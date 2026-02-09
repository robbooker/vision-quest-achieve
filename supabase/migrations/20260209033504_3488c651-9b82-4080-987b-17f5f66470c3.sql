-- Create table to track sent evening reminders (prevent duplicates)
CREATE TABLE public.evening_reminders_sent (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  sent_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, sent_date)
);

-- Enable RLS
ALTER TABLE public.evening_reminders_sent ENABLE ROW LEVEL SECURITY;

-- Users can only see their own reminder history
CREATE POLICY "Users can view their own evening reminders"
  ON public.evening_reminders_sent
  FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can insert (edge function uses service role)
CREATE POLICY "Service role can insert evening reminders"
  ON public.evening_reminders_sent
  FOR INSERT
  WITH CHECK (true);

-- Add index for faster lookups
CREATE INDEX idx_evening_reminders_user_date ON public.evening_reminders_sent(user_id, sent_date);