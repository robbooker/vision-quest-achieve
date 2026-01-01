-- Create goal_tactics table for daily/weekly actions
CREATE TABLE public.goal_tactics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  frequency TEXT NOT NULL DEFAULT 'weekly',
  target_count INTEGER NOT NULL DEFAULT 1,
  due_weeks JSONB,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create goal_indicators table for lead/lag metrics
CREATE TABLE public.goal_indicators (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('lead', 'lag')),
  name TEXT NOT NULL,
  unit TEXT NOT NULL,
  target_value NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indicator_logs table for tracking values over time
CREATE TABLE public.indicator_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  indicator_id UUID NOT NULL REFERENCES public.goal_indicators(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  value NUMERIC NOT NULL,
  logged_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_vision table for long-term aspirations
CREATE TABLE public.user_vision (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  vision_3_year TEXT,
  vision_long_term TEXT,
  core_values TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create chat_messages table for AI coach conversation history
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  context_goal_id UUID REFERENCES public.goals(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add new columns to goals table
ALTER TABLE public.goals 
  ADD COLUMN obstacles TEXT,
  ADD COLUMN strategies TEXT,
  ADD COLUMN vision_connection TEXT,
  ADD COLUMN accountability_partner TEXT;

-- Enable RLS on all new tables
ALTER TABLE public.goal_tactics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.indicator_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_vision ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for goal_tactics
CREATE POLICY "Users can view their own tactics" ON public.goal_tactics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own tactics" ON public.goal_tactics FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own tactics" ON public.goal_tactics FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own tactics" ON public.goal_tactics FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for goal_indicators
CREATE POLICY "Users can view their own indicators" ON public.goal_indicators FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own indicators" ON public.goal_indicators FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own indicators" ON public.goal_indicators FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own indicators" ON public.goal_indicators FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for indicator_logs
CREATE POLICY "Users can view their own indicator logs" ON public.indicator_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own indicator logs" ON public.indicator_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own indicator logs" ON public.indicator_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own indicator logs" ON public.indicator_logs FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for user_vision
CREATE POLICY "Users can view their own vision" ON public.user_vision FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own vision" ON public.user_vision FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own vision" ON public.user_vision FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own vision" ON public.user_vision FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for chat_messages
CREATE POLICY "Users can view their own chat messages" ON public.chat_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own chat messages" ON public.chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own chat messages" ON public.chat_messages FOR DELETE USING (auth.uid() = user_id);

-- Add updated_at triggers for new tables
CREATE TRIGGER update_goal_tactics_updated_at BEFORE UPDATE ON public.goal_tactics FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_goal_indicators_updated_at BEFORE UPDATE ON public.goal_indicators FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_vision_updated_at BEFORE UPDATE ON public.user_vision FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();