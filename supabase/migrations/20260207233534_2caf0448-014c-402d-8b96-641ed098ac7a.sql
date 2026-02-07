-- Create a function to batch update task positions in a single query
CREATE OR REPLACE FUNCTION public.batch_update_task_positions(
  task_updates jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  task_update jsonb;
  task_id uuid;
  new_position int;
BEGIN
  -- Validate that the user owns all the tasks being updated
  FOR task_update IN SELECT * FROM jsonb_array_elements(task_updates)
  LOOP
    task_id := (task_update->>'id')::uuid;
    
    IF NOT EXISTS (
      SELECT 1 FROM quick_tasks 
      WHERE id = task_id AND user_id = auth.uid()
    ) THEN
      RAISE EXCEPTION 'Task not found or access denied: %', task_id;
    END IF;
  END LOOP;

  -- Perform all updates in a single transaction
  FOR task_update IN SELECT * FROM jsonb_array_elements(task_updates)
  LOOP
    task_id := (task_update->>'id')::uuid;
    new_position := (task_update->>'position')::int;
    
    UPDATE quick_tasks 
    SET position = new_position, updated_at = now()
    WHERE id = task_id AND user_id = auth.uid();
  END LOOP;
END;
$$;