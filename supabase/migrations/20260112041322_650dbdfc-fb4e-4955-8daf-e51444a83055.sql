-- Create a trigger function to grant free subscription on user signup
CREATE OR REPLACE FUNCTION public.grant_free_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.subscriptions (
    user_id,
    status,
    subscription_end,
    granted_by_admin
  ) VALUES (
    NEW.id,
    'active',
    '2036-12-31T23:59:59Z',
    true
  )
  ON CONFLICT (user_id) DO UPDATE SET
    status = 'active',
    subscription_end = '2036-12-31T23:59:59Z',
    granted_by_admin = true,
    updated_at = now();
  
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users for new signups
DROP TRIGGER IF EXISTS on_auth_user_created_grant_subscription ON auth.users;
CREATE TRIGGER on_auth_user_created_grant_subscription
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.grant_free_subscription();

-- Update all existing users to have free access until 2036
UPDATE public.subscriptions 
SET status = 'active',
    subscription_end = '2036-12-31T23:59:59Z',
    granted_by_admin = true,
    updated_at = now();

-- Also insert subscriptions for any existing users who don't have one yet
INSERT INTO public.subscriptions (user_id, status, subscription_end, granted_by_admin)
SELECT p.user_id, 'active', '2036-12-31T23:59:59Z', true
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM public.subscriptions s WHERE s.user_id = p.user_id
)
ON CONFLICT (user_id) DO NOTHING;