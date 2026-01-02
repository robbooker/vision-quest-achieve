import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Friendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  updated_at: string;
  // Joined profile data
  friend_email?: string;
  friend_name?: string;
}

export interface Friend {
  id: string;
  user_id: string;
  email: string;
  display_name: string | null;
  friendship_id: string;
}

export function useFriendships() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all friendships (both sent and received)
  const friendshipsQuery = useQuery({
    queryKey: ['friendships', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('friendships')
        .select('*')
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);
      
      if (error) throw error;
      return data as Friendship[];
    },
    enabled: !!user,
  });

  // Fetch profiles for friend lookup
  const profilesQuery = useQuery({
    queryKey: ['profiles-for-friends', user?.id],
    queryFn: async () => {
      if (!user || !friendshipsQuery.data) return [];
      
      const friendIds = friendshipsQuery.data
        .filter(f => f.status === 'accepted')
        .map(f => f.requester_id === user.id ? f.addressee_id : f.requester_id);
      
      if (friendIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, email, display_name')
        .in('user_id', friendIds);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!friendshipsQuery.data,
  });

  // Get accepted friends with their profile info
  const friends: Friend[] = (friendshipsQuery.data || [])
    .filter(f => f.status === 'accepted')
    .map(f => {
      const friendUserId = f.requester_id === user?.id ? f.addressee_id : f.requester_id;
      const profile = (profilesQuery.data || []).find(p => p.user_id === friendUserId);
      return {
        id: profile?.user_id || friendUserId,
        user_id: friendUserId,
        email: profile?.email || '',
        display_name: profile?.display_name || null,
        friendship_id: f.id,
      };
    });

  // Get pending requests (received)
  const pendingReceived = (friendshipsQuery.data || [])
    .filter(f => f.status === 'pending' && f.addressee_id === user?.id);

  // Get pending requests (sent)
  const pendingSent = (friendshipsQuery.data || [])
    .filter(f => f.status === 'pending' && f.requester_id === user?.id);

  // Send friend request by email
  const sendFriendRequest = useMutation({
    mutationFn: async (email: string) => {
      if (!user) throw new Error('Not authenticated');
      
      // Find user by email
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('email', email.toLowerCase().trim())
        .limit(1);
      
      if (profileError) throw profileError;
      if (!profiles || profiles.length === 0) {
        throw new Error('No user found with that email address');
      }
      
      const addresseeId = profiles[0].user_id;
      
      if (addresseeId === user.id) {
        throw new Error("You can't send a friend request to yourself");
      }
      
      // Check if friendship already exists
      const { data: existing } = await supabase
        .from('friendships')
        .select('id, status')
        .or(`and(requester_id.eq.${user.id},addressee_id.eq.${addresseeId}),and(requester_id.eq.${addresseeId},addressee_id.eq.${user.id})`)
        .limit(1);
      
      if (existing && existing.length > 0) {
        if (existing[0].status === 'accepted') {
          throw new Error('You are already friends with this user');
        }
        throw new Error('A friend request already exists');
      }
      
      const { data, error } = await supabase
        .from('friendships')
        .insert({
          requester_id: user.id,
          addressee_id: addresseeId,
          status: 'pending',
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friendships'] });
    },
  });

  // Accept friend request
  const acceptFriendRequest = useMutation({
    mutationFn: async (friendshipId: string) => {
      const { data, error } = await supabase
        .from('friendships')
        .update({ status: 'accepted' })
        .eq('id', friendshipId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friendships'] });
      queryClient.invalidateQueries({ queryKey: ['profiles-for-friends'] });
    },
  });

  // Decline friend request
  const declineFriendRequest = useMutation({
    mutationFn: async (friendshipId: string) => {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('id', friendshipId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friendships'] });
    },
  });

  // Remove friend
  const removeFriend = useMutation({
    mutationFn: async (friendshipId: string) => {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('id', friendshipId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friendships'] });
      queryClient.invalidateQueries({ queryKey: ['profiles-for-friends'] });
    },
  });

  return {
    friends,
    pendingReceived,
    pendingSent,
    isLoading: friendshipsQuery.isLoading,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    removeFriend,
  };
}
