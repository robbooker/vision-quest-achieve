-- Create bird feed posts table for casual photo uploads
CREATE TABLE public.bird_feed_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  photo_url TEXT NOT NULL,
  caption TEXT,
  location_name TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  posted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create bird feed likes table
CREATE TABLE public.bird_feed_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.bird_feed_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Enable RLS
ALTER TABLE public.bird_feed_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bird_feed_likes ENABLE ROW LEVEL SECURITY;

-- Posts policies: public read, authenticated users can create/update/delete their own
CREATE POLICY "Anyone can view bird feed posts" 
ON public.bird_feed_posts 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create posts" 
ON public.bird_feed_posts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts" 
ON public.bird_feed_posts 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts" 
ON public.bird_feed_posts 
FOR DELETE 
USING (auth.uid() = user_id);

-- Likes policies: public read, authenticated users can like/unlike
CREATE POLICY "Anyone can view likes" 
ON public.bird_feed_likes 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can like posts" 
ON public.bird_feed_likes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own likes" 
ON public.bird_feed_likes 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add indexes for performance
CREATE INDEX idx_bird_feed_posts_posted_at ON public.bird_feed_posts(posted_at DESC);
CREATE INDEX idx_bird_feed_posts_user_id ON public.bird_feed_posts(user_id);
CREATE INDEX idx_bird_feed_likes_post_id ON public.bird_feed_likes(post_id);

-- Triggers for updated_at
CREATE TRIGGER update_bird_feed_posts_updated_at
BEFORE UPDATE ON public.bird_feed_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();