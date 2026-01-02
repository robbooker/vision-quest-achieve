-- Create a function to notify users of friend requests
CREATE OR REPLACE FUNCTION public.notify_friend_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  requester_email TEXT;
  requester_name TEXT;
BEGIN
  -- Get requester's profile info
  SELECT email, display_name INTO requester_email, requester_name
  FROM public.profiles
  WHERE user_id = NEW.requester_id;

  -- Create notification for the addressee
  INSERT INTO public.notifications (user_id, type, title, message, metadata)
  VALUES (
    NEW.addressee_id,
    'friend_request',
    'New Friend Request',
    COALESCE(requester_name, requester_email, 'Someone') || ' wants to be your friend!',
    jsonb_build_object('friendship_id', NEW.id, 'requester_id', NEW.requester_id)
  );

  RETURN NEW;
END;
$$;

-- Create trigger for new friend requests
DROP TRIGGER IF EXISTS on_friend_request_created ON public.friendships;
CREATE TRIGGER on_friend_request_created
  AFTER INSERT ON public.friendships
  FOR EACH ROW
  WHEN (NEW.status = 'pending')
  EXECUTE FUNCTION public.notify_friend_request();

-- Fix the notifications INSERT policy to allow the trigger to insert
DROP POLICY IF EXISTS "Service can insert notifications" ON public.notifications;
CREATE POLICY "Anyone can receive notifications"
  ON public.notifications
  FOR INSERT
  WITH CHECK (true);

-- Fix infinite recursion in shared_tasks/task_shares by using security definer functions

-- Function to check if user is owner of a shared task
CREATE OR REPLACE FUNCTION public.is_shared_task_owner(task_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.shared_tasks
    WHERE id = task_id AND owner_id = auth.uid()
  );
$$;

-- Function to check if user has a task shared with them
CREATE OR REPLACE FUNCTION public.is_task_shared_with_me(task_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.task_shares
    WHERE task_shares.task_id = is_task_shared_with_me.task_id 
    AND shared_with_id = auth.uid()
  );
$$;

-- Drop and recreate shared_tasks policies using the functions
DROP POLICY IF EXISTS "Users can view tasks shared with them" ON public.shared_tasks;
DROP POLICY IF EXISTS "Shared users can update task completion" ON public.shared_tasks;

CREATE POLICY "Users can view tasks shared with them"
  ON public.shared_tasks
  FOR SELECT
  USING (owner_id = auth.uid() OR public.is_task_shared_with_me(id));

DROP POLICY IF EXISTS "Owners can view their shared tasks" ON public.shared_tasks;

CREATE POLICY "Shared users can update task completion"
  ON public.shared_tasks
  FOR UPDATE
  USING (owner_id = auth.uid() OR public.is_task_shared_with_me(id));

DROP POLICY IF EXISTS "Owners can update their shared tasks" ON public.shared_tasks;

-- Drop and recreate task_shares policies using the function
DROP POLICY IF EXISTS "Owners can view task shares" ON public.task_shares;
DROP POLICY IF EXISTS "Owners can create task shares" ON public.task_shares;
DROP POLICY IF EXISTS "Owners can delete task shares" ON public.task_shares;

CREATE POLICY "Owners can view task shares"
  ON public.task_shares
  FOR SELECT
  USING (public.is_shared_task_owner(task_id) OR shared_with_id = auth.uid());

DROP POLICY IF EXISTS "Shared users can view their shares" ON public.task_shares;

CREATE POLICY "Owners can create task shares"
  ON public.task_shares
  FOR INSERT
  WITH CHECK (public.is_shared_task_owner(task_id));

CREATE POLICY "Owners can delete task shares"
  ON public.task_shares
  FOR DELETE
  USING (public.is_shared_task_owner(task_id));