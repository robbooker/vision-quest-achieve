import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface Trip {
  id: string;
  user_id: string;
  destination: string;
  start_date: string;
  end_date: string;
  purpose: string;
  attendees: string[];
  planned_activities: string | null;
  created_at: string;
  updated_at: string;
}

export interface MasterItem {
  id: string;
  user_id: string;
  item_name: string;
  category: string;
  default_carry: boolean;
  created_at: string;
  updated_at: string;
}

export interface PackingListItem {
  id: string;
  trip_id: string;
  master_item_id: string | null;
  user_id: string;
  item_name: string;
  category: string;
  quantity: number;
  is_packed: boolean;
  is_ai_suggested: boolean;
  created_at: string;
  updated_at: string;
}

export function useTrips() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: trips = [], isLoading: tripsLoading } = useQuery({
    queryKey: ['trips', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await (supabase
        .from('trips' as any)
        .select('*')
        .eq('user_id', user.id)
        .order('start_date', { ascending: true }) as any);
      if (error) throw error;
      return (data || []) as Trip[];
    },
    enabled: !!user?.id,
  });

  const { data: masterItems = [], isLoading: masterItemsLoading } = useQuery({
    queryKey: ['master_items', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await (supabase
        .from('master_items' as any)
        .select('*')
        .eq('user_id', user.id)
        .order('category', { ascending: true }) as any);
      if (error) throw error;
      return (data || []) as MasterItem[];
    },
    enabled: !!user?.id,
  });

  const createTrip = useMutation({
    mutationFn: async (trip: Omit<Trip, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { data, error } = await (supabase
        .from('trips' as any)
        .insert({ ...trip, user_id: user.id })
        .select()
        .single() as any);
      if (error) throw error;
      return data as Trip;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
    },
  });

  const deleteTrip = useMutation({
    mutationFn: async (tripId: string) => {
      const { error } = await (supabase
        .from('trips' as any)
        .delete()
        .eq('id', tripId) as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      toast.success('Trip deleted');
    },
  });

  const addMasterItem = useMutation({
    mutationFn: async (item: { item_name: string; category: string; default_carry?: boolean }) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { data, error } = await (supabase
        .from('master_items' as any)
        .insert({ ...item, user_id: user.id })
        .select()
        .single() as any);
      if (error) throw error;
      return data as MasterItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['master_items'] });
      toast.success('Added to Master Locker');
    },
  });

  const deleteMasterItem = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await (supabase
        .from('master_items' as any)
        .delete()
        .eq('id', itemId) as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['master_items'] });
    },
  });

  return {
    trips,
    masterItems,
    tripsLoading,
    masterItemsLoading,
    createTrip,
    deleteTrip,
    addMasterItem,
    deleteMasterItem,
  };
}

export function usePackingList(tripId: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: packingList = [], isLoading } = useQuery({
    queryKey: ['packing_list', tripId],
    queryFn: async () => {
      if (!tripId || !user?.id) return [];
      const { data, error } = await (supabase
        .from('trip_packing_list' as any)
        .select('*')
        .eq('trip_id', tripId)
        .order('category', { ascending: true }) as any);
      if (error) throw error;
      return (data || []) as PackingListItem[];
    },
    enabled: !!tripId && !!user?.id,
  });

  const addPackingItems = useMutation({
    mutationFn: async (items: Omit<PackingListItem, 'id' | 'created_at' | 'updated_at'>[]) => {
      const { error } = await (supabase
        .from('trip_packing_list' as any)
        .insert(items) as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packing_list', tripId] });
    },
  });

  const togglePacked = useMutation({
    mutationFn: async ({ itemId, isPacked }: { itemId: string; isPacked: boolean }) => {
      const { error } = await (supabase
        .from('trip_packing_list' as any)
        .update({ is_packed: isPacked })
        .eq('id', itemId) as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packing_list', tripId] });
    },
  });

  const deletePackingItem = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await (supabase
        .from('trip_packing_list' as any)
        .delete()
        .eq('id', itemId) as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packing_list', tripId] });
    },
  });

  const updateQuantity = useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: string; quantity: number }) => {
      const { error } = await (supabase
        .from('trip_packing_list' as any)
        .update({ quantity })
        .eq('id', itemId) as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packing_list', tripId] });
    },
  });

  const packedCount = packingList.filter(item => item.is_packed).length;
  const totalCount = packingList.length;
  const progressPercent = totalCount > 0 ? Math.round((packedCount / totalCount) * 100) : 0;

  return {
    packingList,
    isLoading,
    addPackingItems,
    togglePacked,
    deletePackingItem,
    updateQuantity,
    packedCount,
    totalCount,
    progressPercent,
  };
}
