-- Add Short Scout user_id mapping column to profiles
ALTER TABLE public.profiles 
ADD COLUMN short_scout_user_id uuid;

-- Add index for faster lookups
CREATE INDEX idx_profiles_short_scout_user_id ON public.profiles(short_scout_user_id) 
WHERE short_scout_user_id IS NOT NULL;