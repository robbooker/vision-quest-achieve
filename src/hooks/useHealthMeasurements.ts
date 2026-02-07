import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format, subDays, getHours } from 'date-fns';
import { toast } from 'sonner';

export type MeasurementType = 'weight' | 'blood_pressure';

export interface HealthMeasurement {
  id: string;
  user_id: string;
  measurement_type: MeasurementType;
  primary_value: number;
  secondary_value: number | null;
  unit: string;
  notes: string | null;
  measured_at: string;
  created_at: string;
}

export interface WeightEntry {
  value: number;
  unit: 'lbs' | 'kg';
  notes?: string;
}

export interface BloodPressureEntry {
  systolic: number;
  diastolic: number;
  notes?: string;
}

export interface BPScatterPoint {
  hour: number;
  systolic: number;
  diastolic: number;
  date: string;
  fullTime: string;
  notes: string | null;
}

export interface TimeOfDayStats {
  morningAvg: { systolic: number; diastolic: number } | null;
  afternoonAvg: { systolic: number; diastolic: number } | null;
  eveningAvg: { systolic: number; diastolic: number } | null;
  lowestPeriod: 'morning' | 'afternoon' | 'evening' | null;
  insight: string | null;
}

function calculatePeriodAvg(readings: HealthMeasurement[]): { systolic: number; diastolic: number } | null {
  if (readings.length === 0) return null;
  const avgSys = Math.round(readings.reduce((sum, r) => sum + r.primary_value, 0) / readings.length);
  const avgDia = Math.round(readings.reduce((sum, r) => sum + (r.secondary_value || 0), 0) / readings.length);
  return { systolic: avgSys, diastolic: avgDia };
}

export function useHealthMeasurements(daysBack: number = 30) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const startDate = format(subDays(new Date(), daysBack - 1), 'yyyy-MM-dd');

  // Fetch all measurements
  const { data: measurements, isLoading } = useQuery({
    queryKey: ['health-measurements', user?.id, daysBack],
    queryFn: async (): Promise<HealthMeasurement[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('health_measurements')
        .select('*')
        .eq('user_id', user.id)
        .gte('measured_at', startDate)
        .order('measured_at', { ascending: false });

      if (error) throw error;
      return (data || []) as HealthMeasurement[];
    },
    enabled: !!user?.id,
  });

  // Get today's date string
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  
  // Get today's weight (only show today's measurement)
  const todayWeight = measurements?.find(
    m => m.measurement_type === 'weight' && 
    format(new Date(m.measured_at), 'yyyy-MM-dd') === todayStr
  );

  // Get today's blood pressure (only show today's measurement)
  const todayBP = measurements?.find(
    m => m.measurement_type === 'blood_pressure' && 
    format(new Date(m.measured_at), 'yyyy-MM-dd') === todayStr
  );

  // Get weight trend (last 14 days) for trend indicator
  const weightHistory = measurements
    ?.filter(m => m.measurement_type === 'weight')
    .slice(0, 14)
    .reverse() || [];

  // Get blood pressure readings for history/trends
  const bpHistory = measurements
    ?.filter(m => m.measurement_type === 'blood_pressure')
    .slice(0, 20) || [];

  // Calculate weight stats - compare today's weight to previous measurement
  const latestWeight = todayWeight?.primary_value || null;
  const previousWeight = weightHistory.length > 0 
    ? weightHistory.find(w => format(new Date(w.measured_at), 'yyyy-MM-dd') !== todayStr)?.primary_value 
    : null;
  const weightChange = latestWeight && previousWeight ? latestWeight - previousWeight : null;

  // Today's BP values (not averages)
  const todaySystolic = todayBP?.primary_value || null;
  const todayDiastolic = todayBP?.secondary_value || null;

  // Calculate BP averages for historical comparison (last 7 readings)
  const recentBP = bpHistory.slice(0, 7);
  const avgSystolic = recentBP.length > 0 
    ? Math.round(recentBP.reduce((sum, bp) => sum + bp.primary_value, 0) / recentBP.length)
    : null;
  const avgDiastolic = recentBP.length > 0
    ? Math.round(recentBP.reduce((sum, bp) => sum + (bp.secondary_value || 0), 0) / recentBP.length)
    : null;

  // Generate scatter plot data for BP time-of-day analysis
  const bpScatterData: BPScatterPoint[] = bpHistory.map(reading => {
    const date = new Date(reading.measured_at);
    return {
      hour: getHours(date),
      systolic: reading.primary_value,
      diastolic: reading.secondary_value || 0,
      date: format(date, 'M/d'),
      fullTime: format(date, 'M/d h:mm a'),
      notes: reading.notes,
    };
  });

  // Calculate time-of-day stats
  const morningReadings = bpHistory.filter(r => {
    const hour = getHours(new Date(r.measured_at));
    return hour >= 6 && hour < 12;
  });
  const afternoonReadings = bpHistory.filter(r => {
    const hour = getHours(new Date(r.measured_at));
    return hour >= 12 && hour < 17;
  });
  const eveningReadings = bpHistory.filter(r => {
    const hour = getHours(new Date(r.measured_at));
    return hour >= 17 && hour < 22;
  });

  const morningAvg = calculatePeriodAvg(morningReadings);
  const afternoonAvg = calculatePeriodAvg(afternoonReadings);
  const eveningAvg = calculatePeriodAvg(eveningReadings);

  // Determine lowest period
  let lowestPeriod: 'morning' | 'afternoon' | 'evening' | null = null;
  const periods = [
    { name: 'morning' as const, avg: morningAvg },
    { name: 'afternoon' as const, avg: afternoonAvg },
    { name: 'evening' as const, avg: eveningAvg },
  ].filter(p => p.avg !== null);

  if (periods.length > 0) {
    lowestPeriod = periods.reduce((lowest, current) => 
      current.avg!.systolic < lowest.avg!.systolic ? current : lowest
    ).name;
  }

  // Generate insight
  let timeOfDayInsight: string | null = null;
  if (morningAvg && eveningAvg) {
    const diff = morningAvg.systolic - eveningAvg.systolic;
    if (Math.abs(diff) >= 5) {
      if (diff > 0) {
        timeOfDayInsight = `Morning readings average ${diff} mmHg higher than evening readings.`;
      } else {
        timeOfDayInsight = `Evening readings average ${Math.abs(diff)} mmHg higher than morning readings.`;
      }
    }
  } else if (bpHistory.length >= 3 && bpHistory.length < 6) {
    timeOfDayInsight = "Log more readings at different times to reveal patterns.";
  }

  const timeOfDayStats: TimeOfDayStats = {
    morningAvg,
    afternoonAvg,
    eveningAvg,
    lowestPeriod,
    insight: timeOfDayInsight,
  };

  // Log weight
  const logWeight = useMutation({
    mutationFn: async (entry: WeightEntry) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('health_measurements')
        .insert({
          user_id: user.id,
          measurement_type: 'weight',
          primary_value: entry.value,
          unit: entry.unit,
          notes: entry.notes || null,
          measured_at: new Date().toISOString(),
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['health-measurements'] });
      toast.success('Weight logged');
    },
    onError: (error) => {
      toast.error('Failed to log weight');
      console.error(error);
    },
  });

  // Log blood pressure
  const logBloodPressure = useMutation({
    mutationFn: async (entry: BloodPressureEntry) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('health_measurements')
        .insert({
          user_id: user.id,
          measurement_type: 'blood_pressure',
          primary_value: entry.systolic,
          secondary_value: entry.diastolic,
          unit: 'mmHg',
          notes: entry.notes || null,
          measured_at: new Date().toISOString(),
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['health-measurements'] });
      toast.success('Blood pressure logged');
    },
    onError: (error) => {
      toast.error('Failed to log blood pressure');
      console.error(error);
    },
  });

  // Delete measurement
  const deleteMeasurement = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('health_measurements')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['health-measurements'] });
      toast.success('Measurement deleted');
    },
  });

  return {
    measurements,
    isLoading,
    todayWeight,
    todayBP,
    todaySystolic,
    todayDiastolic,
    weightHistory,
    bpHistory,
    latestWeight,
    weightChange,
    avgSystolic,
    avgDiastolic,
    bpScatterData,
    timeOfDayStats,
    logWeight,
    logBloodPressure,
    deleteMeasurement,
  };
}
