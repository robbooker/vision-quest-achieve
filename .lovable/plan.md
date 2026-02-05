

# Browserless-First News Scraping Architecture

## Overview
Replace Tavily dependency with a curated Browserless scraping strategy. Each news category will target specific, trusted sources with tailored CSS selectors for reliable content extraction.

## Current State
- **ESPN**: Already uses Browserless for team pages + ESPN API for scores (working well)
- **All other categories**: Use Tavily search API for general queries
- **Fallbacks**: Tavily is used when ESPN fails or for soccer teams

## Updated Source Mapping (Per User Request)

| Category | Primary Sources | Notes |
|----------|----------------|-------|
| **Sports** | ESPN (existing) + **The Athletic** | Athletic for premium analysis/features |
| **Tech/AI** | Hacker News, TechCrunch | Headlines + article titles |
| **Business** | Yahoo Finance, **Bloomberg** | Top stories, market news |
| **Trading/Markets** | **Bloomberg**, Yahoo Finance, MarketWatch | Market movers, headlines |
| **Science** | Phys.org, ScienceDaily | Latest discoveries |
| **Health** | Healthline, Medical News Today | Trending articles |
| **Politics** | **Reuters**, AP News | Top political stories |
| **Books** | Goodreads, BookRiot | New releases |
| **Film/TV** | Variety, Deadline | Entertainment headlines |
| **Music** | Pitchfork, Billboard | Music news |
| **Gaming** | IGN, Kotaku | Game news |
| **Custom Topics** | Google News search | Fallback for user queries |

## Implementation Architecture

```text
+-------------------+      +--------------------+      +------------------+
|  briefing-lab-    | ---> | scrape-briefing-   | ---> | Browserless API  |
|  generate         |      | news               |      | (Headless Chrome)|
+-------------------+      +--------------------+      +------------------+
                                    |
                                    v
                           +------------------------+
                           | Category-Specific      |
                           | Scrapers:              |
                           | - scrapeSportsNews()   |  <- ESPN + The Athletic
                           | - scrapeTechNews()     |  <- HN + TechCrunch
                           | - scrapeBusinessNews() |  <- Bloomberg + Yahoo
                           | - scrapeTradingNews()  |  <- Bloomberg + MarketWatch
                           | - scrapePoliticsNews() |  <- Reuters + AP
                           | - scrapeScienceNews()  |
                           | - scrapeHealthNews()   |
                           | - scrapeCustomTopics() |  <- Google News fallback
                           +------------------------+
```

## Technical Details

### New Browserless Scraper Functions

Each function will call the Browserless `/scrape` endpoint with site-specific CSS selectors:

**`scrapeAthleticNews(teamName: string)`** - NEW
- URL: `https://theathletic.com/search/?q=${teamName}`
- Selectors: `.article-card__title a`, `.headline a`
- Note: The Athletic has a paywall but headlines are visible

**`scrapeBloombergNews(category: 'business' | 'markets')`** - NEW
- Business URL: `https://www.bloomberg.com/`
- Markets URL: `https://www.bloomberg.com/markets`
- Selectors: `[data-component="headline"] a`, `.story-package-module__headline a`
- Note: Bloomberg may require handling anti-bot measures

**`scrapeReutersPolitics()`** - NEW
- URL: `https://www.reuters.com/world/us/`
- Selectors: `[data-testid="Heading"] a`, `.media-story-card__headline a`

**`scrapeTechNews(topics?: string)`**
- Primary: `https://news.ycombinator.com`
- Secondary: `https://techcrunch.com/category/artificial-intelligence/`
- Selectors: `.titleline a` for HN, `.post-block__title a` for TechCrunch

**`scrapeScienceNews(topics?: string)`**
- Primary: `https://phys.org/`
- Selectors: `.news-link`, `.sorted-articles-list a`

**`scrapeHealthNews(topics?: string)`**
- Primary: `https://www.healthline.com/health-news`
- Selectors: Article card links

**`scrapeCustomTopics(query: string)`** - Fallback
- URL: `https://news.google.com/search?q=${query}&hl=en-US`
- Selectors: Article cards in Google News results

### Browserless Request Pattern

```javascript
async function scrapeWithBrowserless(url: string, selector: string): Promise<Array<{title: string, url: string}>> {
  const BROWSERLESS_API_KEY = Deno.env.get('BROWSERLESS_API_KEY');
  
  const response = await fetch(`https://chrome.browserless.io/scrape?token=${BROWSERLESS_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url,
      elements: [{ selector, timeout: 15000 }],
      waitFor: 3000,
      gotoOptions: { waitUntil: 'networkidle0' }
    })
  });
  
  // Parse and return headlines...
}
```

### Sports: ESPN + The Athletic

The current ESPN scraping stays intact. We add The Athletic as a secondary source for richer analysis:

```javascript
// In sports scraping logic
if (categories.sports && body.sports_teams) {
  for (const team of teams) {
    // 1. Get ESPN game scores (existing)
    const gameScore = await getESPNGameScore(mapping.slug, mapping.league);
    
    // 2. Get ESPN headlines (existing)
    const espnHeadlines = await scrapeESPNTeamNews(mapping.league, mapping.espnSlug);
    
    // 3. NEW: Get The Athletic analysis
    const athleticHeadlines = await scrapeAthleticNews(mapping.fullName);
    
    // Combine: ESPN for scores/news, Athletic for features
    teamData.headlines = [...espnHeadlines, ...athleticHeadlines].slice(0, 5);
  }
}
```

### Fallback & Caching Strategy

Since selectors can break:
1. **Cache successful scrapes** in `briefing_scraped_data` table (already exists)
2. **Stale-while-revalidate**: If fresh scrape fails, use cached data within 6 hours
3. **Google News fallback**: For custom topics or when all sources fail

## File Changes

### Modified File
**`supabase/functions/scrape-briefing-news/index.ts`**
- Remove `fetchNewsWithTavily` and `fetchSportsNewsWithTavily` functions
- Add new Browserless scrapers:
  - `scrapeAthleticNews(teamName)`
  - `scrapeBloombergNews(category)`
  - `scrapeReutersPolitics()`
  - `scrapeTechNews(topics)`
  - `scrapeScienceNews(topics)`
  - `scrapeHealthNews(topics)`
  - `scrapeGoogleNews(query)` (fallback)
- Update main handler to use category-specific scrapers
- Keep ESPN integration as-is (already working)

## Benefits

1. **Curated sources**: Bloomberg, The Athletic, Reuters are premium sources
2. **Consistency**: Same extraction logic every run (no search ranking variance)
3. **Cost reduction**: Removes Tavily API dependency
4. **Full control**: We choose exactly which sites to trust

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Bloomberg/Athletic paywalls | Scrape visible headlines only; paywall content won't render |
| Selector changes | Monitor `sources_failed`; keep Google News as fallback |
| Rate limiting | Add delays between requests; use caching |
| Browserless timeouts | Parallel scraping with individual try/catch |

## Rollout Phases

1. **Phase 1**: Add The Athletic for sports (alongside ESPN)
2. **Phase 2**: Add Bloomberg for business/trading
3. **Phase 3**: Add Reuters for politics
4. **Phase 4**: Replace remaining Tavily calls with Browserless (Tech, Science, Health)
5. **Phase 5**: Add Google News as universal fallback
6. **Phase 6**: Remove all Tavily code

