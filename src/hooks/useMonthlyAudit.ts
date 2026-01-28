import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { endOfMonth, differenceInDays, format } from 'date-fns';
import { useState } from 'react';

export interface PillarBreakdown {
  pillar: string;
  focusMinutes: number;
  tasksCompleted: number;
  calendarEvents: number;
  habitLogs: number;
  percentageOfTotal: number;
}

export interface PillarAnalytics {
  breakdown: PillarBreakdown[];
  mostActivePillar: string;
  leastActivePillar: string;
  totalEffort: number;
}

export interface EditorialContent {
  headline: string;
  subheadline: string;
  opening: string;
  pullQuote: string;
  habitSection: string;
  focusSection: string;
  tradingSection: string;
  pillarSection: string;
  closing: string;
}

export interface StatsSnapshot {
  trading: {
    totalPnL: number;
    winRate: number;
    tradingDays: number;
  };
  focus: {
    totalMinutes: number;
    sessions: number;
    avgSessionLength: number;
  };
  habits: {
    totalLogs: number;
    topHabits: Array<{ name: string; completions: number }>;
  };
  tasks: {
    completed: number;
  };
  journal: {
    entries: number;
  };
  birds: {
    species: number;
    sightings: number;
    speciesList: string[];
  };
}

export interface MonthlyAudit {
  id: string;
  user_id: string;
  month: string;
  display_name: string | null;
  editorial_content: EditorialContent | null;
  stats_snapshot: StatsSnapshot | null;
  pillar_analytics: PillarAnalytics | null;
  status: 'draft' | 'published';
  privacy: 'private' | 'unlisted' | 'public';
  slug: string | null;
  view_count: number;
  created_at: string;
  updated_at: string;
}

// Check if a month can be audited (must have ended)
export function canGenerateAudit(month: string): { canGenerate: boolean; reason?: string; daysUntilAvailable?: number } {
  const [year, monthNum] = month.split('-').map(Number);
  const monthEnd = endOfMonth(new Date(year, monthNum - 1));
  const now = new Date();
  
  if (now <= monthEnd) {
    const daysLeft = differenceInDays(monthEnd, now) + 1;
    return { 
      canGenerate: false, 
      reason: `${daysLeft} days until ${format(new Date(year, monthNum - 1), 'MMMM')} ends`,
      daysUntilAvailable: daysLeft,
    };
  }
  return { canGenerate: true };
}

// Get available months for audit (past months only)
export function getAvailableAuditMonths(count: number = 12): Array<{ value: string; label: string; canGenerate: boolean }> {
  const months: Array<{ value: string; label: string; canGenerate: boolean }> = [];
  const now = new Date();
  
  for (let i = 0; i < count; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = format(date, 'yyyy-MM');
    const label = format(date, 'MMMM yyyy');
    const { canGenerate } = canGenerateAudit(value);
    months.push({ value, label, canGenerate });
  }
  
  return months;
}

// Fetch a single audit by month
export function useAudit(month: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['monthly-audit', user?.id, month],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('monthly_audits')
        .select('*')
        .eq('user_id', user.id)
        .eq('month', `${month}-01`)
        .maybeSingle();
      
      if (error) throw error;
      
      if (!data) return null;
      
      return {
        ...data,
        editorial_content: data.editorial_content as unknown as EditorialContent,
        stats_snapshot: data.stats_snapshot as unknown as StatsSnapshot,
        pillar_analytics: data.pillar_analytics as unknown as PillarAnalytics,
      } as MonthlyAudit;
    },
    enabled: !!user && !!month,
  });
}

// Fetch all audits for the user
export function useAudits() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['monthly-audits', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('monthly_audits')
        .select('*')
        .eq('user_id', user.id)
        .order('month', { ascending: false });
      
      if (error) throw error;
      
      return (data || []).map(audit => ({
        ...audit,
        editorial_content: audit.editorial_content as unknown as EditorialContent,
        stats_snapshot: audit.stats_snapshot as unknown as StatsSnapshot,
        pillar_analytics: audit.pillar_analytics as unknown as PillarAnalytics,
      })) as MonthlyAudit[];
    },
    enabled: !!user,
  });
}

// Generate audit mutation
export function useGenerateAudit() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState<string[]>([]);
  
  const mutation = useMutation({
    mutationFn: async (month: string) => {
      if (!user) throw new Error('Not authenticated');
      
      setProgress(['Checking month availability...']);
      
      const { canGenerate, reason } = canGenerateAudit(month);
      if (!canGenerate) {
        throw new Error(reason);
      }
      
      setProgress(prev => [...prev, 'Fetching your data...']);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');
      
      setProgress(prev => [...prev, 'Generating AI editorial...']);
      
      const response = await supabase.functions.invoke('generate-monthly-audit', {
        body: { month },
      });
      
      if (response.error) {
        throw new Error(response.error.message || 'Failed to generate audit');
      }
      
      setProgress(prev => [...prev, 'Audit generated successfully!']);
      
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monthly-audit'] });
      queryClient.invalidateQueries({ queryKey: ['monthly-audits'] });
    },
  });
  
  return {
    ...mutation,
    progress,
    resetProgress: () => setProgress([]),
  };
}

// Update audit (status, privacy, etc.)
export function useUpdateAudit() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      id, 
      updates 
    }: { 
      id: string; 
      updates: Partial<Pick<MonthlyAudit, 'status' | 'privacy'>> & { 
        editorial_content?: Record<string, unknown> 
      }
    }) => {
      const { data, error } = await supabase
        .from('monthly_audits')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monthly-audit'] });
      queryClient.invalidateQueries({ queryKey: ['monthly-audits'] });
    },
  });
}

// Delete audit
export function useDeleteAudit() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('monthly_audits')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monthly-audit'] });
      queryClient.invalidateQueries({ queryKey: ['monthly-audits'] });
    },
  });
}