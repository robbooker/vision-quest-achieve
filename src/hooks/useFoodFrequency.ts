import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { subDays, format } from 'date-fns';

export interface FoodFrequencyItem {
  food: string;
  count: number;
}

// Common words to filter out
const STOP_WORDS = new Set([
  'with', 'and', 'the', 'for', 'from', 'in', 'on', 'at', 'to', 'a', 'an',
  'of', 'or', 'some', 'one', 'two', 'three', 'large', 'small', 'medium',
  'oz', 'cup', 'cups', 'tbsp', 'tsp', 'piece', 'pieces', 'serving', 'servings',
  'g', 'gram', 'grams', 'ml', 'slice', 'slices', 'bowl', 'plate',
  'about', 'around', 'roughly', 'approximately', 'half', 'quarter',
  'breakfast', 'lunch', 'dinner', 'snack', 'meal', 'food', 'ate', 'had', 'eating',
]);

// Function to extract food keywords from meal descriptions
function extractFoodKeywords(descriptions: string[]): FoodFrequencyItem[] {
  const wordCounts = new Map<string, number>();

  for (const desc of descriptions) {
    if (!desc) continue;
    
    // Split into words, clean up, and filter
    const words = desc
      .toLowerCase()
      .replace(/[^a-z\s-]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !STOP_WORDS.has(word));
    
    // Count each unique word per description (to avoid double counting from same meal)
    const uniqueWords = new Set(words);
    for (const word of uniqueWords) {
      wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
    }
  }

  // Convert to array and sort by count
  return Array.from(wordCounts.entries())
    .map(([food, count]) => ({ food, count }))
    .filter(item => item.count >= 2) // Only show foods eaten at least twice
    .sort((a, b) => b.count - a.count)
    .slice(0, 20); // Top 20 foods
}

export function useFoodFrequency(daysBack: number = 30) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['food-frequency', user?.id, daysBack],
    queryFn: async (): Promise<{
      foods: FoodFrequencyItem[];
      totalMeals: number;
      uniqueFoods: number;
    }> => {
      if (!user?.id) {
        return { foods: [], totalMeals: 0, uniqueFoods: 0 };
      }

      const startDate = format(subDays(new Date(), daysBack - 1), 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('daily_nutrition')
        .select('meal_description')
        .eq('user_id', user.id)
        .gte('entry_date', startDate)
        .not('meal_description', 'is', null);

      if (error) throw error;

      const descriptions = (data || []).map(d => d.meal_description).filter(Boolean);
      const foods = extractFoodKeywords(descriptions);

      return {
        foods,
        totalMeals: descriptions.length,
        uniqueFoods: foods.length,
      };
    },
    enabled: !!user?.id,
    staleTime: 300000, // 5 minutes
  });
}
