-- Create table to store intraday heart rate data from Oura
CREATE TABLE public.oura_heartrate_samples (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  sample_date date NOT NULL,
  sample_time timestamptz NOT NULL,
  bpm integer NOT NULL,
  source text NOT NULL DEFAULT 'awake',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create index for efficient querying by user and date
CREATE INDEX idx_oura_heartrate_samples_user_date ON public.oura_heartrate_samples (user_id, sample_date);
CREATE INDEX idx_oura_heartrate_samples_user_time ON public.oura_heartrate_samples (user_id, sample_time);

-- Unique constraint to prevent duplicates
ALTER TABLE public.oura_heartrate_samples ADD CONSTRAINT unique_heartrate_sample 
  UNIQUE (user_id, sample_time);

-- Enable RLS
ALTER TABLE public.oura_heartrate_samples ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own heartrate samples" 
  ON public.oura_heartrate_samples FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own heartrate samples" 
  ON public.oura_heartrate_samples FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own heartrate samples" 
  ON public.oura_heartrate_samples FOR DELETE 
  USING (auth.uid() = user_id);