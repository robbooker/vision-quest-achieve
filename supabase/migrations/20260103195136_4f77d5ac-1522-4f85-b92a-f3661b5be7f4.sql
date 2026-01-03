-- Create table for 7-Day Reset daily audits
CREATE TABLE public.reset_audits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  audit_date DATE NOT NULL,
  rule_wake BOOLEAN NOT NULL DEFAULT false,
  rule_move BOOLEAN NOT NULL DEFAULT false,
  rule_work BOOLEAN NOT NULL DEFAULT false,
  rule_read BOOLEAN NOT NULL DEFAULT false,
  rule_input BOOLEAN NOT NULL DEFAULT false,
  rule_sleep BOOLEAN NOT NULL DEFAULT false,
  rule_fuel BOOLEAN NOT NULL DEFAULT false,
  rule_reset BOOLEAN NOT NULL DEFAULT false,
  post_op_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, audit_date)
);

-- Enable Row Level Security
ALTER TABLE public.reset_audits ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own reset audits"
ON public.reset_audits
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own reset audits"
ON public.reset_audits
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reset audits"
ON public.reset_audits
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reset audits"
ON public.reset_audits
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_reset_audits_updated_at
BEFORE UPDATE ON public.reset_audits
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();