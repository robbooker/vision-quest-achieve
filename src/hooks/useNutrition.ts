import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';

export interface NutritionEntry {
  id: string;
  user_id: string;
  entry_date: string;
  meal_description: string;
  meal_type: string | null;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fats_g: number | null;
  sugar_g: number | null;
  fiber_g: number | null;
  source: string;
  created_at: string;
  updated_at: string;
}

export interface NutritionSettings {
  id: string;
  user_id: string;
  daily_calorie_goal: number | null;
  protein_goal_g: number | null;
  carbs_goal_g: number | null;
  fats_goal_g: number | null;
}

export interface NutritionTotals {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
  sugar_g: number;
  fiber_g: number;
  mealCount: number;
}

export interface ParsedNutrition {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
  sugar_g: number;
  fiber_g: number;
  parsed_items: string[];
}

// Hook to fetch today's nutrition entries
export function useTodayNutrition() {
  const { user } = useAuth();
  const today = format(new Date(), 'yyyy-MM-dd');

  return useQuery({
    queryKey: ['nutrition', 'today', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('daily_nutrition')
        .select('*')
        .eq('user_id', user.id)
        .eq('entry_date', today)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as NutritionEntry[];
    },
    enabled: !!user?.id,
  });
}

// Hook to fetch nutrition entries for a specific date
export function useNutritionByDate(date: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['nutrition', date, user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('daily_nutrition')
        .select('*')
        .eq('user_id', user.id)
        .eq('entry_date', date)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as NutritionEntry[];
    },
    enabled: !!user?.id && !!date,
  });
}

// Hook to fetch user nutrition settings
export function useNutritionSettings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['nutrition-settings', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('user_nutrition_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data as NutritionSettings | null;
    },
    enabled: !!user?.id,
  });

  const updateSettings = useMutation({
    mutationFn: async (settings: Partial<Omit<NutritionSettings, 'id' | 'user_id'>>) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data: existing } = await supabase
        .from('user_nutrition_settings')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('user_nutrition_settings')
          .update(settings)
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_nutrition_settings')
          .insert({ user_id: user.id, ...settings });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nutrition-settings', user?.id] });
    },
  });

  return { ...query, updateSettings };
}

// Calculate totals from entries
export function calculateTotals(entries: NutritionEntry[]): NutritionTotals {
  return entries.reduce(
    (acc, entry) => ({
      calories: acc.calories + (entry.calories || 0),
      protein_g: acc.protein_g + (entry.protein_g || 0),
      carbs_g: acc.carbs_g + (entry.carbs_g || 0),
      fats_g: acc.fats_g + (entry.fats_g || 0),
      sugar_g: acc.sugar_g + (entry.sugar_g || 0),
      fiber_g: acc.fiber_g + (entry.fiber_g || 0),
      mealCount: acc.mealCount + 1,
    }),
    { calories: 0, protein_g: 0, carbs_g: 0, fats_g: 0, sugar_g: 0, fiber_g: 0, mealCount: 0 }
  );
}

// Hook for nutrition CRUD operations
export function useNutritionMutations() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const today = format(new Date(), 'yyyy-MM-dd');

  const logMeal = useMutation({
    mutationFn: async (data: {
      meal_description: string;
      meal_type?: string;
      calories?: number;
      protein_g?: number;
      carbs_g?: number;
      fats_g?: number;
      sugar_g?: number;
      fiber_g?: number;
      source?: string;
      entry_date?: string;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('daily_nutrition')
        .insert({
          user_id: user.id,
          entry_date: data.entry_date || today,
          meal_description: data.meal_description,
          meal_type: data.meal_type || null,
          calories: data.calories || null,
          protein_g: data.protein_g || null,
          carbs_g: data.carbs_g || null,
          fats_g: data.fats_g || null,
          sugar_g: data.sugar_g || null,
          fiber_g: data.fiber_g || null,
          source: data.source || 'manual',
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nutrition'] });
    },
  });

  const updateMeal = useMutation({
    mutationFn: async (data: {
      id: string;
      meal_description?: string;
      meal_type?: string;
      calories?: number;
      protein_g?: number;
      carbs_g?: number;
      fats_g?: number;
      sugar_g?: number;
      fiber_g?: number;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { id, ...updates } = data;
      const { error } = await supabase
        .from('daily_nutrition')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nutrition'] });
    },
  });

  const deleteMeal = useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('daily_nutrition')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nutrition'] });
    },
  });

  const parseNutrition = useMutation({
    mutationFn: async (mealDescription: string): Promise<ParsedNutrition> => {
      const { data, error } = await supabase.functions.invoke('parse-nutrition', {
        body: { mealDescription },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);
      
      return data as ParsedNutrition;
    },
  });

  return { logMeal, updateMeal, deleteMeal, parseNutrition };
}
