import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface BroadcastRequest {
  subject: string;
  message: string;
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify user is authenticated and is admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("No authorization header provided");
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

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

    // Check if user is admin
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (roleError || !roleData) {
      console.error("User is not an admin");
      return new Response(
        JSON.stringify({ error: "Forbidden - Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { subject, message }: BroadcastRequest = await req.json();

    if (!subject || !message) {
      return new Response(
        JSON.stringify({ error: "Subject and message are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch all users who have opted in to email communications
    const { data: optedInUsers, error: usersError } = await supabaseAdmin
      .from('profiles')
      .select('email')
      .eq('consent_email', true)
      .not('email', 'is', null);

    if (usersError) {
      console.error("Error fetching opted-in users:", usersError);
      throw new Error("Failed to fetch recipients");
    }

    if (!optedInUsers || optedInUsers.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No users have opted in to emails", sentCount: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const emails = optedInUsers.map(u => u.email).filter(Boolean) as string[];
    console.log(`Sending broadcast to ${emails.length} opted-in users`);

    let successCount = 0;
    let failCount = 0;

    // Send emails one by one to respect Resend limits and get individual status
    for (const email of emails) {
      try {
        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Groovy Planning <onboarding@resend.dev>",
            to: [email],
            subject: subject,
            html: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #f5e6d3, #e8d4c0); padding: 20px; border-radius: 12px; margin-bottom: 20px;">
                  <h1 style="color: #4a2c17; margin: 0;">🍞 ${subject}</h1>
                </div>
                <div style="font-size: 16px; color: #333; line-height: 1.6;">
                  ${message.replace(/\n/g, '<br>')}
                </div>
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e5e5;">
                  <p style="font-size: 12px; color: #888; margin: 0;">
                    You're receiving this because you opted in to email updates from Groovy Planning.
                  </p>
                </div>
              </div>
            `,
          }),
        });

        if (emailResponse.ok) {
          successCount++;
          console.log(`Email sent successfully to ${email}`);
        } else {
          failCount++;
          const errorData = await emailResponse.json();
          console.error(`Failed to send to ${email}:`, errorData);
        }
      } catch (emailError) {
        failCount++;
        console.error(`Error sending to ${email}:`, emailError);
      }
    }

    console.log(`Broadcast complete. Success: ${successCount}, Failed: ${failCount}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Broadcast sent to ${successCount} users`, 
        sentCount: successCount,
        failedCount: failCount,
        totalRecipients: emails.length
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in send-broadcast function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
