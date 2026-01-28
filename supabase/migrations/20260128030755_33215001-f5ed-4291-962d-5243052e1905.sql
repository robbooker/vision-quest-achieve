-- Add created_notes column to journal_entries
ALTER TABLE public.journal_entries
ADD COLUMN created_notes JSONB DEFAULT '[]'::jsonb;