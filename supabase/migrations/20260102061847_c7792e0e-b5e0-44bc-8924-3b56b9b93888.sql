-- Create big_ten_projects table
CREATE TABLE public.big_ten_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  target_date DATE,
  position INTEGER NOT NULL CHECK (position >= 1 AND position <= 10),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, position)
);

-- Create big_ten_tasks table
CREATE TABLE public.big_ten_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.big_ten_projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  position INTEGER NOT NULL CHECK (position >= 1 AND position <= 5),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, position)
);

-- Enable RLS on both tables
ALTER TABLE public.big_ten_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.big_ten_tasks ENABLE ROW LEVEL SECURITY;

-- RLS policies for big_ten_projects
CREATE POLICY "Users can view their own big ten projects"
  ON public.big_ten_projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own big ten projects"
  ON public.big_ten_projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own big ten projects"
  ON public.big_ten_projects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own big ten projects"
  ON public.big_ten_projects FOR DELETE
  USING (auth.uid() = user_id);

-- RLS policies for big_ten_tasks
CREATE POLICY "Users can view their own big ten tasks"
  ON public.big_ten_tasks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own big ten tasks"
  ON public.big_ten_tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own big ten tasks"
  ON public.big_ten_tasks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own big ten tasks"
  ON public.big_ten_tasks FOR DELETE
  USING (auth.uid() = user_id);

-- Update trigger for big_ten_projects
CREATE TRIGGER update_big_ten_projects_updated_at
  BEFORE UPDATE ON public.big_ten_projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();