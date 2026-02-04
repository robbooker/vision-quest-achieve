import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Format time simply: "9am", "2:30pm"
function formatSimpleTime(dateTimeStr: string, timezone: string): string {
  const date = new Date(dateTimeStr);
  const timeStr = date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    timeZone: timezone 
  });
  // Remove ":00" for on-the-hour times
  return timeStr.replace(':00', '').toLowerCase();
}

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

    // Get user preferences (including new location and topic instructions fields)
    const { data: prefs } = await supabase
      .from('briefing_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name, email, phone_us')
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

    // 1. Calendar events (from Google Calendar if connected) - SIMPLIFIED FORMAT
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
              // Simplified format: "Event name at 9am"
              calendarEvents = events.map((e: { start?: { dateTime?: string; date?: string }; summary?: string }) => {
                if (e.start?.dateTime) {
                  const simpleTime = formatSimpleTime(e.start.dateTime, timezone);
                  return `${e.summary || 'Untitled'} at ${simpleTime}`;
                }
                return `${e.summary || 'Untitled'} (all day)`;
              }).join(', ');
              sources.push({ type: 'calendar', data: events });
            }
          }
        } catch (e) {
          console.error('Calendar fetch error:', e);
        }
      }
    }

    // 2. Weather - USE LOCATION FROM PREFERENCES
    let weatherData = 'Weather data unavailable';
    if (prefs?.include_weather) {
      try {
        // Use user's location or fall back to Chicago
        const lat = prefs?.location_lat || 41.88;
        const lng = prefs?.location_lng || -87.63;
        const locationName = prefs?.location_name || 'your area';
        
        const weatherResponse = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&timezone=${encodeURIComponent(timezone)}&temperature_unit=fahrenheit&forecast_days=1`
        );
        if (weatherResponse.ok) {
          const weather = await weatherResponse.json();
          const temp = Math.round(weather.current?.temperature_2m || 0);
          const humidity = weather.current?.relative_humidity_2m || 0;
          const weatherCode = weather.current?.weather_code || 0;
          const highTemp = Math.round(weather.daily?.temperature_2m_max?.[0] || temp);
          const lowTemp = Math.round(weather.daily?.temperature_2m_min?.[0] || temp);
          
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
          weatherData = `Currently ${temp}°F with ${description} in ${locationName}. Today's high ${highTemp}°, low ${lowTemp}°.`;
          sources.push({ type: 'weather', data: { temp, highTemp, lowTemp, humidity, description, location: locationName } });
        }
      } catch (e) {
        console.error('Weather fetch error:', e);
      }
    }

    // 3. News for topics - USE DEFAULT TOPIC INSTRUCTIONS
    let newsResults = 'No news topics requested';
    const topicInstructions = prefs?.default_topic_instructions || '';
    const topics = briefing.topics || [];
    
    if ((topicInstructions || topics.length > 0) && PERPLEXITY_API_KEY) {
      try {
        // If we have paragraph instructions, use them as a single query
        if (topicInstructions) {
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
                  content: `You are a news wire service. Return ONLY factual headlines and key numbers.

For each topic, provide:
- Headline (one sentence, factual)
- Key number or fact (earnings, price, percentage change, date, etc.)
- Source context (one phrase)

DO NOT editorialize or comment on how interesting topics are.
DO NOT say things like "this is an exciting development" or "you seem interested in..."
ONLY provide news headlines and facts. If there's no recent news, say "No breaking news on [topic]"`
                },
                { 
                  role: 'user', 
                  content: `Based on these topic interests: "${topicInstructions}"

Return the top 3-4 relevant news headlines with key facts from today.`
                }
              ],
              search_recency_filter: 'day'
            }),
          });

          if (response.ok) {
            const data = await response.json();
            newsResults = data.choices?.[0]?.message?.content || 'No recent news found';
            sources.push({ type: 'news', data: { instructions: topicInstructions, summary: newsResults, citations: data.citations || [] } });
          }
        } else if (topics.length > 0) {
          // Fall back to individual topic queries
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
                    content: `You are a news wire service. Return ONLY factual headlines and key numbers.

Provide:
- Headline (one sentence, factual)
- Key number or fact (earnings, price, percentage change, date, etc.)

DO NOT editorialize. ONLY provide the headline and key fact.`
                  },
                  { 
                    role: 'user', 
                    content: `What's the latest headline on: ${topic}?`
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
        }
      } catch (e) {
        console.error('News fetch error:', e);
      }
    }

    // Build the prompt - PERSONALIZED GREETING + SHORTER (~3 MIN)
    const prompt = `You are creating a personalized morning audio briefing for ${userName}. Today is ${dayOfWeek}, ${fullDate}.

Your tone is warm, conversational, and energizing - like a smart friend catching them up over coffee. Not cheesy morning radio DJ energy, but genuinely helpful and personable.

**CRITICAL: Keep the entire briefing between 400-500 words (approximately 2.5-3 minutes when spoken).**

---

HERE'S WHAT YOU HAVE TO WORK WITH:

**WEATHER:**
${weatherData}

**CALENDAR TODAY:**
${calendarEvents}

**USER'S TOPIC INSTRUCTIONS:**
${topicInstructions || 'None specified'}

**NEWS SEARCH RESULTS:**
${newsResults}

${briefing.custom_instructions ? `**CUSTOM INSTRUCTIONS:**\n${briefing.custom_instructions}` : ''}

---

STRUCTURE (flow naturally between these, don't use headers or bullet points):

1. **Opening** (1-2 sentences)
   - **START WITH "Good morning, ${userName}!"**
   - Weather conditions and what kind of day it's shaping up to be

2. **Calendar** (brief, only if events exist)
   - Just mention each event by name and start time (e.g., "You've got team standup at 9am, then lunch with Sarah at noon")
   - No need for end times or durations
   - If calendar is empty, skip or just say "Your calendar's open today"

3. **News/Topics** (main section if topics provided)
   - Cover the key stories relevant to their interests
   - Lead with the most important/actionable info
   - Keep it concise - hit the highlights

4. **Close** (1 sentence)
   - Brief energizing send-off, no cheesy catchphrases

---

IMPORTANT GUIDELINES:
- Write for the EAR, not the eye. Use short sentences. Conversational rhythm.
- No bullet points, no headers, no formatting - this will be spoken aloud
- Numbers should be spoken naturally ("about six and a half percent" not "6.5%")
- Stay within 400-500 words - this should be a quick 3-minute briefing
- End on an energizing note without being corny

---

Now write the briefing script:`;

    // Generate script with Gemini
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
        max_tokens: 1500,
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

    console.log(`Generated script: ${script.length} characters, ~${Math.round(script.split(/\s+/).length)} words`);

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
    const wordCount = script.split(/\s+/).length;
    const estimatedDuration = Math.round((wordCount / 150) * 60);

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

    // Send SMS notification if enabled
    if (prefs?.sms_delivery_enabled && profile?.phone_us) {
      try {
        const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID');
        const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN');
        const TWILIO_PHONE_NUMBER = Deno.env.get('TWILIO_PHONE_NUMBER');
        
        if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_PHONE_NUMBER) {
          const topicsList = briefing.topics?.length > 0 
            ? briefing.topics.slice(0, 3).join(', ') 
            : 'your interests';
          
          const smsBody = `☀️ Your morning briefing is ready!\n\nListen now: ${publicUrl}\n\nTopics: ${topicsList}`;
          
          const formData = new URLSearchParams();
          formData.append('To', profile.phone_us);
          formData.append('From', TWILIO_PHONE_NUMBER);
          formData.append('Body', smsBody);

          const encoder = new TextEncoder();
          const credentials = encoder.encode(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);
          const base64Credentials = btoa(String.fromCharCode(...credentials));

          await fetch(
            `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Basic ${base64Credentials}`,
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: formData.toString(),
            }
          );
          console.log(`SMS sent to ${profile.phone_us}`);
        }
      } catch (e) {
        console.error('SMS send error:', e);
        // Don't fail the briefing if SMS fails
      }
    }

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
