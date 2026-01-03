import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify user is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("No authorization header provided");
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error("User authentication failed:", userError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Sending test email to user: ${user.email}`);

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Groovy Planning <onboarding@resend.dev>",
        to: [user.email],
        subject: "🍞 Test Email from Groovy Planning!",
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #4a2c17;">🍞 Hello from Toasty!</h1>
            <p style="font-size: 16px; color: #333;">
              Great news! Your Resend email integration is working perfectly.
            </p>
            <p style="font-size: 16px; color: #333;">
              This means you're all set to receive goal reminders, weekly reviews, and other helpful notifications from Groovy Planning.
            </p>
            <div style="background: linear-gradient(135deg, #f5e6d3, #e8d4c0); padding: 20px; border-radius: 12px; margin: 20px 0;">
              <p style="margin: 0; color: #4a2c17; font-weight: 500;">
                "You're already ahead of 90% of people just by planning your goals. Keep being groovy!" 
              </p>
              <p style="margin: 10px 0 0 0; color: #6b4423; font-size: 14px;">— Toasty 🍞</p>
            </div>
            <p style="font-size: 14px; color: #666;">
              Sent at: ${new Date().toLocaleString()}
            </p>
          </div>
        `,
      }),
    });

    const emailData = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error("Resend API error:", emailData);
      throw new Error(emailData.message || "Failed to send email");
    }

    console.log("Email sent successfully:", emailData);

    return new Response(
      JSON.stringify({ success: true, message: "Test email sent!", data: emailData }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in test-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
