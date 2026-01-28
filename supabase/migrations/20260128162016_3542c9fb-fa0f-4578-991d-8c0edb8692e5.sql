-- Create table to store pillar associations for calendar events
CREATE TABLE public.calendar_event_pillars (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  calendar_event_id TEXT NOT NULL,
  pillar TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, calendar_event_id)
);

-- Enable RLS
ALTER TABLE public.calendar_event_pillars ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own calendar pillars" 
ON public.calendar_event_pillars 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own calendar pillars" 
ON public.calendar_event_pillars 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own calendar pillars" 
ON public.calendar_event_pillars 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own calendar pillars" 
ON public.calendar_event_pillars 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_calendar_event_pillars_updated_at
BEFORE UPDATE ON public.calendar_event_pillars
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();