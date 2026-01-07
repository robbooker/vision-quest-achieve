-- Enable pgvector extension for semantic search
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- Create activity embeddings table for semantic search
CREATE TABLE public.activity_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  source_type TEXT NOT NULL, -- 'journal_entry', 'quick_task', 'habit_log', 'focus_session'
  source_id UUID NOT NULL,
  content_text TEXT NOT NULL,
  embedding vector(768), -- Gemini embedding dimension
  activity_date DATE NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one embedding per source item
  UNIQUE(source_type, source_id)
);

-- Create index for fast similarity search
CREATE INDEX activity_embeddings_embedding_idx ON public.activity_embeddings 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Create index for filtering by user and date
CREATE INDEX activity_embeddings_user_date_idx ON public.activity_embeddings(user_id, activity_date DESC);
CREATE INDEX activity_embeddings_source_idx ON public.activity_embeddings(source_type, source_id);

-- Enable RLS
ALTER TABLE public.activity_embeddings ENABLE ROW LEVEL SECURITY;

-- RLS policies - users can only access their own embeddings
CREATE POLICY "Users can view their own embeddings"
ON public.activity_embeddings FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own embeddings"
ON public.activity_embeddings FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own embeddings"
ON public.activity_embeddings FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own embeddings"
ON public.activity_embeddings FOR DELETE
USING (auth.uid() = user_id);

-- Add updated_at trigger
CREATE TRIGGER update_activity_embeddings_updated_at
BEFORE UPDATE ON public.activity_embeddings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();