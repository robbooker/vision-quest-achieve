-- Drop the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Public can view journal audio" ON storage.objects;

-- Create proper owner-only SELECT policy
CREATE POLICY "Users can view their own journal audio"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'journal-audio' 
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- Add DELETE policy for journal-audio (was missing)
CREATE POLICY "Users can delete their own journal audio"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'journal-audio' 
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- Add INSERT policy for journal-audio (ensure it exists)
DROP POLICY IF EXISTS "Users can upload their own journal audio" ON storage.objects;
CREATE POLICY "Users can upload their own journal audio"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'journal-audio' 
  AND (auth.uid())::text = (storage.foldername(name))[1]
);