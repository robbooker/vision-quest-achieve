import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function formatSimpleTime(dateTimeStr: string, timezone: string): string {
  const date = new Date(dateTimeStr);
  const timeStr = date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    timeZone: timezone 
  });
  return timeStr.replace(':00', '').toLowerCase();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY')!;
    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
    const SHORT_SCOUT_URL = Deno.env.get('SHORT_SCOUT_URL');
    const SHORT_SCOUT_ANON_KEY = Deno.env.get('SHORT_SCOUT_ANON_KEY');

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get auth header and extract user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !userData?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const userId = userData.user.id;

    // Get user's lab preferences
    const { data: labPrefs } = await supabase
      .from('briefing_lab_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    // Get profile info
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name, email')
      .eq('user_id', userId)
      .single();

    const userName = profile?.display_name || profile?.email?.split('@')[0] || 'there';
    const timezone = 'America/Chicago';
    const voiceId = labPrefs?.voice_id || 'JBFqnCBsd6RMkjVDRZzb';

    // Get today's date info
    const now = new Date();
    const userDate = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
    const dayOfWeek = userDate.toLocaleDateString('en-US', { weekday: 'long', timeZone: timezone });
    const fullDate = userDate.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric',
      timeZone: timezone 
    });

    // Get depth settings and max duration
    const maxDuration = labPrefs?.max_duration_minutes || 5;
    const sportsDepth = labPrefs?.sports_depth || 'off';
    const techDepth = labPrefs?.tech_depth || 'off';
    const businessDepth = labPrefs?.business_depth || 'off';
    const tradingDepth = labPrefs?.trading_depth || 'off';

    // Build categories object for scraper based on depth settings
    const categories = {
      sports: sportsDepth !== 'off',
      tech: techDepth !== 'off',
      business: businessDepth !== 'off',
      trading: tradingDepth !== 'off',
    };

    // Build depth map for script generation
    const depthMap = {
      sports: sportsDepth,
      tech: techDepth,
      business: businessDepth,
      trading: tradingDepth,
      politics: labPrefs?.politics_depth || 'off',
      books: labPrefs?.books_depth || 'off',
      film_tv: labPrefs?.film_tv_depth || 'off',
      music: labPrefs?.music_depth || 'off',
      gaming: labPrefs?.gaming_depth || 'off',
      science: labPrefs?.science_depth || 'off',
      health: labPrefs?.health_depth || 'off',
    };

    // Create episode record
    const activeCategories = Object.entries(depthMap)
      .filter(([_, depth]) => depth !== 'off')
      .map(([cat, depth]) => `${cat}:${depth}`);

    const { data: episode, error: episodeError } = await supabase
      .from('briefing_lab_episodes')
      .insert({
        user_id: userId,
        status: 'generating',
        categories_used: activeCategories
      })
      .select()
      .single();

    if (episodeError) {
      console.error('Episode creation error:', episodeError);
      throw new Error('Failed to create episode record');
    }

    // Step 1: Scrape news data
    console.log('Scraping news data...');
    const scrapeResponse = await supabase.functions.invoke('scrape-briefing-news', {
      body: {
        categories,
        sports_teams: labPrefs?.sports_teams,
        tech_topics: labPrefs?.tech_topics,
      }
    });

    const scrapedData = scrapeResponse.data || { sources_succeeded: [], sources_failed: [] };
    console.log('Scraped sources:', scrapedData.sources_succeeded);

    // Store scraped data
    const { data: scrapedRecord } = await supabase
      .from('briefing_scraped_data')
      .insert({
        user_id: userId,
        data: scrapedData,
        sources_succeeded: scrapedData.sources_succeeded || [],
        sources_failed: scrapedData.sources_failed || []
      })
      .select()
      .single();

    // Step 2: Fetch Short Scout data if enabled
    let shortScoutData: { top_searched: string[]; most_traded: string[] } | null = null;
    if (labPrefs?.include_short_scout && SHORT_SCOUT_URL && SHORT_SCOUT_ANON_KEY) {
      try {
        console.log('Fetching Short Scout data...');
        const ssResponse = await fetch(
          `${SHORT_SCOUT_URL}/rest/v1/rpc/get_tickers_data?section=tickers`,
          {
            headers: {
              'apikey': SHORT_SCOUT_ANON_KEY,
              'Authorization': `Bearer ${SHORT_SCOUT_ANON_KEY}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (ssResponse.ok) {
          shortScoutData = await ssResponse.json();
          console.log('Short Scout data:', shortScoutData);
        }
      } catch (e) {
        console.error('Short Scout fetch error:', e);
      }
    }

    // Step 3: Fetch calendar events if enabled
    let calendarEvents = 'No scheduled events';
    if (labPrefs?.include_calendar) {
      const { data: calendarTokens } = await supabase
        .from('user_calendar_tokens')
        .select('access_token, refresh_token, token_expires_at')
        .eq('user_id', userId)
        .single();

      if (calendarTokens?.access_token) {
        try {
          const todayStart = new Date(userDate);
          todayStart.setHours(0, 0, 0, 0);
          const todayEnd = new Date(userDate);
          todayEnd.setHours(23, 59, 59, 999);

          const calendarResponse = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
            `timeMin=${todayStart.toISOString()}&` +
            `timeMax=${todayEnd.toISOString()}&` +
            `singleEvents=true&orderBy=startTime`,
            {
              headers: { 'Authorization': `Bearer ${calendarTokens.access_token}` }
            }
          );

          if (calendarResponse.ok) {
            const calendarData = await calendarResponse.json();
            const events = calendarData.items || [];
            if (events.length > 0) {
              calendarEvents = events.map((e: any) => {
                if (e.start?.dateTime) {
                  const simpleTime = formatSimpleTime(e.start.dateTime, timezone);
                  return `${e.summary || 'Untitled'} at ${simpleTime}`;
                }
                return `${e.summary || 'Untitled'} (all day)`;
              }).join(', ');
            }
          }
        } catch (e) {
          console.error('Calendar fetch error:', e);
        }
      }
    }

    // Step 4: Fetch weather if enabled
    let weatherData = 'Weather data unavailable';
    if (labPrefs?.include_weather) {
      try {
        const lat = labPrefs?.location_lat || 41.88;
        const lng = labPrefs?.location_lng || -87.63;
        
        const weatherResponse = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&temperature_unit=fahrenheit&timezone=America/Chicago`
        );
        
        if (weatherResponse.ok) {
          const weather = await weatherResponse.json();
          const currentTemp = Math.round(weather.current?.temperature_2m || 0);
          const humidity = weather.current?.relative_humidity_2m || 0;
          const high = Math.round(weather.daily?.temperature_2m_max?.[0] || 0);
          const low = Math.round(weather.daily?.temperature_2m_min?.[0] || 0);
          
          const locationName = labPrefs?.location_name || 'your area';
          weatherData = `Currently ${currentTemp}°F in ${locationName} with ${humidity}% humidity. Today's high: ${high}°F, low: ${low}°F.`;
        }
      } catch (e) {
        console.error('Weather fetch error:', e);
      }
    }

    // Step 5: Fetch monthly intention if enabled
    let intentionWord: string | null = null;
    let intentionDescription: string | null = null;
    if (labPrefs?.include_intention) {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const { data: monthlyIntention } = await supabase
        .from('monthly_intentions')
        .select('word, description')
        .eq('user_id', userId)
        .eq('month', currentMonth)
        .maybeSingle();
      
      intentionWord = monthlyIntention?.word || null;
      intentionDescription = monthlyIntention?.description || null;
    }

    // Step 6: Build the prompt with depth awareness
    const buildSectionData = () => {
      const sections: string[] = [];

      // Sports - depth-aware
      if (depthMap.sports !== 'off' && Object.keys(scrapedData.sports || {}).length > 0) {
        const sportsLines: string[] = [];
        for (const [teamKey, teamData] of Object.entries(scrapedData.sports)) {
          const team = teamData as any;
          const teamSection: string[] = [`**${team.name || teamKey.toUpperCase()}:**`];
          
          if (team.last_game) {
            teamSection.push(`Last game: ${team.last_game.result} vs ${team.last_game.opponent} (${team.last_game.score}) on ${team.last_game.date}`);
          }
          
          // Only include headlines for FULL depth
          if (depthMap.sports === 'full' && team.headlines && team.headlines.length > 0) {
            teamSection.push('Headlines:');
            team.headlines.slice(0, 3).forEach((h: any) => {
              teamSection.push(`- ${h.title}`);
            });
          }
          
          sportsLines.push(teamSection.join('\n'));
        }
        sections.push(`**SPORTS (${depthMap.sports === 'brief' ? 'quick scores' : 'full coverage'}):**\n${sportsLines.join('\n\n')}`);
      }

      // Tech/AI - depth-aware
      if (depthMap.tech !== 'off' && scrapedData.tech) {
        const techItems = [
          ...scrapedData.tech.ai_news || [],
          ...scrapedData.tech.general_tech || []
        ];
        const itemLimit = depthMap.tech === 'brief' ? 2 : 5;
        if (techItems.length > 0) {
          sections.push(`**TECH/AI NEWS (${depthMap.tech === 'brief' ? 'highlights' : 'deep dive'}):**\n${techItems.slice(0, itemLimit).map((t: any) => `- ${t.title} (${t.source})`).join('\n')}`);
        }
      }

      // Business - depth-aware
      if (depthMap.business !== 'off' && scrapedData.business && scrapedData.business.length > 0) {
        const itemLimit = depthMap.business === 'brief' ? 2 : 4;
        sections.push(`**BUSINESS NEWS (${depthMap.business === 'brief' ? 'key movers' : 'analysis'}):**\n${scrapedData.business.slice(0, itemLimit).map((b: any) => `- ${b.title} (${b.source})`).join('\n')}`);
      }

      // Custom topics
      if (scrapedData.custom && scrapedData.custom.length > 0) {
        sections.push(`**CUSTOM TOPICS:**\n${scrapedData.custom.map((c: any) => `- ${c.title} (${c.source})`).join('\n')}`);
      }

      // Short Scout
      if (shortScoutData) {
        sections.push(`**SHORT SCOUT TRENDING:**\nTop Searched: ${shortScoutData.top_searched?.slice(0, 5).join(', ') || 'None'}\nMost Traded: ${shortScoutData.most_traded?.slice(0, 5).join(', ') || 'None'}`);
      }

      return sections.join('\n\n');
    };

    const intentionSection = intentionWord ? `
**WORD OF THE MONTH: ${intentionWord}**
${intentionDescription ? `User's notes: ${intentionDescription}` : ''}

Include a 30-60 second reflection on this word at the end of the briefing.` : '';

    // Calculate target word count based on max duration (approx 150 words per minute)
    const targetWordCount = maxDuration * 150;
    const wordCountRange = `${targetWordCount - 50}-${targetWordCount + 50}`;

    // Build depth instructions for the AI
    const depthInstructions = Object.entries(depthMap)
      .filter(([_, depth]) => depth !== 'off')
      .map(([cat, depth]) => {
        const catName = cat.replace('_', ' ');
        return depth === 'brief' 
          ? `- ${catName}: Quick mention only (1-2 sentences)`
          : `- ${catName}: Full segment with context (30-45 seconds)`;
      })
      .join('\n');

    const prompt = `You are a professional podcast host creating a personalized morning briefing for ${userName}. 
Today is ${dayOfWeek}, ${fullDate}.

**CRITICAL RULES:**
- Use ONLY the data provided below. Do NOT infer, guess, or hallucinate any facts.
- Write for the EAR - short sentences, conversational, natural rhythm.
- No bullet points, headers, or formatting - this will be spoken aloud.
- Target approximately ${wordCountRange} words for a ${maxDuration}-minute briefing.

**DEPTH INSTRUCTIONS (how much to cover each topic):**
${depthInstructions || '- No specific news categories selected'}

**WEATHER:**
${weatherData}

**CALENDAR TODAY:**
${calendarEvents}

${buildSectionData()}

${intentionSection}

---

STRUCTURE:
1. Opening - "Good morning, ${userName}!" + weather
2. Calendar - Quick mention of today's events
3. News sections - Cover each category according to its depth level
${intentionWord ? `4. Word of the Month reflection\n5. Brief energizing close` : `4. Brief energizing close`}

Write the briefing script now:`;

    // Step 7: Generate script with Anthropic Claude
    console.log('Generating script with Claude...');
    
    if (!ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY not configured');
    }

    const aiResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Claude API error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        throw new Error('Rate limit exceeded. Please try again in a moment.');
      }
      if (aiResponse.status === 402 || aiResponse.status === 400) {
        throw new Error('Claude API error. Please check your API key and credits.');
      }
      throw new Error(`Claude generation failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const script = aiData.content?.[0]?.text;

    if (!script) {
      throw new Error('No script generated');
    }

    console.log(`Generated script: ${script.length} characters`);

    // Step 8: Generate audio with ElevenLabs
    console.log('Generating audio...');
    const ttsResponse = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: script,
          model_id: 'eleven_turbo_v2_5',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.3,
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!ttsResponse.ok) {
      const errorData = await ttsResponse.text();
      console.error('ElevenLabs error:', errorData);
      throw new Error(`ElevenLabs API error: ${ttsResponse.status}`);
    }

    const audioBuffer = await ttsResponse.arrayBuffer();
    console.log(`Generated audio: ${audioBuffer.byteLength} bytes`);

    // Estimate duration
    const wordCount = script.split(/\s+/).length;
    const estimatedDuration = Math.round((wordCount / 150) * 60);

    // Upload to storage
    const fileName = `lab/${userId}/${episode.id}.mp3`;
    const { error: uploadError } = await supabase.storage
      .from('briefings')
      .upload(fileName, audioBuffer, {
        contentType: 'audio/mpeg',
        upsert: true
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error('Failed to upload audio');
    }

    const { data: { publicUrl } } = supabase.storage
      .from('briefings')
      .getPublicUrl(fileName);

    // Update episode record
    await supabase
      .from('briefing_lab_episodes')
      .update({
        status: 'ready',
        podcast_url: publicUrl,
        script,
        duration_seconds: estimatedDuration,
        scraped_data_id: scrapedRecord?.id,
        generated_at: new Date().toISOString()
      })
      .eq('id', episode.id);

    return new Response(JSON.stringify({
      success: true,
      episode_id: episode.id,
      podcast_url: publicUrl,
      script,
      duration_seconds: estimatedDuration,
      sources_succeeded: scrapedData.sources_succeeded || [],
      sources_failed: scrapedData.sources_failed || []
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in briefing-lab-generate:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
