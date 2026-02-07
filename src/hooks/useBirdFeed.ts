import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface BirdFeedPost {
  id: string;
  user_id: string;
  photo_url: string;
  caption: string | null;
  location_name: string | null;
  latitude: number | null;
  longitude: number | null;
  posted_at: string;
  created_at: string;
  likes_count: number;
  user_has_liked: boolean;
  author_name?: string;
}

export function useBirdFeed() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all feed posts with like counts
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['bird-feed-posts', user?.id],
    queryFn: async () => {
      // Get posts
      const { data: postsData, error: postsError } = await supabase
        .from('bird_feed_posts')
        .select('*')
        .order('posted_at', { ascending: false });

      if (postsError) throw postsError;

      // Get likes for all posts
      const { data: likesData, error: likesError } = await supabase
        .from('bird_feed_likes')
        .select('post_id, user_id');

      if (likesError) throw likesError;

      // Get profiles for author names
      const userIds = [...new Set(postsData.map(p => p.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, email')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p.display_name || p.email?.split('@')[0] || 'Anonymous']));

      // Aggregate likes per post
      const likesMap = new Map<string, { count: number; userLiked: boolean }>();
      likesData?.forEach(like => {
        const current = likesMap.get(like.post_id) || { count: 0, userLiked: false };
        current.count++;
        if (like.user_id === user?.id) current.userLiked = true;
        likesMap.set(like.post_id, current);
      });

      return postsData.map(post => ({
        ...post,
        likes_count: likesMap.get(post.id)?.count || 0,
        user_has_liked: likesMap.get(post.id)?.userLiked || false,
        author_name: profileMap.get(post.user_id) || 'Anonymous',
      })) as BirdFeedPost[];
    },
  });

  // Create post mutation
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
      queryClient.invalidateQueries({ queryKey: ['bird-feed-posts'] });
      toast({ title: 'Posted!', description: 'Your photo is now in the feed 🐦' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to create post', variant: 'destructive' });
    },
  });

  // Toggle like mutation
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
      queryClient.invalidateQueries({ queryKey: ['bird-feed-posts'] });
    },
  });

  // Delete post mutation
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
      queryClient.invalidateQueries({ queryKey: ['bird-feed-posts'] });
      toast({ title: 'Post deleted' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to delete post', variant: 'destructive' });
    },
  });

  return {
    posts,
    isLoading,
    createPost,
    toggleLike,
    deletePost,
  };
}
