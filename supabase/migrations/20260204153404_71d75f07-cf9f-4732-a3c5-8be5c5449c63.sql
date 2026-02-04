-- Add SMS delivery toggle to briefing preferences
ALTER TABLE briefing_preferences
ADD COLUMN sms_delivery_enabled BOOLEAN DEFAULT false;