-- Create briefing-audio bucket for storing generated audio files
INSERT INTO storage.buckets (id, name, public)
VALUES ('briefing-audio', 'briefing-audio', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to all files in the bucket
CREATE POLICY "Public read access for briefing audio"
ON storage.objects FOR SELECT
USING (bucket_id = 'briefing-audio');

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload briefing audio"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'briefing-audio');

-- Allow service role full access (for edge functions)
CREATE POLICY "Service role full access for briefing audio"
ON storage.objects FOR ALL
USING (bucket_id = 'briefing-audio');