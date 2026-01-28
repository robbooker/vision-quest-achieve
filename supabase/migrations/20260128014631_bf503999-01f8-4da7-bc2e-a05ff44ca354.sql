-- Add pillar column to quick_tasks table
ALTER TABLE public.quick_tasks
ADD COLUMN pillar text;

-- Add pillar column to focus_sessions table
ALTER TABLE public.focus_sessions
ADD COLUMN pillar text;

-- Create indexes for filtering by pillar
CREATE INDEX idx_quick_tasks_pillar ON public.quick_tasks(pillar) WHERE pillar IS NOT NULL;
CREATE INDEX idx_focus_sessions_pillar ON public.focus_sessions(pillar) WHERE pillar IS NOT NULL;