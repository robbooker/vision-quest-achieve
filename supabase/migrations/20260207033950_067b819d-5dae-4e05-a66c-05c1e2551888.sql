-- Add scheduling columns to briefing_lab_preferences to consolidate all settings
ALTER TABLE public.briefing_lab_preferences
ADD COLUMN IF NOT EXISTS enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS default_wake_time time without time zone DEFAULT '07:00',
ADD COLUMN IF NOT EXISTS evening_reminder_time time without time zone DEFAULT '19:00',
ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'America/Chicago',
ADD COLUMN IF NOT EXISTS preferred_channel text DEFAULT 'sms',
ADD COLUMN IF NOT EXISTS weekend_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS sms_delivery_enabled boolean DEFAULT false;

-- Copy existing scheduling data from briefing_preferences to briefing_lab_preferences
UPDATE public.briefing_lab_preferences blp
SET 
  enabled = COALESCE(bp.enabled, false),
  default_wake_time = COALESCE(bp.default_wake_time, '07:00'),
  evening_reminder_time = COALESCE(bp.evening_reminder_time, '19:00'),
  timezone = COALESCE(bp.timezone, 'America/Chicago'),
  preferred_channel = COALESCE(bp.preferred_channel, 'sms'),
  weekend_enabled = COALESCE(bp.weekend_enabled, false),
  sms_delivery_enabled = COALESCE(bp.sms_delivery_enabled, false)
FROM public.briefing_preferences bp
WHERE blp.user_id = bp.user_id;