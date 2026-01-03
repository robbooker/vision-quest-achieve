-- Update the handle_new_user function to use email prefix as fallback display name
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, display_name)
  VALUES (
    new.id,
    new.email,
    COALESCE(
      new.raw_user_meta_data ->> 'full_name', 
      new.raw_user_meta_data ->> 'name',
      split_part(new.email, '@', 1)  -- Fallback to email prefix
    )
  )
  ON CONFLICT (user_id) DO UPDATE SET
    email = EXCLUDED.email,
    display_name = COALESCE(profiles.display_name, EXCLUDED.display_name),
    updated_at = now();
  RETURN new;
END;
$$;