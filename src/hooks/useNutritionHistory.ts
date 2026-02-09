import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { subDays, format } from 'date-fns';

export interface DailyNutritionSummary {
  date: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFats: number;
  totalWaterMl: number;
  mealCount: number;
  meals: {
    id: string;
    description: string;
    mealType: string | null;
    calories: number | null;
    protein: number | null;
    carbs: number | null;
    fats: number | null;
    createdAt: string;
  }[];
}

export interface WeightDataPoint {
  date: string;
  weight: number;
}

export function useNutritionHistory(daysBack: number = 30) {
  const { user } = useAuth();

  const nutritionQuery = useQuery({
    queryKey: ['nutrition-history', user?.id, daysBack],
    queryFn: async (): Promise<DailyNutritionSummary[]> => {
      if (!user?.id) return [];

      const startDate = format(subDays(new Date(), daysBack - 1), 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('daily_nutrition')
        .select('id, entry_date, meal_description, meal_type, calories, protein_g, carbs_g, fats_g, water_ml, created_at')
        .eq('user_id', user.id)
        .gte('entry_date', startDate)
        .order('entry_date', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Group by date
      const byDate = new Map<string, DailyNutritionSummary>();
      for (const row of data || []) {
        const existing = byDate.get(row.entry_date) || {
          date: row.entry_date,
          totalCalories: 0,
          totalProtein: 0,
          totalCarbs: 0,
          totalFats: 0,
          totalWaterMl: 0,
          mealCount: 0,
          meals: [],
        };

        // Only count non-water entries as meals
        const isWaterOnly = !row.calories && !row.protein_g && !row.carbs_g && !row.fats_g && row.water_ml;

        existing.totalCalories += row.calories || 0;
        existing.totalProtein += row.protein_g || 0;
        existing.totalCarbs += row.carbs_g || 0;
        existing.totalFats += row.fats_g || 0;
        existing.totalWaterMl += row.water_ml || 0;
        if (!isWaterOnly) existing.mealCount += 1;

        existing.meals.push({
          id: row.id,
          description: row.meal_description,
          mealType: row.meal_type,
          calories: row.calories,
          protein: row.protein_g,
          carbs: row.carbs_g,
          fats: row.fats_g,
          createdAt: row.created_at,
        });

        byDate.set(row.entry_date, existing);
      }

      return Array.from(byDate.values());
    },
    enabled: !!user?.id,
    staleTime: 120000,
  });

  const weightQuery = useQuery({
    queryKey: ['weight-history', user?.id, daysBack],
    queryFn: async (): Promise<WeightDataPoint[]> => {
      if (!user?.id) return [];

      const startDate = format(subDays(new Date(), daysBack - 1), 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('health_measurements')
        .select('primary_value, measured_at')
        .eq('user_id', user.id)
        .eq('measurement_type', 'weight')
        .gte('measured_at', startDate)
        .order('measured_at', { ascending: true });

      if (error) throw error;

      return (data || []).map(d => ({
        date: format(new Date(d.measured_at), 'yyyy-MM-dd'),
        weight: d.primary_value,
      }));
    },
    enabled: !!user?.id,
    staleTime: 120000,
  });

  return {
    nutritionHistory: nutritionQuery.data || [],
    weightHistory: weightQuery.data || [],
    isLoading: nutritionQuery.isLoading || weightQuery.isLoading,
  };
}
