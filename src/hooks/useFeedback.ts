import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

export type FeedbackCategory = 'bug_report' | 'feature_request' | 'general_feedback';
export type FeedbackStatus = 'pending' | 'under_review' | 'planned' | 'in_progress' | 'completed' | 'wont_do';
export type FeedbackPriority = 'low' | 'medium' | 'high';

export interface Feedback {
  id: string;
  user_id: string;
  category: FeedbackCategory;
  title: string;
  description: string | null;
  status: FeedbackStatus;
  priority: FeedbackPriority;
  admin_notes: string | null;
  added_to_tasks: boolean;
  quick_task_id: string | null;
  created_at: string;
  updated_at: string;
  vote_count?: number;
  user_voted?: boolean;
  user_email?: string;
}

export interface FeedbackVote {
  id: string;
  feedback_id: string;
  user_id: string;
  created_at: string;
}

export type SortOption = 'recent' | 'votes' | 'category' | 'status';
export type FilterOption = 'all' | 'bug_report' | 'feature_request' | 'general_feedback' | 'my_submissions';

export function useFeedback() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all feedback with vote counts
  const feedbackQuery = useQuery({
    queryKey: ["feedback"],
    queryFn: async () => {
      const { data: feedbackData, error: feedbackError } = await supabase
        .from("feedback")
        .select("*")
        .order("created_at", { ascending: false });

      if (feedbackError) throw feedbackError;

      // Get vote counts for each feedback
      const { data: votesData, error: votesError } = await supabase
        .from("feedback_votes")
        .select("feedback_id, user_id");

      if (votesError) throw votesError;

      // Get user emails from profiles
      const userIds = [...new Set((feedbackData || []).map(f => f.user_id))];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("user_id, email")
        .in("user_id", userIds);

      const profileMap = new Map((profilesData || []).map(p => [p.user_id, p.email]));

      // Count votes per feedback and check if current user voted
      const voteCountMap = new Map<string, number>();
      const userVotedMap = new Map<string, boolean>();

      (votesData || []).forEach(vote => {
        voteCountMap.set(vote.feedback_id, (voteCountMap.get(vote.feedback_id) || 0) + 1);
        if (vote.user_id === user?.id) {
          userVotedMap.set(vote.feedback_id, true);
        }
      });

      return (feedbackData || []).map(feedback => ({
        ...feedback,
        vote_count: voteCountMap.get(feedback.id) || 0,
        user_voted: userVotedMap.get(feedback.id) || false,
        user_email: profileMap.get(feedback.user_id) || 'Unknown',
      })) as Feedback[];
    },
  });

  // Subscribe to realtime updates
  useEffect(() => {
    const feedbackChannel = supabase
      .channel("feedback-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "feedback" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["feedback"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "feedback_votes" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["feedback"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(feedbackChannel);
    };
  }, [queryClient]);

  // Create feedback
  const createFeedback = useMutation({
    mutationFn: async (data: { category: FeedbackCategory; title: string; description?: string }) => {
      if (!user) throw new Error("Not authenticated");
      
      const { error } = await supabase.from("feedback").insert([{
        user_id: user.id,
        category: data.category,
        title: data.title,
        description: data.description,
      }]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feedback"] });
    },
  });

  // Vote on feedback
  const toggleVote = useMutation({
    mutationFn: async (feedbackId: string) => {
      if (!user) throw new Error("Not authenticated");

      // Check if already voted
      const { data: existingVote } = await supabase
        .from("feedback_votes")
        .select("id")
        .eq("feedback_id", feedbackId)
        .eq("user_id", user.id)
        .single();

      if (existingVote) {
        // Remove vote
        const { error } = await supabase
          .from("feedback_votes")
          .delete()
          .eq("id", existingVote.id);
        if (error) throw error;
      } else {
        // Add vote
        const { error } = await supabase
          .from("feedback_votes")
          .insert([{ feedback_id: feedbackId, user_id: user.id }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feedback"] });
    },
  });

  // Admin: Update feedback status
  const updateStatus = useMutation({
    mutationFn: async ({ feedbackId, status }: { feedbackId: string; status: FeedbackStatus }) => {
      const { error } = await supabase
        .from("feedback")
        .update({ status })
        .eq("id", feedbackId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feedback"] });
    },
  });

  // Admin: Update feedback priority
  const updatePriority = useMutation({
    mutationFn: async ({ feedbackId, priority }: { feedbackId: string; priority: FeedbackPriority }) => {
      const { error } = await supabase
        .from("feedback")
        .update({ priority })
        .eq("id", feedbackId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feedback"] });
    },
  });

  // Admin: Update admin notes
  const updateAdminNotes = useMutation({
    mutationFn: async ({ feedbackId, adminNotes }: { feedbackId: string; adminNotes: string }) => {
      const { error } = await supabase
        .from("feedback")
        .update({ admin_notes: adminNotes })
        .eq("id", feedbackId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feedback"] });
    },
  });

  // Admin: Add to task list
  const addToTaskList = useMutation({
    mutationFn: async (feedback: Feedback) => {
      if (!user) throw new Error("Not authenticated");

      // Create a quick task
      const { data: task, error: taskError } = await supabase
        .from("quick_tasks")
        .insert([{
          user_id: user.id,
          title: `[Feedback] ${feedback.title}`,
          category: "personal",
        }])
        .select()
        .single();

      if (taskError) throw taskError;

      // Update feedback to mark as added to tasks
      const { error: updateError } = await supabase
        .from("feedback")
        .update({ 
          added_to_tasks: true, 
          quick_task_id: task.id 
        })
        .eq("id", feedback.id);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feedback"] });
      queryClient.invalidateQueries({ queryKey: ["quickTasks"] });
    },
  });

  // Admin: Reply to user (creates notification)
  const replyToUser = useMutation({
    mutationFn: async ({ feedback, message }: { feedback: Feedback; message: string }) => {
      const { error } = await supabase.from("notifications").insert([{
        user_id: feedback.user_id,
        type: "feedback_reply",
        title: "Reply to your feedback",
        message: message,
        metadata: { feedback_id: feedback.id, feedback_title: feedback.title },
      }]);

      if (error) throw error;
    },
  });

  // Admin: Delete feedback
  const deleteFeedback = useMutation({
    mutationFn: async (feedbackId: string) => {
      const { error } = await supabase
        .from("feedback")
        .delete()
        .eq("id", feedbackId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feedback"] });
    },
  });

  return {
    feedback: feedbackQuery.data ?? [],
    isLoading: feedbackQuery.isLoading,
    createFeedback,
    toggleVote,
    updateStatus,
    updatePriority,
    updateAdminNotes,
    addToTaskList,
    replyToUser,
    deleteFeedback,
    userId: user?.id,
  };
}
