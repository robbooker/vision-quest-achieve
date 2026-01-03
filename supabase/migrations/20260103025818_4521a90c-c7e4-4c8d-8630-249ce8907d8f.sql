-- Create table for hard question answers
CREATE TABLE public.hard_question_answers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  question_key TEXT NOT NULL,
  answer TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, question_key)
);

-- Enable Row Level Security
ALTER TABLE public.hard_question_answers ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own answers" 
ON public.hard_question_answers 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own answers" 
ON public.hard_question_answers 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own answers" 
ON public.hard_question_answers 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own answers" 
ON public.hard_question_answers 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_hard_question_answers_updated_at
BEFORE UPDATE ON public.hard_question_answers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();