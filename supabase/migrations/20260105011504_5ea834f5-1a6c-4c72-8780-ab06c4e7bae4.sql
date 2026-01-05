-- Add user_photos column to store up to 2 user-uploaded photos
ALTER TABLE public.journal_entries 
ADD COLUMN user_photos jsonb DEFAULT '[]'::jsonb;

-- Add RLS policy for uploading user photos to the journal-images bucket
-- Users can upload to their own folder with 'photos/' prefix
CREATE POLICY "Users can upload their own journal photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'journal-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND (storage.foldername(name))[2] = 'photos'
);

-- Users can delete their own journal photos
CREATE POLICY "Users can delete their own journal photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'journal-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND (storage.foldername(name))[2] = 'photos'
);