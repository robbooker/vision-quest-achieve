CREATE TABLE public.briefing_sms_sent (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  sent_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, sent_date)
);

ALTER TABLE public.briefing_sms_sent ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own SMS records"
  ON public.briefing_sms_sent FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert SMS records"
  ON public.briefing_sms_sent FOR INSERT
  WITH CHECK (true);