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
  pillar: string | null;
  goal_id: string | null;
  focus_session_id: string | null;
  created_at: string;
  updated_at: string;
  item_count?: number;
  share_count?: number;
  // Joined data
  goal_title?: string;
  focus_objective?: string;
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

      // Get item counts and related data
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

          // Get goal title if linked
          let goal_title: string | undefined;
          if (list.goal_id) {
            const { data: goal } = await supabase
              .from("goals")
              .select("title")
              .eq("id", list.goal_id)
              .maybeSingle();
            goal_title = goal?.title;
          }

          // Get focus session objective if linked
          let focus_objective: string | undefined;
          if (list.focus_session_id) {
            const { data: session } = await supabase
              .from("focus_sessions")
              .select("objective")
              .eq("id", list.focus_session_id)
              .maybeSingle();
            focus_objective = session?.objective;
          }

          return {
            ...list,
            item_count: itemCount || 0,
            share_count: shareCount || 0,
            goal_title,
            focus_objective,
          };
        })
      );

      return listsWithCounts as List[];
    },
    enabled: !!user,
  });

  const createList = useMutation({
    mutationFn: async ({ 
      title, 
      description,
      pillar,
      goal_id,
      focus_session_id,
    }: { 
      title: string; 
      description?: string;
      pillar?: string;
      goal_id?: string;
      focus_session_id?: string;
    }) => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("lists")
        .insert({
          user_id: user.id,
          title,
          description: description || null,
          slug: generateSlug(),
          pillar: pillar || null,
          goal_id: goal_id || null,
          focus_session_id: focus_session_id || null,
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
    mutationFn: async ({ 
      id, 
      title, 
      description, 
      is_public,
      pillar,
      goal_id,
      focus_session_id,
    }: { 
      id: string; 
      title?: string; 
      description?: string; 
      is_public?: boolean;
      pillar?: string | null;
      goal_id?: string | null;
      focus_session_id?: string | null;
    }) => {
      const updates: Record<string, unknown> = {};
      if (title !== undefined) updates.title = title;
      if (description !== undefined) updates.description = description;
      if (is_public !== undefined) updates.is_public = is_public;
      if (pillar !== undefined) updates.pillar = pillar;
      if (goal_id !== undefined) updates.goal_id = goal_id;
      if (focus_session_id !== undefined) updates.focus_session_id = focus_session_id;

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
