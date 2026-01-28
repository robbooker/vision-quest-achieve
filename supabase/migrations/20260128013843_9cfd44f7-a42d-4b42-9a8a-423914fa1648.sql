-- Add optional relationship columns to lists table
ALTER TABLE public.lists 
ADD COLUMN pillar text,
ADD COLUMN goal_id uuid REFERENCES public.goals(id) ON DELETE SET NULL,
ADD COLUMN focus_session_id uuid REFERENCES public.focus_sessions(id) ON DELETE SET NULL;

-- Add indexes for the foreign keys
CREATE INDEX idx_lists_goal_id ON public.lists(goal_id);
CREATE INDEX idx_lists_focus_session_id ON public.lists(focus_session_id);
CREATE INDEX idx_lists_pillar ON public.lists(pillar);