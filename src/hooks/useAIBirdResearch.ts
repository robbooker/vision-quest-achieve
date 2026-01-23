import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useAIBirdResearch(species: string) {
  const [research, setResearch] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchResearch = useCallback(async () => {
    if (!species) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('bird-ai-research', {
        body: { species },
      });

      if (error) throw error;
      
      setResearch(data.research);
    } catch (error) {
      console.error('Error fetching bird research:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch AI research',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [species, toast]);

  const identifyBird = useCallback(async (imageUrl: string): Promise<string[]> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('bird-ai-research', {
        body: { action: 'identify', imageUrl },
      });

      if (error) throw error;
      
      return data.suggestions || [];
    } catch (error) {
      console.error('Error identifying bird:', error);
      toast({
        title: 'Error',
        description: 'Failed to identify bird',
        variant: 'destructive',
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  return {
    research,
    isLoading,
    fetchResearch,
    identifyBird,
  };
}
