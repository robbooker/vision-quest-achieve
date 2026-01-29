import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format, subDays } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

export interface OuraMetrics {
  id: string;
  user_id: string;
  metric_date: string;
  // Sleep
  sleep_score: number | null;
  total_sleep_seconds: number | null;
  deep_sleep_seconds: number | null;
  rem_sleep_seconds: number | null;
  light_sleep_seconds: number | null;
  sleep_efficiency: number | null;
  // Readiness
  readiness_score: number | null;
  resting_heart_rate: number | null;
  hrv_balance: number | null;
  // Resilience
  resilience_level: 'exceptional' | 'strong' | 'solid' | 'adequate' | 'limited' | null;
  // Stress alerts
  rhr_baseline_14d: number | null;
  hrv_baseline_14d: number | null;
  rhr_spike_alert: boolean;
  hrv_strain_alert: boolean;
  critical_deficit_alert: boolean;
  // Manual fallback
  source: 'oura' | 'manual';
  manual_bedtime: string | null;
  manual_wake_time: string | null;
  manual_sleep_quality: number | null;
  // Nap tracking
  nap_duration_minutes: number | null;
  // Metadata
  synced_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface OuraProfile {
  oura_access_token: string | null;
  oura_connected_at: string | null;
  manual_sleep_enabled: boolean;
}

export interface ManualSleepData {
  bedtime: string;
  wakeTime: string;
  quality: number;
  date?: string; // Optional, defaults to today
  entryId?: string; // If provided, updates instead of inserts
}

export function useOuraMetrics() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const today = format(new Date(), 'yyyy-MM-dd');

  // Fetch today's metrics
  const { data: todayMetrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['oura-metrics', user?.id, today],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('oura_daily_metrics')
        .select('*')
        .eq('user_id', user.id)
        .eq('metric_date', today)
        .maybeSingle();
      
      if (error) throw error;
      return data as OuraMetrics | null;
    },
    enabled: !!user?.id,
  });

  // Fetch last 7 days metrics for trends
  const { data: weeklyMetrics } = useQuery({
    queryKey: ['oura-metrics-weekly', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const startDate = format(subDays(new Date(), 7), 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('oura_daily_metrics')
        .select('*')
        .eq('user_id', user.id)
        .gte('metric_date', startDate)
        .order('metric_date', { ascending: false });
      
      if (error) throw error;
      return data as OuraMetrics[];
    },
    enabled: !!user?.id,
  });

  // Check Oura connection status
  const { data: ouraProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['oura-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('oura_access_token, oura_connected_at, manual_sleep_enabled')
        .eq('user_id', user.id)
        .single();
      
      if (error) throw error;
      return {
        oura_access_token: data.oura_access_token,
        oura_connected_at: data.oura_connected_at,
        manual_sleep_enabled: data.manual_sleep_enabled ?? false,
      } as OuraProfile;
    },
    enabled: !!user?.id,
  });

  const isOuraConnected = !!ouraProfile?.oura_access_token;
  const isManualMode = ouraProfile?.manual_sleep_enabled ?? false;

  // Sync metrics from Oura
  const syncMetrics = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('oura-sync-performance');
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['oura-metrics'] });
      toast({ title: 'Oura data synced successfully' });
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Sync failed', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });

  // Connect Oura (save token)
  const connectOura = useMutation({
    mutationFn: async (token: string) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('profiles')
        .update({ 
          oura_access_token: token,
          oura_connected_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['oura-profile'] });
      toast({ title: 'Oura Ring connected' });
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Connection failed', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });

  // Disconnect Oura
  const disconnectOura = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('profiles')
        .update({ 
          oura_access_token: null,
          oura_connected_at: null,
        })
        .eq('user_id', user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['oura-profile'] });
      toast({ title: 'Oura Ring disconnected' });
    },
  });

  // Toggle manual sleep mode
  const toggleManualMode = useMutation({
    mutationFn: async (enabled: boolean) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('profiles')
        .update({ manual_sleep_enabled: enabled })
        .eq('user_id', user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['oura-profile'] });
    },
  });

  // Log or update manual sleep entry (hybrid mode - works regardless of Oura connection)
  const logManualSleep = useMutation({
    mutationFn: async (data: ManualSleepData) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const targetDate = data.date || today;
      const bedtimeDate = new Date(data.bedtime);
      const wakeDate = new Date(data.wakeTime);
      const totalSleepSeconds = Math.floor((wakeDate.getTime() - bedtimeDate.getTime()) / 1000);
      const sleepScore = data.quality * 20; // 1-5 → 20-100
      
      if (data.entryId) {
        // Update existing entry - preserve Oura biometric data if present
        const { error } = await supabase
          .from('oura_daily_metrics')
          .update({
            manual_bedtime: data.bedtime,
            manual_wake_time: data.wakeTime,
            manual_sleep_quality: data.quality,
            total_sleep_seconds: totalSleepSeconds,
            sleep_score: sleepScore,
            updated_at: new Date().toISOString(),
          })
          .eq('id', data.entryId)
          .eq('user_id', user.id);
        
        if (error) throw error;
      } else {
        // Create new entry or upsert
        const { error } = await supabase
          .from('oura_daily_metrics')
          .upsert({
            user_id: user.id,
            metric_date: targetDate,
            source: 'manual',
            manual_bedtime: data.bedtime,
            manual_wake_time: data.wakeTime,
            manual_sleep_quality: data.quality,
            total_sleep_seconds: totalSleepSeconds,
            sleep_score: sleepScore,
            synced_at: new Date().toISOString(),
          }, { onConflict: 'user_id,metric_date' });
        
        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['oura-metrics'] });
      toast({ title: variables.entryId ? 'Sleep entry updated' : 'Sleep logged successfully' });
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Failed to save sleep', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });

  // Log nap for today
  const logNap = useMutation({
    mutationFn: async ({ napMinutes }: { napMinutes: number }) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      // Upsert - add to existing entry or create new one
      const { error } = await supabase
        .from('oura_daily_metrics')
        .upsert({
          user_id: user.id,
          metric_date: today,
          nap_duration_minutes: napMinutes,
          source: 'manual',
        }, { 
          onConflict: 'user_id,metric_date',
          ignoreDuplicates: false 
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['oura-metrics'] });
      toast({ title: 'Nap logged successfully' });
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Failed to log nap', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });

  // Get entry for a specific date (for editing)
  const getEntryForDate = async (date: string): Promise<OuraMetrics | null> => {
    if (!user?.id) return null;
    const { data, error } = await supabase
      .from('oura_daily_metrics')
      .select('*')
      .eq('user_id', user.id)
      .eq('metric_date', date)
      .maybeSingle();
    
    if (error) throw error;
    return data as OuraMetrics | null;
  };

  // Helper functions
  const formatSleepDuration = (seconds: number | null): string => {
    if (!seconds) return '--';
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${mins}m`;
  };

  const getReadinessTier = (score: number | null): { tier: string; color: string; icon: string } => {
    if (!score) return { tier: 'Unknown', color: 'text-muted-foreground', icon: '' };
    if (score >= 85) return { tier: 'Optimal', color: 'text-green-500', icon: '👑' };
    if (score >= 70) return { tier: 'Good', color: 'text-yellow-500', icon: '' };
    return { tier: 'Pay Attention', color: 'text-red-500', icon: '⚠️' };
  };

  const getResilienceColor = (level: string | null): string => {
    if (!level) return 'text-muted-foreground';
    if (['exceptional', 'strong'].includes(level)) return 'text-green-500';
    if (['solid', 'adequate'].includes(level)) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getRhrStatus = (rhr: number | null, baseline: number | null): { status: string; color: string; diff: number } => {
    if (!rhr || !baseline) return { status: 'Unknown', color: 'text-muted-foreground', diff: 0 };
    const diff = rhr - baseline;
    if (diff >= 3) return { status: 'Elevated', color: 'text-red-500', diff };
    if (diff >= 1) return { status: 'Slightly High', color: 'text-yellow-500', diff };
    return { status: 'Normal', color: 'text-green-500', diff };
  };

  return {
    todayMetrics,
    weeklyMetrics,
    isLoading: metricsLoading || profileLoading,
    isOuraConnected,
    isManualMode,
    ouraProfile,
    syncMetrics,
    connectOura,
    disconnectOura,
    toggleManualMode,
    logManualSleep,
    logNap,
    getEntryForDate,
    formatSleepDuration,
    getReadinessTier,
    getResilienceColor,
    getRhrStatus,
  };
}
