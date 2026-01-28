import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface ListShare {
  id: string;
  list_id: string;
  shared_by_id: string;
  phone_number: string;
  access_token: string;
  sms_sent_at: string | null;
  first_viewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useListShares(listId: string | undefined) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const sharesQuery = useQuery({
    queryKey: ["list-shares", listId],
    queryFn: async () => {
      if (!listId) return [];

      const { data, error } = await supabase
        .from("list_shares")
        .select("*")
        .eq("list_id", listId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ListShare[];
    },
    enabled: !!listId && !!user,
  });

  const shareList = useMutation({
    mutationFn: async ({ phoneNumber }: { phoneNumber: string }) => {
      if (!user || !listId) throw new Error("Not authenticated or no list");

      // Format phone number to E.164
      const formattedPhone = phoneNumber.replace(/\D/g, "");
      const e164Phone = formattedPhone.startsWith("1") ? `+${formattedPhone}` : `+1${formattedPhone}`;

      // Create share record
      const { data: share, error: shareError } = await supabase
        .from("list_shares")
        .insert({
          list_id: listId,
          shared_by_id: user.id,
          phone_number: e164Phone,
        })
        .select()
        .single();

      if (shareError) throw shareError;

      // Send SMS via edge function
      const { error: smsError } = await supabase.functions.invoke("share-list-sms", {
        body: { list_id: listId, share_id: share.id },
      });

      if (smsError) {
        console.error("SMS send error:", smsError);
        // Don't throw - share was created, SMS just didn't send
        toast({ 
          title: "Share created", 
          description: "SMS could not be sent. Share the link manually.",
          variant: "default"
        });
      }

      return share;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["list-shares", listId] });
      queryClient.invalidateQueries({ queryKey: ["lists"] });
      toast({ title: "List shared!" });
    },
    onError: (error) => {
      toast({ title: "Failed to share list", description: error.message, variant: "destructive" });
    },
  });

  const deleteShare = useMutation({
    mutationFn: async (shareId: string) => {
      const { error } = await supabase.from("list_shares").delete().eq("id", shareId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["list-shares", listId] });
      queryClient.invalidateQueries({ queryKey: ["lists"] });
      toast({ title: "Share removed" });
    },
    onError: (error) => {
      toast({ title: "Failed to remove share", description: error.message, variant: "destructive" });
    },
  });

  return {
    shares: sharesQuery.data || [],
    isLoading: sharesQuery.isLoading,
    shareList,
    deleteShare,
  };
}

// Hook for public list view (by access token)
export function usePublicListByToken(accessToken: string | undefined) {
  return useQuery({
    queryKey: ["public-list", accessToken],
    queryFn: async () => {
      if (!accessToken) return null;

      // Get share by token
      const { data: share, error: shareError } = await supabase
        .from("list_shares")
        .select("*, lists(*)")
        .eq("access_token", accessToken)
        .single();

      if (shareError) throw shareError;

      // Mark as viewed if first time
      if (!share.first_viewed_at) {
        await supabase
          .from("list_shares")
          .update({ first_viewed_at: new Date().toISOString() })
          .eq("id", share.id);
      }

      // Get list items
      const { data: items, error: itemsError } = await supabase
        .from("list_items")
        .select("*")
        .eq("list_id", share.list_id)
        .order("position", { ascending: true });

      if (itemsError) throw itemsError;

      return {
        share,
        list: share.lists as any,
        items: items || [],
      };
    },
    enabled: !!accessToken,
  });
}
