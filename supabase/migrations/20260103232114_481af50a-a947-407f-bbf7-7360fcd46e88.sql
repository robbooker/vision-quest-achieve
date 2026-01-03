-- Add onboarding fields to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_us TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_whatsapp TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS consent_email BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS consent_sms BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS consent_whatsapp BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS consent_timestamp TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;