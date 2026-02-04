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

// Sports detection patterns
const sportsPatterns: Record<string, { pattern: RegExp; league: string; sport: string }> = {
  nba: { 
    pattern: /\b(nba|heat|lakers|celtics|knicks|warriors|nets|bucks|76ers|sixers|suns|mavs|mavericks|spurs|thunder|nuggets|clippers|kings|timberwolves|pelicans|grizzlies|rockets|raptors|pacers|bulls|cavaliers|cavs|hawks|hornets|magic|pistons|wizards|jazz|blazers|trail blazers)\b/i,
    league: 'nba',
    sport: 'basketball'
  },
  mlb: {
    pattern: /\b(mlb|yankees|mets|dodgers|red sox|cubs|astros|braves|phillies|padres|angels|mariners|rangers|twins|guardians|tigers|royals|white sox|brewers|cardinals|reds|pirates|nationals|marlins|rays|blue jays|orioles|athletics|rockies|diamondbacks|giants)\b/i,
    league: 'mlb',
    sport: 'baseball'
  },
  nfl: {
    pattern: /\b(nfl|giants|jets|cowboys|eagles|patriots|chiefs|bills|dolphins|ravens|49ers|niners|seahawks|rams|chargers|broncos|raiders|steelers|bengals|browns|texans|colts|titans|jaguars|commanders|panthers|falcons|saints|buccaneers|bucs|lions|bears|packers|vikings|cardinals)\b/i,
    league: 'nfl',
    sport: 'football'
  },
  nhl: {
    pattern: /\b(nhl|rangers|devils|islanders|bruins|penguins|blackhawks|maple leafs|canadiens|flyers|capitals|lightning|panthers|hurricanes|blue jackets|red wings|sabres|senators|oilers|flames|canucks|kraken|sharks|ducks|kings|golden knights|avalanche|stars|blues|wild|jets|predators|coyotes)\b/i,
    league: 'nhl',
    sport: 'hockey'
  }
};

// ESPN team name mappings for matching
const teamNameMappings: Record<string, string[]> = {
  // NBA
  'heat': ['heat', 'miami heat'],
  'lakers': ['lakers', 'los angeles lakers'],
  'celtics': ['celtics', 'boston celtics'],
  'knicks': ['knicks', 'new york knicks'],
  'warriors': ['warriors', 'golden state warriors'],
  'nets': ['nets', 'brooklyn nets'],
  'bucks': ['bucks', 'milwaukee bucks'],
  '76ers': ['76ers', 'sixers', 'philadelphia 76ers'],
  'suns': ['suns', 'phoenix suns'],
  'mavs': ['mavs', 'mavericks', 'dallas mavericks'],
  // MLB
  'yankees': ['yankees', 'new york yankees'],
  'mets': ['mets', 'new york mets'],
  'dodgers': ['dodgers', 'los angeles dodgers'],
  'red sox': ['red sox', 'boston red sox'],
  // Add more as needed
};

// Detect sports from topic instructions
function detectSportsInterests(topicInstructions: string): Set<string> {
  const detected = new Set<string>();
  for (const [key, config] of Object.entries(sportsPatterns)) {
    if (config.pattern.test(topicInstructions)) {
      detected.add(key);
    }
  }
  return detected;
}

// Extract team names user cares about
function extractTeamNames(topicInstructions: string): string[] {
  const teams: string[] = [];
  const lowerInstructions = topicInstructions.toLowerCase();
  
  for (const [key, aliases] of Object.entries(teamNameMappings)) {
    for (const alias of aliases) {
      if (lowerInstructions.includes(alias)) {
        teams.push(key);
        break;
      }
    }
  }
  return teams;
}

interface ESPNGame {
  name: string;
  shortName: string;
  date: string;
  status: {
    type: {
      name: string;
      completed: boolean;
    };
  };
  competitions: Array<{
    competitors: Array<{
      team: {
        displayName: string;
        shortDisplayName: string;
        abbreviation: string;
      };
      score: string;
      winner?: boolean;
      homeAway: string;
    }>;
    notes?: Array<{ headline?: string }>;
  }>;
}

// Fetch sports scores from ESPN
async function fetchESPNScores(leagues: Set<string>, topicInstructions: string, dateStr: string): Promise<string> {
  const results: string[] = [];
  const teamsUserCaresAbout = extractTeamNames(topicInstructions);
  const lowerInstructions = topicInstructions.toLowerCase();
  
  for (const leagueKey of leagues) {
    const config = sportsPatterns[leagueKey];
    if (!config) continue;
    
    try {
      const url = `https://site.api.espn.com/apis/site/v2/sports/${config.sport}/${config.league}/scoreboard?dates=${dateStr}`;
      console.log(`Fetching ESPN: ${url}`);
      
      const response = await fetch(url);
      if (!response.ok) {
        console.error(`ESPN API error for ${leagueKey}: ${response.status}`);
        continue;
      }
      
      const data = await response.json();
      const events = data.events || [];
      
      if (events.length === 0) {
        results.push(`${config.league.toUpperCase()}: No games yesterday.`);
        continue;
      }
      
      // Filter to games involving teams the user cares about
      const relevantGames = events.filter((game: ESPNGame) => {
        const competitors = game.competitions?.[0]?.competitors || [];
        return competitors.some((comp: { team: { displayName: string; shortDisplayName: string; abbreviation: string } }) => {
          const teamName = comp.team.displayName.toLowerCase();
          const shortName = comp.team.shortDisplayName.toLowerCase();
          const abbrev = comp.team.abbreviation.toLowerCase();
          
          // Check if user mentioned this team
          return teamsUserCaresAbout.some(t => 
            teamName.includes(t) || shortName.includes(t) || t.includes(abbrev)
          ) || lowerInstructions.includes(teamName) || lowerInstructions.includes(shortName);
        });
      });
      
      if (relevantGames.length === 0) {
        // If no relevant games but user mentioned the league, show top games
        if (lowerInstructions.includes(config.league)) {
          const topGames = events.slice(0, 2);
          for (const game of topGames) {
            const formatted = formatGameResult(game);
            if (formatted) results.push(formatted);
          }
        }
        continue;
      }
      
      for (const game of relevantGames) {
        const formatted = formatGameResult(game);
        if (formatted) results.push(formatted);
      }
    } catch (e) {
      console.error(`Error fetching ${leagueKey} scores:`, e);
    }
  }
  
  return results.length > 0 ? results.join('\n') : 'No relevant sports scores found for yesterday.';
}

function formatGameResult(game: ESPNGame): string | null {
  const competition = game.competitions?.[0];
  if (!competition) return null;
  
  const competitors = competition.competitors;
  if (!competitors || competitors.length < 2) return null;
  
  const home = competitors.find(c => c.homeAway === 'home');
  const away = competitors.find(c => c.homeAway === 'away');
  
  if (!home || !away) return null;
  
  const status = game.status?.type?.name || 'Unknown';
  const isComplete = game.status?.type?.completed;
  
  if (!isComplete) {
    return `${away.team.shortDisplayName} @ ${home.team.shortDisplayName}: ${status}`;
  }
  
  const winner = competitors.find(c => c.winner);
  const loser = competitors.find(c => !c.winner);
  
  // Check for special notes (like anniversary celebrations)
  const notes = competition.notes?.map(n => n.headline).filter(Boolean).join('. ') || '';
  const notesSuffix = notes ? ` (${notes})` : '';
  
  if (winner && loser) {
    return `${winner.team.shortDisplayName} ${winner.score}, ${loser.team.shortDisplayName} ${loser.score} (Final)${notesSuffix}`;
  }
  
  return `${away.team.shortDisplayName} ${away.score}, ${home.team.shortDisplayName} ${home.score} (Final)${notesSuffix}`;
}

// Fetch news from Tavily (for non-sports topics)
async function fetchTavilyNews(query: string, apiKey: string): Promise<{ answer: string; sources: Array<{ title: string; url: string }> }> {
  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: apiKey,
        query: query,
        topic: 'news',
        time_range: 'day',
        max_results: 5,
        include_answer: true,
        search_depth: 'basic',
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Tavily API error:', errorText);
      return { answer: 'Unable to fetch news updates.', sources: [] };
    }
    
    const data = await response.json();
    return {
      answer: data.answer || 'No recent news found.',
      sources: (data.results || []).map((r: { title: string; url: string }) => ({ title: r.title, url: r.url }))
    };
  } catch (e) {
    console.error('Tavily fetch error:', e);
    return { answer: 'Unable to fetch news updates.', sources: [] };
  }
}

// Filter out sports terms from topic instructions for Tavily
function getNonSportsTopics(topicInstructions: string): string {
  let filtered = topicInstructions;
  
  // Remove sports team/league mentions
  for (const config of Object.values(sportsPatterns)) {
    filtered = filtered.replace(config.pattern, '');
  }
  
  // Clean up extra whitespace and punctuation
  filtered = filtered.replace(/,\s*,/g, ',').replace(/\s+/g, ' ').trim();
  filtered = filtered.replace(/^,+|,+$/g, '').trim();
  
  return filtered;
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
    const TAVILY_API_KEY = Deno.env.get('TAVILY_API_KEY');
    
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

    // Fetch current month's intention word
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
    const { data: monthlyIntention } = await supabase
      .from('monthly_intentions')
      .select('word, description')
      .eq('user_id', userId)
      .eq('month', currentMonth)
      .maybeSingle();
    
    const intentionWord = monthlyIntention?.word || null;
    const intentionDescription = monthlyIntention?.description || null;

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
    
    // Get yesterday's date for sports scores (morning briefing = yesterday's games)
    const yesterday = new Date(userDate);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayDateStr = yesterday.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD format
    const yesterdayFormatted = yesterday.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric',
      timeZone: timezone 
    });

    // Gather sources
    const sources: { type: string; data: unknown }[] = [];

    // Helper function to refresh Google OAuth token
    async function refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; expiresAt: Date } | null> {
      const clientId = Deno.env.get("GOOGLE_CALENDAR_CLIENT_ID");
      const clientSecret = Deno.env.get("GOOGLE_CALENDAR_CLIENT_SECRET");
      
      if (!clientId || !clientSecret) {
        console.error('Missing Google Calendar credentials');
        return null;
      }

      const response = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: refreshToken,
          grant_type: "refresh_token",
        }),
      });

      if (!response.ok) {
        console.error("Failed to refresh token:", await response.text());
        return null;
      }

      const data = await response.json();
      return {
        accessToken: data.access_token,
        expiresAt: new Date(Date.now() + data.expires_in * 1000),
      };
    }

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
          let accessToken = calendarTokens.access_token;
          
          // Check if token needs refresh
          const tokenExpiresAt = new Date(calendarTokens.token_expires_at);
          if (tokenExpiresAt <= new Date()) {
            console.log('Calendar token expired, refreshing for briefing...');
            const newTokens = await refreshAccessToken(calendarTokens.refresh_token);
            
            if (newTokens) {
              // Update the stored token
              await supabase
                .from('user_calendar_tokens')
                .update({
                  access_token: newTokens.accessToken,
                  token_expires_at: newTokens.expiresAt.toISOString(),
                })
                .eq('user_id', userId);
              
              accessToken = newTokens.accessToken;
              console.log('Calendar token refreshed successfully');
            } else {
              console.error('Failed to refresh calendar token');
            }
          }
          
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
                'Authorization': `Bearer ${accessToken}`
              }
            }
          );

          if (calendarResponse.ok) {
            const calendarData = await calendarResponse.json();
            const events = calendarData.items || [];
            console.log(`Found ${events.length} calendar events for today`);
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
          } else {
            const errorText = await calendarResponse.text();
            console.error('Calendar API error:', calendarResponse.status, errorText);
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

    // 3. News/Sports - DUAL SOURCE: Tavily for news, ESPN for sports
    const topicInstructions = prefs?.default_topic_instructions || '';
    let sportsResults = '';
    let newsResults = '';
    
    if (topicInstructions) {
      // Detect sports interests
      const detectedSports = detectSportsInterests(topicInstructions);
      
      // Fetch sports scores from ESPN if sports detected
      if (detectedSports.size > 0) {
        console.log(`Detected sports: ${Array.from(detectedSports).join(', ')}`);
        sportsResults = await fetchESPNScores(detectedSports, topicInstructions, yesterdayDateStr);
        sources.push({ type: 'sports', data: { leagues: Array.from(detectedSports), scores: sportsResults } });
      }
      
      // Fetch non-sports news from Tavily
      const nonSportsTopics = getNonSportsTopics(topicInstructions);
      if (nonSportsTopics && TAVILY_API_KEY) {
        console.log(`Fetching Tavily news for: ${nonSportsTopics}`);
        const tavilyResult = await fetchTavilyNews(nonSportsTopics, TAVILY_API_KEY);
        newsResults = tavilyResult.answer;
        sources.push({ type: 'news', data: { query: nonSportsTopics, answer: tavilyResult.answer, sources: tavilyResult.sources } });
      } else if (!TAVILY_API_KEY && nonSportsTopics) {
        newsResults = 'News updates unavailable (API not configured).';
      }
    }
    
    // Combine results for the prompt
    let combinedNewsSection = '';
    if (sportsResults) {
      combinedNewsSection += `**VERIFIED SPORTS SCORES (from ${yesterdayFormatted}):**\n${sportsResults}\n\n`;
    }
    if (newsResults) {
      combinedNewsSection += `**NEWS HEADLINES:**\n${newsResults}`;
    }
    if (!sportsResults && !newsResults) {
      combinedNewsSection = 'No news topics requested or available.';
    }

    // Build the intention section for the prompt
    const intentionSection = intentionWord ? `
**WORD OF THE MONTH:**
Word: "${intentionWord}"
${intentionDescription ? `Why they chose it: "${intentionDescription}"` : ''}

At the end of the briefing, include a 30-60 second section about this word. Include:
- A brief, inspiring definition or perspective on the word
- One relevant quote from a philosopher, leader, or thinker
- One practical way to embody this word today
Keep it grounded and actionable, not preachy.
` : '';

    // Adjust word count based on whether we have an intention
    const wordTarget = intentionWord ? '500-600 words (approximately 3-4 minutes when spoken)' : '400-500 words (approximately 2.5-3 minutes when spoken)';

    // Build the prompt - PERSONALIZED GREETING + SHORTER (~3 MIN)
    const prompt = `You are creating a personalized morning audio briefing for ${userName}. Today is ${dayOfWeek}, ${fullDate}.

Your tone is warm, conversational, and energizing - like a smart friend catching them up over coffee. Not cheesy morning radio DJ energy, but genuinely helpful and personable.

**CRITICAL: Keep the entire briefing between ${wordTarget}.**

---

**FACTUAL ACCURACY RULES (VERY IMPORTANT):**
- Today is ${dayOfWeek}, ${fullDate}. DO NOT reference outdated information.
- For sports: Use ONLY the ESPN scores provided below. These are VERIFIED results from ${yesterdayFormatted}.
- NEVER guess or assume current team rosters, player affiliations, or trade statuses.
- For news: Use ONLY the Tavily headlines provided below. Include key numbers when available.
- If no data is provided for a topic, say "I don't have updates on [topic] this morning."
- NEVER say "things seem quiet" or make up information when data is simply unavailable.
- When reporting scores, say them naturally: "Your Heat beat the Hornets 112 to 98" not "Heat 112, Hornets 98"

---

HERE'S WHAT YOU HAVE TO WORK WITH:

**WEATHER:**
${weatherData}

**CALENDAR TODAY:**
${calendarEvents}

**USER'S TOPIC INTERESTS:**
${topicInstructions || 'None specified'}

${combinedNewsSection}

${briefing.custom_instructions ? `**CUSTOM INSTRUCTIONS:**\n${briefing.custom_instructions}` : ''}
${intentionSection}
---

STRUCTURE (flow naturally between these, don't use headers or bullet points):

1. **Opening** (1-2 sentences)
   - **START WITH "Good morning, ${userName}!"**
   - Weather conditions and what kind of day it's shaping up to be

2. **Calendar** (brief, only if events exist)
   - Just mention each event by name and start time (e.g., "You've got team standup at 9am, then lunch with Sarah at noon")
   - No need for end times or durations
   - If calendar is empty, skip or just say "Your calendar's open today"

3. **Sports** (if scores are provided)
   - Report the verified scores naturally
   - Mention any special context (celebrations, milestones) if noted in the data
   - ONLY report what's in the ESPN data - do not add commentary about players or rosters

4. **News/Topics** (main section if topics provided)
   - Cover the key stories from the Tavily results
   - Lead with the most important/actionable info
   - Keep it concise - hit the highlights with key numbers

${intentionWord ? `5. **Word of the Month: ${intentionWord}** (30-60 seconds)
   - Transition naturally: "Now, let's take a moment for your word this month..."
   - Share a meaningful definition or insight about the word
   - Include one relevant quote
   - Give one specific, practical way to live this word today

6. **Close** (1 sentence)
   - Brief energizing send-off that ties back to the word` : `5. **Close** (1 sentence)
   - Brief energizing send-off, no cheesy catchphrases`}

---

IMPORTANT GUIDELINES:
- Write for the EAR, not the eye. Use short sentences. Conversational rhythm.
- No bullet points, no headers, no formatting - this will be spoken aloud
- Numbers should be spoken naturally ("about six and a half percent" not "6.5%")
- Stay within ${wordTarget}
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
