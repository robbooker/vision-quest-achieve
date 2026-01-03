-- No new table needed - we'll use existing goals table with goal_type = 'habit'
-- But we need to add columns for Duhigg's framework

ALTER TABLE public.goals 
ADD COLUMN IF NOT EXISTS habit_direction TEXT, -- 'start', 'stop', 'replace'
ADD COLUMN IF NOT EXISTS habit_cue TEXT,
ADD COLUMN IF NOT EXISTS habit_current_routine TEXT,
ADD COLUMN IF NOT EXISTS habit_new_routine TEXT,
ADD COLUMN IF NOT EXISTS habit_reward TEXT,
ADD COLUMN IF NOT EXISTS habit_craving TEXT,
ADD COLUMN IF NOT EXISTS habit_environment_change TEXT,
ADD COLUMN IF NOT EXISTS implementation_intention TEXT,
ADD COLUMN IF NOT EXISTS is_keystone_habit BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS accountability_partner_email TEXT;

-- Add index for goal_type filtering
CREATE INDEX IF NOT EXISTS idx_goals_goal_type ON public.goals(goal_type);

COMMENT ON COLUMN public.goals.habit_direction IS 'start, stop, or replace';
COMMENT ON COLUMN public.goals.habit_cue IS 'The trigger for the habit (time, location, emotion, action, people)';
COMMENT ON COLUMN public.goals.habit_current_routine IS 'The existing behavior to stop/replace';
COMMENT ON COLUMN public.goals.habit_new_routine IS 'The new behavior to adopt';
COMMENT ON COLUMN public.goals.habit_reward IS 'What reward does this habit provide';
COMMENT ON COLUMN public.goals.habit_craving IS 'The underlying craving being satisfied';
COMMENT ON COLUMN public.goals.habit_environment_change IS 'Changes to make environment support the habit';
COMMENT ON COLUMN public.goals.implementation_intention IS 'When X happens, I will Y';
COMMENT ON COLUMN public.goals.is_keystone_habit IS 'Whether this is a keystone habit that ripples to other areas';
COMMENT ON COLUMN public.goals.accountability_partner_email IS 'Email of accountability partner for shared visibility';