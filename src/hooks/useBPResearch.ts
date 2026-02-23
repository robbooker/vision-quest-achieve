import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format, subDays, getHours, startOfWeek, startOfMonth } from 'date-fns';
import { useMemo, useState } from 'react';

export interface BPReading {
  id: string;
  systolic: number;
  diastolic: number;
  notes: string | null;
  measured_at: string;
}

export type BPCategory = 'Normal' | 'Elevated' | 'Stage 1' | 'Stage 2';

export function classifyBP(systolic: number, diastolic: number): BPCategory {
  if (systolic >= 140 || diastolic >= 90) return 'Stage 2';
  if (systolic >= 130 || diastolic >= 80) return 'Stage 1';
  if (systolic >= 120 && diastolic < 80) return 'Elevated';
  return 'Normal';
}

export function categoryColor(cat: BPCategory) {
  switch (cat) {
    case 'Normal': return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30';
    case 'Elevated': return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30';
    case 'Stage 1': return 'text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/30';
    case 'Stage 2': return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30';
  }
}

function avg(nums: number[]) {
  return nums.length ? Math.round(nums.reduce((a, b) => a + b, 0) / nums.length) : null;
}

function stdDev(nums: number[]) {
  if (nums.length < 2) return 0;
  const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
  const variance = nums.reduce((sum, v) => sum + (v - mean) ** 2, 0) / nums.length;
  return Math.sqrt(variance);
}

export type TimeRange = '7d' | '30d' | '90d' | '6mo' | '1yr' | 'all';

export function useBPResearch() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [timeRange, setTimeRange] = useState<TimeRange>('90d');
  const [showMovingAvg, setShowMovingAvg] = useState(false);
  const [logPage, setLogPage] = useState(0);
  const LOG_PAGE_SIZE = 20;

  const { data: allReadings = [], isLoading } = useQuery({
    queryKey: ['bp-research', user?.id],
    queryFn: async (): Promise<BPReading[]> => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('health_measurements')
        .select('id, primary_value, secondary_value, notes, measured_at')
        .eq('user_id', user.id)
        .eq('measurement_type', 'blood_pressure')
        .order('measured_at', { ascending: true });
      if (error) throw error;
      return (data || []).map(r => ({
        id: r.id,
        systolic: r.primary_value,
        diastolic: r.secondary_value || 0,
        notes: r.notes,
        measured_at: r.measured_at,
      }));
    },
    enabled: !!user?.id,
  });

  const computed = useMemo(() => {
    if (!allReadings.length) return null;

    const now = new Date();
    const rangeDays: Record<TimeRange, number | null> = {
      '7d': 7, '30d': 30, '90d': 90, '6mo': 180, '1yr': 365, 'all': null,
    };
    const days = rangeDays[timeRange];
    const cutoff = days ? subDays(now, days) : null;
    const filtered = cutoff
      ? allReadings.filter(r => new Date(r.measured_at) >= cutoff)
      : allReadings;

    // Latest reading (from all, not filtered)
    const latest = allReadings[allReadings.length - 1];

    // Period averages
    const last7 = allReadings.filter(r => new Date(r.measured_at) >= subDays(now, 7));
    const last30 = allReadings.filter(r => new Date(r.measured_at) >= subDays(now, 30));
    const last90 = allReadings.filter(r => new Date(r.measured_at) >= subDays(now, 90));

    const avg7sys = avg(last7.map(r => r.systolic));
    const avg7dia = avg(last7.map(r => r.diastolic));
    const avg30sys = avg(last30.map(r => r.systolic));
    const avg30dia = avg(last30.map(r => r.diastolic));
    const avg90sys = avg(last90.map(r => r.systolic));
    const avg90dia = avg(last90.map(r => r.diastolic));

    // All-time high/low
    const allTimeHigh = allReadings.reduce((best, r) => r.systolic > best.systolic ? r : best, allReadings[0]);
    const allTimeLow = allReadings.reduce((best, r) => r.systolic < best.systolic ? r : best, allReadings[0]);

    // Trend chart data (filtered by range)
    const trendData = filtered.map(r => ({
      date: format(new Date(r.measured_at), 'M/d'),
      fullDate: format(new Date(r.measured_at), 'MMM d, yyyy h:mm a'),
      systolic: r.systolic,
      diastolic: r.diastolic,
    }));

    // 7-reading moving average
    const movingAvgData = filtered.map((r, i) => {
      const window = filtered.slice(Math.max(0, i - 6), i + 1);
      return {
        date: format(new Date(r.measured_at), 'M/d'),
        sysMA: avg(window.map(w => w.systolic)),
        diaMA: avg(window.map(w => w.diastolic)),
      };
    });

    // Distribution
    const categories: Record<BPCategory, number> = { Normal: 0, Elevated: 0, 'Stage 1': 0, 'Stage 2': 0 };
    allReadings.forEach(r => { categories[classifyBP(r.systolic, r.diastolic)]++; });
    const distData = Object.entries(categories).map(([name, count]) => ({
      name,
      count,
      pct: Math.round((count / allReadings.length) * 100),
    }));

    // Time of day
    const byPeriod = { morning: [] as BPReading[], afternoon: [] as BPReading[], evening: [] as BPReading[] };
    allReadings.forEach(r => {
      const h = getHours(new Date(r.measured_at));
      if (h >= 6 && h < 12) byPeriod.morning.push(r);
      else if (h >= 12 && h < 17) byPeriod.afternoon.push(r);
      else if (h >= 17 && h < 22) byPeriod.evening.push(r);
    });

    const periodStats = Object.entries(byPeriod).map(([period, readings]) => ({
      period: period.charAt(0).toUpperCase() + period.slice(1),
      count: readings.length,
      avgSys: avg(readings.map(r => r.systolic)),
      avgDia: avg(readings.map(r => r.diastolic)),
    }));

    const scatterData = allReadings.map(r => ({
      hour: getHours(new Date(r.measured_at)),
      systolic: r.systolic,
      diastolic: r.diastolic,
      date: format(new Date(r.measured_at), 'M/d h:mm a'),
    }));

    // Weekly averages
    const weeklyMap = new Map<string, BPReading[]>();
    allReadings.forEach(r => {
      const wk = format(startOfWeek(new Date(r.measured_at)), 'M/d');
      if (!weeklyMap.has(wk)) weeklyMap.set(wk, []);
      weeklyMap.get(wk)!.push(r);
    });
    const weeklyData = Array.from(weeklyMap.entries()).map(([week, readings]) => ({
      week,
      avgSys: avg(readings.map(r => r.systolic))!,
      avgDia: avg(readings.map(r => r.diastolic))!,
      count: readings.length,
    }));

    // Monthly averages
    const monthlyMap = new Map<string, BPReading[]>();
    allReadings.forEach(r => {
      const mo = format(startOfMonth(new Date(r.measured_at)), 'MMM yyyy');
      if (!monthlyMap.has(mo)) monthlyMap.set(mo, []);
      monthlyMap.get(mo)!.push(r);
    });
    const monthlyData = Array.from(monthlyMap.entries()).map(([month, readings]) => ({
      month,
      avgSys: avg(readings.map(r => r.systolic))!,
      avgDia: avg(readings.map(r => r.diastolic))!,
      count: readings.length,
    }));

    // Spike detection (> 1.5 SD from mean)
    const sysMean = avg(allReadings.map(r => r.systolic)) || 0;
    const sysSD = stdDev(allReadings.map(r => r.systolic));
    const threshold = sysMean + 1.5 * sysSD;
    const spikes = allReadings
      .filter(r => r.systolic > threshold)
      .sort((a, b) => b.systolic - a.systolic);

    return {
      latest,
      totalCount: allReadings.length,
      avg7: avg7sys && avg7dia ? { sys: avg7sys, dia: avg7dia } : null,
      avg30: avg30sys && avg30dia ? { sys: avg30sys, dia: avg30dia } : null,
      avg90: avg90sys && avg90dia ? { sys: avg90sys, dia: avg90dia } : null,
      allTimeHigh,
      allTimeLow,
      trendData,
      movingAvgData,
      distData,
      periodStats,
      scatterData,
      weeklyData,
      monthlyData,
      spikes,
      spikeThreshold: Math.round(threshold),
      filtered,
    };
  }, [allReadings, timeRange]);

  // Search + paginate for the log
  const logData = useMemo(() => {
    const reversed = [...allReadings].reverse();
    const searched = searchQuery
      ? reversed.filter(r => r.notes?.toLowerCase().includes(searchQuery.toLowerCase())
          || format(new Date(r.measured_at), 'MMM d, yyyy').toLowerCase().includes(searchQuery.toLowerCase()))
      : reversed;
    const totalPages = Math.ceil(searched.length / LOG_PAGE_SIZE);
    const page = searched.slice(logPage * LOG_PAGE_SIZE, (logPage + 1) * LOG_PAGE_SIZE);
    return { items: page, totalPages, totalCount: searched.length };
  }, [allReadings, searchQuery, logPage]);

  return {
    isLoading,
    allReadings,
    computed,
    timeRange, setTimeRange,
    showMovingAvg, setShowMovingAvg,
    searchQuery, setSearchQuery,
    logPage, setLogPage,
    logData,
  };
}
