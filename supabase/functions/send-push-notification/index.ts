import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Base64URL encode helper
function base64UrlToUint8Array(base64Url: string): Uint8Array {
  const padding = "=".repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Helper to send notifications - we'll use a simpler approach without VAPID signing in the initial version

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id, title, body, url } = await req.json();

    if (!user_id || !title || !body) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get user's push subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", user_id);

    if (subError) {
      console.error("[send-push] Error fetching subscriptions:", subError);
      return new Response(JSON.stringify({ error: "Failed to fetch subscriptions" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log("[send-push] No subscriptions found for user:", user_id);
      return new Response(JSON.stringify({ sent: 0, message: "No subscriptions found" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");
    const vapidEmail = Deno.env.get("VAPID_EMAIL");

    if (!vapidPublicKey || !vapidPrivateKey || !vapidEmail) {
      console.error("[send-push] VAPID keys not configured");
      return new Response(JSON.stringify({ error: "VAPID keys not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = JSON.stringify({ title, body, url: url || "/" });
    let sentCount = 0;
    const errors: string[] = [];

    for (const sub of subscriptions) {
      try {
        const endpoint = new URL(sub.endpoint);
        const audience = `${endpoint.protocol}//${endpoint.host}`;

        // For web push, we use a simpler approach with fetch
        const response = await fetch(sub.endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/octet-stream",
            "Content-Encoding": "aes128gcm",
            "TTL": "86400",
            "Urgency": "high",
          },
          body: payload,
        });

        if (response.ok || response.status === 201) {
          sentCount++;
          console.log("[send-push] Notification sent to:", sub.endpoint.substring(0, 50));
        } else {
          const errorText = await response.text();
          console.error("[send-push] Failed to send:", response.status, errorText);
          errors.push(`${response.status}: ${errorText}`);

          // Remove invalid subscription
          if (response.status === 404 || response.status === 410) {
            await supabase
              .from("push_subscriptions")
              .delete()
              .eq("id", sub.id);
            console.log("[send-push] Removed invalid subscription:", sub.id);
          }
        }
      } catch (error) {
        console.error("[send-push] Error sending to subscription:", error);
        errors.push(error instanceof Error ? error.message : "Unknown error");
      }
    }

    return new Response(JSON.stringify({ 
      sent: sentCount, 
      total: subscriptions.length,
      errors: errors.length > 0 ? errors : undefined 
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[send-push] Error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
