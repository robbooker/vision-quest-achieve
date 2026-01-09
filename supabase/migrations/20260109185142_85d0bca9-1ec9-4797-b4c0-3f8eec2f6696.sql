-- Create sick_days table to track days when user is sick
CREATE TABLE public.sick_days (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  sick_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add unique constraint to prevent duplicate entries for same user/date
CREATE UNIQUE INDEX sick_days_user_date_idx ON public.sick_days (user_id, sick_date);

-- Enable RLS
ALTER TABLE public.sick_days ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own sick days" 
ON public.sick_days 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sick days" 
ON public.sick_days 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sick days" 
ON public.sick_days 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sick days" 
ON public.sick_days 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_sick_days_updated_at
BEFORE UPDATE ON public.sick_days
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();