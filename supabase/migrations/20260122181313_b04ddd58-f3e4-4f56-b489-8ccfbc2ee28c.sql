
-- Create trips table
CREATE TABLE public.trips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  destination TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  purpose TEXT NOT NULL DEFAULT 'leisure',
  attendees TEXT[] DEFAULT '{}',
  planned_activities TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create master_items table (user's personal item locker)
CREATE TABLE public.master_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  item_name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'General',
  default_carry BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, item_name)
);

-- Create trip_packing_list table (links trips and items)
CREATE TABLE public.trip_packing_list (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  master_item_id UUID REFERENCES public.master_items(id) ON DELETE SET NULL,
  user_id UUID NOT NULL,
  item_name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'General',
  quantity INTEGER NOT NULL DEFAULT 1,
  is_packed BOOLEAN NOT NULL DEFAULT false,
  is_ai_suggested BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_packing_list ENABLE ROW LEVEL SECURITY;

-- RLS policies for trips
CREATE POLICY "Users can view their own trips" ON public.trips FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own trips" ON public.trips FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own trips" ON public.trips FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own trips" ON public.trips FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for master_items
CREATE POLICY "Users can view their own master items" ON public.master_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own master items" ON public.master_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own master items" ON public.master_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own master items" ON public.master_items FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for trip_packing_list
CREATE POLICY "Users can view their own packing lists" ON public.trip_packing_list FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own packing list items" ON public.trip_packing_list FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own packing list items" ON public.trip_packing_list FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own packing list items" ON public.trip_packing_list FOR DELETE USING (auth.uid() = user_id);

-- Add updated_at triggers
CREATE TRIGGER update_trips_updated_at BEFORE UPDATE ON public.trips FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_master_items_updated_at BEFORE UPDATE ON public.master_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_trip_packing_list_updated_at BEFORE UPDATE ON public.trip_packing_list FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_trips_user_id ON public.trips(user_id);
CREATE INDEX idx_trips_dates ON public.trips(start_date, end_date);
CREATE INDEX idx_master_items_user_id ON public.master_items(user_id);
CREATE INDEX idx_trip_packing_list_trip_id ON public.trip_packing_list(trip_id);
CREATE INDEX idx_trip_packing_list_user_id ON public.trip_packing_list(user_id);
