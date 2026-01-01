-- Add text_size column to user_preferences
ALTER TABLE public.user_preferences
ADD COLUMN text_size text DEFAULT 'medium';