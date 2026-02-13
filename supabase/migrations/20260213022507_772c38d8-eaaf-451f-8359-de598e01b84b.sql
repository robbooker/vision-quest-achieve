
-- Table to store hashed API keys
CREATE TABLE public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  key_hash TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  label TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at TIMESTAMPTZ,
  revoked BOOLEAN NOT NULL DEFAULT false
);

-- Index for fast key lookup during auth
CREATE INDEX idx_api_keys_key_hash ON public.api_keys (key_hash) WHERE revoked = false;
CREATE INDEX idx_api_keys_user_id ON public.api_keys (user_id);

-- Enable RLS
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Users can only see their own keys
CREATE POLICY "Users can view own API keys"
  ON public.api_keys FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own API keys"
  ON public.api_keys FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own API keys"
  ON public.api_keys FOR UPDATE
  USING (auth.uid() = user_id);

-- Function to look up user_id from an API key hash (used by edge functions, bypasses RLS)
CREATE OR REPLACE FUNCTION public.validate_api_key(p_key_hash TEXT)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT user_id FROM public.api_keys
  WHERE key_hash = p_key_hash AND revoked = false
  LIMIT 1;
$$;
