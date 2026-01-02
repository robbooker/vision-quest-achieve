-- Add position column for drag-and-drop ordering
ALTER TABLE public.quick_tasks ADD COLUMN position INTEGER NOT NULL DEFAULT 0;

-- Set initial positions based on creation order
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rn
  FROM public.quick_tasks
)
UPDATE public.quick_tasks 
SET position = ranked.rn
FROM ranked
WHERE public.quick_tasks.id = ranked.id;