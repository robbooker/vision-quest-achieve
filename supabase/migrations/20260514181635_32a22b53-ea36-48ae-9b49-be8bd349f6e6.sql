
-- Create storage bucket for graduation photos
INSERT INTO storage.buckets (id, name, public) VALUES ('graduation-photos', 'graduation-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Photos table
CREATE TABLE public.graduation_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_path TEXT NOT NULL,
  uploaded_by UUID,
  assigned_to_user_1 BOOLEAN NOT NULL DEFAULT false,
  assigned_to_user_2 BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.graduation_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Photos viewable by all"
  ON public.graduation_photos FOR SELECT USING (true);

CREATE POLICY "Admins can insert photos"
  ON public.graduation_photos FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update photos"
  ON public.graduation_photos FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete photos"
  ON public.graduation_photos FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Decisions table
CREATE TABLE public.graduation_photo_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id UUID NOT NULL REFERENCES public.graduation_photos(id) ON DELETE CASCADE,
  reviewer_slug TEXT NOT NULL CHECK (reviewer_slug IN ('user-1', 'user-2')),
  decision TEXT NOT NULL CHECK (decision IN ('keep', 'discard')),
  decided_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (photo_id, reviewer_slug)
);

ALTER TABLE public.graduation_photo_decisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Decisions viewable by all"
  ON public.graduation_photo_decisions FOR SELECT USING (true);

CREATE POLICY "Anyone can insert decisions"
  ON public.graduation_photo_decisions FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update decisions"
  ON public.graduation_photo_decisions FOR UPDATE USING (true);

CREATE POLICY "Admins can delete decisions"
  ON public.graduation_photo_decisions FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Storage policies for graduation-photos bucket
CREATE POLICY "Graduation photos public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'graduation-photos');

CREATE POLICY "Admins upload graduation photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'graduation-photos' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update graduation photos"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'graduation-photos' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete graduation photos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'graduation-photos' AND public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_grad_decisions_photo ON public.graduation_photo_decisions(photo_id);
