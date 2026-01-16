-- Create feedback category enum
CREATE TYPE public.feedback_category AS ENUM ('bug_report', 'feature_request', 'general_feedback');

-- Create feedback status enum
CREATE TYPE public.feedback_status AS ENUM ('pending', 'under_review', 'planned', 'in_progress', 'completed', 'wont_do');

-- Create feedback priority enum
CREATE TYPE public.feedback_priority AS ENUM ('low', 'medium', 'high');

-- Create feedback table
CREATE TABLE public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  category feedback_category NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status feedback_status NOT NULL DEFAULT 'pending',
  priority feedback_priority DEFAULT 'medium',
  admin_notes TEXT,
  added_to_tasks BOOLEAN NOT NULL DEFAULT false,
  quick_task_id UUID REFERENCES public.quick_tasks(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create feedback votes table
CREATE TABLE public.feedback_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id UUID NOT NULL REFERENCES public.feedback(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(feedback_id, user_id)
);

-- Enable RLS
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_votes ENABLE ROW LEVEL SECURITY;

-- Feedback policies: Everyone can read all feedback
CREATE POLICY "Anyone can view feedback"
ON public.feedback
FOR SELECT
USING (true);

-- Users can create their own feedback
CREATE POLICY "Users can create their own feedback"
ON public.feedback
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can update any feedback
CREATE POLICY "Admins can update any feedback"
ON public.feedback
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can delete any feedback
CREATE POLICY "Admins can delete any feedback"
ON public.feedback
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Vote policies: Everyone can read votes
CREATE POLICY "Anyone can view votes"
ON public.feedback_votes
FOR SELECT
USING (true);

-- Users can create their own votes
CREATE POLICY "Users can create their own votes"
ON public.feedback_votes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own votes
CREATE POLICY "Users can delete their own votes"
ON public.feedback_votes
FOR DELETE
USING (auth.uid() = user_id);

-- Create updated_at trigger for feedback
CREATE TRIGGER update_feedback_updated_at
BEFORE UPDATE ON public.feedback
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for feedback
ALTER PUBLICATION supabase_realtime ADD TABLE public.feedback;
ALTER PUBLICATION supabase_realtime ADD TABLE public.feedback_votes;