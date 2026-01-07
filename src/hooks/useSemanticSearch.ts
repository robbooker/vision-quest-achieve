import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface SearchOptions {
  limit?: number;
  sourceTypes?: ("journal_entry" | "quick_task" | "habit_log" | "focus_session")[];
  dateRange?: { from: string; to: string };
}

interface SearchResult {
  sourceType: string;
  sourceId: string;
  contentText: string;
  activityDate: string;
  similarity: number;
  metadata: Record<string, unknown>;
}

export function useSemanticSearch() {
  const search = useCallback(async (
    query: string,
    options: SearchOptions = {}
  ): Promise<{ results: SearchResult[]; error?: string }> => {
    try {
      if (!query || query.trim().length < 3) {
        return { results: [] };
      }

      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        return { results: [], error: "Not authenticated" };
      }

      const response = await supabase.functions.invoke("semantic-search", {
        body: {
          query,
          limit: options.limit || 10,
          sourceTypes: options.sourceTypes,
          dateRange: options.dateRange,
        },
      });

      if (response.error) {
        console.error("Semantic search error:", response.error);
        return { results: [], error: response.error.message };
      }

      return { results: response.data?.results || [] };
    } catch (error) {
      console.error("Semantic search failed:", error);
      return { 
        results: [], 
        error: error instanceof Error ? error.message : "Search failed" 
      };
    }
  }, []);

  // Helper to format search results as context for AI
  const formatAsContext = useCallback((results: SearchResult[]): string => {
    if (results.length === 0) return "";

    const grouped: Record<string, SearchResult[]> = {};
    results.forEach(r => {
      if (!grouped[r.sourceType]) grouped[r.sourceType] = [];
      grouped[r.sourceType].push(r);
    });

    const sections: string[] = [];
    
    if (grouped.journal_entry?.length) {
      sections.push("**Past Journal Entries:**\n" + 
        grouped.journal_entry.map(r => `- ${r.activityDate}: ${r.contentText}`).join("\n"));
    }
    
    if (grouped.quick_task?.length) {
      sections.push("**Related Completed Tasks:**\n" + 
        grouped.quick_task.map(r => `- ${r.activityDate}: ${r.contentText}`).join("\n"));
    }
    
    if (grouped.habit_log?.length) {
      sections.push("**Related Habit Completions:**\n" + 
        grouped.habit_log.map(r => `- ${r.activityDate}: ${r.contentText}`).join("\n"));
    }
    
    if (grouped.focus_session?.length) {
      sections.push("**Related Focus Sessions:**\n" + 
        grouped.focus_session.map(r => `- ${r.activityDate}: ${r.contentText}`).join("\n"));
    }

    return sections.join("\n\n");
  }, []);

  return { search, formatAsContext };
}
