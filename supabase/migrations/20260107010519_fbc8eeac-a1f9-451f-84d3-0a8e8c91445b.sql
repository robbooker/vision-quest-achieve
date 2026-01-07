-- Create a function for vector similarity search
CREATE OR REPLACE FUNCTION public.match_activity_embeddings(
  query_embedding vector(768),
  match_threshold float DEFAULT 0.3,
  match_count int DEFAULT 10,
  filter_user_id uuid DEFAULT NULL,
  filter_source_types text[] DEFAULT NULL,
  filter_date_from date DEFAULT NULL,
  filter_date_to date DEFAULT NULL
)
RETURNS TABLE (
  source_type text,
  source_id uuid,
  content_text text,
  activity_date date,
  similarity float,
  metadata jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ae.source_type,
    ae.source_id,
    ae.content_text,
    ae.activity_date,
    1 - (ae.embedding <=> query_embedding) as similarity,
    ae.metadata
  FROM activity_embeddings ae
  WHERE 
    (filter_user_id IS NULL OR ae.user_id = filter_user_id)
    AND (filter_source_types IS NULL OR ae.source_type = ANY(filter_source_types))
    AND (filter_date_from IS NULL OR ae.activity_date >= filter_date_from)
    AND (filter_date_to IS NULL OR ae.activity_date <= filter_date_to)
    AND 1 - (ae.embedding <=> query_embedding) > match_threshold
  ORDER BY ae.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;