import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("[push-subscribe] Auth error:", authError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { subscription } = await req.json();
    
    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return new Response(JSON.stringify({ error: "Invalid subscription data" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("[push-subscribe] Saving subscription for user:", user.id);

    // Upsert subscription
    const { error: subError } = await supabase
      .from("push_subscriptions")
      .upsert({
        user_id: user.id,
        endpoint: subscription.endpoint,
        p256dh_key: subscription.keys.p256dh,
        auth_key: subscription.keys.auth,
      }, {
        onConflict: "user_id,endpoint",
      });

    if (subError) {
      console.error("[push-subscribe] Error saving subscription:", subError);
      return new Response(JSON.stringify({ error: "Failed to save subscription" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Initialize notification preferences if not exists
    const { error: prefError } = await supabase
      .from("notification_preferences")
      .upsert({
        user_id: user.id,
        start_of_block: true,
        weekly_review: true,
        behind_plan: true,
      }, {
        onConflict: "user_id",
        ignoreDuplicates: true,
      });

    if (prefError) {
      console.error("[push-subscribe] Error creating preferences:", prefError);
    }

    console.log("[push-subscribe] Subscription saved successfully");

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[push-subscribe] Error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
