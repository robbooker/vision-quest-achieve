-- Add category column to big_ten_projects table
ALTER TABLE public.big_ten_projects 
ADD COLUMN category text CHECK (category IN ('opportunity', 'challenge'));