-- Create AI Arena conversations table for admin-only AI debates
CREATE TABLE public.ai_arena_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  topic TEXT NOT NULL,
  transcript JSONB NOT NULL DEFAULT '[]'::jsonb,
  turn_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  rating INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_arena_conversations ENABLE ROW LEVEL SECURITY;

-- Admin-only policies using existing has_role function
CREATE POLICY "Admins can view all AI arena conversations"
ON public.ai_arena_conversations
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can create AI arena conversations"
ON public.ai_arena_conversations
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin') AND auth.uid() = user_id);

CREATE POLICY "Admins can update AI arena conversations"
ON public.ai_arena_conversations
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin') AND auth.uid() = user_id);

CREATE POLICY "Admins can delete AI arena conversations"
ON public.ai_arena_conversations
FOR DELETE
USING (public.has_role(auth.uid(), 'admin') AND auth.uid() = user_id);

-- Add updated_at trigger
CREATE TRIGGER update_ai_arena_conversations_updated_at
BEFORE UPDATE ON public.ai_arena_conversations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();