-- Add pillar and goal_id columns to big_ten_projects table
ALTER TABLE public.big_ten_projects 
ADD COLUMN IF NOT EXISTS pillar text,
ADD COLUMN IF NOT EXISTS goal_id uuid REFERENCES public.goals(id) ON DELETE SET NULL;