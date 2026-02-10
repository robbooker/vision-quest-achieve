ALTER TABLE briefing_lab_preferences
ADD COLUMN IF NOT EXISTS briefing_personality TEXT DEFAULT 'default';