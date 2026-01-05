-- Add rating column to focus_sessions
ALTER TABLE public.focus_sessions 
ADD COLUMN rating text CHECK (rating IN ('bad', 'good', 'great'));