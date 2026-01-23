-- Create bird sightings table
CREATE TABLE public.bird_sightings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  species_name TEXT NOT NULL,
  sighting_date DATE NOT NULL DEFAULT CURRENT_DATE,
  sighting_time TIME WITHOUT TIME ZONE,
  location_name TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  behavior_notes TEXT,
  field_marks TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bird sighting photos table
CREATE TABLE public.bird_sighting_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sighting_id UUID NOT NULL REFERENCES public.bird_sightings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  photo_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bird wishlist table
CREATE TABLE public.bird_wishlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  species_name TEXT NOT NULL,
  notes TEXT,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, species_name)
);

-- Create bird species notes table (for personal notes alongside AI research)
CREATE TABLE public.bird_species_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  species_name TEXT NOT NULL,
  personal_notes TEXT,
  ai_research_cache JSONB,
  ai_research_fetched_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, species_name)
);

-- Enable RLS on all tables
ALTER TABLE public.bird_sightings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bird_sighting_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bird_wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bird_species_notes ENABLE ROW LEVEL SECURITY;

-- RLS policies for bird_sightings
CREATE POLICY "Users can view their own sightings" ON public.bird_sightings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own sightings" ON public.bird_sightings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own sightings" ON public.bird_sightings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own sightings" ON public.bird_sightings FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for bird_sighting_photos
CREATE POLICY "Users can view their own photos" ON public.bird_sighting_photos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own photos" ON public.bird_sighting_photos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own photos" ON public.bird_sighting_photos FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for bird_wishlist
CREATE POLICY "Users can view their own wishlist" ON public.bird_wishlist FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own wishlist items" ON public.bird_wishlist FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own wishlist" ON public.bird_wishlist FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own wishlist items" ON public.bird_wishlist FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for bird_species_notes
CREATE POLICY "Users can view their own species notes" ON public.bird_species_notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own species notes" ON public.bird_species_notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own species notes" ON public.bird_species_notes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own species notes" ON public.bird_species_notes FOR DELETE USING (auth.uid() = user_id);

-- Create storage bucket for bird photos
INSERT INTO storage.buckets (id, name, public) VALUES ('bird-photos', 'bird-photos', true);

-- Storage policies for bird photos
CREATE POLICY "Users can view bird photos" ON storage.objects FOR SELECT USING (bucket_id = 'bird-photos');
CREATE POLICY "Users can upload their own bird photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'bird-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their own bird photos" ON storage.objects FOR DELETE USING (bucket_id = 'bird-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION public.update_bird_tables_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_bird_sightings_updated_at BEFORE UPDATE ON public.bird_sightings FOR EACH ROW EXECUTE FUNCTION public.update_bird_tables_updated_at();
CREATE TRIGGER update_bird_wishlist_updated_at BEFORE UPDATE ON public.bird_wishlist FOR EACH ROW EXECUTE FUNCTION public.update_bird_tables_updated_at();
CREATE TRIGGER update_bird_species_notes_updated_at BEFORE UPDATE ON public.bird_species_notes FOR EACH ROW EXECUTE FUNCTION public.update_bird_tables_updated_at();