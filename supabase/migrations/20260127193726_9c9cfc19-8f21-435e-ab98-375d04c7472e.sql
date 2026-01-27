-- P.R.I.M.E.D. Framework Tables

-- Table 1: primed_assessments - stores user assessment snapshots
CREATE TABLE public.primed_assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  assessed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  physical_level INTEGER NOT NULL DEFAULT 0 CHECK (physical_level >= 0 AND physical_level <= 3),
  relations_level INTEGER NOT NULL DEFAULT 0 CHECK (relations_level >= 0 AND relations_level <= 3),
  income_level INTEGER NOT NULL DEFAULT 0 CHECK (income_level >= 0 AND income_level <= 3),
  mental_level INTEGER NOT NULL DEFAULT 0 CHECK (mental_level >= 0 AND mental_level <= 3),
  excellence_level INTEGER NOT NULL DEFAULT 0 CHECK (excellence_level >= 0 AND excellence_level <= 3),
  direction_level INTEGER NOT NULL DEFAULT 0 CHECK (direction_level >= 0 AND direction_level <= 3),
  ai_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.primed_assessments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for primed_assessments
CREATE POLICY "Users can view their own assessments"
  ON public.primed_assessments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own assessments"
  ON public.primed_assessments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own assessments"
  ON public.primed_assessments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own assessments"
  ON public.primed_assessments FOR DELETE
  USING (auth.uid() = user_id);

-- Table 2: primed_assessment_behaviors - stores which behaviors were checked
CREATE TABLE public.primed_assessment_behaviors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_id UUID NOT NULL REFERENCES public.primed_assessments(id) ON DELETE CASCADE,
  pillar TEXT NOT NULL CHECK (pillar IN ('physical', 'relations', 'income', 'mental', 'excellence', 'direction')),
  level INTEGER NOT NULL CHECK (level >= 0 AND level <= 3),
  behavior_key TEXT NOT NULL,
  behavior_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(assessment_id, behavior_key)
);

-- Enable RLS
ALTER TABLE public.primed_assessment_behaviors ENABLE ROW LEVEL SECURITY;

-- RLS Policies for primed_assessment_behaviors (via assessment ownership)
CREATE POLICY "Users can view their own assessment behaviors"
  ON public.primed_assessment_behaviors FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.primed_assessments 
    WHERE id = assessment_id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can create their own assessment behaviors"
  ON public.primed_assessment_behaviors FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.primed_assessments 
    WHERE id = assessment_id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their own assessment behaviors"
  ON public.primed_assessment_behaviors FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.primed_assessments 
    WHERE id = assessment_id AND user_id = auth.uid()
  ));

-- Table 3: primed_goal_progress - snapshot of progress per pillar at assessment time
CREATE TABLE public.primed_goal_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_id UUID NOT NULL REFERENCES public.primed_assessments(id) ON DELETE CASCADE,
  pillar TEXT NOT NULL CHECK (pillar IN ('physical', 'relations', 'income', 'mental', 'excellence', 'direction')),
  goals_completed INTEGER NOT NULL DEFAULT 0,
  habits_maintained INTEGER NOT NULL DEFAULT 0,
  focus_minutes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(assessment_id, pillar)
);

-- Enable RLS
ALTER TABLE public.primed_goal_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for primed_goal_progress (via assessment ownership)
CREATE POLICY "Users can view their own goal progress"
  ON public.primed_goal_progress FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.primed_assessments 
    WHERE id = assessment_id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can create their own goal progress"
  ON public.primed_goal_progress FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.primed_assessments 
    WHERE id = assessment_id AND user_id = auth.uid()
  ));

-- Add pillar column to existing goals table
ALTER TABLE public.goals 
ADD COLUMN pillar TEXT CHECK (pillar IS NULL OR pillar IN ('physical', 'relations', 'income', 'mental', 'excellence', 'direction'));

-- Create updated_at trigger for primed_assessments
CREATE TRIGGER update_primed_assessments_updated_at
  BEFORE UPDATE ON public.primed_assessments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();