

# Morning Briefing: Claude Web Search Integration

## Overview

Replace the current multi-step scraping pipeline (Tavily + Browserless) with **Claude Sonnet 4.5's native web search tool**. This gives Claude direct access to real-time web content for both research and writing, resulting in more specific, contextual, and well-cited news coverage.

---

## Current Architecture

```text
┌─────────────────────────────────────────────────────────────────┐
│                    briefing-lab-generate                        │
├─────────────────────────────────────────────────────────────────┤
│  1. Fetch user preferences                                      │
│  2. Call scrape-briefing-news (Tavily + Browserless)            │
│  3. Build prompt with scraped data                              │
│  4. Claude Sonnet 4.0 writes script (NO web access)             │
│  5. ElevenLabs generates audio                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     scrape-briefing-news                        │
├─────────────────────────────────────────────────────────────────┤
│  • Tavily API for most categories                               │
│  • Browserless for ESPN/Athletic (sports)                       │
│  • ESPN API for scores                                          │
│  • ~700 lines of scraping logic                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Issues with current approach:**
- Generic headlines from Tavily ("There is a lot of buzz...")
- Browserless has concurrency limits and parsing issues
- Claude writes from scraped snippets—can't verify or dig deeper
- Two separate API calls before Claude even sees the data

---

## New Architecture

```text
┌─────────────────────────────────────────────────────────────────┐
│                    briefing-lab-generate                        │
├─────────────────────────────────────────────────────────────────┤
│  1. Fetch user preferences                                      │
│  2. Fetch calendar/weather/Short Scout (keep these)             │
│  3. Single Claude Sonnet 4.5 call with web_search tool          │
│     • Claude searches for each enabled category                 │
│     • Claude writes script with cited sources                   │
│  4. ElevenLabs generates audio                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Benefits:**
- Claude decides what to search and can refine queries
- Real-time web content with proper citations
- More specific, contextual headlines
- Single API call instead of scraper + writer

---

## Implementation Plan

### Step 1: Update `briefing-lab-generate` Function

**Changes:**

1. **Remove** the call to `scrape-briefing-news`
2. **Upgrade model** to `claude-sonnet-4-5-20250929` (Sonnet 4.5)
3. **Add web search tool** to the Claude API request
4. **Restructure prompt** to instruct Claude to:
   - Search for news in each enabled category
   - Use user's specific topics (teams, interests)
   - Write the briefing script with proper citations

**Web Search Configuration:**
```typescript
tools: [{
  type: "web_search_20250305",
  name: "web_search",
  max_uses: 15,  // Allow multiple searches across categories
  user_location: {
    type: "approximate",
    city: prefs.location_name || "Chicago",
    region: "Illinois",
    country: "US",
    timezone: "America/Chicago"
  }
}]
```

### Step 2: Restructure the Prompt

**Current prompt:** "Here's scraped data, write a script from it"

**New prompt structure:**
```
You are creating a personalized morning briefing podcast for [userName].
Today is [day], [date].

You have access to a web search tool. Use it to research REAL, CURRENT news.

ENABLED CATEGORIES (search for each):
- Sports (FULL): Search for "Miami Heat latest news today", "New York Yankees news today"
- Tech/AI (BRIEF): Search for top AI news
- Business (OFF): Skip this category

For each category, search for the most recent and relevant stories,
then synthesize into a conversational podcast script.

Target: [X] words for [Y]-minute briefing.
Include: [weather data], [calendar events], [Short Scout data if enabled]

Write the script now, using ONLY information from your web searches.
```

### Step 3: Handle the Response

Claude's response with web search will include:
- `server_tool_use` blocks (the searches performed)
- `web_search_tool_result` blocks (results returned)
- Final text with `citations` linking to sources

**Extract and store:**
- The final script text (for TTS)
- Citations for potential display
- Search queries used (for debugging)

### Step 4: Keep What Works

**Preserve these data sources** (not web-searchable):
- **Weather:** Open-Meteo API (fast, free, accurate)
- **Calendar:** Google Calendar API (user's private data)
- **Short Scout:** Internal trading data API
- **Monthly Intention:** User's personal data from Supabase

These will still be fetched and included in the prompt as structured data.

---

## Technical Details

### Model Change
```typescript
// Before
model: 'claude-sonnet-4-20250514'  // Sonnet 4.0

// After  
model: 'claude-sonnet-4-5-20250929'  // Sonnet 4.5
```

### API Request Structure
```typescript
const aiResponse = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'x-api-key': ANTHROPIC_API_KEY,
    'anthropic-version': '2023-06-01',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 4000,
    messages: [{ role: 'user', content: prompt }],
    tools: [{
      type: 'web_search_20250305',
      name: 'web_search',
      max_uses: 15,
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
```

### Response Parsing
```typescript
const aiData = await aiResponse.json();

// Find the final text content (after all searches)
const textBlocks = aiData.content.filter(
  (block: any) => block.type === 'text'
);
const script = textBlocks.map((b: any) => b.text).join('');

// Extract citations for logging/display
const citations = textBlocks
  .flatMap((b: any) => b.citations || [])
  .map((c: any) => ({ url: c.url, title: c.title, cited_text: c.cited_text }));
```

### Search Budget

With 11 possible news categories and `max_uses: 15`:
- Claude can search 1-2 times per enabled category
- Plus follow-up searches for specific topics
- ESPN scores will still come from the ESPN API (kept)

### Pricing Impact

| Service | Current Cost | New Cost |
|---------|--------------|----------|
| Tavily | ~$0.01/search | $0 (removed) |
| Browserless | ~$0.10/request | $0 (removed) |
| Claude Web Search | $0 | $0.15 (15 searches × $0.01) |
| Claude Tokens | ~$0.02 | ~$0.04 (slightly more) |
| **Total** | ~$0.15-0.25 | ~$0.19 |

Roughly similar cost, much better quality.

---

## Files to Modify

1. **`supabase/functions/briefing-lab-generate/index.ts`**
   - Remove scrape-briefing-news call
   - Add web search tool configuration
   - Update model to Sonnet 4.5
   - Restructure prompt for search-first approach
   - Parse response with citations

2. **No changes needed to:**
   - `scrape-briefing-news` (will remain but not be called for this test)
   - Frontend components
   - Database schema

---

## Rollback Plan

If web search doesn't work well:
- The `scrape-briefing-news` function remains intact
- Simply revert `briefing-lab-generate` to call it again
- Switch model back to Sonnet 4.0

---

## Expected Outcome

After implementation:
- **More specific sports headlines** (actual game results, player news)
- **Current tech news** with proper context
- **Claude verifies and cross-references** information
- **Cited sources** in the response for transparency
- **Single API call** instead of scraper → writer pipeline

