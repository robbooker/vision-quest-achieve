-- Create storage bucket for audio files
INSERT INTO storage.buckets (id, name, public)
VALUES ('journal-audio', 'journal-audio', true);

-- Create RLS policies for journal-audio bucket
CREATE POLICY "Users can upload their own audio files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'journal-audio' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own audio files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'journal-audio' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own audio files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'journal-audio' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Public can view journal audio"
ON storage.objects FOR SELECT
USING (bucket_id = 'journal-audio');

-- Add audio columns to journal_entries table
ALTER TABLE public.journal_entries 
ADD COLUMN audio_url TEXT,
ADD COLUMN audio_transcript TEXT,
ADD COLUMN audio_duration_seconds INTEGER,
ADD COLUMN audio_metadata JSONB DEFAULT '{}'::jsonb;