import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useActivityEmbeddings } from '@/hooks/useActivityEmbeddings';

export interface BirdSighting {
  id: string;
  user_id: string;
  species_name: string;
  sighting_date: string;
  sighting_time: string | null;
  location_name: string | null;
  latitude: number | null;
  longitude: number | null;
  behavior_notes: string | null;
  field_marks: string | null;
  created_at: string;
  updated_at: string;
  photos?: BirdSightingPhoto[];
}

export interface BirdSightingPhoto {
  id: string;
  sighting_id: string;
  user_id: string;
  photo_url: string;
  created_at: string;
}

export interface BirdWishlistItem {
  id: string;
  user_id: string;
  species_name: string;
  notes: string | null;
  priority: number;
  created_at: string;
  updated_at: string;
}

export interface BirdSpeciesNotes {
  id: string;
  user_id: string;
  species_name: string;
  personal_notes: string | null;
  ai_research_cache: string | null;
  ai_research_fetched_at: string | null;
  ai_research_previous: string | null;
  created_at: string;
  updated_at: string;
}

export interface SightingFormData {
  species_name: string;
  sighting_date: string;
  sighting_time?: string;
  location_name?: string;
  latitude?: number;
  longitude?: number;
  behavior_notes?: string;
  field_marks?: string;
}

export function useBirdwatching() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { embedBirdSighting } = useActivityEmbeddings();

  // Fetch all sightings
  const { data: sightings = [], isLoading: sightingsLoading } = useQuery({
    queryKey: ['bird-sightings', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('bird_sightings')
        .select('*')
        .eq('user_id', user.id)
        .order('sighting_date', { ascending: false });
      if (error) throw error;
      return data as BirdSighting[];
    },
    enabled: !!user,
  });

  // Fetch photos for all sightings
  const { data: allPhotos = [] } = useQuery({
    queryKey: ['bird-sighting-photos', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('bird_sighting_photos')
        .select('*')
        .eq('user_id', user.id);
      if (error) throw error;
      return data as BirdSightingPhoto[];
    },
    enabled: !!user,
  });

  // Fetch wishlist
  const { data: wishlist = [], isLoading: wishlistLoading } = useQuery({
    queryKey: ['bird-wishlist', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('bird_wishlist')
        .select('*')
        .eq('user_id', user.id)
        .order('priority', { ascending: false });
      if (error) throw error;
      return data as BirdWishlistItem[];
    },
    enabled: !!user,
  });

  // Fetch species notes
  const { data: speciesNotes = [] } = useQuery({
    queryKey: ['bird-species-notes', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('bird_species_notes')
        .select('*')
        .eq('user_id', user.id);
      if (error) throw error;
      return data as BirdSpeciesNotes[];
    },
    enabled: !!user,
  });

  // Calculate life list (unique species) - memoized to prevent recalculation on every render
  const lifeList = useMemo(() => {
    return [...new Set(sightings.map(s => s.species_name))].map(species => {
      const speciesSightings = sightings.filter(s => s.species_name === species);
      const firstSighting = speciesSightings[speciesSightings.length - 1];
      const lastSighting = speciesSightings[0];
      return {
        species,
        count: speciesSightings.length,
        firstSeen: firstSighting?.sighting_date,
        lastSeen: lastSighting?.sighting_date,
        isNew: speciesSightings.length === 1 && 
          new Date(firstSighting?.created_at).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000, // Within last 7 days
      };
    }).sort((a, b) => a.species.localeCompare(b.species));
  }, [sightings]);

  // Calculate stats - memoized
  const stats = useMemo(() => ({
    totalSpecies: lifeList.length,
    totalSightings: sightings.length,
    mostFrequentBird: lifeList.reduce((max, bird) => bird.count > (max?.count || 0) ? bird : max, null as typeof lifeList[0] | null),
    thisMonth: sightings.filter(s => {
      const date = new Date(s.sighting_date);
      const now = new Date();
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).length,
    thisYear: sightings.filter(s => new Date(s.sighting_date).getFullYear() === new Date().getFullYear()).length,
  }), [sightings, lifeList]);

  // Get seasonal data (which months each species has been spotted) - memoized
  const seasonalData = useMemo(() => {
    return lifeList.map(bird => {
      const months = new Array(12).fill(0);
      sightings
        .filter(s => s.species_name === bird.species)
        .forEach(s => {
          const month = new Date(s.sighting_date).getMonth();
          months[month]++;
        });
      return { species: bird.species, months };
    });
  }, [sightings, lifeList]);

  // Add sighting mutation
  const addSighting = useMutation({
    mutationFn: async (data: SightingFormData) => {
      if (!user) throw new Error('Not authenticated');
      
      // Check if this is a first sighting of a wishlisted bird
      const isWishlisted = wishlist.some(w => w.species_name.toLowerCase() === data.species_name.toLowerCase());
      const isFirstSighting = !lifeList.some(l => l.species.toLowerCase() === data.species_name.toLowerCase());

      const { data: sighting, error } = await supabase
        .from('bird_sightings')
        .insert({
          user_id: user.id,
          species_name: data.species_name,
          sighting_date: data.sighting_date,
          sighting_time: data.sighting_time || null,
          location_name: data.location_name || null,
          latitude: data.latitude || null,
          longitude: data.longitude || null,
          behavior_notes: data.behavior_notes || null,
          field_marks: data.field_marks || null,
        })
        .select()
        .single();

      if (error) throw error;

      // If wishlisted, remove from wishlist
      if (isWishlisted) {
        await supabase
          .from('bird_wishlist')
          .delete()
          .eq('user_id', user.id)
          .ilike('species_name', data.species_name);
      }

      return { sighting, isWishlisted, isFirstSighting };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['bird-sightings'] });
      queryClient.invalidateQueries({ queryKey: ['bird-wishlist'] });
      
      // Generate embedding for the sighting
      embedBirdSighting(result.sighting).catch(console.error);
      
      if (result.isWishlisted && result.isFirstSighting) {
        toast({
          title: '🎉 Wishlist bird spotted!',
          description: `Congratulations! You spotted ${result.sighting.species_name} for the first time!`,
        });
      } else if (result.isFirstSighting) {
        toast({
          title: '🆕 New species!',
          description: `${result.sighting.species_name} added to your life list!`,
        });
      } else {
        toast({
          title: 'Sighting logged',
          description: result.sighting.species_name,
        });
      }
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to log sighting', variant: 'destructive' });
    },
  });

  // Update sighting mutation
  const updateSighting = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<SightingFormData> }) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data: sighting, error } = await supabase
        .from('bird_sightings')
        .update({
          species_name: data.species_name,
          sighting_date: data.sighting_date,
          sighting_time: data.sighting_time || null,
          location_name: data.location_name || null,
          latitude: data.latitude || null,
          longitude: data.longitude || null,
          behavior_notes: data.behavior_notes || null,
          field_marks: data.field_marks || null,
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      return sighting;
    },
    onSuccess: (sighting) => {
      queryClient.invalidateQueries({ queryKey: ['bird-sightings'] });
      
      // Update embedding for the sighting
      embedBirdSighting(sighting).catch(console.error);
      
      toast({ title: 'Sighting updated', description: sighting.species_name });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to update sighting', variant: 'destructive' });
    },
  });

  // Delete sighting mutation
  const deleteSighting = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('bird_sightings').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bird-sightings'] });
      toast({ title: 'Sighting deleted' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to delete sighting', variant: 'destructive' });
    },
  });

  // Add to wishlist mutation
  const addToWishlist = useMutation({
    mutationFn: async (data: { species_name: string; notes?: string; priority?: number }) => {
      if (!user) throw new Error('Not authenticated');
      const { data: item, error } = await supabase
        .from('bird_wishlist')
        .insert({
          user_id: user.id,
          species_name: data.species_name,
          notes: data.notes || null,
          priority: data.priority || 0,
        })
        .select()
        .single();
      if (error) throw error;
      return item;
    },
    onSuccess: (item) => {
      queryClient.invalidateQueries({ queryKey: ['bird-wishlist'] });
      toast({ title: 'Added to wishlist', description: item.species_name });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to add to wishlist', variant: 'destructive' });
    },
  });

  // Remove from wishlist mutation
  const removeFromWishlist = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('bird_wishlist').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bird-wishlist'] });
      toast({ title: 'Removed from wishlist' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to remove from wishlist', variant: 'destructive' });
    },
  });

  // Upload photo mutation
  const uploadPhoto = useMutation({
    mutationFn: async ({ sightingId, file }: { sightingId: string; file: File }) => {
      if (!user) throw new Error('Not authenticated');
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${sightingId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('bird-photos')
        .upload(fileName, file);
      
      if (uploadError) throw uploadError;
      
      const { data: urlData } = supabase.storage.from('bird-photos').getPublicUrl(fileName);
      
      const { data: photo, error } = await supabase
        .from('bird_sighting_photos')
        .insert({
          sighting_id: sightingId,
          user_id: user.id,
          photo_url: urlData.publicUrl,
        })
        .select()
        .single();
      
      if (error) throw error;
      return photo;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bird-sighting-photos'] });
      toast({ title: 'Photo uploaded' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to upload photo', variant: 'destructive' });
    },
  });

  // Save species notes mutation
  const saveSpeciesNotes = useMutation({
    mutationFn: async ({ species_name, personal_notes }: { species_name: string; personal_notes: string }) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('bird_species_notes')
        .upsert({
          user_id: user.id,
          species_name,
          personal_notes,
        }, { onConflict: 'user_id,species_name' })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bird-species-notes'] });
      toast({ title: 'Notes saved' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to save notes', variant: 'destructive' });
    },
  });

  // Save AI research mutation
  const saveAIResearch = useMutation({
    mutationFn: async ({ species_name, research }: { species_name: string; research: string }) => {
      if (!user) throw new Error('Not authenticated');
      
      // First get the current cached research to save as previous
      const existing = speciesNotes.find(n => n.species_name.toLowerCase() === species_name.toLowerCase());
      
      const { data, error } = await supabase
        .from('bird_species_notes')
        .upsert({
          user_id: user.id,
          species_name,
          ai_research_cache: research,
          ai_research_fetched_at: new Date().toISOString(),
          ai_research_previous: existing?.ai_research_cache || null,
        }, { onConflict: 'user_id,species_name' })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bird-species-notes'] });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to save AI research', variant: 'destructive' });
    },
  });

  // Get photos for a specific sighting
  const getPhotosForSighting = (sightingId: string) => {
    return allPhotos.filter(p => p.sighting_id === sightingId);
  };

  // Get notes for a specific species
  const getNotesForSpecies = (speciesName: string) => {
    return speciesNotes.find(n => n.species_name.toLowerCase() === speciesName.toLowerCase());
  };

  // Get sightings by date for calendar view
  const getSightingsByDate = () => {
    const byDate: Record<string, BirdSighting[]> = {};
    sightings.forEach(s => {
      if (!byDate[s.sighting_date]) {
        byDate[s.sighting_date] = [];
      }
      byDate[s.sighting_date].push(s);
    });
    return byDate;
  };

  return {
    sightings,
    sightingsLoading,
    wishlist,
    wishlistLoading,
    lifeList,
    stats,
    seasonalData,
    speciesNotes,
    allPhotos,
    addSighting,
    updateSighting,
    deleteSighting,
    addToWishlist,
    removeFromWishlist,
    uploadPhoto,
    saveSpeciesNotes,
    saveAIResearch,
    getPhotosForSighting,
    getNotesForSpecies,
    getSightingsByDate,
  };
}
