import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Keyword mappings for pillar detection
const PILLAR_KEYWORDS: Record<string, string[]> = {
  physical: ['gym', 'workout', 'fitness', 'walk', 'cardio', 'run', 'exercise', 'yoga', 'swim', 'bike', 'hike', 'sport'],
  mental: ['meditation', 'meditate', 'therapy', 'journal', 'mindfulness', 'breathe', 'mental health', 'counseling'],
  relations: ['dinner with', 'lunch with', 'coffee with', 'call with', 'meeting with', 'isaac', 'family', 'date night', 'hangout', 'catch up'],
  income: ['client', 'sales', 'interview', 'pitch', 'business', 'investor', 'networking', 'work'],
  excellence: ['practice', 'learn', 'study', 'course', 'training', 'skill', 'class', 'lesson'],
  direction: ['planning', 'goals', 'strategy', 'vision', 'review', 'reflect'],
};

function detectPillarFromTitle(title: string): string | null {
  const lowerTitle = title.toLowerCase();
  
  for (const [pillar, keywords] of Object.entries(PILLAR_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerTitle.includes(keyword)) {
        return pillar;
      }
    }
  }
  
  return null;
}

async function refreshAccessToken(supabase: any, userId: string, refreshToken: string): Promise<string | null> {
  const clientId = Deno.env.get('GOOGLE_CALENDAR_CLIENT_ID');
  const clientSecret = Deno.env.get('GOOGLE_CALENDAR_CLIENT_SECRET');

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId!,
      client_secret: clientSecret!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    console.error('Failed to refresh token:', await response.text());
    return null;
  }

  const data = await response.json();
  const newExpiresAt = new Date(Date.now() + data.expires_in * 1000);

  await supabase
    .from('user_calendar_tokens')
    .update({
      access_token: data.access_token,
      token_expires_at: newExpiresAt.toISOString(),
    })
    .eq('user_id', userId);

  return data.access_token;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getUser(token);
    if (claimsError || !claimsData?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = claimsData.user.id;

    // Get the user's calendar tokens
    const { data: tokenData, error: tokenError } = await supabase
      .from('user_calendar_tokens')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (tokenError || !tokenData) {
      return new Response(JSON.stringify({ error: 'Calendar not connected' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if token needs refresh
    let accessToken = tokenData.access_token;
    const tokenExpires = new Date(tokenData.token_expires_at);
    if (tokenExpires < new Date()) {
      accessToken = await refreshAccessToken(supabase, userId, tokenData.refresh_token);
      if (!accessToken) {
        return new Response(JSON.stringify({ error: 'Failed to refresh calendar token' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Parse request body for date range
    const body = await req.json().catch(() => ({}));
    const startDate = body.startDate || '2025-01-01';
    const endDate = body.endDate || '2025-01-31';

    // Fetch events from Google Calendar
    const calendarId = tokenData.calendar_id || 'primary';
    const timeMin = new Date(startDate).toISOString();
    const timeMax = new Date(endDate + 'T23:59:59').toISOString();

    const eventsUrl = new URL(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`);
    eventsUrl.searchParams.set('timeMin', timeMin);
    eventsUrl.searchParams.set('timeMax', timeMax);
    eventsUrl.searchParams.set('singleEvents', 'true');
    eventsUrl.searchParams.set('orderBy', 'startTime');
    eventsUrl.searchParams.set('maxResults', '2500');

    const eventsResponse = await fetch(eventsUrl.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!eventsResponse.ok) {
      const errorText = await eventsResponse.text();
      console.error('Google Calendar API error:', errorText);
      return new Response(JSON.stringify({ error: 'Failed to fetch calendar events' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const eventsData = await eventsResponse.json();
    const events = eventsData.items || [];

    // Get existing pillar assignments to avoid duplicates
    const { data: existingPillars } = await supabase
      .from('calendar_event_pillars')
      .select('calendar_event_id')
      .eq('user_id', userId);

    const existingEventIds = new Set((existingPillars || []).map((p: any) => p.calendar_event_id));

    // Process events and detect pillars
    const results = {
      processed: 0,
      tagged: 0,
      skipped: 0,
      byPillar: {} as Record<string, number>,
      taggedEvents: [] as { title: string; pillar: string }[],
    };

    const pillarsToInsert: { user_id: string; calendar_event_id: string; pillar: string }[] = [];

    for (const event of events) {
      results.processed++;

      // Skip if already has a pillar assignment
      if (existingEventIds.has(event.id)) {
        results.skipped++;
        continue;
      }

      const title = event.summary || '';
      const detectedPillar = detectPillarFromTitle(title);

      if (detectedPillar) {
        pillarsToInsert.push({
          user_id: userId,
          calendar_event_id: event.id,
          pillar: detectedPillar,
        });

        results.tagged++;
        results.byPillar[detectedPillar] = (results.byPillar[detectedPillar] || 0) + 1;
        results.taggedEvents.push({ title, pillar: detectedPillar });
      }
    }

    // Insert pillar assignments in batches
    if (pillarsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('calendar_event_pillars')
        .insert(pillarsToInsert);

      if (insertError) {
        console.error('Error inserting pillar assignments:', insertError);
        return new Response(JSON.stringify({ error: 'Failed to save pillar assignments' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Backfill error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
