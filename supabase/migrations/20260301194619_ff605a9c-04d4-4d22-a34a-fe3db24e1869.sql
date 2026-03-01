
-- Sprint templates (predefined blueprints)
CREATE TABLE public.sprint_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  duration_weeks INTEGER NOT NULL DEFAULT 8,
  default_tasks JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Sprints
CREATE TABLE public.sprints (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.sprint_templates(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  goal TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'archived')),
  duration_weeks INTEGER NOT NULL DEFAULT 8,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Sprint areas of focus
CREATE TABLE public.sprint_areas_of_focus (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sprint_id UUID NOT NULL REFERENCES public.sprints(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Sprint tasks
CREATE TABLE public.sprint_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sprint_id UUID NOT NULL REFERENCES public.sprints(id) ON DELETE CASCADE,
  area_of_focus_id UUID NOT NULL REFERENCES public.sprint_areas_of_focus(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done', 'skipped')),
  week INTEGER,
  day_range TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  template_task_order INTEGER,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_sprints_user_status ON public.sprints(user_id, status);
CREATE INDEX idx_sprint_areas_sprint ON public.sprint_areas_of_focus(sprint_id);
CREATE INDEX idx_sprint_tasks_sprint ON public.sprint_tasks(sprint_id, sort_order);
CREATE INDEX idx_sprint_tasks_area ON public.sprint_tasks(area_of_focus_id);

-- RLS
ALTER TABLE public.sprint_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sprint_areas_of_focus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sprint_tasks ENABLE ROW LEVEL SECURITY;

-- Templates: anyone can read system templates, users can read their own
CREATE POLICY "Anyone can read system templates" ON public.sprint_templates
  FOR SELECT USING (is_system = true OR created_by = auth.uid());

CREATE POLICY "Users manage own sprints" ON public.sprints
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own sprint areas" ON public.sprint_areas_of_focus
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own sprint tasks" ON public.sprint_tasks
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Updated_at triggers
CREATE TRIGGER update_sprints_updated_at
  BEFORE UPDATE ON public.sprints
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sprint_tasks_updated_at
  BEFORE UPDATE ON public.sprint_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sprint_templates_updated_at
  BEFORE UPDATE ON public.sprint_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Atomic sprint launch RPC
CREATE OR REPLACE FUNCTION public.launch_sprint(
  p_name TEXT,
  p_goal TEXT,
  p_duration_weeks INTEGER,
  p_template_id UUID,
  p_areas JSONB,
  p_tasks JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_sprint_id UUID;
  v_user_id UUID := auth.uid();
  v_area JSONB;
  v_task JSONB;
  v_area_map JSONB := '{}'::jsonb;
  v_new_area_id UUID;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 1. Create sprint
  INSERT INTO sprints (user_id, template_id, name, goal, status, duration_weeks, start_date, end_date)
  VALUES (
    v_user_id, p_template_id, p_name, p_goal, 'active', p_duration_weeks,
    CURRENT_DATE, CURRENT_DATE + (p_duration_weeks * 7)
  )
  RETURNING id INTO v_sprint_id;

  -- 2. Create areas of focus and build draft_id -> real_id map
  FOR v_area IN SELECT * FROM jsonb_array_elements(p_areas)
  LOOP
    INSERT INTO sprint_areas_of_focus (sprint_id, user_id, name, color, sort_order)
    VALUES (
      v_sprint_id, v_user_id,
      v_area->>'name',
      v_area->>'color',
      COALESCE((v_area->>'sort_order')::int, 0)
    )
    RETURNING id INTO v_new_area_id;

    v_area_map := v_area_map || jsonb_build_object(v_area->>'draft_id', v_new_area_id::text);
  END LOOP;

  -- 3. Create tasks with mapped area IDs
  FOR v_task IN SELECT * FROM jsonb_array_elements(p_tasks)
  LOOP
    INSERT INTO sprint_tasks (
      sprint_id, area_of_focus_id, user_id, title, description,
      week, day_range, sort_order, template_task_order
    )
    VALUES (
      v_sprint_id,
      (v_area_map->>( v_task->>'area_draft_id' ))::uuid,
      v_user_id,
      v_task->>'title',
      v_task->>'description',
      NULLIF(v_task->>'week', '')::int,
      v_task->>'day_range',
      COALESCE((v_task->>'sort_order')::int, 0),
      NULLIF(v_task->>'template_task_order', '')::int
    );
  END LOOP;

  RETURN v_sprint_id;
END;
$$;

-- Seed a default system template
INSERT INTO public.sprint_templates (name, description, duration_weeks, is_system, default_tasks)
VALUES (
  '8-Week Performance Sprint',
  'A structured 8-week sprint covering key habits, projects, and growth areas.',
  8,
  true,
  '[
    {"title": "Define success metrics", "description": "Clarify what done looks like for each area", "week": 1, "sort_order": 0},
    {"title": "Set up tracking system", "description": "Configure tools and dashboards", "week": 1, "sort_order": 1},
    {"title": "Complete first milestone", "description": "Deliver initial tangible output", "week": 2, "sort_order": 2},
    {"title": "Week 2 review & adjust", "description": "Review progress, adjust approach", "week": 2, "sort_order": 3},
    {"title": "Deep work block", "description": "Focused execution on highest-priority task", "week": 3, "sort_order": 4},
    {"title": "Mid-sprint checkpoint", "description": "Assess progress at halfway point", "week": 4, "sort_order": 5},
    {"title": "Address blockers", "description": "Remove obstacles identified at checkpoint", "week": 5, "sort_order": 6},
    {"title": "Stretch goal attempt", "description": "Push beyond minimum viable target", "week": 6, "sort_order": 7},
    {"title": "Final push", "description": "Complete remaining deliverables", "week": 7, "sort_order": 8},
    {"title": "Sprint retrospective", "description": "Document learnings and plan next sprint", "week": 8, "sort_order": 9}
  ]'::jsonb
),
(
  '4-Week Quick Sprint',
  'A focused 4-week sprint for rapid execution on a single area.',
  4,
  true,
  '[
    {"title": "Define scope & goals", "description": "Set clear boundaries and targets", "week": 1, "sort_order": 0},
    {"title": "Build foundation", "description": "Set up core systems and habits", "week": 1, "sort_order": 1},
    {"title": "Execute core tasks", "description": "Focus on primary deliverables", "week": 2, "sort_order": 2},
    {"title": "Mid-sprint review", "description": "Check progress, recalibrate", "week": 2, "sort_order": 3},
    {"title": "Polish & refine", "description": "Improve quality of outputs", "week": 3, "sort_order": 4},
    {"title": "Final deliverables", "description": "Complete and ship", "week": 4, "sort_order": 5},
    {"title": "Retrospective", "description": "Capture learnings", "week": 4, "sort_order": 6}
  ]'::jsonb
),
(
  'Blank Sprint',
  'Start from scratch with your own tasks and structure.',
  8,
  true,
  '[]'::jsonb
);
