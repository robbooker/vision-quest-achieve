

# Morning Briefing: Dual-Source News (Tavily + ESPN)

This plan replaces Perplexity with two specialized sources: **Tavily** for general/financial news and **ESPN** for verified sports scores, addressing the accuracy issues with stale data and missed games.

---

## Summary of Changes

| Source | Purpose | Data Type |
|--------|---------|-----------|
| **Tavily API** | General news, financial news, tech topics | Headlines, facts, AI-generated summaries |
| **ESPN API** | Sports scores and highlights | Yesterday's verified game results |

---

## Why This Dual Approach Works

| Problem | Current Behavior | New Behavior |
|---------|-----------------|--------------|
| Heat game missed | Perplexity says "no updates" | ESPN API fetches actual 112-98 score |
| Juan Soto roster error | AI hallucinates outdated data | ESPN provides verified team/player data |
| Fluffy commentary | "It sounds like you're diving deep..." | Tavily returns factual headlines only |

---

## Technical Implementation

### 1. Add Tavily API Key Secret

The user provided the key: `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`

This will be added as a secret named `TAVILY_API_KEY`.

### 2. Sports Detection Logic

Scan the user's topic instructions for sports keywords:

```typescript
const sportsPatterns = {
  nba: /\b(nba|heat|lakers|celtics|knicks|warriors|nets|bucks|76ers|suns|mavs|spurs)\b/i,
  mlb: /\b(mlb|yankees|mets|dodgers|red sox|cubs|astros|braves|phillies|padres|angels)\b/i,
  nfl: /\b(nfl|giants|jets|cowboys|eagles|patriots|chiefs|bills|dolphins|ravens|49ers)\b/i,
  nhl: /\b(nhl|rangers|devils|islanders|bruins|penguins|blackhawks|maple leafs|canadiens)\b/i,
};

const detectedSports: string[] = [];
if (sportsPatterns.nba.test(topicInstructions)) detectedSports.push('nba');
if (sportsPatterns.mlb.test(topicInstructions)) detectedSports.push('mlb');
// etc.
```

### 3. ESPN API Integration

ESPN provides free, unauthenticated scoreboard APIs:

```text
NBA: https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=YYYYMMDD
MLB: https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard?dates=YYYYMMDD
NFL: https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates=YYYYMMDD
```

**Yesterday's Games Logic:**
```typescript
const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);
const dateStr = yesterday.toISOString().slice(0, 10).replace(/-/g, ''); // "20260203"
```

**Team Matching:**
```typescript
// Find games involving teams the user cares about
const relevantGames = allGames.filter(game => 
  game.competitions[0].competitors.some(team => 
    topicInstructions.toLowerCase().includes(team.team.displayName.toLowerCase())
  )
);
```

**Formatted Output:**
```text
Heat 112, Hornets 98 (Final) - 20th anniversary celebration at halftime
Yankees Spring Training: Pitchers and catchers report in 7 days
```

### 4. Tavily API Integration

Tavily replaces Perplexity for non-sports news. Key features:
- `topic: "news"` for real-time news results
- `time_range: "day"` for recent stories
- `include_answer: true` for AI-synthesized summary
- Returns verified sources with URLs

**API Call (REST, not SDK in Deno):**
```typescript
const TAVILY_API_KEY = Deno.env.get('TAVILY_API_KEY');

// Filter out sports topics (handled by ESPN)
const nonSportsInstructions = topicInstructions
  .replace(/\b(yankees|heat|nba|mlb|nfl|etc)\b/gi, '')
  .trim();

const tavilyResponse = await fetch('https://api.tavily.com/search', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${TAVILY_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    query: nonSportsInstructions,
    topic: 'news',           // Optimized for news queries
    time_range: 'day',       // Last 24 hours
    max_results: 5,
    include_answer: true,    // Get AI summary
    search_depth: 'basic',   // 1 credit per search
  }),
});

const tavilyData = await tavilyResponse.json();
// tavilyData.answer = AI-generated summary
// tavilyData.results = [{title, url, content, score}]
```

---

## Data Flow Diagram

```text
User Topic Instructions
"New York Yankees, Miami Heat scores, SMCI earnings, FDA biotech approvals"
                            │
            ┌───────────────┴───────────────┐
            ▼                               ▼
    Sports Detection              Non-Sports Topics
    (Yankees, Heat)             (SMCI, FDA biotech)
            │                               │
            ▼                               ▼
       ESPN APIs                     Tavily Search
    (yesterday's games)           (topic: "news")
            │                               │
            ▼                               ▼
  "Heat 112-98 (W)"            "SMCI up 8% on earnings..."
  "Yankees: 7 days to ST"      "FDA approves new drug..."
            │                               │
            └───────────────┬───────────────┘
                            ▼
                    Claude Script Gen
             (with anti-hallucination rules)
                            ▼
             Final briefing with verified data
```

---

## Anti-Hallucination Rules for Claude

Add explicit instructions to prevent fabricating data:

```text
**FACTUAL ACCURACY RULES:**
- Today is [CURRENT DATE]. DO NOT reference outdated information.
- ONLY report information from the data provided below.
- For sports: Use ONLY the ESPN scores provided. Never guess current rosters.
- For news: Use ONLY the Tavily headlines provided. Include key numbers when available.
- If no data is provided for a topic, say "I don't have updates on [topic] this morning."
- NEVER say "things seem quiet" when data is simply unavailable.
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/briefing-generate/index.ts` | (1) Add Tavily API call, (2) Add ESPN API calls for detected sports, (3) Split topic routing, (4) Add date context + accuracy rules |

---

## Example Output Comparison

**Before (Perplexity only):**
> "I don't have any specific updates on the Miami Heat for you today."
> "Juan Soto and Aaron Judge are right up there at the top..."

**After (Tavily + ESPN):**
> "Your Heat took care of business last night, beating the Hornets 112 to 98. The game featured a special halftime celebration for the 20th anniversary of Miami's first championship."
> "In Yankees news, pitchers and catchers report in just one week for spring training. The team is looking to add depth around Aaron Judge with targets including Paul Goldschmidt and Ty France."
> "On the financial front, SMCI shares jumped 8% after beating earnings expectations, reporting revenue of 5.2 billion dollars for the quarter."

---

## API Credits & Costs

| Service | Cost | Usage |
|---------|------|-------|
| Tavily | 1 credit/search (1000 free/month) | ~1 search per briefing |
| ESPN | Free, no auth required | ~2-4 calls per briefing |
| Perplexity | Replaced | No longer used for briefings |

