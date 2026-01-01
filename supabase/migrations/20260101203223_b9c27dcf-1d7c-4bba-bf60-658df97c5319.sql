-- Add archived column to cycles table
ALTER TABLE public.cycles ADD COLUMN archived boolean NOT NULL DEFAULT false;