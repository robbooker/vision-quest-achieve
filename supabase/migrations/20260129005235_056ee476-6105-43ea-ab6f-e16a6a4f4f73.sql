-- Add water_ml column to daily_nutrition table for tracking hydration
ALTER TABLE public.daily_nutrition 
ADD COLUMN water_ml integer DEFAULT 0;

-- Add comment explaining the column
COMMENT ON COLUMN public.daily_nutrition.water_ml IS 'Water consumed in milliliters. 3000ml = 3 liters ≈ 101 oz';