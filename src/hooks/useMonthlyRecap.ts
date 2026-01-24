import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';

export interface RecapStats {
  totalJournalEntries: number;
  habitCompletionRate: number;
  goalsProgressed: number;
  totalFocusMinutes: number;
  tasksCompleted: number;
  longestStreak: number;
  photosCount: number;
}

export interface RecapContent {
  opening_reflection: string;
  goal_insights: Array<{ goal_title: string; insight: string }>;
  habit_insights: string;
  biggest_win: {
    title: string;
    why_it_mattered: string;
    narrative: string;
  } | null;
  hardest_struggle: {
    title: string;
    lesson_learned: string;
    narrative: string;
  } | null;
  unexpected_delight: {
    title: string;
    narrative: string;
  } | null;
  pull_quotes: string[];
  looking_ahead: string;
}

export interface RecapPhoto {
  url: string;
  date: string;
  caption: string;
}

export interface MonthlyRecap {
  id: string;
  user_id: string;
  month: string;
  headline: string | null;
  subheadline: string | null;
  content: RecapContent;
  charts_data: any;
  photos: RecapPhoto[];
  stats: RecapStats;
  tone: string;
  status: 'draft' | 'published';
  privacy: 'private' | 'unlisted' | 'public';
  slug: string | null;
  published_at: string | null;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export type RecapTone = 'witty' | 'reflective' | 'brutally_honest' | 'balanced';

// Hook to fetch preview stats for a month (before generating)
export function useRecapPreviewStats(month: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['recap-preview-stats', user?.id, month],
    queryFn: async () => {
      if (!user || !month) return null;
      
      const startDate = `${month}-01`;
      const [year, monthNum] = month.split('-').map(Number);
      const endDate = format(endOfMonth(new Date(year, monthNum - 1)), 'yyyy-MM-dd');
      
      // Fetch counts in parallel
      const [journalCount, goalsCount, tacticsCount, focusCount, tasksCount] = await Promise.all([
        supabase
          .from('journal_entries')
          .select('id, user_photos', { count: 'exact' })
          .eq('user_id', user.id)
          .gte('entry_date', startDate)
          .lte('entry_date', endDate),
        
        supabase
          .from('goals')
          .select('id', { count: 'exact' })
          .eq('user_id', user.id)
          .lte('created_at', `${endDate}T23:59:59Z`),
        
        supabase
          .from('tactic_logs')
          .select('id', { count: 'exact' })
          .eq('user_id', user.id)
          .gte('logged_date', startDate)
          .lte('logged_date', endDate),
        
        supabase
          .from('focus_sessions')
          .select('actual_duration_minutes')
          .eq('user_id', user.id)
          .eq('status', 'completed')
          .gte('started_at', `${startDate}T00:00:00Z`)
          .lte('started_at', `${endDate}T23:59:59Z`),
        
        supabase
          .from('quick_tasks')
          .select('id', { count: 'exact' })
          .eq('user_id', user.id)
          .eq('completed', true)
          .gte('completed_at', `${startDate}T00:00:00Z`)
          .lte('completed_at', `${endDate}T23:59:59Z`),
      ]);
      
      // Count photos from journal entries
      let photosCount = 0;
      if (journalCount.data) {
        for (const entry of journalCount.data) {
          const photos = entry.user_photos as any[] || [];
          photosCount += Array.isArray(photos) ? photos.length : 0;
        }
      }
      
      // Sum focus minutes
      const focusMinutes = focusCount.data?.reduce(
        (sum, s) => sum + (s.actual_duration_minutes || 0), 
        0
      ) || 0;
      
      return {
        journalEntries: journalCount.count || 0,
        goals: goalsCount.count || 0,
        habitLogs: tacticsCount.count || 0,
        focusMinutes,
        tasksCompleted: tasksCount.count || 0,
        photos: photosCount,
        hasEnoughData: (journalCount.count || 0) > 0 || (tacticsCount.count || 0) > 0,
      };
    },
    enabled: !!user && !!month,
  });
}

// Hook to generate a new recap
export function useGenerateRecap() {
  const { user, session } = useAuth();
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState<string[]>([]);
  
  const mutation = useMutation({
    mutationFn: async ({ month, tone }: { month: string; tone: RecapTone }) => {
      if (!session?.access_token) throw new Error('Not authenticated');
      
      setProgress(['Gathering your goals and progress...']);
      
      // Simulate progress updates (the edge function does all the work)
      const progressSteps = [
        'Analyzing habit patterns...',
        'Pulling highlights from your journal...',
        'Selecting photos and memories...',
        'Finding insights in your reflections...',
        'Writing your month in review...',
      ];
      
      let stepIndex = 0;
      const progressInterval = setInterval(() => {
        if (stepIndex < progressSteps.length) {
          setProgress(prev => [...prev, progressSteps[stepIndex]]);
          stepIndex++;
        }
      }, 5000);
      
      try {
        const { data, error } = await supabase.functions.invoke('generate-monthly-recap', {
          body: { month, tone },
        });
        
        clearInterval(progressInterval);
        setProgress(prev => [...prev, 'Your recap is ready!']);
        
        if (error) throw error;
        return data;
      } catch (err) {
        clearInterval(progressInterval);
        throw err;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['monthly-recaps'] });
      queryClient.invalidateQueries({ queryKey: ['monthly-recap', variables.month] });
    },
  });
  
  return {
    ...mutation,
    progress,
    resetProgress: () => setProgress([]),
  };
}

// Hook to fetch a specific recap
export function useRecap(month: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['monthly-recap', user?.id, month],
    queryFn: async () => {
      if (!user || !month) return null;
      
      const [year, monthNum] = month.split('-').map(Number);
      const monthDate = format(new Date(year, monthNum - 1, 1), 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('monthly_recaps')
        .select('*')
        .eq('user_id', user.id)
        .eq('month', monthDate)
        .maybeSingle();
      
      if (error) throw error;
      
      if (!data) return null;
      
      // Cast the JSONB fields properly
      return {
        ...data,
        content: data.content as unknown as RecapContent,
        photos: data.photos as unknown as RecapPhoto[],
        stats: data.stats as unknown as RecapStats,
        status: data.status as 'draft' | 'published',
        privacy: data.privacy as 'private' | 'unlisted' | 'public',
      } as MonthlyRecap;
    },
    enabled: !!user && !!month,
  });
}

// Hook to fetch all recaps for a user
export function useRecaps() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['monthly-recaps', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('monthly_recaps')
        .select('*')
        .eq('user_id', user.id)
        .order('month', { ascending: false });
      
      if (error) throw error;
      
      // Cast the JSONB fields properly for each recap
      return (data || []).map(item => ({
        ...item,
        content: item.content as unknown as RecapContent,
        photos: item.photos as unknown as RecapPhoto[],
        stats: item.stats as unknown as RecapStats,
        status: item.status as 'draft' | 'published',
        privacy: item.privacy as 'private' | 'unlisted' | 'public',
      })) as MonthlyRecap[];
    },
    enabled: !!user,
  });
}

// Hook to update a recap
export function useUpdateRecap() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      recapId, 
      updates 
    }: { 
      recapId: string; 
      updates: Partial<Pick<MonthlyRecap, 'headline' | 'subheadline' | 'content' | 'status' | 'privacy' | 'slug'>> 
    }) => {
      // Convert content to JSON-compatible format
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };
      
      if (updates.headline !== undefined) updateData.headline = updates.headline;
      if (updates.subheadline !== undefined) updateData.subheadline = updates.subheadline;
      if (updates.content !== undefined) updateData.content = updates.content as unknown;
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.privacy !== undefined) updateData.privacy = updates.privacy;
      if (updates.slug !== undefined) updateData.slug = updates.slug;
      
      const { data, error } = await supabase
        .from('monthly_recaps')
        .update(updateData)
        .eq('id', recapId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monthly-recaps'] });
      queryClient.invalidateQueries({ queryKey: ['monthly-recap'] });
    },
  });
}

// Hook to delete a recap
export function useDeleteRecap() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (recapId: string) => {
      const { error } = await supabase
        .from('monthly_recaps')
        .delete()
        .eq('id', recapId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monthly-recaps'] });
    },
  });
}

// Section keys that can be regenerated
export type RegeneratableSectionKey = 
  | 'opening_reflection' 
  | 'habit_insights' 
  | 'biggest_win' 
  | 'hardest_struggle' 
  | 'unexpected_delight' 
  | 'looking_ahead'
  | 'goal_insights';

// Hook to regenerate a specific section
export function useRegenerateSection() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      recapId, 
      section, 
      tone,
      context 
    }: { 
      recapId: string; 
      section: RegeneratableSectionKey; 
      tone: RecapTone;
      context?: Record<string, any>;
    }) => {
      const { data, error } = await supabase.functions.invoke('regenerate-recap-section', {
        body: { 
          recap_id: recapId, 
          section, 
          tone,
          context 
        },
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monthly-recaps'] });
      queryClient.invalidateQueries({ queryKey: ['monthly-recap'] });
    },
  });
}

// Utility to get available months for recap generation
export function getAvailableMonths(count: number = 12): Array<{ value: string; label: string }> {
  const months: Array<{ value: string; label: string }> = [];
  const now = new Date();
  
  // Start from last completed month
  let current = subMonths(startOfMonth(now), 1);
  
  for (let i = 0; i < count; i++) {
    months.push({
      value: format(current, 'yyyy-MM'),
      label: format(current, 'MMMM yyyy'),
    });
    current = subMonths(current, 1);
  }
  
  return months;
}
