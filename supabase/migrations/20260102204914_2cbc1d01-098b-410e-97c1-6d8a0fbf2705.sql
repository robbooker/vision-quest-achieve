-- Create shared_tasks table if not exists
CREATE TABLE IF NOT EXISTS public.shared_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  title text NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on shared_tasks
ALTER TABLE public.shared_tasks ENABLE ROW LEVEL SECURITY;

-- Shared tasks policies (drop if exist then recreate)
DROP POLICY IF EXISTS "Owners can view their shared tasks" ON public.shared_tasks;
DROP POLICY IF EXISTS "Users can view tasks shared with them" ON public.shared_tasks;
DROP POLICY IF EXISTS "Owners can create shared tasks" ON public.shared_tasks;
DROP POLICY IF EXISTS "Owners can update their shared tasks" ON public.shared_tasks;
DROP POLICY IF EXISTS "Shared users can update task completion" ON public.shared_tasks;
DROP POLICY IF EXISTS "Owners can delete their shared tasks" ON public.shared_tasks;

-- Create task_shares table if not exists
CREATE TABLE IF NOT EXISTS public.task_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.shared_tasks(id) ON DELETE CASCADE,
  shared_with_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(task_id, shared_with_id)
);

-- Enable RLS on task_shares
ALTER TABLE public.task_shares ENABLE ROW LEVEL SECURITY;

-- Shared tasks policies
CREATE POLICY "Owners can view their shared tasks" ON public.shared_tasks
FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can view tasks shared with them" ON public.shared_tasks
FOR SELECT USING (EXISTS (
  SELECT 1 FROM task_shares WHERE task_shares.task_id = shared_tasks.id AND task_shares.shared_with_id = auth.uid()
));

CREATE POLICY "Owners can create shared tasks" ON public.shared_tasks
FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their shared tasks" ON public.shared_tasks
FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Shared users can update task completion" ON public.shared_tasks
FOR UPDATE USING (EXISTS (
  SELECT 1 FROM task_shares WHERE task_shares.task_id = shared_tasks.id AND task_shares.shared_with_id = auth.uid()
));

CREATE POLICY "Owners can delete their shared tasks" ON public.shared_tasks
FOR DELETE USING (auth.uid() = owner_id);

-- Task shares policies (drop if exist then recreate)
DROP POLICY IF EXISTS "Owners can view task shares" ON public.task_shares;
DROP POLICY IF EXISTS "Shared users can view their shares" ON public.task_shares;
DROP POLICY IF EXISTS "Owners can create task shares" ON public.task_shares;
DROP POLICY IF EXISTS "Owners can delete task shares" ON public.task_shares;

CREATE POLICY "Owners can view task shares" ON public.task_shares
FOR SELECT USING (EXISTS (
  SELECT 1 FROM shared_tasks WHERE shared_tasks.id = task_shares.task_id AND shared_tasks.owner_id = auth.uid()
));

CREATE POLICY "Shared users can view their shares" ON public.task_shares
FOR SELECT USING (auth.uid() = shared_with_id);

CREATE POLICY "Owners can create task shares" ON public.task_shares
FOR INSERT WITH CHECK (EXISTS (
  SELECT 1 FROM shared_tasks WHERE shared_tasks.id = task_shares.task_id AND shared_tasks.owner_id = auth.uid()
));

CREATE POLICY "Owners can delete task shares" ON public.task_shares
FOR DELETE USING (EXISTS (
  SELECT 1 FROM shared_tasks WHERE shared_tasks.id = task_shares.task_id AND shared_tasks.owner_id = auth.uid()
));

-- Add updated_at trigger for shared_tasks
DROP TRIGGER IF EXISTS update_shared_tasks_updated_at ON public.shared_tasks;
CREATE TRIGGER update_shared_tasks_updated_at
BEFORE UPDATE ON public.shared_tasks
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();