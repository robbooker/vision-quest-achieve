-- Create monthly_recaps table for storing generated month-in-review content
CREATE TABLE public.monthly_recaps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  month DATE NOT NULL, -- First day of the month
  headline TEXT,
  subheadline TEXT,
  content JSONB DEFAULT '{}'::jsonb, -- All sections: opening, goals, habits, highlights, looking_ahead
  charts_data JSONB DEFAULT '{}'::jsonb, -- Pre-computed data for Recharts
  photos JSONB DEFAULT '[]'::jsonb, -- Photo URLs + AI-generated captions
  stats JSONB DEFAULT '{}'::jsonb, -- Quick-hit numbers
  tone TEXT DEFAULT 'balanced', -- 'witty' | 'reflective' | 'brutally_honest' | 'balanced'
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft' | 'published'
  privacy TEXT NOT NULL DEFAULT 'private', -- 'private' | 'unlisted' | 'public'
  slug TEXT UNIQUE,
  published_at TIMESTAMP WITH TIME ZONE,
  view_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, month)
);

-- Enable Row Level Security
ALTER TABLE public.monthly_recaps ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own recaps"
ON public.monthly_recaps
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own recaps"
ON public.monthly_recaps
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recaps"
ON public.monthly_recaps
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recaps"
ON public.monthly_recaps
FOR DELETE
USING (auth.uid() = user_id);

-- Public can view published public recaps
CREATE POLICY "Anyone can view public published recaps"
ON public.monthly_recaps
FOR SELECT
USING (status = 'published' AND privacy = 'public');

-- Create index for efficient queries
CREATE INDEX idx_monthly_recaps_user_month ON public.monthly_recaps(user_id, month);
CREATE INDEX idx_monthly_recaps_slug ON public.monthly_recaps(slug) WHERE slug IS NOT NULL;
CREATE INDEX idx_monthly_recaps_public ON public.monthly_recaps(status, privacy) WHERE status = 'published';

-- Trigger to update updated_at
CREATE TRIGGER update_monthly_recaps_updated_at
BEFORE UPDATE ON public.monthly_recaps
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();