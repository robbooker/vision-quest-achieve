-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create trigger for new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name'),
    NEW.raw_user_meta_data ->> 'avatar_url'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create cycle status enum
CREATE TYPE public.cycle_status AS ENUM ('planning', 'active', 'review', 'completed');

-- Create cycles table
CREATE TABLE public.cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status public.cycle_status NOT NULL DEFAULT 'planning',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.cycles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own cycles"
  ON public.cycles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own cycles"
  ON public.cycles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cycles"
  ON public.cycles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cycles"
  ON public.cycles FOR DELETE
  USING (auth.uid() = user_id);

-- Create goals table
CREATE TABLE public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id UUID NOT NULL REFERENCES public.cycles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  metric_type TEXT NOT NULL,
  target_value NUMERIC NOT NULL,
  why TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own goals"
  ON public.goals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own goals"
  ON public.goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goals"
  ON public.goals FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own goals"
  ON public.goals FOR DELETE
  USING (auth.uid() = user_id);

-- Create milestones table
CREATE TABLE public.milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL CHECK (week_number >= 1 AND week_number <= 12),
  target_value NUMERIC NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own milestones"
  ON public.milestones FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own milestones"
  ON public.milestones FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own milestones"
  ON public.milestones FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own milestones"
  ON public.milestones FOR DELETE
  USING (auth.uid() = user_id);

-- Create work package templates table
CREATE TABLE public.work_package_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.work_package_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own work package templates"
  ON public.work_package_templates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own work package templates"
  ON public.work_package_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own work package templates"
  ON public.work_package_templates FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own work package templates"
  ON public.work_package_templates FOR DELETE
  USING (auth.uid() = user_id);

-- Create task status enum
CREATE TYPE public.task_status AS ENUM ('pending', 'scheduled', 'in_progress', 'completed', 'skipped');

-- Create task instances table
CREATE TABLE public.task_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id UUID NOT NULL REFERENCES public.cycles(id) ON DELETE CASCADE,
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.work_package_templates(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  due_week INTEGER NOT NULL CHECK (due_week >= 1 AND due_week <= 12),
  due_date DATE,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  status public.task_status NOT NULL DEFAULT 'pending',
  scheduled_start TIMESTAMP WITH TIME ZONE,
  scheduled_end TIMESTAMP WITH TIME ZONE,
  calendar_event_id TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.task_instances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own task instances"
  ON public.task_instances FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own task instances"
  ON public.task_instances FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own task instances"
  ON public.task_instances FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own task instances"
  ON public.task_instances FOR DELETE
  USING (auth.uid() = user_id);

-- Create week reviews table (supports weeks 1-13, where 13 is the reset week)
CREATE TABLE public.week_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id UUID NOT NULL REFERENCES public.cycles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL CHECK (week_number >= 1 AND week_number <= 13),
  wins TEXT,
  lessons TEXT,
  next_focus TEXT,
  execution_score NUMERIC CHECK (execution_score >= 0 AND execution_score <= 100),
  celebration TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(cycle_id, week_number)
);

ALTER TABLE public.week_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own week reviews"
  ON public.week_reviews FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own week reviews"
  ON public.week_reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own week reviews"
  ON public.week_reviews FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own week reviews"
  ON public.week_reviews FOR DELETE
  USING (auth.uid() = user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add updated_at triggers to all tables
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cycles_updated_at
  BEFORE UPDATE ON public.cycles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_goals_updated_at
  BEFORE UPDATE ON public.goals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_milestones_updated_at
  BEFORE UPDATE ON public.milestones
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_work_package_templates_updated_at
  BEFORE UPDATE ON public.work_package_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_task_instances_updated_at
  BEFORE UPDATE ON public.task_instances
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_week_reviews_updated_at
  BEFORE UPDATE ON public.week_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();