-- Update cron job 3 to call the new Lab auto-generate function
SELECT cron.alter_job(
  3,
  command := $$
  SELECT net.http_post(
    url := 'https://gogzkyjylruuziseprfw.supabase.co/functions/v1/briefing-lab-auto-generate',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdvZ3preWp5bHJ1dXppc2VwcmZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcyODQzMDIsImV4cCI6MjA4Mjg2MDMwMn0.U6Ya45V80ZFzbnJoUHE2FX5rm8nw-cl9o1Sn2LzD7eg"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- Update cron job 4 to also call the new Lab auto-generate function
SELECT cron.alter_job(
  4,
  command := $$
  SELECT net.http_post(
    url := 'https://gogzkyjylruuziseprfw.supabase.co/functions/v1/briefing-lab-auto-generate',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdvZ3preWp5bHJ1dXppc2VwcmZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcyODQzMDIsImV4cCI6MjA4Mjg2MDMwMn0.U6Ya45V80ZFzbnJoUHE2FX5rm8nw-cl9o1Sn2LzD7eg"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);