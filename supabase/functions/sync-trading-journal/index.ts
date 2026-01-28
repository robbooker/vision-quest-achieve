import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ShortScoutEntry {
  entry_date: string;
  trade_count: number;
  total_pnl: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get Short Scout credentials
    const shortScoutUrl = Deno.env.get('SHORT_SCOUT_URL');
    const shortScoutKey = Deno.env.get('SHORT_SCOUT_ANON_KEY');
    
    if (!shortScoutUrl || !shortScoutKey) {
      throw new Error('Short Scout credentials not configured');
    }

    // Get local Supabase credentials
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Create clients
    const shortScoutClient = createClient(shortScoutUrl, shortScoutKey);
    const localClient = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body for optional user_id filter or date range
    let userId: string | null = null;
    let syncDays = 30; // Default to last 30 days
    
    try {
      const body = await req.json();
      userId = body.user_id || null;
      syncDays = body.sync_days || 30;
    } catch {
      // No body provided, use defaults
    }

    // Calculate date range
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - syncDays);
    const startDateStr = startDate.toISOString().split('T')[0];

    console.log(`Syncing trading journal from ${startDateStr} to today...`);

    // Fetch aggregated data from Short Scout
    // Using RPC would be ideal but we'll query directly
    const { data: rawEntries, error: fetchError } = await shortScoutClient
      .from('trade_journal_entries')
      .select('entry_date, calculated_pnl, user_id')
      .eq('status', 'completed')
      .gte('entry_date', startDateStr);

    if (fetchError) {
      console.error('Error fetching from Short Scout:', fetchError);
      throw new Error(`Failed to fetch from Short Scout: ${fetchError.message}`);
    }

    if (!rawEntries || rawEntries.length === 0) {
      console.log('No trading entries found in Short Scout');
      return new Response(
        JSON.stringify({ success: true, message: 'No entries to sync', synced: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Aggregate by user_id and entry_date
    const aggregated = new Map<string, { trade_count: number; total_pnl: number; user_id: string }>();
    
    for (const entry of rawEntries) {
      const key = `${entry.user_id}:${entry.entry_date}`;
      const existing = aggregated.get(key) || { trade_count: 0, total_pnl: 0, user_id: entry.user_id };
      existing.trade_count += 1;
      existing.total_pnl += Number(entry.calculated_pnl) || 0;
      aggregated.set(key, existing);
    }

    console.log(`Found ${aggregated.size} unique user/date combinations to sync`);

    // Find matching users in Groovy Planning by looking at profiles
    // We need to map Short Scout user_ids to Groovy Planning user_ids
    // For now, we'll assume the same user has the same email in both systems
    
    // Get all Short Scout user IDs
    const shortScoutUserIds = [...new Set(rawEntries.map(e => e.user_id))];
    
    // For each aggregated entry, upsert into trading_pnl
    // Since we can't easily map users between systems, we'll need a way to link them
    // Option 1: Same user ID (if user exists in both)
    // Option 2: Match by email (requires profile lookup)
    // For simplicity, let's check if the user exists in our profiles table
    
    const { data: localProfiles } = await localClient
      .from('profiles')
      .select('user_id, email')
      .not('email', 'is', null);

    // Create email-to-userId map for Groovy Planning
    const emailToLocalUserId = new Map<string, string>();
    for (const profile of localProfiles || []) {
      if (profile.email) {
        emailToLocalUserId.set(profile.email.toLowerCase(), profile.user_id);
      }
    }

    // Fetch Short Scout user emails (this may not work without service role)
    // We'll try direct user_id matching first
    let syncedCount = 0;
    const errors: string[] = [];

    for (const [key, data] of aggregated) {
      const [ssUserId, entryDate] = key.split(':');
      
      // Try to find this user in Groovy Planning
      // First, check if user_id directly exists
      const { data: existingProfile } = await localClient
        .from('profiles')
        .select('user_id')
        .eq('user_id', ssUserId)
        .maybeSingle();

      const localUserId = existingProfile?.user_id;

      if (!localUserId) {
        // Skip users that don't exist in Groovy Planning
        continue;
      }

      // Upsert into trading_pnl
      const { error: upsertError } = await localClient
        .from('trading_pnl')
        .upsert({
          user_id: localUserId,
          trade_date: entryDate,
          pnl_amount: data.total_pnl,
          trade_count: data.trade_count,
          notes: 'Synced from Short Scout',
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,trade_date',
        });

      if (upsertError) {
        console.error(`Error upserting for ${entryDate}:`, upsertError);
        errors.push(`${entryDate}: ${upsertError.message}`);
      } else {
        syncedCount++;
      }
    }

    console.log(`Successfully synced ${syncedCount} entries`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        synced: syncedCount,
        total_found: aggregated.size,
        errors: errors.length > 0 ? errors : undefined
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Sync error:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
