-- Drop old policies with wrong user ID
DROP POLICY IF EXISTS "Public can view Rob's sightings" ON public.bird_sightings;
DROP POLICY IF EXISTS "Public can view Rob's photos" ON public.bird_sighting_photos;

-- Add new public SELECT policies with correct user ID
CREATE POLICY "Public can view Rob's sightings"
ON public.bird_sightings
FOR SELECT
USING (user_id = 'a0bff1ab-02c1-4d2a-ad68-2b48cf4bdd9a'::uuid);

CREATE POLICY "Public can view Rob's photos"
ON public.bird_sighting_photos
FOR SELECT
USING (user_id = 'a0bff1ab-02c1-4d2a-ad68-2b48cf4bdd9a'::uuid);