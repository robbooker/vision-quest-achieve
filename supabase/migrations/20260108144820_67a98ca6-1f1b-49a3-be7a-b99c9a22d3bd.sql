-- Add goal_id column to quick_tasks table for optional goal connection
ALTER TABLE public.quick_tasks 
ADD COLUMN goal_id UUID REFERENCES public.goals(id) ON DELETE SET NULL;

-- Create an index for faster lookups by goal_id
CREATE INDEX idx_quick_tasks_goal_id ON public.quick_tasks(goal_id);