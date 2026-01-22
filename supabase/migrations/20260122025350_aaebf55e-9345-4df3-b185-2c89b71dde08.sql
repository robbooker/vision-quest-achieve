-- Create voice call logs table for call history
CREATE TABLE public.voice_call_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  call_sid TEXT NOT NULL,
  caller_number TEXT,
  call_started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  call_ended_at TIMESTAMP WITH TIME ZONE,
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  tasks_created JSONB DEFAULT '[]'::jsonb,
  tasks_completed JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create unique index on call_sid for fast lookups
CREATE UNIQUE INDEX idx_voice_call_logs_call_sid ON public.voice_call_logs(call_sid);

-- Create index on user_id for user queries
CREATE INDEX idx_voice_call_logs_user_id ON public.voice_call_logs(user_id);

-- Enable RLS
ALTER TABLE public.voice_call_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own call logs"
  ON public.voice_call_logs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own call logs"
  ON public.voice_call_logs
  FOR DELETE
  USING (auth.uid() = user_id);

-- Service role can insert/update (edge function uses service role)
CREATE POLICY "Service role can insert call logs"
  ON public.voice_call_logs
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update call logs"
  ON public.voice_call_logs
  FOR UPDATE
  USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_voice_call_logs_updated_at
  BEFORE UPDATE ON public.voice_call_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();