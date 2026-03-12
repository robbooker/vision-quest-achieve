
CREATE TABLE public.goal_sprint_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  sprint_date DATE NOT NULL,
  goal_key TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, sprint_date, goal_key)
);

ALTER TABLE public.goal_sprint_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sprint logs" ON public.goal_sprint_logs
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sprint logs" ON public.goal_sprint_logs
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sprint logs" ON public.goal_sprint_logs
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own sprint logs" ON public.goal_sprint_logs
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
