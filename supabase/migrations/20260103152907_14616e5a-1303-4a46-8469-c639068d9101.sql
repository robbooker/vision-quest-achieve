-- Add goal_type column to goals table
ALTER TABLE public.goals 
ADD COLUMN goal_type TEXT NOT NULL DEFAULT 'standard';

-- Create goal_schedules table for time-mastery goals
CREATE TABLE public.goal_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME,
  end_time TIME,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  calendar_event_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on goal_schedules
ALTER TABLE public.goal_schedules ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for goal_schedules
CREATE POLICY "Users can view their own goal schedules"
ON public.goal_schedules
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own goal schedules"
ON public.goal_schedules
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goal schedules"
ON public.goal_schedules
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own goal schedules"
ON public.goal_schedules
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_goal_schedules_updated_at
BEFORE UPDATE ON public.goal_schedules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for efficient querying by goal_id
CREATE INDEX idx_goal_schedules_goal_id ON public.goal_schedules(goal_id);

-- Create index for querying by user and day
CREATE INDEX idx_goal_schedules_user_day ON public.goal_schedules(user_id, day_of_week);