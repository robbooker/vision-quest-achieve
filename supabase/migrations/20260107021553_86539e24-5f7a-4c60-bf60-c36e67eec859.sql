-- Add WOOP-specific columns to goals table
ALTER TABLE public.goals 
ADD COLUMN IF NOT EXISTS outcome_visualization TEXT,
ADD COLUMN IF NOT EXISTS primary_obstacle TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.goals.outcome_visualization IS 'WOOP Step 2: Vivid description of the best outcome when goal is achieved';
COMMENT ON COLUMN public.goals.primary_obstacle IS 'WOOP Step 3: The main internal obstacle that might derail progress';