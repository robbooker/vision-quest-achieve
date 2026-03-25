import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Auth: accept either x-api-key (Buddy/external) OR a valid Supabase JWT (web UI)
  let authenticated = false;

  const apiKey = req.headers.get("x-api-key");
  const expectedKey = Deno.env.get("GROOVY_AUTH_TOKEN");
  if (apiKey && apiKey === expectedKey) {
    authenticated = true;
  }

  if (!authenticated) {
    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      const supabaseAuth = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!
      );
      const { data: { user } } = await supabaseAuth.auth.getUser(token);
      if (user) authenticated = true;
    }
  }

  if (!authenticated) {
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

  console.log("Task created:", data.id);

  // Fire Slack notification async — don't block the response
  const slackToken = Deno.env.get("SLACK_BOT_TOKEN");
  if (slackToken) {
    // Slack member ID mapping
    const SLACK_MEMBERS: Record<string, { display: string; mention: string }> = {
      rob: { display: "Rob", mention: "<@U0AEJPYLJ85>" },
      liz: { display: "Liz", mention: "<@U0AERUZQLG4>" },
      buddy: { display: "Buddy", mention: "@Buddy" },
    };

    const assigneeKey = data.assigned_to || "";
    const assigneeInfo = SLACK_MEMBERS[assigneeKey];
    const assigneeDisplay = assigneeInfo?.display || "unassigned";
    const assigneeMention = assigneeInfo?.mention || "";

    const creatorKey = data.created_by || "";
    const creatorInfo = SLACK_MEMBERS[creatorKey];
    const creatorDisplay = creatorInfo?.display || data.created_by || "unknown";

    let slackText = `🗂️ New task on the board: *${data.title}* — assigned to ${assigneeDisplay}, priority: ${data.priority}. Added by ${creatorDisplay}.`;
    if (assigneeMention) {
      slackText += ` ${assigneeMention}`;
    }
    if (data.assigned_to === "buddy") {
      slackText += " Hey Buddy, this one's yours.";
    }

    console.log("Sending Slack notification...");
    fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${slackToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ channel: "C0AHVSGP7TR", text: slackText }),
    }).then((slackRes) => {
      console.log("Slack response status:", slackRes.status);
    }).catch((err) => {
      console.error("Slack error:", err.message);
    });
  }

  return new Response(JSON.stringify(data), {
    status: 201,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
