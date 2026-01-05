-- Create a function to get sitewide stats (bypasses RLS with SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.get_sitewide_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    -- Quick tasks
    'quick_tasks_completed_today', (
      SELECT COUNT(*) FROM quick_tasks 
      WHERE completed = true 
      AND completed_at::date = CURRENT_DATE
    ),
    'quick_tasks_completed_all_time', (
      SELECT COUNT(*) FROM quick_tasks WHERE completed = true
    ),
    'quick_tasks_total', (SELECT COUNT(*) FROM quick_tasks),
    
    -- Big Ten
    'big_ten_projects_total', (SELECT COUNT(*) FROM big_ten_projects),
    'big_ten_projects_completed', (
      SELECT COUNT(*) FROM big_ten_projects WHERE completed = true
    ),
    'big_ten_tasks_completed', (
      SELECT COUNT(*) FROM big_ten_tasks WHERE completed = true
    ),
    
    -- Focus sessions
    'focus_sessions_total', (SELECT COUNT(*) FROM focus_sessions),
    'focus_sessions_completed', (
      SELECT COUNT(*) FROM focus_sessions WHERE status = 'completed'
    ),
    'focus_sessions_today', (
      SELECT COUNT(*) FROM focus_sessions 
      WHERE started_at::date = CURRENT_DATE
    ),
    'focus_minutes_total', (
      SELECT COALESCE(SUM(actual_duration_minutes), 0) FROM focus_sessions 
      WHERE status = 'completed'
    ),
    'focus_minutes_today', (
      SELECT COALESCE(SUM(actual_duration_minutes), 0) FROM focus_sessions 
      WHERE status = 'completed' AND started_at::date = CURRENT_DATE
    ),
    
    -- Journal
    'journal_entries_total', (SELECT COUNT(*) FROM journal_entries),
    'journal_entries_today', (
      SELECT COUNT(*) FROM journal_entries 
      WHERE entry_date = CURRENT_DATE
    ),
    
    -- Habits/Tactics
    'tactics_created', (SELECT COUNT(*) FROM goal_tactics),
    'tactic_logs_total', (SELECT COUNT(*) FROM tactic_logs),
    'tactic_logs_today', (
      SELECT COUNT(*) FROM tactic_logs 
      WHERE logged_date = CURRENT_DATE
    ),
    
    -- Goals
    'goals_total', (SELECT COUNT(*) FROM goals),
    'cycles_total', (SELECT COUNT(*) FROM cycles),
    
    -- Users
    'total_users', (SELECT COUNT(*) FROM profiles),
    'users_active_today', (
      SELECT COUNT(DISTINCT user_id) FROM (
        SELECT user_id FROM quick_tasks WHERE updated_at::date = CURRENT_DATE
        UNION
        SELECT user_id FROM focus_sessions WHERE started_at::date = CURRENT_DATE
        UNION
        SELECT user_id FROM journal_entries WHERE entry_date = CURRENT_DATE
        UNION
        SELECT user_id FROM tactic_logs WHERE logged_date = CURRENT_DATE
      ) active_users
    )
  ) INTO result;
  
  RETURN result;
END;
$$;