-- Create monthly_audits table for storing generated Month in Review reports
CREATE TABLE public.monthly_audits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  month DATE NOT NULL, -- First day of the month being audited
  display_name TEXT, -- User's name at time of generation
  editorial_content JSONB, -- AI-generated op-ed sections (headline, opening, pull_quote, sections, closing)
  stats_snapshot JSONB, -- All metrics frozen at generation time
  pillar_analytics JSONB, -- PRIMED breakdown data
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft' | 'published'
  privacy TEXT NOT NULL DEFAULT 'private', -- 'private' | 'unlisted' | 'public'
  slug TEXT UNIQUE, -- For shareable URLs
  view_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure one audit per user per month
  CONSTRAINT monthly_audits_user_month_unique UNIQUE (user_id, month)
);

-- Enable Row Level Security
ALTER TABLE public.monthly_audits ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own audits" 
ON public.monthly_audits 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own audits" 
ON public.monthly_audits 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own audits" 
ON public.monthly_audits 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own audits" 
ON public.monthly_audits 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create policy for public viewing of published audits
CREATE POLICY "Anyone can view published public/unlisted audits"
ON public.monthly_audits
FOR SELECT
USING (status = 'published' AND privacy IN ('public', 'unlisted'));

-- Create updated_at trigger
CREATE TRIGGER update_monthly_audits_updated_at
BEFORE UPDATE ON public.monthly_audits
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to increment view count
CREATE OR REPLACE FUNCTION public.increment_audit_view(audit_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE monthly_audits
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE id = audit_id;
END;
$$;