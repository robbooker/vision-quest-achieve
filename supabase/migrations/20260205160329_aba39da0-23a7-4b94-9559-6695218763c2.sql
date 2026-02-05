-- Table: briefing_lab_preferences
CREATE TABLE public.briefing_lab_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  
  -- Core settings
  location_lat DOUBLE PRECISION,
  location_lng DOUBLE PRECISION,
  location_name TEXT,
  voice_id TEXT DEFAULT 'JBFqnCBsd6RMkjVDRZzb',
  
  -- Category toggles
  include_sports BOOLEAN DEFAULT false,
  include_tech BOOLEAN DEFAULT false,
  include_business BOOLEAN DEFAULT false,
  include_trading BOOLEAN DEFAULT false,
  include_politics BOOLEAN DEFAULT false,
  include_books BOOLEAN DEFAULT false,
  include_film_tv BOOLEAN DEFAULT false,
  include_music BOOLEAN DEFAULT false,
  include_gaming BOOLEAN DEFAULT false,
  include_science BOOLEAN DEFAULT false,
  include_health BOOLEAN DEFAULT false,
  include_short_scout BOOLEAN DEFAULT false,
  include_weather BOOLEAN DEFAULT true,
  include_calendar BOOLEAN DEFAULT true,
  include_intention BOOLEAN DEFAULT true,
  
  -- Category-specific interests
  sports_teams TEXT,
  tech_topics TEXT,
  business_topics TEXT,
  politics_topics TEXT,
  books_topics TEXT,
  music_topics TEXT,
  gaming_topics TEXT,
  science_topics TEXT,
  health_topics TEXT,
  
  -- Free-form custom topics
  custom_topics TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.briefing_lab_preferences ENABLE ROW LEVEL SECURITY;

-- RLS policies for briefing_lab_preferences
CREATE POLICY "Users can view own lab preferences" ON public.briefing_lab_preferences
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own lab preferences" ON public.briefing_lab_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own lab preferences" ON public.briefing_lab_preferences
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own lab preferences" ON public.briefing_lab_preferences
  FOR DELETE USING (auth.uid() = user_id);

-- Table: briefing_scraped_data
CREATE TABLE public.briefing_scraped_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scraped_at TIMESTAMPTZ DEFAULT now(),
  data JSONB NOT NULL,
  sources_succeeded TEXT[] DEFAULT '{}',
  sources_failed TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.briefing_scraped_data ENABLE ROW LEVEL SECURITY;

-- RLS policies for briefing_scraped_data
CREATE POLICY "Users can view own scraped data" ON public.briefing_scraped_data
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own scraped data" ON public.briefing_scraped_data
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own scraped data" ON public.briefing_scraped_data
  FOR DELETE USING (auth.uid() = user_id);

-- Table: briefing_lab_episodes
CREATE TABLE public.briefing_lab_episodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  generated_at TIMESTAMPTZ DEFAULT now(),
  podcast_url TEXT,
  script TEXT,
  duration_seconds INTEGER,
  categories_used TEXT[],
  scraped_data_id UUID REFERENCES public.briefing_scraped_data(id),
  status TEXT DEFAULT 'generating',
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.briefing_lab_episodes ENABLE ROW LEVEL SECURITY;

-- RLS policies for briefing_lab_episodes
CREATE POLICY "Users can view own lab episodes" ON public.briefing_lab_episodes
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own lab episodes" ON public.briefing_lab_episodes
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own lab episodes" ON public.briefing_lab_episodes
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own lab episodes" ON public.briefing_lab_episodes
  FOR DELETE USING (auth.uid() = user_id);