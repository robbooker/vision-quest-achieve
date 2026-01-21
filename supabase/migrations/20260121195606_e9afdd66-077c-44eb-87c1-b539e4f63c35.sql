-- Make the journal-audio bucket private so files are only accessible through RLS
UPDATE storage.buckets SET public = false WHERE id = 'journal-audio';