import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const stateParam = url.searchParams.get("state");
    const error = url.searchParams.get("error");

    // Handle OAuth errors
    if (error) {
      console.error("OAuth error:", error);
      return new Response(
        `<html><body><script>window.location.href = "/?calendar_error=${encodeURIComponent(error)}";</script></body></html>`,
        { status: 200, headers: { "Content-Type": "text/html" } }
      );
    }

    if (!code || !stateParam) {
      console.error("Missing code or state parameter");
      return new Response(
        `<html><body><script>window.location.href = "/?calendar_error=missing_params";</script></body></html>`,
        { status: 200, headers: { "Content-Type": "text/html" } }
      );
    }

    // Parse the state to get user ID and redirect URI
    let state: { userId: string; redirectUri: string };
    try {
      state = JSON.parse(decodeURIComponent(stateParam));
    } catch (e) {
      console.error("Failed to parse state:", e);
      return new Response(
        `<html><body><script>window.location.href = "/?calendar_error=invalid_state";</script></body></html>`,
        { status: 200, headers: { "Content-Type": "text/html" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const clientId = Deno.env.get("GOOGLE_CALENDAR_CLIENT_ID")!;
    const clientSecret = Deno.env.get("GOOGLE_CALENDAR_CLIENT_SECRET")!;

    // Exchange the authorization code for tokens
    const callbackUrl = `${supabaseUrl}/functions/v1/google-calendar-callback`;
    
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: callbackUrl,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error("Token exchange failed:", errorData);
      return new Response(
        `<html><body><script>window.location.href = "${state.redirectUri}?calendar_error=token_exchange_failed";</script></body></html>`,
        { status: 200, headers: { "Content-Type": "text/html" } }
      );
    }

    const tokens = await tokenResponse.json();
    console.log("Token exchange successful for user:", state.userId);

    // Calculate token expiration time
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    // Store tokens in the database using service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { error: upsertError } = await supabase
      .from("user_calendar_tokens")
      .upsert({
        user_id: state.userId,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expires_at: expiresAt,
        calendar_id: "primary",
      }, { onConflict: "user_id" });

    if (upsertError) {
      console.error("Failed to store tokens:", upsertError);
      return new Response(
        `<html><body><script>window.location.href = "${state.redirectUri}?calendar_error=storage_failed";</script></body></html>`,
        { status: 200, headers: { "Content-Type": "text/html" } }
      );
    }

    console.log("Tokens stored successfully for user:", state.userId);

    // Redirect back to the app with success
    return new Response(
      `<html><body><script>window.location.href = "${state.redirectUri}?calendar_connected=true";</script></body></html>`,
      { status: 200, headers: { "Content-Type": "text/html" } }
    );
  } catch (error) {
    console.error("Error in google-calendar-callback:", error);
    return new Response(
      `<html><body><script>window.location.href = "/?calendar_error=internal_error";</script></body></html>`,
      { status: 200, headers: { "Content-Type": "text/html" } }
    );
  }
});
