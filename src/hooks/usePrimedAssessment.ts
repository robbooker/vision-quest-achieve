import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { PillarKey, PillarLevel } from '@/data/primedBehaviors';

export interface PrimedAssessment {
  id: string;
  user_id: string;
  assessed_at: string;
  physical_level: number;
  relations_level: number;
  income_level: number;
  mental_level: number;
  excellence_level: number;
  direction_level: number;
  ai_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AssessmentBehavior {
  id: string;
  assessment_id: string;
  pillar: PillarKey;
  level: number;
  behavior_key: string;
  behavior_text: string;
  created_at: string;
}

export interface CreateAssessmentInput {
  physical_level: PillarLevel;
  relations_level: PillarLevel;
  income_level: PillarLevel;
  mental_level: PillarLevel;
  excellence_level: PillarLevel;
  direction_level: PillarLevel;
  behaviors: {
    pillar: PillarKey;
    level: PillarLevel;
    behavior_key: string;
    behavior_text: string;
  }[];
}

export function usePrimedAssessments() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all assessments for the user
  const { data: assessments, isLoading, error } = useQuery({
    queryKey: ['primed-assessments', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('primed_assessments')
        .select('*')
        .eq('user_id', user.id)
        .order('assessed_at', { ascending: false });

      if (error) throw error;
      return data as PrimedAssessment[];
    },
    enabled: !!user?.id,
  });

  // Fetch the most recent assessment
  const { data: currentAssessment, isLoading: isLoadingCurrent } = useQuery({
    queryKey: ['primed-current-assessment', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('primed_assessments')
        .select('*')
        .eq('user_id', user.id)
        .order('assessed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as PrimedAssessment | null;
    },
    enabled: !!user?.id,
  });

  // Fetch behaviors for a specific assessment
  const fetchBehaviors = async (assessmentId: string): Promise<AssessmentBehavior[]> => {
    const { data, error } = await supabase
      .from('primed_assessment_behaviors')
      .select('*')
      .eq('assessment_id', assessmentId);

    if (error) throw error;
    return data as AssessmentBehavior[];
  };

  // Create a new assessment
  const createAssessment = useMutation({
    mutationFn: async (input: CreateAssessmentInput) => {
      if (!user?.id) throw new Error('Not authenticated');

      // Create the assessment
      const { data: assessment, error: assessmentError } = await supabase
        .from('primed_assessments')
        .insert({
          user_id: user.id,
          physical_level: input.physical_level,
          relations_level: input.relations_level,
          income_level: input.income_level,
          mental_level: input.mental_level,
          excellence_level: input.excellence_level,
          direction_level: input.direction_level,
        })
        .select()
        .single();

      if (assessmentError) throw assessmentError;

      // Create behavior records
      if (input.behaviors.length > 0) {
        const behaviorRecords = input.behaviors.map(b => ({
          assessment_id: assessment.id,
          pillar: b.pillar,
          level: b.level,
          behavior_key: b.behavior_key,
          behavior_text: b.behavior_text,
        }));

        const { error: behaviorsError } = await supabase
          .from('primed_assessment_behaviors')
          .insert(behaviorRecords);

        if (behaviorsError) throw behaviorsError;
      }

      return assessment as PrimedAssessment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['primed-assessments'] });
      queryClient.invalidateQueries({ queryKey: ['primed-current-assessment'] });
    },
  });

  // Update an assessment
  const updateAssessment = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PrimedAssessment> & { id: string }) => {
      const { data, error } = await supabase
        .from('primed_assessments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as PrimedAssessment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['primed-assessments'] });
      queryClient.invalidateQueries({ queryKey: ['primed-current-assessment'] });
    },
  });

  // Delete an assessment
  const deleteAssessment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('primed_assessments')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['primed-assessments'] });
      queryClient.invalidateQueries({ queryKey: ['primed-current-assessment'] });
    },
  });

  return {
    assessments: assessments ?? [],
    currentAssessment,
    isLoading,
    isLoadingCurrent,
    error,
    fetchBehaviors,
    createAssessment,
    updateAssessment,
    deleteAssessment,
  };
}

// Convenience hook for just getting current assessment
export function useCurrentAssessment() {
  const { currentAssessment, isLoadingCurrent } = usePrimedAssessments();
  return { assessment: currentAssessment, isLoading: isLoadingCurrent };
}
