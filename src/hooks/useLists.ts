import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface List {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  slug: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  item_count?: number;
  share_count?: number;
}

function generateSlug(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export function useLists() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const listsQuery = useQuery({
    queryKey: ["lists", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data: lists, error } = await supabase
        .from("lists")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      if (error) throw error;

      // Get item counts
      const listsWithCounts = await Promise.all(
        (lists || []).map(async (list) => {
          const { count: itemCount } = await supabase
            .from("list_items")
            .select("*", { count: "exact", head: true })
            .eq("list_id", list.id);

          const { count: shareCount } = await supabase
            .from("list_shares")
            .select("*", { count: "exact", head: true })
            .eq("list_id", list.id);

          return {
            ...list,
            item_count: itemCount || 0,
            share_count: shareCount || 0,
          };
        })
      );

      return listsWithCounts as List[];
    },
    enabled: !!user,
  });

  const createList = useMutation({
    mutationFn: async ({ title, description }: { title: string; description?: string }) => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("lists")
        .insert({
          user_id: user.id,
          title,
          description: description || null,
          slug: generateSlug(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lists"] });
      toast({ title: "List created" });
    },
    onError: (error) => {
      toast({ title: "Failed to create list", description: error.message, variant: "destructive" });
    },
  });

  const updateList = useMutation({
    mutationFn: async ({ id, title, description, is_public }: { id: string; title?: string; description?: string; is_public?: boolean }) => {
      const updates: Record<string, unknown> = {};
      if (title !== undefined) updates.title = title;
      if (description !== undefined) updates.description = description;
      if (is_public !== undefined) updates.is_public = is_public;

      const { error } = await supabase
        .from("lists")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lists"] });
    },
    onError: (error) => {
      toast({ title: "Failed to update list", description: error.message, variant: "destructive" });
    },
  });

  const deleteList = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("lists").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lists"] });
      toast({ title: "List deleted" });
    },
    onError: (error) => {
      toast({ title: "Failed to delete list", description: error.message, variant: "destructive" });
    },
  });

  return {
    lists: listsQuery.data || [],
    isLoading: listsQuery.isLoading,
    createList,
    updateList,
    deleteList,
  };
}

export function useList(id: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["list", id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from("lists")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as List;
    },
    enabled: !!id && !!user,
  });
}
