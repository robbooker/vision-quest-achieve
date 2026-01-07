import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useActivityEmbeddings } from './useActivityEmbeddings';

export interface WeekReview {
  id: string;
  user_id: string;
  cycle_id: string;
  week_number: number;
  execution_score: number | null;
  wins: string | null;
  lessons: string | null;
  next_focus: string | null;
  celebration: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateWeekReviewInput {
  cycle_id: string;
  week_number: number;
  execution_score?: number;
  wins?: string;
  lessons?: string;
  next_focus?: string;
  celebration?: string;
}

export interface UpdateWeekReviewInput {
  id: string;
  execution_score?: number;
  wins?: string;
  lessons?: string;
  next_focus?: string;
  celebration?: string;
}

export function useWeekReviews(cycleId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { embedWeekReview } = useActivityEmbeddings();

  const reviewsQuery = useQuery({
    queryKey: ['week_reviews', cycleId],
    queryFn: async () => {
      let query = supabase
        .from('week_reviews')
        .select('*')
        .order('week_number', { ascending: true });

      if (cycleId) {
        query = query.eq('cycle_id', cycleId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as WeekReview[];
    },
    enabled: !!user && !!cycleId,
  });

  const createOrUpdateReview = useMutation({
    mutationFn: async (input: CreateWeekReviewInput) => {
      // Check if review already exists
      const { data: existing } = await supabase
        .from('week_reviews')
        .select('id')
        .eq('cycle_id', input.cycle_id)
        .eq('week_number', input.week_number)
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from('week_reviews')
          .update({
            execution_score: input.execution_score,
            wins: input.wins,
            lessons: input.lessons,
            next_focus: input.next_focus,
            celebration: input.celebration,
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        return data as WeekReview;
      } else {
        const { data, error } = await supabase
          .from('week_reviews')
          .insert({
            ...input,
            user_id: user!.id,
          })
          .select()
          .single();

        if (error) throw error;
        return data as WeekReview;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['week_reviews'] });
      // Generate embedding for the review
      embedWeekReview(data).catch(console.error);
    },
  });

  const getReviewForWeek = (weekNumber: number): WeekReview | undefined => {
    return reviewsQuery.data?.find(r => r.week_number === weekNumber);
  };

  return {
    reviews: reviewsQuery.data ?? [],
    isLoading: reviewsQuery.isLoading,
    error: reviewsQuery.error,
    createOrUpdateReview,
    getReviewForWeek,
  };
}
