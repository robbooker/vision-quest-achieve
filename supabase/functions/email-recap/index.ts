import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRecapRequest {
  recap_id: string;
  recipient_email: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { recap_id, recipient_email }: EmailRecapRequest = await req.json();

    if (!recap_id || !recipient_email) {
      throw new Error("Missing recap_id or recipient_email");
    }

    // Fetch the recap
    const { data: recap, error: recapError } = await supabase
      .from("monthly_recaps")
      .select("*")
      .eq("id", recap_id)
      .eq("user_id", user.id)
      .single();

    if (recapError || !recap) {
      throw new Error("Recap not found or access denied");
    }

    const content = recap.content as any;
    const stats = recap.stats as any;
    
    // Format month
    const [year, month] = recap.month.split('-');
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                        'July', 'August', 'September', 'October', 'November', 'December'];
    const monthLabel = `${monthNames[parseInt(month) - 1]} ${year}`;

    // Build HTML email
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${recap.headline || `${monthLabel} Recap`}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          h1 { color: #1a1a1a; font-size: 28px; margin-bottom: 8px; }
          h2 { color: #444; font-size: 20px; margin-top: 32px; margin-bottom: 16px; border-bottom: 2px solid #eee; padding-bottom: 8px; }
          .subheadline { color: #666; font-size: 18px; margin-bottom: 24px; }
          .stat-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin: 24px 0; }
          .stat-card { background: #f8f9fa; padding: 16px; border-radius: 8px; text-align: center; }
          .stat-value { font-size: 32px; font-weight: bold; color: #1a1a1a; }
          .stat-label { font-size: 14px; color: #666; }
          .section { margin: 24px 0; padding: 16px; background: #fafafa; border-radius: 8px; }
          .highlight { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 12px; margin: 24px 0; }
          .highlight h3 { margin: 0 0 8px 0; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #999; font-size: 14px; }
        </style>
      </head>
      <body>
        <h1>${recap.headline || `${monthLabel} Recap`}</h1>
        <p class="subheadline">${recap.subheadline || ''}</p>

        ${content?.opening_reflection ? `
          <p>${content.opening_reflection}</p>
        ` : ''}

        ${stats ? `
          <div class="stat-grid">
            <div class="stat-card">
              <div class="stat-value">${stats.journalEntries || 0}</div>
              <div class="stat-label">Journal Entries</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${stats.focusMinutes || 0}</div>
              <div class="stat-label">Focus Minutes</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${stats.habitLogs || 0}</div>
              <div class="stat-label">Habits Logged</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${stats.tasksCompleted || 0}</div>
              <div class="stat-label">Tasks Done</div>
            </div>
          </div>
        ` : ''}

        ${content?.biggest_win ? `
          <div class="highlight">
            <h3>🏆 Biggest Win</h3>
            <p style="margin: 0;">${content.biggest_win}</p>
          </div>
        ` : ''}

        ${content?.hardest_struggle ? `
          <h2>💪 Hardest Struggle</h2>
          <p>${content.hardest_struggle}</p>
        ` : ''}

        ${content?.unexpected_delight ? `
          <h2>✨ Unexpected Delight</h2>
          <p>${content.unexpected_delight}</p>
        ` : ''}

        ${content?.looking_ahead ? `
          <h2>🔮 Looking Ahead</h2>
          <p>${content.looking_ahead}</p>
        ` : ''}

        <div class="footer">
          <p>Generated with Vision Quest</p>
        </div>
      </body>
      </html>
    `;

    // Send email via Resend API
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Vision Quest <onboarding@resend.dev>",
        to: [recipient_email],
        subject: `${monthLabel} Monthly Recap`,
        html: htmlContent,
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      throw new Error(`Failed to send email: ${errorText}`);
    }

    console.log("Email sent successfully");

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Email recap error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
