-- Create bloodwork_reports table
CREATE TABLE public.bloodwork_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  report_date date NOT NULL,
  lab_name text,
  pdf_url text NOT NULL,
  raw_text text,
  biomarkers jsonb DEFAULT '[]'::jsonb,
  ai_insights text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bloodwork_reports ENABLE ROW LEVEL SECURITY;

-- RLS policies for bloodwork_reports
CREATE POLICY "Users can view their own bloodwork reports"
  ON public.bloodwork_reports FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bloodwork reports"
  ON public.bloodwork_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bloodwork reports"
  ON public.bloodwork_reports FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bloodwork reports"
  ON public.bloodwork_reports FOR DELETE
  USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE TRIGGER update_bloodwork_reports_updated_at
  BEFORE UPDATE ON public.bloodwork_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create private storage bucket for bloodwork PDFs
INSERT INTO storage.buckets (id, name, public)
VALUES ('bloodwork-pdfs', 'bloodwork-pdfs', false);

-- Storage RLS policies - users can only access their own files
CREATE POLICY "Users can view their own bloodwork PDFs"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'bloodwork-pdfs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own bloodwork PDFs"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'bloodwork-pdfs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own bloodwork PDFs"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'bloodwork-pdfs' AND auth.uid()::text = (storage.foldername(name))[1]);