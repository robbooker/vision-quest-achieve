CREATE POLICY "Users can update their own photos"
ON public.bird_sighting_photos
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);