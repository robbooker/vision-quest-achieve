import { useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";

interface ToastCallback {
  (notification: { title: string; message: string; type: string }): void;
}

export function useSharedNotesRealtime(onToast: ToastCallback) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const onToastRef = useRef(onToast);
  
  useEffect(() => {
    onToastRef.current = onToast;
  }, [onToast]);

  const fetchContributorName = useCallback(async (contributorId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("display_name, email")
      .eq("user_id", contributorId)
      .single();
    return data?.display_name || data?.email || "Someone";
  }, []);

  useEffect(() => {
    if (!user) return;

    // Listen for new items added to lists that the user owns
    const listItemsChannel = supabase
      .channel("shared-notes-items-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "list_items",
        },
        async (payload) => {
          const newItem = payload.new as { 
            list_id: string; 
            contributor_id: string | null;
            contributor_name: string | null;
            content: string;
            user_id: string;
          };
          
          // Only notify if item was added by someone else (contributor)
          if (!newItem.contributor_id || newItem.contributor_id === user.id) {
            return;
          }

          // Check if this list belongs to the current user
          const { data: list } = await supabase
            .from("lists")
            .select("title, user_id")
            .eq("id", newItem.list_id)
            .single();

          if (list && list.user_id === user.id) {
            const contributorName = newItem.contributor_name || await fetchContributorName(newItem.contributor_id);
            
            // Mark the list as having updates in localStorage
            const updatedNotes = JSON.parse(localStorage.getItem("updated_notes") || "{}");
            updatedNotes[newItem.list_id] = new Date().toISOString();
            localStorage.setItem("updated_notes", JSON.stringify(updatedNotes));

            // Show toast
            onToastRef.current({
              title: "Note updated",
              message: `${contributorName} added to "${list.title}"`,
              type: "note_updated",
            });

            // Invalidate lists query
            queryClient.invalidateQueries({ queryKey: ["lists"] });
            queryClient.invalidateQueries({ queryKey: ["list-items", newItem.list_id] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(listItemsChannel);
    };
  }, [user, queryClient, fetchContributorName]);
}

// Hook to check if a note has updates
export function useNoteHasUpdates(listId: string): boolean {
  const lastViewed = localStorage.getItem(`note_viewed_${listId}`);
  const updatedNotes = JSON.parse(localStorage.getItem("updated_notes") || "{}");
  const lastUpdate = updatedNotes[listId];
  
  if (!lastUpdate) return false;
  if (!lastViewed) return true;
  
  return new Date(lastUpdate) > new Date(lastViewed);
}

// Mark a note as viewed
export function markNoteAsViewed(listId: string) {
  localStorage.setItem(`note_viewed_${listId}`, new Date().toISOString());
  
  // Remove from updated notes
  const updatedNotes = JSON.parse(localStorage.getItem("updated_notes") || "{}");
  delete updatedNotes[listId];
  localStorage.setItem("updated_notes", JSON.stringify(updatedNotes));
}
