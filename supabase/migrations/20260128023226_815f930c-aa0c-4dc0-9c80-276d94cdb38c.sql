-- Add contributor tracking columns to list_items
ALTER TABLE public.list_items 
ADD COLUMN IF NOT EXISTS contributor_id uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS contributor_name text;