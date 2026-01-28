-- Create lists table
CREATE TABLE public.lists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  slug TEXT UNIQUE NOT NULL,
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create list_items table
CREATE TABLE public.list_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  list_id UUID NOT NULL REFERENCES public.lists(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  link_url TEXT,
  link_title TEXT,
  link_description TEXT,
  link_image TEXT,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create list_shares table
CREATE TABLE public.list_shares (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  list_id UUID NOT NULL REFERENCES public.lists(id) ON DELETE CASCADE,
  shared_by_id UUID NOT NULL,
  phone_number TEXT NOT NULL,
  access_token TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  sms_sent_at TIMESTAMP WITH TIME ZONE,
  first_viewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.list_shares ENABLE ROW LEVEL SECURITY;

-- Lists policies
CREATE POLICY "Users can create their own lists"
  ON public.lists FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own lists"
  ON public.lists FOR SELECT
  USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can update their own lists"
  ON public.lists FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own lists"
  ON public.lists FOR DELETE
  USING (auth.uid() = user_id);

-- List items policies
CREATE POLICY "Users can create items in their lists"
  ON public.list_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view items in their lists or public lists"
  ON public.list_items FOR SELECT
  USING (
    auth.uid() = user_id OR 
    EXISTS (SELECT 1 FROM public.lists WHERE lists.id = list_items.list_id AND lists.is_public = true)
  );

CREATE POLICY "Users can update items in their lists"
  ON public.list_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete items in their lists"
  ON public.list_items FOR DELETE
  USING (auth.uid() = user_id);

-- List shares policies
CREATE POLICY "Users can create shares for their lists"
  ON public.list_shares FOR INSERT
  WITH CHECK (auth.uid() = shared_by_id);

CREATE POLICY "Users can view shares for their lists"
  ON public.list_shares FOR SELECT
  USING (auth.uid() = shared_by_id);

CREATE POLICY "Users can update shares for their lists"
  ON public.list_shares FOR UPDATE
  USING (auth.uid() = shared_by_id);

CREATE POLICY "Users can delete shares for their lists"
  ON public.list_shares FOR DELETE
  USING (auth.uid() = shared_by_id);

-- Public access to shares by token (for viewing shared lists)
CREATE POLICY "Anyone can view shares by access token"
  ON public.list_shares FOR SELECT
  USING (true);

-- Enable realtime for list_items
ALTER PUBLICATION supabase_realtime ADD TABLE public.list_items;

-- Create updated_at triggers
CREATE TRIGGER update_lists_updated_at
  BEFORE UPDATE ON public.lists
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_list_items_updated_at
  BEFORE UPDATE ON public.list_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_list_shares_updated_at
  BEFORE UPDATE ON public.list_shares
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();