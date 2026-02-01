-- Create monthly_intentions table
CREATE TABLE public.monthly_intentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  month DATE NOT NULL,
  word TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, month)
);

-- Enable RLS
ALTER TABLE public.monthly_intentions ENABLE ROW LEVEL SECURITY;

-- RLS policies for monthly_intentions
CREATE POLICY "Users can view their own intentions"
ON public.monthly_intentions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own intentions"
ON public.monthly_intentions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own intentions"
ON public.monthly_intentions FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own intentions"
ON public.monthly_intentions FOR DELETE
USING (auth.uid() = user_id);

-- Add intention tracking columns to journal_entries
ALTER TABLE public.journal_entries 
  ADD COLUMN IF NOT EXISTS intention_score INTEGER,
  ADD COLUMN IF NOT EXISTS intention_reflection TEXT;

-- Add constraint for intention_score range (1-5)
ALTER TABLE public.journal_entries 
  ADD CONSTRAINT intention_score_range CHECK (intention_score IS NULL OR (intention_score >= 1 AND intention_score <= 5));