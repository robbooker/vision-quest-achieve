import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')!;
    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY')!;
    const PERPLEXITY_API_KEY = Deno.env.get('PERPLEXITY_API_KEY');
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    const { briefing_id } = await req.json();
    
    if (!briefing_id) {
      return new Response(JSON.stringify({ error: 'briefing_id required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get briefing
    const { data: briefing, error: briefingError } = await supabase
      .from('morning_briefings')
      .select('*')
      .eq('id', briefing_id)
      .single();

    if (briefingError || !briefing) {
      throw new Error('Briefing not found');
    }

    // Update status to generating
    await supabase
      .from('morning_briefings')
      .update({ status: 'generating' })
      .eq('id', briefing_id);

    const userId = briefing.user_id;

    // Get user preferences
    const { data: prefs } = await supabase
      .from('briefing_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name, email')
      .eq('user_id', userId)
      .single();

    const userName = profile?.display_name || profile?.email?.split('@')[0] || 'there';
    const timezone = prefs?.timezone || 'America/Chicago';
    const voiceId = prefs?.voice_id || 'JBFqnCBsd6RMkjVDRZzb';

    // Get today's date in user's timezone
    const now = new Date();
    const userDate = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
    const dayOfWeek = userDate.toLocaleDateString('en-US', { weekday: 'long', timeZone: timezone });
    const fullDate = userDate.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric',
      timeZone: timezone 
    });

    // Gather sources
    const sources: { type: string; data: unknown }[] = [];

    // 1. Calendar events (from Google Calendar if connected)
    let calendarEvents = 'No scheduled events';
    if (prefs?.include_calendar) {
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
              headers: {
                'Authorization': `Bearer ${calendarTokens.access_token}`
              }
            }
          );

          if (calendarResponse.ok) {
            const calendarData = await calendarResponse.json();
            const events = calendarData.items || [];
            if (events.length > 0) {
              calendarEvents = events.map((e: { start?: { dateTime?: string; date?: string }; summary?: string }) => {
                const startTime = e.start?.dateTime 
                  ? new Date(e.start.dateTime).toLocaleTimeString('en-US', { 
                      hour: 'numeric', 
                      minute: '2-digit',
                      timeZone: timezone 
                    })
                  : 'All day';
                return `${startTime}: ${e.summary || 'Untitled'}`;
              }).join('\n');
              sources.push({ type: 'calendar', data: events });
            }
          }
        } catch (e) {
          console.error('Calendar fetch error:', e);
        }
      }
    }

    // 2. Weather
    let weatherData = 'Weather data unavailable';
    if (prefs?.include_weather) {
      try {
        // Use a default location or could be stored in preferences
        // For now, using Chicago as default
        const weatherResponse = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=41.88&longitude=-87.63&current=temperature_2m,relative_humidity_2m,weather_code&timezone=${encodeURIComponent(timezone)}&temperature_unit=fahrenheit`
        );
        if (weatherResponse.ok) {
          const weather = await weatherResponse.json();
          const temp = Math.round(weather.current?.temperature_2m || 0);
          const humidity = weather.current?.relative_humidity_2m || 0;
          const weatherCode = weather.current?.weather_code || 0;
          
          const weatherDescriptions: Record<number, string> = {
            0: 'clear skies',
            1: 'mainly clear',
            2: 'partly cloudy',
            3: 'overcast',
            45: 'foggy',
            48: 'foggy',
            51: 'light drizzle',
            53: 'drizzle',
            55: 'heavy drizzle',
            61: 'light rain',
            63: 'rain',
            65: 'heavy rain',
            71: 'light snow',
            73: 'snow',
            75: 'heavy snow',
            95: 'thunderstorms',
          };
          
          const description = weatherDescriptions[weatherCode] || 'mixed conditions';
          weatherData = `${temp}°F with ${description}, ${humidity}% humidity`;
          sources.push({ type: 'weather', data: { temp, humidity, description } });
        }
      } catch (e) {
        console.error('Weather fetch error:', e);
      }
    }

    // 3. News for topics
    let newsResults = 'No news topics requested';
    const topics = briefing.topics || [];
    if (topics.length > 0 && PERPLEXITY_API_KEY) {
      try {
        const newsPromises = topics.map(async (topic: string) => {
          const response = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'sonar',
              messages: [
                { 
                  role: 'system', 
                  content: 'Provide a concise 2-3 sentence summary of the latest news on this topic. Focus on actionable information and key developments. Be specific with numbers and facts.'
                },
                { 
                  role: 'user', 
                  content: `What's the latest news on: ${topic}?`
                }
              ],
              search_recency_filter: 'day'
            }),
          });

          if (response.ok) {
            const data = await response.json();
            return {
              topic,
              summary: data.choices?.[0]?.message?.content || 'No recent news found',
              citations: data.citations || []
            };
          }
          return { topic, summary: 'Unable to fetch news', citations: [] };
        });

        const newsData = await Promise.all(newsPromises);
        newsResults = newsData.map(n => `**${n.topic}:** ${n.summary}`).join('\n\n');
        sources.push({ type: 'news', data: newsData });
      } catch (e) {
        console.error('News fetch error:', e);
      }
    }

    // 4. Quick tasks and priorities
    const { data: tasks } = await supabase
      .from('quick_tasks')
      .select('title, category')
      .eq('user_id', userId)
      .eq('completed', false)
      .order('created_at', { ascending: false })
      .limit(5);

    const taskList = tasks?.length 
      ? tasks.map(t => `- ${t.title}`).join('\n')
      : 'No pending tasks';

    // 5. Get habits due today
    const { data: habits } = await supabase
      .from('goal_tactics')
      .select('title, target_count')
      .eq('user_id', userId)
      .eq('is_active', true)
      .limit(5);

    const habitList = habits?.length
      ? habits.map(h => `- ${h.title}`).join('\n')
      : 'No habits configured';

    // Build the prompt
    const prompt = `You are creating a personalized morning audio briefing for ${userName}. Today is ${dayOfWeek}, ${fullDate}.

Your tone is warm, conversational, and energizing - like a smart friend catching them up over coffee. Not cheesy morning radio DJ energy, but genuinely helpful and personable. You can be witty but don't force it.

Keep the entire briefing between 600-800 words (approximately 4-5 minutes when spoken).

---

HERE'S WHAT YOU HAVE TO WORK WITH:

**WEATHER:**
${weatherData}

**CALENDAR TODAY:**
${calendarEvents}

**PENDING TASKS:**
${taskList}

**DAILY HABITS:**
${habitList}

**USER'S REQUESTED TOPICS:**
${topics.length > 0 ? topics.join(', ') : 'None specified'}

**NEWS SEARCH RESULTS FOR THOSE TOPICS:**
${newsResults}

${briefing.custom_instructions ? `**CUSTOM INSTRUCTIONS:**\n${briefing.custom_instructions}` : ''}

---

STRUCTURE (flow naturally between these, don't use headers or bullet points):

1. **Opening** (2-3 sentences)
   - Warm greeting with their name
   - Weather and what kind of day it's shaping up to be
   - Set the energy/vibe

2. **Calendar & Tasks Rundown** (if events exist)
   - What's on deck today
   - Key tasks to tackle
   - Keep it practical

3. **News Deep-Dive** (bulk of the briefing if topics provided)
   - Cover each requested topic
   - Lead with the most important/actionable info
   - Connect dots between stories if relevant
   - For financial/trading topics, focus on what actually matters for decision-making

4. **Close** (2-3 sentences)
   - Quick synthesis or "bottom line"
   - Energizing send-off
   - No cheesy catchphrases

---

IMPORTANT GUIDELINES:
- Write for the EAR, not the eye. Use short sentences. Conversational rhythm.
- No bullet points, no headers, no formatting - this will be spoken aloud
- Numbers should be spoken naturally ("about six and a half percent" not "6.5%")
- Avoid jargon unless it's relevant to the user's expertise
- Don't editorialize too much on news - present it, add brief context, move on
- If calendar is empty, keep that section very brief ("Your calendar's clear today, so you've got flexibility")
- End on an energizing note without being corny

---

Now write the briefing script:`;

    // Generate script with Claude
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'user', content: prompt }
        ],
        max_tokens: 2000,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI response error:', errorText);
      throw new Error(`AI generation failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const script = aiData.choices?.[0]?.message?.content;

    if (!script) {
      throw new Error('No script generated');
    }

    console.log(`Generated script: ${script.length} characters`);

    // Generate audio with ElevenLabs
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
      console.error('ElevenLabs API error:', errorData);
      throw new Error(`ElevenLabs API error: ${ttsResponse.status}`);
    }

    const audioBuffer = await ttsResponse.arrayBuffer();
    console.log(`Generated audio: ${audioBuffer.byteLength} bytes`);

    // Estimate duration (rough: ~150 words per minute, ~5 chars per word)
    const estimatedDuration = Math.round((script.length / 5 / 150) * 60);

    // Upload to Supabase Storage
    const fileName = `${userId}/${briefing.wake_date}-briefing.mp3`;
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

    // Store sources
    for (const source of sources) {
      await supabase
        .from('briefing_sources')
        .insert({
          briefing_id,
          source_type: source.type,
          raw_data: source.data
        });
    }

    // Update briefing record
    await supabase
      .from('morning_briefings')
      .update({
        status: 'ready',
        podcast_url: publicUrl,
        script,
        duration_seconds: estimatedDuration,
        generated_at: new Date().toISOString()
      })
      .eq('id', briefing_id);

    return new Response(JSON.stringify({
      success: true,
      podcast_url: publicUrl,
      duration_seconds: estimatedDuration
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    console.error('Error in briefing-generate:', error);
    
    // Try to update briefing status to failed
    try {
      const { briefing_id } = await req.clone().json();
      if (briefing_id) {
        const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
        const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        await supabase
          .from('morning_briefings')
          .update({
            status: 'failed',
            error_message: error instanceof Error ? error.message : 'Unknown error'
          })
          .eq('id', briefing_id);
      }
    } catch (e) {
      console.error('Failed to update briefing status:', e);
    }

    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
