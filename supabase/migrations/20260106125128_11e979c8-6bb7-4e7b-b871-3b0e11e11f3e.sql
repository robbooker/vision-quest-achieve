-- Add completed_focus_sessions column to journal_entries table
ALTER TABLE public.journal_entries 
ADD COLUMN completed_focus_sessions jsonb DEFAULT NULL;