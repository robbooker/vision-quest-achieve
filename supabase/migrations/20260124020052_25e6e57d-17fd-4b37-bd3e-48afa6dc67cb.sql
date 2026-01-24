-- Add view_count column for tracking public views
ALTER TABLE public.monthly_recaps ADD COLUMN IF NOT EXISTS view_count integer DEFAULT 0;

-- Add password_hash for optional password protection on unlisted recaps
ALTER TABLE public.monthly_recaps ADD COLUMN IF NOT EXISTS password_hash text;

-- Create RLS policy for public access to published recaps
CREATE POLICY "Anyone can view published public recaps"
ON public.monthly_recaps
FOR SELECT
USING (status = 'published' AND privacy = 'public');

-- Create RLS policy for unlisted recaps (accessible via direct link)
CREATE POLICY "Anyone can view published unlisted recaps"
ON public.monthly_recaps
FOR SELECT
USING (status = 'published' AND privacy = 'unlisted');

-- Create function to increment view count
CREATE OR REPLACE FUNCTION public.increment_recap_view(recap_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE monthly_recaps
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE id = recap_id;
END;
$$;