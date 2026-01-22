-- Create table to track all used PINs (ensures they're never reused even after user deletion)
CREATE TABLE public.used_member_pins (
  pin TEXT NOT NULL PRIMARY KEY,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID NOT NULL
);

-- Add member_pin column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS member_pin TEXT UNIQUE;

-- Create function to generate a unique 4-digit PIN
CREATE OR REPLACE FUNCTION public.generate_unique_member_pin()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_pin TEXT;
  max_attempts INTEGER := 100;
  attempt INTEGER := 0;
BEGIN
  LOOP
    -- Generate a random 4-digit number (1000-9999 to ensure 4 digits)
    new_pin := LPAD((1000 + floor(random() * 9000))::TEXT, 4, '0');
    
    -- Check if this PIN has ever been used
    IF NOT EXISTS (SELECT 1 FROM used_member_pins WHERE pin = new_pin) THEN
      RETURN new_pin;
    END IF;
    
    attempt := attempt + 1;
    IF attempt >= max_attempts THEN
      RAISE EXCEPTION 'Could not generate unique PIN after % attempts', max_attempts;
    END IF;
  END LOOP;
END;
$$;

-- Create function to assign PIN to a user
CREATE OR REPLACE FUNCTION public.assign_member_pin(target_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_pin TEXT;
  existing_pin TEXT;
BEGIN
  -- Check if user already has a PIN
  SELECT member_pin INTO existing_pin FROM profiles WHERE user_id = target_user_id;
  
  IF existing_pin IS NOT NULL THEN
    RETURN existing_pin;
  END IF;
  
  -- Generate new unique PIN
  new_pin := generate_unique_member_pin();
  
  -- Record PIN as used (this happens first to prevent race conditions)
  INSERT INTO used_member_pins (pin, user_id) VALUES (new_pin, target_user_id);
  
  -- Assign to user profile
  UPDATE profiles SET member_pin = new_pin WHERE user_id = target_user_id;
  
  RETURN new_pin;
END;
$$;

-- Create trigger to auto-assign PIN when profile is created
CREATE OR REPLACE FUNCTION public.auto_assign_member_pin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_pin TEXT;
BEGIN
  IF NEW.member_pin IS NULL THEN
    new_pin := generate_unique_member_pin();
    INSERT INTO used_member_pins (pin, user_id) VALUES (new_pin, NEW.user_id);
    NEW.member_pin := new_pin;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_auto_assign_member_pin
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_assign_member_pin();

-- Assign PINs to existing users who don't have one
DO $$
DECLARE
  profile_record RECORD;
  new_pin TEXT;
BEGIN
  FOR profile_record IN SELECT user_id FROM profiles WHERE member_pin IS NULL LOOP
    new_pin := public.generate_unique_member_pin();
    INSERT INTO used_member_pins (pin, user_id) VALUES (new_pin, profile_record.user_id);
    UPDATE profiles SET member_pin = new_pin WHERE user_id = profile_record.user_id;
  END LOOP;
END;
$$;

-- RLS for used_member_pins (admins only for viewing, system manages inserts)
ALTER TABLE public.used_member_pins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view used PINs"
  ON public.used_member_pins
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));