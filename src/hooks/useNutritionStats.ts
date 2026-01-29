import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { subDays, format, differenceInDays, parseISO } from 'date-fns';

export interface NutritionStats {
  avgCalories: number;
  avgProtein: number;
  avgWaterMl: number;
  daysLogged: number;
  loggingStreak: number; // consecutive days with at least one meal logged
  daysHydrationGoalMet: number; // days with >= 3000ml water
  entries: {
    date: string;
    totalCalories: number;
    totalProtein: number;
    totalWaterMl: number;
    mealCount: number;
  }[];
}

export function useNutritionStats(daysBack: number = 7) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['nutrition-stats', user?.id, daysBack],
    queryFn: async (): Promise<NutritionStats> => {
      if (!user?.id) {
        return {
          avgCalories: 0,
          avgProtein: 0,
          avgWaterMl: 0,
          daysLogged: 0,
          loggingStreak: 0,
          daysHydrationGoalMet: 0,
          entries: [],
        };
      }

      const startDate = format(subDays(new Date(), daysBack - 1), 'yyyy-MM-dd');
      const endDate = format(new Date(), 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('daily_nutrition')
        .select('entry_date, calories, protein_g, water_ml')
        .eq('user_id', user.id)
        .gte('entry_date', startDate)
        .lte('entry_date', endDate)
        .order('entry_date', { ascending: false });

      if (error) throw error;

      // Group by date
      const byDate = new Map<string, { totalCalories: number; totalProtein: number; totalWaterMl: number; mealCount: number }>();
      for (const entry of data || []) {
        const existing = byDate.get(entry.entry_date) || { totalCalories: 0, totalProtein: 0, totalWaterMl: 0, mealCount: 0 };
        byDate.set(entry.entry_date, {
          totalCalories: existing.totalCalories + (entry.calories || 0),
          totalProtein: existing.totalProtein + (entry.protein_g || 0),
          totalWaterMl: existing.totalWaterMl + (entry.water_ml || 0),
          mealCount: existing.mealCount + 1,
        });
      }

      const entries = Array.from(byDate.entries()).map(([date, stats]) => ({
        date,
        ...stats,
      }));

      // Calculate averages (only for days with data)
      const daysLogged = entries.length;
      const avgCalories = daysLogged > 0 
        ? Math.round(entries.reduce((a, b) => a + b.totalCalories, 0) / daysLogged)
        : 0;
      const avgProtein = daysLogged > 0 
        ? Math.round(entries.reduce((a, b) => a + b.totalProtein, 0) / daysLogged)
        : 0;
      const avgWaterMl = daysLogged > 0 
        ? Math.round(entries.reduce((a, b) => a + b.totalWaterMl, 0) / daysLogged)
        : 0;
      
      // Count days meeting hydration goal (3000ml)
      const daysHydrationGoalMet = entries.filter(e => e.totalWaterMl >= 3000).length;
      // Calculate logging streak (consecutive days from today going back)
      let loggingStreak = 0;
      const sortedDates = [...byDate.keys()].sort((a, b) => 
        new Date(b).getTime() - new Date(a).getTime()
      );
      
      const today = format(new Date(), 'yyyy-MM-dd');
      let checkDate = today;
      
      for (const date of sortedDates) {
        if (date === checkDate) {
          loggingStreak++;
          checkDate = format(subDays(parseISO(checkDate), 1), 'yyyy-MM-dd');
        } else if (date < checkDate) {
          // Gap in dates, streak broken
          break;
        }
      }

      return {
        avgCalories,
        avgProtein,
        avgWaterMl,
        daysLogged,
        loggingStreak,
        daysHydrationGoalMet,
        entries,
      };
    },
    enabled: !!user?.id,
    staleTime: 60000,
  });
}
