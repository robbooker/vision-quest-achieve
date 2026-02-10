import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ShortScoutResponse {
  success: boolean;
  data: unknown;
  error?: string;
}

async function fetchShortScoutSection(
  baseUrl: string,
  apiKey: string,
  section: string
): Promise<ShortScoutResponse> {
  try {
    const response = await fetch(
      `${baseUrl}/functions/v1/platform-stats?section=${section}&days=30`,
      {
        headers: {
          'x-api-key': apiKey,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        data: null,
        error: `HTTP ${response.status}: ${errorText}`,
      };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get auth token from request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user is admin
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check admin role
    const { data: isAdmin } = await supabase.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin',
    });

    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if Short Scout secrets are configured
    const shortScoutUrl = Deno.env.get('SHORT_SCOUT_URL');
    const shortScoutPlatformKey = Deno.env.get('SHORT_SCOUT_PLATFORM_KEY');

    const secretsConfigured = !!(shortScoutUrl && shortScoutPlatformKey);

    if (!secretsConfigured) {
      return new Response(
        JSON.stringify({
          secrets_configured: false,
          error: 'SHORT_SCOUT_URL and/or SHORT_SCOUT_PLATFORM_KEY not configured',
          tickers: { success: false, data: null, error: 'Secrets not configured' },
          engagement: { success: false, data: null, error: 'Secrets not configured' },
          trends: { success: false, data: null, error: 'Secrets not configured' },
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Testing Short Scout API with URL:', shortScoutUrl);

    // Test all sections in parallel
    const sections = ['tickers', 'engagement', 'trends', 'activity', 'chat', 'leaderboard', 'patterns', 'scout'];
    const results = await Promise.all(
      sections.map(s => fetchShortScoutSection(shortScoutUrl!, shortScoutPlatformKey!, s))
    );

    const sectionResults: Record<string, ShortScoutResponse> = {};
    sections.forEach((s, i) => {
      sectionResults[s] = results[i];
      console.log(`${s} response:`, JSON.stringify(results[i], null, 2));
    });

    return new Response(
      JSON.stringify({
        secrets_configured: true,
        short_scout_url: shortScoutUrl,
        ...sectionResults,
        tested_at: new Date().toISOString(),
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in test-short-scout:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        secrets_configured: false,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
