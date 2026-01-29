-- Add physical activity columns to oura_daily_metrics
ALTER TABLE public.oura_daily_metrics
ADD COLUMN IF NOT EXISTS activity_score integer,
ADD COLUMN IF NOT EXISTS active_calories integer,
ADD COLUMN IF NOT EXISTS total_calories integer,
ADD COLUMN IF NOT EXISTS steps integer,
ADD COLUMN IF NOT EXISTS equivalent_walking_distance_meters integer,
ADD COLUMN IF NOT EXISTS high_activity_minutes integer,
ADD COLUMN IF NOT EXISTS medium_activity_minutes integer,
ADD COLUMN IF NOT EXISTS low_activity_minutes integer,
ADD COLUMN IF NOT EXISTS sedentary_minutes integer,
ADD COLUMN IF NOT EXISTS inactivity_alerts integer;

COMMENT ON COLUMN public.oura_daily_metrics.activity_score IS 'Oura daily activity score (0-100)';
COMMENT ON COLUMN public.oura_daily_metrics.active_calories IS 'Calories burned from activity';
COMMENT ON COLUMN public.oura_daily_metrics.steps IS 'Total steps for the day';
COMMENT ON COLUMN public.oura_daily_metrics.high_activity_minutes IS 'Minutes of high intensity activity';
COMMENT ON COLUMN public.oura_daily_metrics.medium_activity_minutes IS 'Minutes of medium intensity activity';