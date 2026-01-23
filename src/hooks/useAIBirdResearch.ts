import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UseAIBirdResearchOptions {
  cachedResearch?: string | null;
  cachedAt?: string | null;
  previousResearch?: string | null;
  onSave?: (research: string) => Promise<void>;
}

export function useAIBirdResearch(
  species: string, 
  options: UseAIBirdResearchOptions = {}
) {
  const { cachedResearch, cachedAt, previousResearch, onSave } = options;
  
  const [research, setResearch] = useState<string | null>(cachedResearch || null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(!!cachedResearch);
  const [savedAt, setSavedAt] = useState<string | null>(cachedAt || null);
  const [hasPrevious, setHasPrevious] = useState(!!previousResearch);
  const [previousContent, setPreviousContent] = useState<string | null>(previousResearch || null);
  const { toast } = useToast();

  // Update state when cached data changes
  useEffect(() => {
    if (cachedResearch) {
      setResearch(cachedResearch);
      setIsSaved(true);
      setSavedAt(cachedAt || null);
    }
    if (previousResearch) {
      setHasPrevious(true);
      setPreviousContent(previousResearch);
    }
  }, [cachedResearch, cachedAt, previousResearch]);

  const fetchResearch = useCallback(async () => {
    if (!species) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('bird-ai-research', {
        body: { species },
      });

      if (error) throw error;
      
      setResearch(data.research);
      setIsSaved(false);
      return data.research;
    } catch (error) {
      console.error('Error fetching bird research:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch AI research',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [species, toast]);

  const regenerate = useCallback(async () => {
    // When regenerating, the current research becomes the previous
    if (research && isSaved) {
      setPreviousContent(research);
      setHasPrevious(true);
    }
    
    const newResearch = await fetchResearch();
    if (newResearch) {
      setIsSaved(false);
    }
    return newResearch;
  }, [fetchResearch, research, isSaved]);

  const saveResearch = useCallback(async () => {
    if (!research || !onSave) return;
    
    try {
      await onSave(research);
      setIsSaved(true);
      setSavedAt(new Date().toISOString());
      toast({
        title: 'Research saved!',
        description: 'AI research has been saved to your notes.',
      });
    } catch (error) {
      console.error('Error saving research:', error);
      toast({
        title: 'Error',
        description: 'Failed to save research',
        variant: 'destructive',
      });
    }
  }, [research, onSave, toast]);

  const restorePrevious = useCallback(() => {
    if (previousContent) {
      setResearch(previousContent);
      setIsSaved(false);
      toast({
        title: 'Previous version restored',
        description: 'You can save this version or regenerate again.',
      });
    }
  }, [previousContent, toast]);

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
    isSaved,
    savedAt,
    hasPrevious,
    fetchResearch,
    regenerate,
    saveResearch,
    restorePrevious,
    identifyBird,
  };
}
