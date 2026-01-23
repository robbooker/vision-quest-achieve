-- Add has_flight column to trips table
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS has_flight boolean DEFAULT false;

-- Add bag_type column to trip_packing_list table
ALTER TABLE public.trip_packing_list ADD COLUMN IF NOT EXISTS bag_type text DEFAULT 'checked';

-- Add comment for clarity
COMMENT ON COLUMN public.trips.has_flight IS 'Whether the trip involves a flight (affects carry-on vs checked bag organization)';
COMMENT ON COLUMN public.trip_packing_list.bag_type IS 'carry_on or checked - only relevant for flights';