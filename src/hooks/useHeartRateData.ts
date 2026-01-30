import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format, subDays } from 'date-fns';

export interface HeartRateSample {
  id: string;
  user_id: string;
  sample_date: string;
  sample_time: string;
  bpm: number;
  source: string;
}

export function useHeartRateData(date?: string) {
  const { user } = useAuth();
  const targetDate = date || format(new Date(), 'yyyy-MM-dd');

  // Fetch intraday heart rate samples for a specific date
  const { data: intradayData, isLoading: intradayLoading } = useQuery({
    queryKey: ['heartrate-intraday', user?.id, targetDate],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('oura_heartrate_samples')
        .select('*')
        .eq('user_id', user.id)
        .eq('sample_date', targetDate)
        .order('sample_time', { ascending: true });
      
      if (error) throw error;
      return data as HeartRateSample[];
    },
    enabled: !!user?.id,
  });

  // Fetch 14-day RHR and HRV trend data
  const { data: biometricTrend, isLoading: trendLoading } = useQuery({
    queryKey: ['biometric-trend', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const startDate = format(subDays(new Date(), 13), 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('oura_daily_metrics')
        .select('metric_date, resting_heart_rate, hrv_balance, rhr_baseline_14d, hrv_baseline_14d')
        .eq('user_id', user.id)
        .gte('metric_date', startDate)
        .order('metric_date', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Process intraday data for charting - aggregate to 30-minute intervals for smoother display
  const chartData = intradayData?.reduce((acc: { time: string; hour: number; bpm: number; count: number }[], sample) => {
    const sampleDate = new Date(sample.sample_time);
    const hour = sampleDate.getHours();
    const halfHour = Math.floor(sampleDate.getMinutes() / 30);
    const timeKey = `${hour.toString().padStart(2, '0')}:${halfHour === 0 ? '00' : '30'}`;
    
    const existing = acc.find(d => d.time === timeKey);
    if (existing) {
      existing.bpm = Math.round((existing.bpm * existing.count + sample.bpm) / (existing.count + 1));
      existing.count++;
    } else {
      acc.push({ time: timeKey, hour, bpm: sample.bpm, count: 1 });
    }
    return acc;
  }, []) || [];

  // Calculate intraday stats
  const intradayStats = intradayData?.length ? {
    min: Math.min(...intradayData.map(s => s.bpm)),
    max: Math.max(...intradayData.map(s => s.bpm)),
    avg: Math.round(intradayData.reduce((sum, s) => sum + s.bpm, 0) / intradayData.length),
    samples: intradayData.length,
  } : null;

  return {
    intradayData,
    chartData: chartData.sort((a, b) => a.hour - b.hour || a.time.localeCompare(b.time)),
    intradayStats,
    biometricTrend,
    isLoading: intradayLoading || trendLoading,
  };
}
