-- Add due_date column to quick_tasks table
ALTER TABLE public.quick_tasks 
ADD COLUMN due_date DATE DEFAULT NULL;

-- Add index for due_date queries
CREATE INDEX idx_quick_tasks_due_date ON public.quick_tasks(due_date) WHERE due_date IS NOT NULL;