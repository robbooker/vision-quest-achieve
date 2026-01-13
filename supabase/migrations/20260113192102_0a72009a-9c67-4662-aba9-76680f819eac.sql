-- Create table for affirmation submissions
-- Tracks when a user completes their 15-line affirmation practice
-- The actual content can be optionally saved (if user chooses "Save and Submit")
CREATE TABLE public.affirmation_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  content_saved BOOLEAN NOT NULL DEFAULT false,
  saved_affirmations TEXT[] NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.affirmation_submissions ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own affirmation submissions" 
ON public.affirmation_submissions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own affirmation submissions" 
ON public.affirmation_submissions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own affirmation submissions" 
ON public.affirmation_submissions 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create index for faster streak calculations
CREATE INDEX idx_affirmation_submissions_user_date 
ON public.affirmation_submissions (user_id, submitted_at DESC);