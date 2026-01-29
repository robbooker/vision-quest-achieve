-- Add nap tracking column to oura_daily_metrics
ALTER TABLE public.oura_daily_metrics 
ADD COLUMN nap_duration_minutes integer DEFAULT NULL;