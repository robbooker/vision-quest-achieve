-- Create health measurements table for weight, blood pressure, etc.
CREATE TABLE public.health_measurements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  measurement_type text NOT NULL, -- 'weight', 'blood_pressure'
  primary_value numeric NOT NULL, -- weight in lbs, or systolic for BP
  secondary_value numeric, -- diastolic for BP, null for weight
  unit text NOT NULL DEFAULT 'lbs', -- 'lbs', 'kg', 'mmHg'
  notes text, -- context notes (especially for BP - what were you doing before)
  measured_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.health_measurements ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own measurements"
ON public.health_measurements
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own measurements"
ON public.health_measurements
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own measurements"
ON public.health_measurements
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own measurements"
ON public.health_measurements
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for efficient queries
CREATE INDEX idx_health_measurements_user_type_date 
ON public.health_measurements(user_id, measurement_type, measured_at DESC);

-- Create trigger for updated_at
CREATE TRIGGER update_health_measurements_updated_at
BEFORE UPDATE ON public.health_measurements
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();