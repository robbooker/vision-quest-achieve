import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface LinkMetadata {
  title: string | null;
  description: string | null;
  image: string | null;
  siteName: string | null;
}

// Simple in-memory cache
const metadataCache = new Map<string, LinkMetadata>();

export function useLinkMetadata() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMetadata = useCallback(async (url: string): Promise<LinkMetadata | null> => {
    // Check cache first
    if (metadataCache.has(url)) {
      return metadataCache.get(url) || null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase.functions.invoke('fetch-link-metadata', {
        body: { url },
      });

      if (fetchError) {
        console.error('Error fetching metadata:', fetchError);
        setError(fetchError.message);
        return null;
      }

      if (data?.success && data?.data) {
        metadataCache.set(url, data.data);
        return data.data as LinkMetadata;
      }

      return null;
    } catch (err) {
      console.error('Error fetching metadata:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch metadata');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { fetchMetadata, isLoading, error };
}

// Utility function to extract URLs from text
const URL_REGEX = /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi;

export function extractUrls(text: string): string[] {
  return text.match(URL_REGEX) || [];
}
