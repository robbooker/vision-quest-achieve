-- Create trip_logistics table for storing travel logistics (flights, hotels, car rentals, etc.)
CREATE TABLE public.trip_logistics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  logistics_type TEXT NOT NULL CHECK (logistics_type IN ('stay', 'flight', 'car_rental', 'transportation', 'activity')),
  provider_name TEXT,
  confirmation_code TEXT,
  start_datetime TIMESTAMPTZ,
  end_datetime TIMESTAMPTZ,
  start_location TEXT,
  end_location TEXT,
  flight_number TEXT,
  seat_assignment TEXT,
  vehicle_type TEXT,
  contact_phone TEXT,
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.trip_logistics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own trip logistics"
  ON public.trip_logistics
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own trip logistics"
  ON public.trip_logistics
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trip logistics"
  ON public.trip_logistics
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own trip logistics"
  ON public.trip_logistics
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_trip_logistics_updated_at
  BEFORE UPDATE ON public.trip_logistics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_trip_logistics_trip_id ON public.trip_logistics(trip_id);
CREATE INDEX idx_trip_logistics_user_id ON public.trip_logistics(user_id);
CREATE INDEX idx_trip_logistics_type ON public.trip_logistics(logistics_type);