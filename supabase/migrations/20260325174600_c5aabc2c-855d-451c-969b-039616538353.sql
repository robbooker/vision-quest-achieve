
-- Create team_tasks table
CREATE TABLE public.team_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  priority TEXT NOT NULL DEFAULT 'normal',
  created_by TEXT,
  assigned_to TEXT,
  completed_by TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add updated_at trigger
CREATE TRIGGER update_team_tasks_updated_at
  BEFORE UPDATE ON public.team_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.team_tasks;

-- No RLS - team-internal table accessible to all authenticated users
ALTER TABLE public.team_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read team tasks"
  ON public.team_tasks FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert team tasks"
  ON public.team_tasks FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update team tasks"
  ON public.team_tasks FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete team tasks"
  ON public.team_tasks FOR DELETE TO authenticated USING (true);
