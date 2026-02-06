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
    const scienceDepth = labPrefs?.science_depth || 'off';
    const healthDepth = labPrefs?.health_depth || 'off';

    // Build depth map for script generation
    const depthMap: Record<string, string> = {
      sports: sportsDepth,
      tech: techDepth,
      business: businessDepth,
      trading: tradingDepth,
      politics: labPrefs?.politics_depth || 'off',
      books: labPrefs?.books_depth || 'off',
      film_tv: labPrefs?.film_tv_depth || 'off',
      music: labPrefs?.music_depth || 'off',
      gaming: labPrefs?.gaming_depth || 'off',
      science: scienceDepth,
      health: healthDepth,
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

    // Step 1: Fetch Short Scout data if enabled (private API, not web-searchable)
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

    // Step 2: Fetch calendar events if enabled (private user data)
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

    // Step 3: Fetch weather if enabled (structured API data)
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

    // Step 4: Fetch monthly intention if enabled (private user data)
    let intentionWord: string | null = null;
    let intentionDescription: string | null = null;
    if (labPrefs?.include_intention) {
      const nowForMonth = new Date();
      const currentMonthDate = `${nowForMonth.getFullYear()}-${String(nowForMonth.getMonth() + 1).padStart(2, '0')}-01`;
      console.log(`Looking for monthly intention for: ${currentMonthDate}`);
      const { data: monthlyIntention } = await supabase
        .from('monthly_intentions')
        .select('word, description')
        .eq('user_id', userId)
        .eq('month', currentMonthDate)
        .maybeSingle();
      
      console.log(`Monthly intention found:`, monthlyIntention);
      intentionWord = monthlyIntention?.word || null;
      intentionDescription = monthlyIntention?.description || null;
    }

    // Step 5: Build search instructions for Claude based on enabled categories
    const buildSearchInstructions = () => {
      const instructions: string[] = [];
      
      // Sports
      if (depthMap.sports !== 'off') {
        const teams = labPrefs?.sports_teams || '';
        if (teams) {
          const teamList = teams.split(',').map((t: string) => t.trim()).filter(Boolean);
          teamList.forEach((team: string) => {
            instructions.push(`- Search "${team} latest news today ${fullDate}" for recent games, scores, and news`);
          });
        } else {
          instructions.push(`- Search "top sports news today ${fullDate}" for major sports headlines`);
        }
        if (depthMap.sports === 'full') {
          instructions.push(`  → Provide full coverage with context and analysis for each team/story`);
        } else {
          instructions.push(`  → Keep brief: just scores and key headlines`);
        }
      }
      
      // Tech/AI
      if (depthMap.tech !== 'off') {
        const topics = labPrefs?.tech_topics || 'AI, technology';
        instructions.push(`- Search "${topics} news today ${fullDate}" for latest tech developments`);
        if (depthMap.tech === 'full') {
          instructions.push(`  → Provide detailed coverage with implications and context`);
        } else {
          instructions.push(`  → Brief highlights only`);
        }
      }
      
      // Business
      if (depthMap.business !== 'off') {
        const topics = labPrefs?.business_topics || 'stock market, business';
        instructions.push(`- Search "${topics} news today ${fullDate}" for market and business news`);
        if (depthMap.business === 'full') {
          instructions.push(`  → Include market analysis and major company news`);
        } else {
          instructions.push(`  → Key headlines only`);
        }
      }
      
      // Politics
      if (depthMap.politics !== 'off') {
        const topics = labPrefs?.politics_topics || 'US politics';
        instructions.push(`- Search "${topics} news today ${fullDate}" for political developments`);
        if (depthMap.politics === 'full') {
          instructions.push(`  → Provide context and analysis`);
        } else {
          instructions.push(`  → Brief headlines only`);
        }
      }
      
      // Science
      if (depthMap.science !== 'off') {
        const topics = labPrefs?.science_topics || 'science discoveries';
        instructions.push(`- Search "${topics} news today ${fullDate}" for science news`);
        if (depthMap.science === 'full') {
          instructions.push(`  → Explain significance and context`);
        } else {
          instructions.push(`  → Key discoveries only`);
        }
      }
      
      // Health
      if (depthMap.health !== 'off') {
        const topics = labPrefs?.health_topics || 'health, fitness, wellness';
        instructions.push(`- Search "${topics} news today ${fullDate}" for health news`);
        if (depthMap.health === 'full') {
          instructions.push(`  → Include research findings and practical advice`);
        } else {
          instructions.push(`  → Quick tips and headlines`);
        }
      }
      
      // Books
      if (depthMap.books !== 'off') {
        const topics = labPrefs?.books_topics || 'book releases, bestsellers';
        instructions.push(`- Search "${topics} ${fullDate}" for literary news`);
      }
      
      // Film/TV
      if (depthMap.film_tv !== 'off') {
        instructions.push(`- Search "movies TV shows streaming news today ${fullDate}" for entertainment news`);
      }
      
      // Music
      if (depthMap.music !== 'off') {
        const topics = labPrefs?.music_topics || 'music releases, concerts';
        instructions.push(`- Search "${topics} news today ${fullDate}" for music news`);
      }
      
      // Gaming
      if (depthMap.gaming !== 'off') {
        const topics = labPrefs?.gaming_topics || 'video games';
        instructions.push(`- Search "${topics} news today ${fullDate}" for gaming news`);
      }
      
      // Custom topics
      if (labPrefs?.custom_topics) {
        instructions.push(`- Search "${labPrefs.custom_topics} news today ${fullDate}" for custom topic updates`);
      }
      
      return instructions.join('\n');
    };

    const searchInstructions = buildSearchInstructions();
    const hasNewsCategories = Object.entries(depthMap).some(([_, depth]) => depth !== 'off');
    
    // Calculate target word count based on max duration (approx 150 words per minute)
    const targetWordCount = maxDuration * 150;
    const wordCountRange = `${targetWordCount - 50}-${targetWordCount + 50}`;

    // Build the intention section
    const intentionSection = intentionWord ? `
**WORD OF THE MONTH: ${intentionWord}**
${intentionDescription ? `User's notes: ${intentionDescription}` : ''}

Include a 30-60 second reflection on this word at the end of the briefing.` : '';

    // Build Short Scout section
    const shortScoutSection = shortScoutData ? `
**SHORT SCOUT TRADING DATA (include this in your briefing):**
Top Searched Tickers: ${shortScoutData.top_searched?.slice(0, 5).join(', ') || 'None'}
Most Traded Tickers: ${shortScoutData.most_traded?.slice(0, 5).join(', ') || 'None'}` : '';

    // Build the prompt for Claude with web search
    const prompt = `You are creating a personalized morning briefing podcast for ${userName}. 
Today is ${dayOfWeek}, ${fullDate}.

You have access to a web search tool. USE IT to research REAL, CURRENT news for each enabled category below.

**YOUR TASK:**
1. Search for current news using the search instructions below
2. Synthesize the search results into a natural, conversational podcast script
3. Only include information you actually found from your searches - do NOT make up or hallucinate facts
4. Cite your sources naturally (e.g., "According to ESPN..." or "The New York Times is reporting...")

**SEARCH INSTRUCTIONS:**
${hasNewsCategories ? searchInstructions : 'No news categories are enabled - focus on weather, calendar, and any other enabled sections.'}

**STRUCTURED DATA (already provided - no search needed):**

**WEATHER:**
${weatherData}

**CALENDAR TODAY:**
${calendarEvents}
${shortScoutSection}
${intentionSection}

---

**SCRIPT REQUIREMENTS:**
- Target approximately ${wordCountRange} words for a ${maxDuration}-minute briefing
- Write for the EAR - short sentences, conversational, natural rhythm
- No bullet points, headers, or formatting - this will be spoken aloud
- Start with "Good morning, ${userName}!" + weather
- Mention calendar events early
- Cover news categories in order of depth (full coverage first, brief mentions after)
${intentionWord ? `- End with a 30-60 second reflection on the word "${intentionWord}"` : '- End with a brief energizing close'}

Write the complete briefing script now:`;

    // Step 6: Generate script with Claude Sonnet 4.5 + Web Search
    console.log('Generating script with Claude Sonnet 4.5 + Web Search...');
    
    if (!ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY not configured');
    }

    // Determine location for web search context
    const locationName = labPrefs?.location_name || 'Chicago';
    
    const aiResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 16000,
        messages: [{ role: 'user', content: prompt }],
        tools: [{
          type: 'web_search_20250305',
          name: 'web_search',
          max_uses: 20,
          user_location: {
            type: 'approximate',
            city: locationName,
            region: 'Illinois',
            country: 'US',
            timezone: timezone
          }
        }]
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
    console.log('Claude response received, stop_reason:', aiData.stop_reason);
    
    // Extract the final text content from Claude's response
    // With web search, the response contains multiple content blocks:
    // - server_tool_use blocks (searches performed)
    // - web_search_tool_result blocks (search results)
    // - text blocks (the final script with citations)
    const textBlocks = aiData.content?.filter((block: any) => block.type === 'text') || [];
    const script = textBlocks.map((b: any) => b.text).join('\n\n');

    if (!script || script.trim().length === 0) {
      console.error('No script in response. Full response:', JSON.stringify(aiData));
      throw new Error('No script generated from Claude');
    }

    // Extract citations for logging
    const citations: Array<{ url: string; title: string; cited_text: string }> = [];
    textBlocks.forEach((block: any) => {
      if (block.citations && Array.isArray(block.citations)) {
        block.citations.forEach((c: any) => {
          citations.push({
            url: c.url || '',
            title: c.title || '',
            cited_text: c.cited_text || ''
          });
        });
      }
    });
    
    console.log(`Generated script: ${script.length} characters, ${citations.length} citations`);
    console.log('Citations:', JSON.stringify(citations.slice(0, 5)));

    // Step 7: Generate audio with ElevenLabs
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
        generated_at: new Date().toISOString()
      })
      .eq('id', episode.id);

    return new Response(JSON.stringify({
      success: true,
      episode_id: episode.id,
      podcast_url: publicUrl,
      script,
      duration_seconds: estimatedDuration,
      citations: citations.slice(0, 10),
      sources_succeeded: ['claude-web-search'],
      sources_failed: []
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
