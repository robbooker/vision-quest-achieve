import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    // Parse request body for optional parameters
    let syncDays = 30;
    
    try {
      const body = await req.json();
      syncDays = body.sync_days || 30;
    } catch {
      // No body provided, use defaults
    }

    // Calculate date range
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - syncDays);
    const startDateStr = startDate.toISOString().split('T')[0];

    console.log(`Syncing trading journal from ${startDateStr} to today...`);

    // Get Short Scout profiles to map user_id -> email
    const { data: ssProfiles, error: ssProfilesError } = await shortScoutClient
      .from('profiles')
      .select('user_id, email');

    if (ssProfilesError) {
      console.error('Error fetching Short Scout profiles:', ssProfilesError);
      throw new Error(`Cannot access Short Scout profiles: ${ssProfilesError.message}`);
    }

    // Create Short Scout user_id -> email map
    const ssUserIdToEmail = new Map<string, string>();
    for (const profile of ssProfiles || []) {
      if (profile.email) {
        ssUserIdToEmail.set(profile.user_id, profile.email.toLowerCase());
      }
    }

    console.log(`Found ${ssUserIdToEmail.size} Short Scout users with emails`);

    // Get local profiles to map email -> user_id
    const { data: localProfiles } = await localClient
      .from('profiles')
      .select('user_id, email');

    const emailToLocalUserId = new Map<string, string>();
    for (const profile of localProfiles || []) {
      if (profile.email) {
        emailToLocalUserId.set(profile.email.toLowerCase(), profile.user_id);
      }
    }

    console.log(`Found ${emailToLocalUserId.size} Groovy Planning users with emails`);

    // Build Short Scout user_id -> Groovy Planning user_id mapping
    const ssToLocalUserMap = new Map<string, string>();
    for (const [ssUserId, email] of ssUserIdToEmail) {
      const localUserId = emailToLocalUserId.get(email);
      if (localUserId) {
        ssToLocalUserMap.set(ssUserId, localUserId);
        console.log(`Matched user: ${email}`);
      }
    }

    if (ssToLocalUserMap.size === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'No matching users found between Short Scout and Groovy Planning. Make sure you use the same email in both apps.' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Matched ${ssToLocalUserMap.size} users between projects`);

    // Fetch trading entries for matched users
    const matchedSsUserIds = [...ssToLocalUserMap.keys()];
    
    const { data: rawEntries, error: fetchError } = await shortScoutClient
      .from('trade_journal_entries')
      .select('entry_date, calculated_pnl, user_id')
      .eq('status', 'completed')
      .gte('entry_date', startDateStr)
      .in('user_id', matchedSsUserIds);

    if (fetchError) {
      console.error('Error fetching from Short Scout:', fetchError);
      throw new Error(`Failed to fetch from Short Scout: ${fetchError.message}`);
    }

    if (!rawEntries || rawEntries.length === 0) {
      console.log('No trading entries found in Short Scout for matched users');
      return new Response(
        JSON.stringify({ success: true, message: 'No entries to sync', synced: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${rawEntries.length} entries from Short Scout`);

    // Aggregate by user_id and entry_date
    const aggregated = new Map<string, { trade_count: number; total_pnl: number; ss_user_id: string; entry_date: string }>();
    
    for (const entry of rawEntries) {
      const key = `${entry.user_id}:${entry.entry_date}`;
      const existing = aggregated.get(key) || { 
        trade_count: 0, 
        total_pnl: 0, 
        ss_user_id: entry.user_id,
        entry_date: entry.entry_date 
      };
      existing.trade_count += 1;
      existing.total_pnl += Number(entry.calculated_pnl) || 0;
      aggregated.set(key, existing);
    }

    console.log(`Aggregated into ${aggregated.size} date entries`);

    let syncedCount = 0;
    const errors: string[] = [];

    for (const [, data] of aggregated) {
      const localUserId = ssToLocalUserMap.get(data.ss_user_id);
      if (!localUserId) continue;

      // Upsert into trading_pnl
      const { error: upsertError } = await localClient
        .from('trading_pnl')
        .upsert({
          user_id: localUserId,
          trade_date: data.entry_date,
          pnl_amount: data.total_pnl,
          trade_count: data.trade_count,
          notes: 'Synced from Short Scout',
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,trade_date',
        });

      if (upsertError) {
        console.error(`Error upserting for ${data.entry_date}:`, upsertError);
        errors.push(`${data.entry_date}: ${upsertError.message}`);
      } else {
        syncedCount++;
      }
    }

    console.log(`Successfully synced ${syncedCount} entries`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        synced: syncedCount,
        total_found: rawEntries.length,
        matched_users: ssToLocalUserMap.size,
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
