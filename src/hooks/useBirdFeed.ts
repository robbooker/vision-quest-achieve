import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface BirdFeedItem {
  id: string;
  type: 'post' | 'sighting';
  user_id: string;
  photo_url: string;
  caption: string | null;
  species_name?: string;
  location_name: string | null;
  latitude: number | null;
  longitude: number | null;
  posted_at: string;
  likes_count: number;
  user_has_liked: boolean;
  author_name?: string;
}

export function useBirdFeed() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch combined feed: casual posts + official sighting photos
  const { data: feedItems = [], isLoading } = useQuery({
    queryKey: ['bird-feed-combined', user?.id],
    queryFn: async () => {
      // 1. Get casual feed posts
      const { data: postsData, error: postsError } = await supabase
        .from('bird_feed_posts')
        .select('*')
        .order('posted_at', { ascending: false });

      if (postsError) throw postsError;

      // 2. Get official sighting photos with their sighting data
      const { data: sightingPhotos, error: photosError } = await supabase
        .from('bird_sighting_photos')
        .select(`
          id,
          photo_url,
          user_id,
          created_at,
          sighting_id,
          bird_sightings (
            species_name,
            sighting_date,
            location_name,
            latitude,
            longitude,
            user_id
          )
        `)
        .order('created_at', { ascending: false });

      if (photosError) throw photosError;

      // 3. Get likes for casual posts
      const { data: likesData } = await supabase
        .from('bird_feed_likes')
        .select('post_id, user_id');

      // 4. Get all user IDs for profile lookup
      const postUserIds = postsData?.map(p => p.user_id) || [];
      const sightingUserIds = sightingPhotos?.map(p => p.user_id) || [];
      const allUserIds = [...new Set([...postUserIds, ...sightingUserIds])];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, email')
        .in('user_id', allUserIds);

      const profileMap = new Map(
        profiles?.map(p => [p.user_id, p.display_name || p.email?.split('@')[0] || 'Anonymous'])
      );

      // Aggregate likes per post
      const likesMap = new Map<string, { count: number; userLiked: boolean }>();
      likesData?.forEach(like => {
        const current = likesMap.get(like.post_id) || { count: 0, userLiked: false };
        current.count++;
        if (like.user_id === user?.id) current.userLiked = true;
        likesMap.set(like.post_id, current);
      });

      // Transform casual posts
      const casualPosts: BirdFeedItem[] = (postsData || []).map(post => ({
        id: post.id,
        type: 'post' as const,
        user_id: post.user_id,
        photo_url: post.photo_url,
        caption: post.caption,
        location_name: post.location_name,
        latitude: post.latitude,
        longitude: post.longitude,
        posted_at: post.posted_at,
        likes_count: likesMap.get(post.id)?.count || 0,
        user_has_liked: likesMap.get(post.id)?.userLiked || false,
        author_name: profileMap.get(post.user_id) || 'Anonymous',
      }));

      // Transform sighting photos
      const sightingItems: BirdFeedItem[] = (sightingPhotos || [])
        .filter(p => p.bird_sightings)
        .map(photo => {
          const sighting = photo.bird_sightings as any;
          return {
            id: photo.id,
            type: 'sighting' as const,
            user_id: photo.user_id,
            photo_url: photo.photo_url,
            caption: null,
            species_name: sighting.species_name,
            location_name: sighting.location_name,
            latitude: sighting.latitude,
            longitude: sighting.longitude,
            posted_at: photo.created_at,
            likes_count: 0, // Sighting photos don't have likes (yet)
            user_has_liked: false,
            author_name: profileMap.get(photo.user_id) || 'Anonymous',
          };
        });

      // Merge and sort by date
      const combined = [...casualPosts, ...sightingItems].sort(
        (a, b) => new Date(b.posted_at).getTime() - new Date(a.posted_at).getTime()
      );

      return combined;
    },
  });

  // Create post mutation (casual posts only)
  const createPost = useMutation({
    mutationFn: async (data: { 
      file: File; 
      caption?: string; 
      location_name?: string;
      latitude?: number;
      longitude?: number;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const fileExt = data.file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('bird-photos')
        .upload(fileName, data.file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('bird-photos').getPublicUrl(fileName);

      const { data: post, error } = await supabase
        .from('bird_feed_posts')
        .insert({
          user_id: user.id,
          photo_url: urlData.publicUrl,
          caption: data.caption || null,
          location_name: data.location_name || null,
          latitude: data.latitude || null,
          longitude: data.longitude || null,
        })
        .select()
        .single();

      if (error) throw error;
      return post;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bird-feed-combined'] });
      toast({ title: 'Posted!', description: 'Your photo is now in the feed 🐦' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to create post', variant: 'destructive' });
    },
  });

  // Toggle like mutation (casual posts only)
  const toggleLike = useMutation({
    mutationFn: async (postId: string) => {
      if (!user) throw new Error('Not authenticated');

      // Check if already liked
      const { data: existingLike } = await supabase
        .from('bird_feed_likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .single();

      if (existingLike) {
        // Unlike
        const { error } = await supabase
          .from('bird_feed_likes')
          .delete()
          .eq('id', existingLike.id);
        if (error) throw error;
        return { action: 'unliked' };
      } else {
        // Like
        const { error } = await supabase
          .from('bird_feed_likes')
          .insert({ post_id: postId, user_id: user.id });
        if (error) throw error;
        return { action: 'liked' };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bird-feed-combined'] });
    },
  });

  // Delete post mutation (casual posts only)
  const deletePost = useMutation({
    mutationFn: async (postId: string) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('bird_feed_posts')
        .delete()
        .eq('id', postId)
        .eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bird-feed-combined'] });
      toast({ title: 'Post deleted' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to delete post', variant: 'destructive' });
    },
  });

  return {
    feedItems,
    isLoading,
    createPost,
    toggleLike,
    deletePost,
  };
}
