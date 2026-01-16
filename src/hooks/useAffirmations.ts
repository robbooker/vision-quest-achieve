import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useMemo } from 'react';
import { startOfDay, subDays, differenceInCalendarDays } from 'date-fns';

interface AffirmationSubmission {
  id: string;
  user_id: string;
  submitted_at: string;
  content_saved: boolean;
  saved_affirmations: string[] | null;
  created_at: string;
}

export function useAffirmations() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all submissions for the user
  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ['affirmation-submissions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('affirmation_submissions')
        .select('*')
        .eq('user_id', user.id)
        .order('submitted_at', { ascending: false });
      
      if (error) throw error;
      return data as AffirmationSubmission[];
    },
    enabled: !!user?.id,
  });

  // Submit affirmations
  const submitAffirmations = useMutation({
    mutationFn: async ({ 
      affirmations, 
      saveContent 
    }: { 
      affirmations: string[]; 
      saveContent: boolean;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('affirmation_submissions')
        .insert({
          user_id: user.id,
          content_saved: saveContent,
          saved_affirmations: saveContent ? affirmations : null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['affirmation-submissions', user?.id] });
    },
  });

  // Delete an affirmation submission
  const deleteSubmission = useMutation({
    mutationFn: async (submissionId: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('affirmation_submissions')
        .delete()
        .eq('id', submissionId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['affirmation-submissions', user?.id] });
    },
  });

  // Calculate stats
  const stats = useMemo(() => {
    if (!submissions.length) {
      return { totalDays: 0, currentStreak: 0 };
    }

    // Get unique dates (in local timezone)
    const uniqueDates = new Set<string>();
    submissions.forEach(s => {
      const date = startOfDay(new Date(s.submitted_at)).toISOString().split('T')[0];
      uniqueDates.add(date);
    });

    const totalDays = uniqueDates.size;

    // Calculate current streak
    const sortedDates = Array.from(uniqueDates).sort().reverse();
    const today = startOfDay(new Date()).toISOString().split('T')[0];
    const yesterday = startOfDay(subDays(new Date(), 1)).toISOString().split('T')[0];

    let currentStreak = 0;
    
    // Streak must start from today or yesterday
    if (sortedDates[0] === today || sortedDates[0] === yesterday) {
      currentStreak = 1;
      
      for (let i = 1; i < sortedDates.length; i++) {
        const currentDate = new Date(sortedDates[i - 1]);
        const prevDate = new Date(sortedDates[i]);
        const daysDiff = differenceInCalendarDays(currentDate, prevDate);
        
        if (daysDiff === 1) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    return { totalDays, currentStreak };
  }, [submissions]);

  // Get saved affirmations (most recent saved ones)
  const savedAffirmations = useMemo(() => {
    const saved = submissions.find(s => s.content_saved && s.saved_affirmations);
    return saved?.saved_affirmations || [];
  }, [submissions]);

  return {
    submissions,
    isLoading,
    submitAffirmations,
    deleteSubmission,
    stats,
    savedAffirmations,
  };
}