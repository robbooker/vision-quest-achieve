
# Morning Briefing Lab - Enhanced Version

## Summary
Create a `/morning-briefing` lab page with an experimental briefing system featuring:
1. **Anthropic Claude** for script generation (replacing Lovable AI/Gemini)
2. **Browserless.io** web scraping for authoritative news data
3. **Short Scout** integration for trending stocks
4. **User-configurable news categories** with specific interest inputs
5. **SMS delivery** after generation (like production)
6. **Zip code / location** picker (reusing existing pattern)

## User Experience Flow

### Generation Page (`/morning-briefing`)
1. User configures their preferences (saved for future)
2. User clicks "Generate Briefing"
3. System scrapes news sources, fetches Short Scout data
4. Claude generates script from scraped data
5. ElevenLabs creates audio
6. Audio player appears with transcript
7. "Send SMS" button immediately sends link to their phone

### Preferences Panel
Users will see a grid of content categories they can toggle on/off. When a category is enabled, they can optionally add specific interests.

## News Categories & Preferences

| Category | Toggle | Optional Input |
|----------|--------|----------------|
| Sports | Checkbox | Teams input (e.g., "Heat, Yankees, Giants") |
| Tech / AI | Checkbox | Topics input (e.g., "vibe coding, Claude, cursor") |
| Business | Checkbox | Companies/industries input |
| Trading / Markets | Checkbox | - |
| Politics | Checkbox | Topics input |
| Books | Checkbox | Genres/authors input |
| Film & TV | Checkbox | - |
| Music | Checkbox | Genres/artists input |
| Gaming | Checkbox | Platforms/games input |
| Science | Checkbox | Topics input |
| Health & Fitness | Checkbox | Topics input |
| Short Scout Updates | Checkbox | - (pulls top_searched, most_traded) |
| Weather | Checkbox | Uses saved location |
| Calendar | Checkbox | Pulls from Google Calendar |
| Monthly Intention | Checkbox | Reflection on word of the month |
| **Custom Topics** | Text area | Free-form input for anything else |

## Database Schema

### Table: `briefing_lab_preferences`
```sql
CREATE TABLE briefing_lab_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  
  -- Core settings
  location_lat DOUBLE PRECISION,
  location_lng DOUBLE PRECISION,
  location_name TEXT,
  voice_id TEXT DEFAULT 'JBFqnCBsd6RMkjVDRZzb',
  
  -- Category toggles
  include_sports BOOLEAN DEFAULT false,
  include_tech BOOLEAN DEFAULT false,
  include_business BOOLEAN DEFAULT false,
  include_trading BOOLEAN DEFAULT false,
  include_politics BOOLEAN DEFAULT false,
  include_books BOOLEAN DEFAULT false,
  include_film_tv BOOLEAN DEFAULT false,
  include_music BOOLEAN DEFAULT false,
  include_gaming BOOLEAN DEFAULT false,
  include_science BOOLEAN DEFAULT false,
  include_health BOOLEAN DEFAULT false,
  include_short_scout BOOLEAN DEFAULT false,
  include_weather BOOLEAN DEFAULT true,
  include_calendar BOOLEAN DEFAULT true,
  include_intention BOOLEAN DEFAULT true,
  
  -- Category-specific interests
  sports_teams TEXT,           -- "Heat, Yankees, Giants"
  tech_topics TEXT,            -- "vibe coding, Claude, AI agents"
  business_topics TEXT,        -- "Tesla, fintech, startups"
  politics_topics TEXT,        -- "economic policy, tech regulation"
  books_topics TEXT,           -- "sci-fi, business books"
  music_topics TEXT,           -- "electronic, jazz"
  gaming_topics TEXT,          -- "PlayStation, indie games"
  science_topics TEXT,         -- "space, climate"
  health_topics TEXT,          -- "nutrition, longevity"
  
  -- Free-form custom topics
  custom_topics TEXT,          -- Anything else the user wants
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE briefing_lab_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own lab preferences" ON briefing_lab_preferences
  FOR ALL USING (auth.uid() = user_id);
```

### Table: `briefing_scraped_data`
```sql
CREATE TABLE briefing_scraped_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  scraped_at TIMESTAMPTZ DEFAULT now(),
  data JSONB NOT NULL,
  sources_succeeded TEXT[] DEFAULT '{}',
  sources_failed TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE briefing_scraped_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own scraped data" ON briefing_scraped_data
  FOR ALL USING (auth.uid() = user_id);
```

### Table: `briefing_lab_episodes`
```sql
CREATE TABLE briefing_lab_episodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  generated_at TIMESTAMPTZ DEFAULT now(),
  podcast_url TEXT,
  script TEXT,
  duration_seconds INTEGER,
  categories_used TEXT[],
  scraped_data_id UUID REFERENCES briefing_scraped_data(id),
  status TEXT DEFAULT 'generating',
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE briefing_lab_episodes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own lab episodes" ON briefing_lab_episodes
  FOR ALL USING (auth.uid() = user_id);
```

## Edge Functions

### 1. `scrape-briefing-news/index.ts`
Uses Browserless.io to scrape authoritative sources based on user's enabled categories.

**Key scraping targets:**
- **Sports**: ESPN pages for user's specified teams
- **Tech/AI**: Hacker News (filtered by keywords), TechCrunch AI
- **Business**: Bloomberg, WSJ top stories
- **Trading/Markets**: Yahoo Finance, MarketWatch
- **Politics**: AP News, Reuters
- **Books**: NYT Book Review, Goodreads trending
- **Film/TV**: Variety, Hollywood Reporter
- **Music**: Billboard, Pitchfork
- **Gaming**: IGN, Polygon
- **Science**: Ars Technica, Science Daily
- **Health**: WebMD, Healthline trending

**Returns structured JSON:**
```json
{
  "scraped_at": "2026-02-05T06:30:00Z",
  "sports": {
    "heat": { "last_game": {...}, "next_game": {...}, "record": "28-24" }
  },
  "tech": {
    "ai_news": [{ "title": "...", "source": "...", "url": "..." }]
  },
  "markets": { "sp500": {...}, "dow": {...}, "headlines": [...] },
  "sources_succeeded": ["sports", "tech", "markets"],
  "sources_failed": []
}
```

### 2. `briefing-lab-generate/index.ts`
Main generation using Anthropic API:

```typescript
// Key differences from production:

// 1. Use Anthropic API instead of Lovable AI
const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'x-api-key': ANTHROPIC_API_KEY,
    'anthropic-version': '2023-06-01',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4000,
    messages: [{ role: 'user', content: prompt }]
  }),
});

// 2. Fetch user's lab preferences (categories + specific interests)
const { data: labPrefs } = await supabase
  .from('briefing_lab_preferences')
  .select('*')
  .eq('user_id', userId)
  .single();

// 3. Call scrape-briefing-news with user's enabled categories
const scrapedData = await supabase.functions.invoke('scrape-briefing-news', {
  body: { 
    userId,
    categories: getEnabledCategories(labPrefs),
    sports_teams: labPrefs.sports_teams,
    tech_topics: labPrefs.tech_topics,
    // ... etc
  }
});

// 4. Fetch Short Scout if enabled
if (labPrefs.include_short_scout) {
  const shortScoutResponse = await fetch(
    `${SHORT_SCOUT_URL}/rest/v1/rpc/get_tickers_data?section=tickers`,
    { headers: { 'apikey': SHORT_SCOUT_ANON_KEY } }
  );
  // Add top_searched, most_traded to prompt
}

// 5. Build prompt with STRICT anti-hallucination rules
const prompt = buildPromptFromScrapedData(scrapedData, labPrefs, shortScoutData);
```

### 3. `send-briefing-sms/index.ts` (or reuse existing pattern)
Sends SMS with briefing link after generation completes.

## Frontend Components

### `src/pages/MorningBriefingLab.tsx`
Main lab page with:
- Category toggle grid with interest inputs
- Location picker (zip code or geolocation - reusing existing pattern)
- Voice selector
- Generate button
- Audio player with transcript
- "Send SMS" button

### `src/hooks/useBriefingLab.ts`
```typescript
export function useBriefingLabPreferences() {
  // Fetch and mutate briefing_lab_preferences
}

export function useGenerateLabBriefing() {
  // Mutation to call briefing-lab-generate
}

export function useSendBriefingSms() {
  // Send SMS with podcast URL
}
```

## UI Layout

```text
┌─────────────────────────────────────────────────────────────────────────┐
│  Morning Briefing Lab                                         [Generate]│
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  📍 Location: [Enter zip code] [Set] or [Use Current Location]         │
│     Currently: Chicago, IL                                              │
│                                                                         │
│  ──────────────────────────────────────────────────────────────────────│
│                                                                         │
│  What would you like in your briefing?                                  │
│                                                                         │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐            │
│  │ ☑ Sports       │  │ ☑ Tech / AI    │  │ ☐ Business     │            │
│  │ [Heat, Yankees]│  │ [vibe coding,  │  │ [             ]│            │
│  │                │  │  Claude, AI]   │  │                │            │
│  └────────────────┘  └────────────────┘  └────────────────┘            │
│                                                                         │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐            │
│  │ ☑ Trading      │  │ ☐ Politics     │  │ ☐ Books        │            │
│  └────────────────┘  └────────────────┘  └────────────────┘            │
│                                                                         │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐            │
│  │ ☐ Film & TV    │  │ ☐ Music        │  │ ☐ Gaming       │            │
│  └────────────────┘  └────────────────┘  └────────────────┘            │
│                                                                         │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐            │
│  │ ☐ Science      │  │ ☐ Health       │  │ ☑ Short Scout  │            │
│  └────────────────┘  └────────────────┘  │ (trending stks)│            │
│                                          └────────────────┘            │
│                                                                         │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐            │
│  │ ☑ Weather      │  │ ☑ Calendar     │  │ ☑ Monthly Word │            │
│  └────────────────┘  └────────────────┘  └────────────────┘            │
│                                                                         │
│  ──────────────────────────────────────────────────────────────────────│
│                                                                         │
│  Anything else you'd like to know about?                                │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ I want to know about upcoming SpaceX launches and any news     │   │
│  │ about the new ChatGPT features...                               │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ──────────────────────────────────────────────────────────────────────│
│                                                                         │
│  🎧 Voice: [George (Default) ▼]                                        │
│                                                                         │
│  ═══════════════════════════════════════════════════════════════════   │
│                                                                         │
│  [▶ Audio Player ──────────────────────────────── 0:00 / 3:45]         │
│                                                                         │
│  📱 [Send SMS]                                                          │
│                                                                         │
│  ▼ View Transcript                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Good morning! It's Wednesday, February 5th...                   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## Secrets Required

| Secret | Purpose | Status |
|--------|---------|--------|
| `BROWSERLESS_API_KEY` | Web scraping | New - need to add |
| `ANTHROPIC_API_KEY` | Claude script generation | Already exists |
| `SHORT_SCOUT_URL` | Trending stocks API | Already exists |
| `SHORT_SCOUT_ANON_KEY` | Trending stocks API | Already exists |
| `ELEVENLABS_API_KEY` | TTS audio | Already exists |
| `TWILIO_*` credentials | SMS delivery | Already exists |

## File Summary

| File | Purpose |
|------|---------|
| `src/pages/MorningBriefingLab.tsx` | Lab page with category toggles and player |
| `src/hooks/useBriefingLab.ts` | Data fetching and mutations |
| `supabase/functions/scrape-briefing-news/index.ts` | Browserless web scraping |
| `supabase/functions/briefing-lab-generate/index.ts` | Anthropic-powered generation |
| `briefing_lab_preferences` table | User category preferences |
| `briefing_scraped_data` table | Cached scraped news |
| `briefing_lab_episodes` table | Generated lab briefings |

## Implementation Order

1. **Database**: Create the three new tables
2. **Secrets**: Add `BROWSERLESS_API_KEY`
3. **Edge Function**: `scrape-briefing-news` with Browserless integration
4. **Edge Function**: `briefing-lab-generate` with Anthropic + scraped data
5. **Frontend**: `useBriefingLab.ts` hook
6. **Frontend**: `MorningBriefingLab.tsx` page
7. **Routing**: Add `/morning-briefing` route in App.tsx
