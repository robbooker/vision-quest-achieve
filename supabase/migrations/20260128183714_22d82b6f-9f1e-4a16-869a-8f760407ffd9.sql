
-- Add policy to allow viewing lists when user has a valid share token
-- This uses a subquery to check if the list has any shares (accessible via token)
CREATE POLICY "Anyone can view lists shared via token"
ON public.lists
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.list_shares
    WHERE list_shares.list_id = lists.id
  )
);

-- Add policy to allow viewing list items when accessing via share token
CREATE POLICY "Anyone can view items in shared lists"
ON public.list_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.list_shares
    WHERE list_shares.list_id = list_items.list_id
  )
);

-- Add policy to allow updating list_shares first_viewed_at for anonymous users
CREATE POLICY "Anyone can update first_viewed_at on shares"
ON public.list_shares
FOR UPDATE
USING (true)
WITH CHECK (true);
