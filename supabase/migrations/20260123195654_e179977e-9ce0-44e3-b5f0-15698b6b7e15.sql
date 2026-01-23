-- Add column for storing previous AI research (for undo/restore feature)
ALTER TABLE public.bird_species_notes 
ADD COLUMN IF NOT EXISTS ai_research_previous TEXT;