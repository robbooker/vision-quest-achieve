-- Create daily_nutrition table for meal tracking
CREATE TABLE public.daily_nutrition (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  meal_description TEXT NOT NULL,
  calories INTEGER,
  protein_g NUMERIC(6,1),
  carbs_g NUMERIC(6,1),
  fats_g NUMERIC(6,1),
  sugar_g NUMERIC(6,1),
  fiber_g NUMERIC(6,1),
  source TEXT NOT NULL DEFAULT 'manual',
  meal_type TEXT DEFAULT 'meal',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.daily_nutrition ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own nutrition entries"
ON public.daily_nutrition
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own nutrition entries"
ON public.daily_nutrition
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own nutrition entries"
ON public.daily_nutrition
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own nutrition entries"
ON public.daily_nutrition
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_daily_nutrition_updated_at
BEFORE UPDATE ON public.daily_nutrition
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for efficient querying by user and date
CREATE INDEX idx_daily_nutrition_user_date ON public.daily_nutrition(user_id, entry_date);

-- Create user_nutrition_settings table for calorie/macro goals
CREATE TABLE public.user_nutrition_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  daily_calorie_goal INTEGER DEFAULT 2000,
  protein_goal_g INTEGER DEFAULT 150,
  carbs_goal_g INTEGER DEFAULT 200,
  fats_goal_g INTEGER DEFAULT 65,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on settings
ALTER TABLE public.user_nutrition_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own nutrition settings"
ON public.user_nutrition_settings
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own nutrition settings"
ON public.user_nutrition_settings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own nutrition settings"
ON public.user_nutrition_settings
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own nutrition settings"
ON public.user_nutrition_settings
FOR DELETE
USING (auth.uid() = user_id);

CREATE TRIGGER update_user_nutrition_settings_updated_at
BEFORE UPDATE ON public.user_nutrition_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();