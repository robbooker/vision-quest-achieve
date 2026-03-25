import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const apiKey = req.headers.get("x-api-key");
  const expectedKey = Deno.env.get("GROOVY_AUTH_TOKEN");
  if (!apiKey || apiKey !== expectedKey) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { title, description, priority, created_by, assigned_to } = await req.json();

  if (!title) {
    return new Response(JSON.stringify({ error: "title is required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data, error } = await supabase
    .from("team_tasks")
    .insert({
      title,
      description: description || null,
      priority: priority || "normal",
      created_by: created_by || null,
      assigned_to: assigned_to || null,
    })
    .select()
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Fire Slack notification async — don't block the response
  const slackToken = Deno.env.get("SLACK_BOT_TOKEN");
  if (slackToken) {
    const assignee = data.assigned_to || "unassigned";
    let slackText = `🗂️ New task on the board: *${data.title}* — assigned to ${assignee}, priority: ${data.priority}. Added by ${data.created_by || "unknown"}. <@U0AEJPYLJ85>`;
    if (data.assigned_to === "buddy") {
      slackText += " Hey Buddy, this one's yours.";
    }
    fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${slackToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ channel: "C0AHVSGP7TR", text: slackText }),
    }).catch((err) => console.error("Slack notification failed:", err));
  }

  return new Response(JSON.stringify(data), {
    status: 201,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
