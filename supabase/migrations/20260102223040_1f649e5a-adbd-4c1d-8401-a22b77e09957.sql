-- Update the notify_friend_request function to include clearer instructions
CREATE OR REPLACE FUNCTION public.notify_friend_request()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  requester_email TEXT;
  requester_name TEXT;
BEGIN
  -- Get requester's profile info
  SELECT email, display_name INTO requester_email, requester_name
  FROM public.profiles
  WHERE user_id = NEW.requester_id;

  -- Create notification for the addressee with clear instructions
  INSERT INTO public.notifications (user_id, type, title, message, metadata)
  VALUES (
    NEW.addressee_id,
    'friend_request',
    'New Friend Request',
    COALESCE(requester_name, requester_email, 'Someone') || ' wants to be your friend! Go to Settings → Friends to accept or decline.',
    jsonb_build_object('friendship_id', NEW.id, 'requester_id', NEW.requester_id)
  );

  RETURN NEW;
END;
$function$;