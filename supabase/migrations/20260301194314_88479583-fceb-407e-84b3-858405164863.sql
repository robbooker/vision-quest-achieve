
-- Routine items: morning/evening checklist items
CREATE TABLE public.routine_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  routine_type TEXT NOT NULL CHECK (routine_type IN ('morning', 'evening')),
  title TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Routine logs: daily completion tracking
CREATE TABLE public.routine_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  routine_item_id UUID NOT NULL REFERENCES public.routine_items(id) ON DELETE CASCADE,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  completed BOOLEAN NOT NULL DEFAULT true,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(routine_item_id, log_date)
);

-- Indexes
CREATE INDEX idx_routine_items_user ON public.routine_items(user_id, routine_type);
CREATE INDEX idx_routine_logs_user_date ON public.routine_logs(user_id, log_date);
CREATE INDEX idx_routine_logs_item ON public.routine_logs(routine_item_id, log_date);

-- RLS
ALTER TABLE public.routine_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routine_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own routine items" ON public.routine_items
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own routine logs" ON public.routine_logs
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Updated_at trigger
CREATE TRIGGER update_routine_items_updated_at
  BEFORE UPDATE ON public.routine_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
