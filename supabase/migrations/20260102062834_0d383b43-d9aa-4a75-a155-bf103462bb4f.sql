-- Add completed column to big_ten_projects
ALTER TABLE public.big_ten_projects ADD COLUMN completed boolean NOT NULL DEFAULT false;
ALTER TABLE public.big_ten_projects ADD COLUMN completed_at timestamp with time zone;