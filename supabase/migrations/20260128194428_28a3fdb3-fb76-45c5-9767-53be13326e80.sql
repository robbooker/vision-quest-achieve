-- Create oura_daily_metrics table for unified biometric data
CREATE TABLE public.oura_daily_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  metric_date DATE NOT NULL,
  
  -- Sleep Data
  sleep_score INTEGER,
  total_sleep_seconds INTEGER,
  deep_sleep_seconds INTEGER,
  rem_sleep_seconds INTEGER,
  light_sleep_seconds INTEGER,
  sleep_efficiency INTEGER,
  
  -- Readiness Data
  readiness_score INTEGER,
  resting_heart_rate INTEGER,
  hrv_balance INTEGER,
  
  -- Resilience Data (5 Oura v2 levels)
  resilience_level TEXT CHECK (resilience_level IN ('exceptional', 'strong', 'solid', 'adequate', 'limited')),
  
  -- Stress Detection (Dual-Signal System)
  rhr_baseline_14d INTEGER,
  hrv_baseline_14d INTEGER,
  rhr_spike_alert BOOLEAN DEFAULT false,
  hrv_strain_alert BOOLEAN DEFAULT false,
  critical_deficit_alert BOOLEAN DEFAULT false,
  
  -- Manual Fallback
  source TEXT NOT NULL DEFAULT 'oura' CHECK (source IN ('oura', 'manual')),
  manual_bedtime TIMESTAMPTZ,
  manual_wake_time TIMESTAMPTZ,
  manual_sleep_quality INTEGER CHECK (manual_sleep_quality >= 1 AND manual_sleep_quality <= 5),
  
  -- Metadata
  synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Unique constraint per user per day
  UNIQUE (user_id, metric_date)
);

-- Add oura_access_token to profiles table
ALTER TABLE public.profiles 
ADD COLUMN oura_access_token TEXT,
ADD COLUMN oura_connected_at TIMESTAMPTZ,
ADD COLUMN manual_sleep_enabled BOOLEAN DEFAULT false;

-- Enable RLS
ALTER TABLE public.oura_daily_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for oura_daily_metrics
CREATE POLICY "Users can view their own metrics"
ON public.oura_daily_metrics
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own metrics"
ON public.oura_daily_metrics
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own metrics"
ON public.oura_daily_metrics
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own metrics"
ON public.oura_daily_metrics
FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_oura_daily_metrics_updated_at
BEFORE UPDATE ON public.oura_daily_metrics
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();