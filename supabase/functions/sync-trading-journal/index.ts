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

    console.log('Short Scout URL:', shortScoutUrl);

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

    // Test connection first with a simple query
    const { count, error: countError } = await shortScoutClient
      .from('trade_journal_entries')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('Connection test failed:', countError);
      // If we can't even count, the table might not exist or RLS is blocking
      throw new Error(`Cannot access Short Scout table: ${countError.message}`);
    }

    console.log(`Short Scout has approximately ${count} total entries`);

    // Fetch aggregated data from Short Scout
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
      console.log('No trading entries found in Short Scout for the date range');
      return new Response(
        JSON.stringify({ success: true, message: 'No entries to sync', synced: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${rawEntries.length} raw entries from Short Scout`);

    // Aggregate by user_id and entry_date
    const aggregated = new Map<string, { trade_count: number; total_pnl: number; user_id: string; entry_date: string }>();
    
    for (const entry of rawEntries) {
      const key = `${entry.user_id}:${entry.entry_date}`;
      const existing = aggregated.get(key) || { 
        trade_count: 0, 
        total_pnl: 0, 
        user_id: entry.user_id,
        entry_date: entry.entry_date 
      };
      existing.trade_count += 1;
      existing.total_pnl += Number(entry.calculated_pnl) || 0;
      aggregated.set(key, existing);
    }

    console.log(`Aggregated into ${aggregated.size} unique user/date combinations`);

    // Get local profiles to map users
    const { data: localProfiles } = await localClient
      .from('profiles')
      .select('user_id');

    const localUserIds = new Set((localProfiles || []).map(p => p.user_id));
    console.log(`Found ${localUserIds.size} local users to potentially match`);

    let syncedCount = 0;
    const errors: string[] = [];

    for (const [, data] of aggregated) {
      // Only sync if the user exists in Groovy Planning
      if (!localUserIds.has(data.user_id)) {
        continue;
      }

      // Upsert into trading_pnl
      const { error: upsertError } = await localClient
        .from('trading_pnl')
        .upsert({
          user_id: data.user_id,
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
        aggregated_count: aggregated.size,
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
