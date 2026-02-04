-- Create briefing preferences table (user defaults/settings)
CREATE TABLE public.briefing_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  enabled BOOLEAN DEFAULT true,
  default_wake_time TIME DEFAULT '07:00',
  default_topics TEXT[] DEFAULT '{}',
  timezone TEXT DEFAULT 'America/Chicago',
  evening_reminder_time TIME DEFAULT '19:00',
  preferred_channel TEXT DEFAULT 'sms' CHECK (preferred_channel IN ('call', 'sms', 'both')),
  voice_id TEXT DEFAULT 'JBFqnCBsd6RMkjVDRZzb',
  include_calendar BOOLEAN DEFAULT true,
  include_email_summary BOOLEAN DEFAULT false,
  include_weather BOOLEAN DEFAULT true,
  weekend_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.briefing_preferences ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own briefing preferences"
ON public.briefing_preferences FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own briefing preferences"
ON public.briefing_preferences FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own briefing preferences"
ON public.briefing_preferences FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own briefing preferences"
ON public.briefing_preferences FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_briefing_preferences_updated_at
BEFORE UPDATE ON public.briefing_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create morning briefings table (daily records)
CREATE TABLE public.morning_briefings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  wake_date DATE NOT NULL,
  wake_time TIME NOT NULL,
  topics TEXT[] DEFAULT '{}',
  custom_instructions TEXT,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'generating', 'ready', 'played', 'failed', 'skipped')),
  podcast_url TEXT,
  script TEXT,
  duration_seconds INTEGER,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  generated_at TIMESTAMPTZ,
  played_at TIMESTAMPTZ,
  UNIQUE(user_id, wake_date)
);

-- Enable RLS
ALTER TABLE public.morning_briefings ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own briefings"
ON public.morning_briefings FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own briefings"
ON public.morning_briefings FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own briefings"
ON public.morning_briefings FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own briefings"
ON public.morning_briefings FOR DELETE
USING (auth.uid() = user_id);

-- Create briefing sources table (what went into each briefing)
CREATE TABLE public.briefing_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  briefing_id UUID REFERENCES public.morning_briefings(id) ON DELETE CASCADE,
  source_type TEXT CHECK (source_type IN ('calendar', 'email', 'weather', 'news', 'custom')),
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.briefing_sources ENABLE ROW LEVEL SECURITY;

-- RLS policy via briefing ownership
CREATE POLICY "Users can view sources for their briefings"
ON public.briefing_sources FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.morning_briefings mb
  WHERE mb.id = briefing_id AND mb.user_id = auth.uid()
));

CREATE POLICY "Users can create sources for their briefings"
ON public.briefing_sources FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.morning_briefings mb
  WHERE mb.id = briefing_id AND mb.user_id = auth.uid()
));

-- Add api_key column to profiles for iOS Shortcut authentication
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS api_key TEXT UNIQUE;

-- Create storage bucket for briefing audio files
INSERT INTO storage.buckets (id, name, public)
VALUES ('briefings', 'briefings', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policy for briefing audio
CREATE POLICY "Anyone can view briefing audio"
ON storage.objects FOR SELECT
USING (bucket_id = 'briefings');

CREATE POLICY "Service role can upload briefing audio"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'briefings');

CREATE POLICY "Service role can delete briefing audio"
ON storage.objects FOR DELETE
USING (bucket_id = 'briefings');