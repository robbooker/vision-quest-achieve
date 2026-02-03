import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format, subDays, startOfDay } from 'date-fns';
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
  notes?: string; // What were you doing before measuring
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
    logWeight,
    logBloodPressure,
    deleteMeasurement,
  };
}
