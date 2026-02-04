-- Add location and topic instructions columns to briefing_preferences
ALTER TABLE public.briefing_preferences
ADD COLUMN location_lat DOUBLE PRECISION,
ADD COLUMN location_lng DOUBLE PRECISION,
ADD COLUMN location_name TEXT,
ADD COLUMN default_topic_instructions TEXT;