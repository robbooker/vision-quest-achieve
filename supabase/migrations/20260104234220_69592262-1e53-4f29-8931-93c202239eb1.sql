-- Create journal_settings table for user preferences
CREATE TABLE public.journal_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  theme_instructions TEXT DEFAULT 'Nature scenes with peaceful, calming vibes',
  art_style TEXT DEFAULT 'watercolor',
  color_palette TEXT DEFAULT 'warm and inspiring',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create journal_entries table
CREATE TABLE public.journal_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  entry_date DATE NOT NULL,
  completed_tasks JSONB DEFAULT '[]'::jsonb,
  completed_habits JSONB DEFAULT '[]'::jsonb,
  image_url TEXT,
  image_prompt TEXT,
  user_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, entry_date)
);

-- Enable RLS on both tables
ALTER TABLE public.journal_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

-- RLS policies for journal_settings
CREATE POLICY "Users can view their own journal settings"
  ON public.journal_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own journal settings"
  ON public.journal_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own journal settings"
  ON public.journal_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS policies for journal_entries
CREATE POLICY "Users can view their own journal entries"
  ON public.journal_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own journal entries"
  ON public.journal_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own journal entries"
  ON public.journal_entries FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own journal entries"
  ON public.journal_entries FOR DELETE
  USING (auth.uid() = user_id);

-- Create storage bucket for journal images
INSERT INTO storage.buckets (id, name, public) VALUES ('journal-images', 'journal-images', true);

-- Storage policies for journal-images bucket
CREATE POLICY "Users can view their own journal images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'journal-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own journal images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'journal-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own journal images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'journal-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own journal images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'journal-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Public read access for journal images (needed to display in app)
CREATE POLICY "Anyone can view journal images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'journal-images');

-- Trigger for updated_at on journal_settings
CREATE TRIGGER update_journal_settings_updated_at
  BEFORE UPDATE ON public.journal_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for updated_at on journal_entries
CREATE TRIGGER update_journal_entries_updated_at
  BEFORE UPDATE ON public.journal_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();