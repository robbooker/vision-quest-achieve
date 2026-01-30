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
  // Using raw REST API call to bypass TypeScript type generation issues with new tables
  const { data: intradayData, isLoading: intradayLoading } = useQuery({
    queryKey: ['heartrate-intraday', user?.id, targetDate],
    queryFn: async (): Promise<HeartRateSample[]> => {
      if (!user?.id) return [];
      
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      
      if (!accessToken) return [];
      
      // Construct Supabase REST API URL directly
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const url = `${supabaseUrl}/rest/v1/oura_heartrate_samples?user_id=eq.${user.id}&sample_date=eq.${targetDate}&order=sample_time.asc&select=id,user_id,sample_date,sample_time,bpm,source`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        console.error('Heartrate fetch error:', response.status, await response.text());
        return [];
      }
      
      const data = await response.json();
      console.log(`Fetched ${data?.length || 0} HR samples for ${targetDate}`);
      return data as HeartRateSample[];
    },
    enabled: !!user?.id,
  });

  // Fetch 14-day RHR and HRV trend data (uses existing typed table)
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
  const chartData = (intradayData || []).reduce((acc: { time: string; hour: number; bpm: number; count: number }[], sample) => {
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
  }, []);

  // Calculate intraday stats
  const samples = intradayData || [];
  const intradayStats = samples.length ? {
    min: Math.min(...samples.map(s => s.bpm)),
    max: Math.max(...samples.map(s => s.bpm)),
    avg: Math.round(samples.reduce((sum, s) => sum + s.bpm, 0) / samples.length),
    samples: samples.length,
  } : null;

  return {
    intradayData: samples,
    chartData: chartData.sort((a, b) => a.hour - b.hour || a.time.localeCompare(b.time)),
    intradayStats,
    biometricTrend,
    isLoading: intradayLoading || trendLoading,
  };
}
