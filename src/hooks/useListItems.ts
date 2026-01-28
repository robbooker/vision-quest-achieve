import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

export interface ListItem {
  id: string;
  list_id: string;
  user_id: string;
  content: string;
  link_url: string | null;
  link_title: string | null;
  link_description: string | null;
  link_image: string | null;
  is_completed: boolean;
  position: number;
  created_at: string;
  updated_at: string;
  contributor_id: string | null;
  contributor_name: string | null;
}

export function useListItems(listId: string | undefined) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const itemsQuery = useQuery({
    queryKey: ["list-items", listId],
    queryFn: async () => {
      if (!listId) return [];

      const { data, error } = await supabase
        .from("list_items")
        .select("*")
        .eq("list_id", listId)
        .order("position", { ascending: true });

      if (error) throw error;
      return data as ListItem[];
    },
    enabled: !!listId,
  });

  // Realtime subscription
  useEffect(() => {
    if (!listId) return;

    const channel = supabase
      .channel(`list-items-${listId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "list_items",
          filter: `list_id=eq.${listId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["list-items", listId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [listId, queryClient]);

  const addItem = useMutation({
    mutationFn: async ({ 
      content, 
      linkUrl,
      contributorId,
      contributorName,
    }: { 
      content: string; 
      linkUrl?: string;
      contributorId?: string;
      contributorName?: string;
    }) => {
      if (!user || !listId) throw new Error("Not authenticated or no list");

      // Get max position
      const { data: existingItems } = await supabase
        .from("list_items")
        .select("position")
        .eq("list_id", listId)
        .order("position", { ascending: false })
        .limit(1);

      const nextPosition = existingItems && existingItems.length > 0 ? existingItems[0].position + 1 : 0;

      const { data, error } = await supabase
        .from("list_items")
        .insert({
          list_id: listId,
          user_id: user.id,
          content,
          link_url: linkUrl || null,
          position: nextPosition,
          contributor_id: contributorId || null,
          contributor_name: contributorName || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["list-items", listId] });
      queryClient.invalidateQueries({ queryKey: ["lists"] });
    },
    onError: (error) => {
      toast({ title: "Failed to add item", description: error.message, variant: "destructive" });
    },
  });

  const updateItem = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ListItem> & { id: string }) => {
      const { error } = await supabase
        .from("list_items")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["list-items", listId] });
    },
    onError: (error) => {
      toast({ title: "Failed to update item", description: error.message, variant: "destructive" });
    },
  });

  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("list_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["list-items", listId] });
      queryClient.invalidateQueries({ queryKey: ["lists"] });
    },
    onError: (error) => {
      toast({ title: "Failed to delete item", description: error.message, variant: "destructive" });
    },
  });

  const toggleComplete = useMutation({
    mutationFn: async ({ id, is_completed }: { id: string; is_completed: boolean }) => {
      const { error } = await supabase
        .from("list_items")
        .update({ is_completed })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["list-items", listId] });
    },
  });

  const reorderItems = useMutation({
    mutationFn: async (items: { id: string; position: number }[]) => {
      const updates = items.map(({ id, position }) =>
        supabase.from("list_items").update({ position }).eq("id", id)
      );

      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["list-items", listId] });
    },
  });

  return {
    items: itemsQuery.data || [],
    isLoading: itemsQuery.isLoading,
    addItem,
    updateItem,
    deleteItem,
    toggleComplete,
    reorderItems,
  };
}
