-- Add RLS policy to allow users to search for other profiles by email (for friend requests)
CREATE POLICY "Users can search profiles by email" 
ON public.profiles 
FOR SELECT 
USING (true);

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;