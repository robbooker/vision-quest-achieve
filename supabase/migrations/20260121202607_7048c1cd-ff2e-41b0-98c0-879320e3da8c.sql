-- Create table for multiple audio recordings per journal entry
CREATE TABLE public.journal_audio_recordings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  journal_entry_id UUID NOT NULL REFERENCES public.journal_entries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  audio_url TEXT NOT NULL,
  audio_transcript TEXT,
  audio_duration_seconds INTEGER,
  audio_metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.journal_audio_recordings ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own audio recordings"
ON public.journal_audio_recordings FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own audio recordings"
ON public.journal_audio_recordings FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own audio recordings"
ON public.journal_audio_recordings FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own audio recordings"
ON public.journal_audio_recordings FOR DELETE
USING (auth.uid() = user_id);

-- Trigger to update updated_at
CREATE TRIGGER update_journal_audio_recordings_updated_at
BEFORE UPDATE ON public.journal_audio_recordings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_journal_audio_recordings_entry_id ON public.journal_audio_recordings(journal_entry_id);
CREATE INDEX idx_journal_audio_recordings_user_id ON public.journal_audio_recordings(user_id);