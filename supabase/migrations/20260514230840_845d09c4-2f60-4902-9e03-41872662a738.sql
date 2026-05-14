ALTER TABLE public.graduation_photos ADD COLUMN assigned_to_user_3 BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.graduation_photo_decisions DROP CONSTRAINT graduation_photo_decisions_reviewer_slug_check;
ALTER TABLE public.graduation_photo_decisions ADD CONSTRAINT graduation_photo_decisions_reviewer_slug_check CHECK (reviewer_slug IN ('user-1', 'user-2', 'user-3'));