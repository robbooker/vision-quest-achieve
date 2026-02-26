import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export type LogisticsType = 'stay' | 'flight' | 'car_rental' | 'transportation' | 'activity';
export type TripTimezone = 'CT' | 'ET' | 'PT' | 'MT' | 'HT';

export interface TripLogistics {
  id: string;
  trip_id: string;
  user_id: string;
  logistics_type: LogisticsType;
  provider_name: string | null;
  confirmation_code: string | null;
  start_datetime: string | null;
  end_datetime: string | null;
  start_location: string | null;
  end_location: string | null;
  flight_number: string | null;
  seat_assignment: string | null;
  vehicle_type: string | null;
  contact_phone: string | null;
  notes: string | null;
  timezone: TripTimezone;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export type TripLogisticsInsert = Omit<TripLogistics, 'id' | 'created_at' | 'updated_at'>;
export type TripLogisticsUpdate = Partial<Omit<TripLogistics, 'id' | 'trip_id' | 'user_id' | 'created_at' | 'updated_at'>>;

export function useTripLogistics(tripId: string | null, tripDestination?: string, tripStartDate?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: logistics = [], isLoading } = useQuery({
    queryKey: ['trip_logistics', tripId],
    queryFn: async () => {
      if (!tripId || !user?.id) return [];
      const { data, error } = await (supabase
        .from('trip_logistics' as any)
        .select('*')
        .eq('trip_id', tripId)
        .order('start_datetime', { ascending: true }) as any);
      if (error) throw error;
      return (data || []) as TripLogistics[];
    },
    enabled: !!tripId && !!user?.id,
  });

  // Generate embedding content text for a logistics entry
  const generateEmbeddingContent = (entry: TripLogisticsInsert | TripLogistics, destination: string): string => {
    const parts: string[] = [];
    
    switch (entry.logistics_type) {
      case 'flight':
        parts.push(`${destination} trip flight`);
        if (entry.provider_name) parts.push(`${entry.provider_name}`);
        if (entry.flight_number) parts.push(`flight ${entry.flight_number}`);
        if (entry.start_location && entry.start_datetime) {
          const depTime = new Date(entry.start_datetime).toLocaleString('en-US', {
            month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
          });
          parts.push(`departing ${entry.start_location} on ${depTime}`);
        }
        if (entry.end_location && entry.end_datetime) {
          const arrTime = new Date(entry.end_datetime).toLocaleString('en-US', {
            hour: 'numeric', minute: '2-digit'
          });
          parts.push(`arriving ${entry.end_location} at ${arrTime}`);
        }
        if (entry.confirmation_code) parts.push(`Confirmation: ${entry.confirmation_code}`);
        if (entry.seat_assignment) parts.push(`Seat ${entry.seat_assignment}`);
        break;
        
      case 'stay':
        parts.push(`${destination} trip accommodation`);
        if (entry.provider_name) parts.push(`staying at ${entry.provider_name}`);
        if (entry.start_location) parts.push(`at ${entry.start_location}`);
        if (entry.start_datetime) {
          const checkIn = new Date(entry.start_datetime).toLocaleString('en-US', {
            month: 'short', day: 'numeric'
          });
          parts.push(`check-in ${checkIn}`);
        }
        if (entry.end_datetime) {
          const checkOut = new Date(entry.end_datetime).toLocaleString('en-US', {
            month: 'short', day: 'numeric'
          });
          parts.push(`check-out ${checkOut}`);
        }
        if (entry.confirmation_code) parts.push(`Confirmation: ${entry.confirmation_code}`);
        if (entry.contact_phone) parts.push(`Phone: ${entry.contact_phone}`);
        break;
        
      case 'car_rental':
        parts.push(`${destination} trip car rental`);
        if (entry.provider_name) parts.push(`from ${entry.provider_name}`);
        if (entry.vehicle_type) parts.push(`${entry.vehicle_type}`);
        if (entry.start_location && entry.start_datetime) {
          const pickupTime = new Date(entry.start_datetime).toLocaleString('en-US', {
            month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
          });
          parts.push(`pickup at ${entry.start_location} on ${pickupTime}`);
        }
        if (entry.end_location && entry.end_datetime) {
          const dropoffTime = new Date(entry.end_datetime).toLocaleString('en-US', {
            month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
          });
          parts.push(`dropoff at ${entry.end_location} on ${dropoffTime}`);
        }
        if (entry.confirmation_code) parts.push(`Confirmation: ${entry.confirmation_code}`);
        break;
        
      case 'transportation':
        parts.push(`${destination} trip transportation`);
        if (entry.provider_name) parts.push(`${entry.provider_name}`);
        if (entry.start_location) parts.push(`from ${entry.start_location}`);
        if (entry.end_location) parts.push(`to ${entry.end_location}`);
        if (entry.start_datetime) {
          const depTime = new Date(entry.start_datetime).toLocaleString('en-US', {
            month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
          });
          parts.push(`on ${depTime}`);
        }
        if (entry.confirmation_code) parts.push(`Confirmation: ${entry.confirmation_code}`);
        break;
        
      case 'activity':
        parts.push(`${destination} trip activity/reservation`);
        if (entry.provider_name) parts.push(`${entry.provider_name}`);
        if (entry.start_location) parts.push(`at ${entry.start_location}`);
        if (entry.start_datetime) {
          const time = new Date(entry.start_datetime).toLocaleString('en-US', {
            month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
          });
          parts.push(`on ${time}`);
        }
        if (entry.confirmation_code) parts.push(`Confirmation: ${entry.confirmation_code}`);
        break;
    }
    
    if (entry.notes) parts.push(`Notes: ${entry.notes}`);
    
    return parts.join('. ') + '.';
  };

  // Generate embedding for a logistics entry
  const generateEmbedding = async (logisticsId: string, entry: TripLogisticsInsert | TripLogistics) => {
    if (!tripDestination || !tripStartDate) return;
    
    const contentText = generateEmbeddingContent(entry, tripDestination);
    
    try {
      await supabase.functions.invoke('generate-embedding', {
        body: {
          sourceType: 'trip_logistics',
          sourceId: logisticsId,
          contentText,
          activityDate: tripStartDate,
          metadata: {
            trip_id: tripId,
            logistics_type: entry.logistics_type,
            destination: tripDestination,
            confirmation_code: entry.confirmation_code,
            provider_name: entry.provider_name,
          },
        },
      });
    } catch (err) {
      console.error('Failed to generate embedding for trip logistics:', err);
    }
  };

  const addLogistics = useMutation({
    mutationFn: async (entry: Omit<TripLogisticsInsert, 'user_id'>) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { data, error } = await (supabase
        .from('trip_logistics' as any)
        .insert({ ...entry, user_id: user.id })
        .select()
        .single() as any);
      if (error) throw error;
      return data as TripLogistics;
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ['trip_logistics', tripId] });
      toast.success('Logistics added');
      // Generate embedding in background
      generateEmbedding(data.id, data);
    },
    onError: (error: Error) => {
      toast.error(`Failed to add: ${error.message}`);
    },
  });

  const updateLogistics = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: TripLogisticsUpdate }) => {
      const { data, error } = await (supabase
        .from('trip_logistics' as any)
        .update(updates)
        .eq('id', id)
        .select()
        .single() as any);
      if (error) throw error;
      return data as TripLogistics;
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ['trip_logistics', tripId] });
      toast.success('Logistics updated');
      // Regenerate embedding with updated content
      generateEmbedding(data.id, data);
    },
    onError: (error: Error) => {
      toast.error(`Failed to update: ${error.message}`);
    },
  });

  const deleteLogistics = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase
        .from('trip_logistics' as any)
        .delete()
        .eq('id', id) as any);
      if (error) throw error;
      
      // Also delete the embedding
      await supabase
        .from('activity_embeddings')
        .delete()
        .eq('source_type', 'trip_logistics')
        .eq('source_id', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trip_logistics', tripId] });
      toast.success('Logistics removed');
    },
    onError: (error: Error) => {
      toast.error(`Failed to remove: ${error.message}`);
    },
  });

  // Group logistics by type
  const groupedLogistics = logistics.reduce((acc, item) => {
    if (!acc[item.logistics_type]) {
      acc[item.logistics_type] = [];
    }
    acc[item.logistics_type].push(item);
    return acc;
  }, {} as Record<LogisticsType, TripLogistics[]>);

  return {
    logistics,
    groupedLogistics,
    isLoading,
    addLogistics,
    updateLogistics,
    deleteLogistics,
  };
}
