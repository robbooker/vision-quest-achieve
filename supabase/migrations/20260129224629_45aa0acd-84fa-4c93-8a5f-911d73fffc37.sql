-- Add public SELECT policy for bird_sightings (only for Rob's user_id)
CREATE POLICY "Public can view Rob's sightings"
ON public.bird_sightings
FOR SELECT
USING (user_id = 'e28a3074-6c06-4686-a6c4-0e50b12aae26'::uuid);

-- Add public SELECT policy for bird_sighting_photos (only for Rob's user_id)  
CREATE POLICY "Public can view Rob's photos"
ON public.bird_sighting_photos
FOR SELECT
USING (user_id = 'e28a3074-6c06-4686-a6c4-0e50b12aae26'::uuid);