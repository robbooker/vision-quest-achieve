-- Create table for tracking daily tactic completions
CREATE TABLE public.tactic_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tactic_id UUID NOT NULL REFERENCES public.goal_tactics(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  logged_date DATE NOT NULL,
  completed_count INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create unique constraint to prevent duplicate logs for same tactic/date
CREATE UNIQUE INDEX tactic_logs_tactic_date_unique ON public.tactic_logs(tactic_id, logged_date);

-- Enable Row Level Security
ALTER TABLE public.tactic_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own tactic logs"
ON public.tactic_logs
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tactic logs"
ON public.tactic_logs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tactic logs"
ON public.tactic_logs
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tactic logs"
ON public.tactic_logs
FOR DELETE
USING (auth.uid() = user_id);