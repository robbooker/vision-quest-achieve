-- Add max duration and per-category depth settings to briefing_lab_preferences
ALTER TABLE public.briefing_lab_preferences
ADD COLUMN IF NOT EXISTS max_duration_minutes integer DEFAULT 5,
ADD COLUMN IF NOT EXISTS sports_depth text DEFAULT 'brief' CHECK (sports_depth IN ('off', 'brief', 'full')),
ADD COLUMN IF NOT EXISTS tech_depth text DEFAULT 'full' CHECK (tech_depth IN ('off', 'brief', 'full')),
ADD COLUMN IF NOT EXISTS business_depth text DEFAULT 'brief' CHECK (business_depth IN ('off', 'brief', 'full')),
ADD COLUMN IF NOT EXISTS trading_depth text DEFAULT 'brief' CHECK (trading_depth IN ('off', 'brief', 'full')),
ADD COLUMN IF NOT EXISTS politics_depth text DEFAULT 'off' CHECK (politics_depth IN ('off', 'brief', 'full')),
ADD COLUMN IF NOT EXISTS books_depth text DEFAULT 'off' CHECK (books_depth IN ('off', 'brief', 'full')),
ADD COLUMN IF NOT EXISTS film_tv_depth text DEFAULT 'off' CHECK (film_tv_depth IN ('off', 'brief', 'full')),
ADD COLUMN IF NOT EXISTS music_depth text DEFAULT 'off' CHECK (music_depth IN ('off', 'brief', 'full')),
ADD COLUMN IF NOT EXISTS gaming_depth text DEFAULT 'off' CHECK (gaming_depth IN ('off', 'brief', 'full')),
ADD COLUMN IF NOT EXISTS science_depth text DEFAULT 'brief' CHECK (science_depth IN ('off', 'brief', 'full')),
ADD COLUMN IF NOT EXISTS health_depth text DEFAULT 'brief' CHECK (health_depth IN ('off', 'brief', 'full'));

-- Add comment for documentation
COMMENT ON COLUMN public.briefing_lab_preferences.max_duration_minutes IS 'Target maximum duration for the briefing in minutes';
COMMENT ON COLUMN public.briefing_lab_preferences.sports_depth IS 'Depth level: off (skip), brief (quick mention), full (detailed segment)';