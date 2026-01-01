import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[notification-scheduler] Starting scheduler run");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const now = new Date();
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

    // Get all users with push subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from("push_subscriptions")
      .select("user_id")
      .order("user_id");

    if (subError) {
      console.error("[notification-scheduler] Error fetching subscriptions:", subError);
      return new Response(JSON.stringify({ error: "Failed to fetch subscriptions" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userIds = [...new Set(subscriptions?.map(s => s.user_id) || [])];
    console.log("[notification-scheduler] Processing", userIds.length, "users");

    let notificationsSent = 0;

    for (const userId of userIds) {
      // Get user's notification preferences
      const { data: prefs } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (!prefs) continue;

      // Check for start-of-block notifications
      if (prefs.start_of_block) {
        const { data: upcomingTasks } = await supabase
          .from("task_instances")
          .select("id, title, scheduled_start")
          .eq("user_id", userId)
          .gte("scheduled_start", now.toISOString())
          .lte("scheduled_start", fiveMinutesFromNow.toISOString())
          .eq("status", "pending");

        for (const task of upcomingTasks || []) {
          // Check if we already sent this notification
          const { data: existing } = await supabase
            .from("scheduled_notifications")
            .select("id")
            .eq("user_id", userId)
            .eq("notification_type", "start_of_block")
            .eq("reference_id", task.id)
            .single();

          if (!existing) {
            // Send notification
            const response = await supabase.functions.invoke("send-push-notification", {
              body: {
                user_id: userId,
                title: "Focus Time",
                body: `Your task "${task.title}" starts now`,
                url: "/today",
              },
            });

            if (!response.error) {
              // Record that we sent this
              await supabase.from("scheduled_notifications").insert({
                user_id: userId,
                notification_type: "start_of_block",
                reference_id: task.id,
                scheduled_for: task.scheduled_start,
                sent_at: now.toISOString(),
              });
              notificationsSent++;
            }
          }
        }
      }

      // Check for weekly review notifications (Friday at user's preferred time)
      if (prefs.weekly_review) {
        const dayOfWeek = now.getDay();
        const hour = now.getHours();

        if (dayOfWeek === prefs.review_day && hour === prefs.review_hour) {
          // Get current active cycle
          const { data: cycle } = await supabase
            .from("cycles")
            .select("id")
            .eq("user_id", userId)
            .eq("status", "active")
            .single();

          if (cycle) {
            // Check if review already exists for this week
            const startOfCycle = await supabase
              .from("cycles")
              .select("start_date")
              .eq("id", cycle.id)
              .single();

            const cycleStart = new Date(startOfCycle.data?.start_date || now);
            const weekNumber = Math.ceil((now.getTime() - cycleStart.getTime()) / (7 * 24 * 60 * 60 * 1000));

            const { data: existingReview } = await supabase
              .from("week_reviews")
              .select("id")
              .eq("cycle_id", cycle.id)
              .eq("week_number", weekNumber)
              .single();

            if (!existingReview) {
              // Check if we already sent reminder today
              const todayStart = new Date(now);
              todayStart.setHours(0, 0, 0, 0);

              const { data: sentToday } = await supabase
                .from("scheduled_notifications")
                .select("id")
                .eq("user_id", userId)
                .eq("notification_type", "weekly_review")
                .gte("sent_at", todayStart.toISOString())
                .single();

              if (!sentToday) {
                await supabase.functions.invoke("send-push-notification", {
                  body: {
                    user_id: userId,
                    title: "Weekly Review Time",
                    body: "It's Friday. Do the review. Yes, you.",
                    url: "/dashboard",
                  },
                });

                await supabase.from("scheduled_notifications").insert({
                  user_id: userId,
                  notification_type: "weekly_review",
                  reference_id: cycle.id,
                  scheduled_for: now.toISOString(),
                  sent_at: now.toISOString(),
                });
                notificationsSent++;
              }
            }
          }
        }
      }

      // Check for behind-plan notifications (once daily)
      if (prefs.behind_plan) {
        const todayStart = new Date(now);
        todayStart.setHours(0, 0, 0, 0);

        // Only check once a day at noon
        if (now.getHours() === 12) {
          const { data: sentToday } = await supabase
            .from("scheduled_notifications")
            .select("id")
            .eq("user_id", userId)
            .eq("notification_type", "behind_plan")
            .gte("sent_at", todayStart.toISOString())
            .single();

          if (!sentToday) {
            // Get active cycle
            const { data: cycle } = await supabase
              .from("cycles")
              .select("id, start_date")
              .eq("user_id", userId)
              .eq("status", "active")
              .single();

            if (cycle) {
              // Calculate current week
              const cycleStart = new Date(cycle.start_date);
              const weekNumber = Math.ceil((now.getTime() - cycleStart.getTime()) / (7 * 24 * 60 * 60 * 1000));

              // Get milestones for current week
              const { data: milestones } = await supabase
                .from("milestones")
                .select("id, goal_id")
                .eq("user_id", userId)
                .eq("week_number", weekNumber);

              const goalIds = [...new Set(milestones?.map(m => m.goal_id) || [])];

              // Get pending tasks for this week
              const { data: pendingTasks } = await supabase
                .from("task_instances")
                .select("id, duration_minutes, scheduled_start")
                .eq("user_id", userId)
                .eq("due_week", weekNumber)
                .eq("status", "pending")
                .in("goal_id", goalIds);

              const unscheduled = pendingTasks?.filter(t => !t.scheduled_start) || [];
              const totalUnscheduledHours = unscheduled.reduce((acc, t) => acc + (t.duration_minutes / 60), 0);

              if (totalUnscheduledHours > 2) {
                await supabase.functions.invoke("send-push-notification", {
                  body: {
                    user_id: userId,
                    title: "Reality Check",
                    body: `${Math.round(totalUnscheduledHours)}h of tasks unscheduled this week`,
                    url: "/dashboard",
                  },
                });

                await supabase.from("scheduled_notifications").insert({
                  user_id: userId,
                  notification_type: "behind_plan",
                  scheduled_for: now.toISOString(),
                  sent_at: now.toISOString(),
                });
                notificationsSent++;
              }
            }
          }
        }
      }
    }

    console.log("[notification-scheduler] Completed. Sent", notificationsSent, "notifications");

    return new Response(JSON.stringify({ 
      success: true, 
      processed: userIds.length,
      notificationsSent 
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[notification-scheduler] Error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
