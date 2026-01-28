-- Add bird sightings column to journal entries
ALTER TABLE public.journal_entries 
ADD COLUMN IF NOT EXISTS bird_sightings JSONB DEFAULT NULL;