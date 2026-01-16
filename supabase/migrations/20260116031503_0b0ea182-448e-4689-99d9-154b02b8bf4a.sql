
-- Create a function to get trend data for the last N days
CREATE OR REPLACE FUNCTION public.get_sitewide_trends(days_back integer DEFAULT 7)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    -- Daily task completions
    'daily_tasks', (
      SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb)
      FROM (
        SELECT 
          DATE(completed_at) as date,
          COUNT(*) as count
        FROM quick_tasks 
        WHERE completed = true 
        AND completed_at >= NOW() - (days_back || ' days')::interval
        GROUP BY DATE(completed_at)
        ORDER BY date
      ) t
    ),
    -- Daily focus sessions
    'daily_focus', (
      SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb)
      FROM (
        SELECT 
          DATE(started_at) as date,
          COUNT(*) as sessions,
          COALESCE(SUM(actual_duration_minutes), 0) as minutes
        FROM focus_sessions 
        WHERE status = 'completed'
        AND started_at >= NOW() - (days_back || ' days')::interval
        GROUP BY DATE(started_at)
        ORDER BY date
      ) t
    ),
    -- Daily journal entries
    'daily_journal', (
      SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb)
      FROM (
        SELECT 
          entry_date as date,
          COUNT(*) as count
        FROM journal_entries 
        WHERE entry_date >= CURRENT_DATE - days_back
        GROUP BY entry_date
        ORDER BY entry_date
      ) t
    ),
    -- Daily habit logs
    'daily_habits', (
      SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb)
      FROM (
        SELECT 
          logged_date as date,
          COUNT(*) as count,
          SUM(completed_count) as total_completions
        FROM tactic_logs 
        WHERE logged_date >= CURRENT_DATE - days_back
        GROUP BY logged_date
        ORDER BY logged_date
      ) t
    ),
    -- Daily active users
    'daily_active_users', (
      SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb)
      FROM (
        SELECT 
          activity_date as date,
          COUNT(DISTINCT user_id) as count
        FROM (
          SELECT DATE(completed_at) as activity_date, user_id FROM quick_tasks 
          WHERE completed_at >= NOW() - (days_back || ' days')::interval
          UNION ALL
          SELECT DATE(started_at) as activity_date, user_id FROM focus_sessions 
          WHERE started_at >= NOW() - (days_back || ' days')::interval
          UNION ALL
          SELECT entry_date as activity_date, user_id FROM journal_entries 
          WHERE entry_date >= CURRENT_DATE - days_back
          UNION ALL
          SELECT logged_date as activity_date, user_id FROM tactic_logs 
          WHERE logged_date >= CURRENT_DATE - days_back
        ) all_activity
        GROUP BY activity_date
        ORDER BY activity_date
      ) t
    ),
    -- New user signups by day
    'daily_signups', (
      SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb)
      FROM (
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as count
        FROM profiles 
        WHERE created_at >= NOW() - (days_back || ' days')::interval
        GROUP BY DATE(created_at)
        ORDER BY date
      ) t
    )
  ) INTO result;
  
  RETURN result;
END;
$function$;
