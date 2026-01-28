-- Add ai_daily_insight column to journal_entries for auto-generated pillar analysis
ALTER TABLE public.journal_entries 
ADD COLUMN ai_daily_insight text;