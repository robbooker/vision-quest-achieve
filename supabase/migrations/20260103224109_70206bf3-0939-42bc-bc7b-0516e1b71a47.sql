-- Add reset opt-in columns to user_preferences
ALTER TABLE public.user_preferences ADD COLUMN reset_active boolean DEFAULT false;
ALTER TABLE public.user_preferences ADD COLUMN reset_started_at timestamptz DEFAULT null;