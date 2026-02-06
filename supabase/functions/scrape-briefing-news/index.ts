import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScrapeRequest {
  categories: {
    sports?: boolean;
    tech?: boolean;
    business?: boolean;
    trading?: boolean;
    politics?: boolean;
    books?: boolean;
    film_tv?: boolean;
    music?: boolean;
    gaming?: boolean;
    science?: boolean;
    health?: boolean;
  };
  sports_teams?: string;
  tech_topics?: string;
  business_topics?: string;
  science_topics?: string;
  health_topics?: string;
  politics_topics?: string;
  music_topics?: string;
  gaming_topics?: string;
  books_topics?: string;
  custom_topics?: string;
}

interface ScrapedData {
  scraped_at: string;
  sports: Record<string, any>;
  tech: {
    ai_news: Array<{ title: string; source: string; url: string }>;
    general_tech: Array<{ title: string; source: string; url: string }>;
  };
  business: Array<{ title: string; source: string; url: string }>;
  science: Array<{ title: string; source: string; url: string }>;
  health: Array<{ title: string; source: string; url: string }>;
  politics: Array<{ title: string; source: string; url: string }>;
  trading: Array<{ title: string; source: string; url: string }>;
  books: Array<{ title: string; source: string; url: string }>;
  film_tv: Array<{ title: string; source: string; url: string }>;
  music: Array<{ title: string; source: string; url: string }>;
  gaming: Array<{ title: string; source: string; url: string }>;
  markets: {
    headlines: Array<string>;
  };
  custom: Array<{ title: string; source: string; url: string }>;
  sources_succeeded: string[];
  sources_failed: string[];
}

// Team mappings with ESPN slugs and full names for news search
const TEAM_MAPPINGS: Record<string, { slug: string; league: string; espnSlug: string; fullName: string }> = {
  'heat': { slug: 'mia', league: 'nba', espnSlug: 'mia/miami-heat', fullName: 'Miami Heat' },
  'miami heat': { slug: 'mia', league: 'nba', espnSlug: 'mia/miami-heat', fullName: 'Miami Heat' },
  'yankees': { slug: 'nyy', league: 'mlb', espnSlug: 'nyy/new-york-yankees', fullName: 'New York Yankees' },
  'new york yankees': { slug: 'nyy', league: 'mlb', espnSlug: 'nyy/new-york-yankees', fullName: 'New York Yankees' },
  'giants': { slug: 'nyg', league: 'nfl', espnSlug: 'nyg/new-york-giants', fullName: 'New York Giants' },
  'jets': { slug: 'nyj', league: 'nfl', espnSlug: 'nyj/new-york-jets', fullName: 'New York Jets' },
  'dolphins': { slug: 'mia', league: 'nfl', espnSlug: 'mia/miami-dolphins', fullName: 'Miami Dolphins' },
  'miami dolphins': { slug: 'mia', league: 'nfl', espnSlug: 'mia/miami-dolphins', fullName: 'Miami Dolphins' },
  'celtics': { slug: 'bos', league: 'nba', espnSlug: 'bos/boston-celtics', fullName: 'Boston Celtics' },
  'lakers': { slug: 'lal', league: 'nba', espnSlug: 'lal/los-angeles-lakers', fullName: 'Los Angeles Lakers' },
  'mets': { slug: 'nym', league: 'mlb', espnSlug: 'nym/new-york-mets', fullName: 'New York Mets' },
  'dodgers': { slug: 'lad', league: 'mlb', espnSlug: 'lad/los-angeles-dodgers', fullName: 'Los Angeles Dodgers' },
  'cubs': { slug: 'chc', league: 'mlb', espnSlug: 'chc/chicago-cubs', fullName: 'Chicago Cubs' },
  'bulls': { slug: 'chi', league: 'nba', espnSlug: 'chi/chicago-bulls', fullName: 'Chicago Bulls' },
  'bears': { slug: 'chi', league: 'nfl', espnSlug: 'chi/chicago-bears', fullName: 'Chicago Bears' },
  'warriors': { slug: 'gs', league: 'nba', espnSlug: 'gs/golden-state-warriors', fullName: 'Golden State Warriors' },
  'knicks': { slug: 'ny', league: 'nba', espnSlug: 'ny/new-york-knicks', fullName: 'New York Knicks' },
  'red sox': { slug: 'bos', league: 'mlb', espnSlug: 'bos/boston-red-sox', fullName: 'Boston Red Sox' },
  'patriots': { slug: 'ne', league: 'nfl', espnSlug: 'ne/new-england-patriots', fullName: 'New England Patriots' },
  'cowboys': { slug: 'dal', league: 'nfl', espnSlug: 'dal/dallas-cowboys', fullName: 'Dallas Cowboys' },
  '49ers': { slug: 'sf', league: 'nfl', espnSlug: 'sf/san-francisco-49ers', fullName: 'San Francisco 49ers' },
  'eagles': { slug: 'phi', league: 'nfl', espnSlug: 'phi/philadelphia-eagles', fullName: 'Philadelphia Eagles' },
  'chiefs': { slug: 'kc', league: 'nfl', espnSlug: 'kc/kansas-city-chiefs', fullName: 'Kansas City Chiefs' },
  // Soccer / international teams
  'bayern': { slug: 'bayern', league: 'soccer', espnSlug: '', fullName: 'Bayern Munich' },
  'bayern munich': { slug: 'bayern', league: 'soccer', espnSlug: '', fullName: 'Bayern Munich' },
  'bayern munic': { slug: 'bayern', league: 'soccer', espnSlug: '', fullName: 'Bayern Munich' },
  'manchester united': { slug: 'manu', league: 'soccer', espnSlug: '', fullName: 'Manchester United' },
  'man united': { slug: 'manu', league: 'soccer', espnSlug: '', fullName: 'Manchester United' },
  'liverpool': { slug: 'liv', league: 'soccer', espnSlug: '', fullName: 'Liverpool FC' },
  'chelsea': { slug: 'che', league: 'soccer', espnSlug: '', fullName: 'Chelsea FC' },
  'real madrid': { slug: 'rma', league: 'soccer', espnSlug: '', fullName: 'Real Madrid' },
  'barcelona': { slug: 'bar', league: 'soccer', espnSlug: '', fullName: 'FC Barcelona' },
  'inter miami': { slug: 'mia', league: 'mls', espnSlug: '', fullName: 'Inter Miami CF' },
};

// ========== TAVILY + BROWSERLESS SCRAPER UTILITIES ==========

interface ScrapedHeadline {
  title: string;
  url: string;
  source: string;
}

// Primary news search using Tavily API (more reliable than web scraping)
async function searchWithTavily(
  query: string,
  maxResults = 5
): Promise<ScrapedHeadline[]> {
  const TAVILY_API_KEY = Deno.env.get('TAVILY_API_KEY');
  if (!TAVILY_API_KEY) {
    console.log('TAVILY_API_KEY not configured, falling back to Browserless');
    return [];
  }

  try {
    console.log(`Tavily search: ${query}`);
    
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: TAVILY_API_KEY,
        query,
        search_depth: 'basic',
        max_results: maxResults,
        include_domains: [],
        exclude_domains: []
      })
    });

    if (!response.ok) {
      console.error(`Tavily error: ${response.status}`);
      return [];
    }

    const data = await response.json();
    const results = data.results || [];
    
    const headlines: ScrapedHeadline[] = results
      .filter((r: any) => r.title && r.title.length > 10)
      .slice(0, maxResults)
      .map((r: any) => ({
        title: r.title,
        url: r.url,
        source: new URL(r.url).hostname.replace('www.', '')
      }));

    console.log(`Tavily found ${headlines.length} results for: ${query}`);
    return headlines;
  } catch (e) {
    console.error(`Tavily search error:`, e);
    return [];
  }
}

// Fallback: Generic Browserless scrape helper (v2 API)
async function scrapeWithBrowserless(
  url: string, 
  selector: string,
  source: string,
  timeout = 15000,
  waitFor = 3000
): Promise<ScrapedHeadline[]> {
  const BROWSERLESS_API_KEY = Deno.env.get('BROWSERLESS_API_KEY');
  if (!BROWSERLESS_API_KEY) {
    console.log('BROWSERLESS_API_KEY not configured');
    return [];
  }

  try {
    console.log(`Browserless v2 scraping: ${url} with selector: ${selector}`);
    
    // Browserless v2 API endpoint
    const response = await fetch(`https://production-sfo.browserless.io/scrape?token=${BROWSERLESS_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url,
        elements: [{ selector }],
        gotoOptions: { 
          waitUntil: 'networkidle0',
          timeout 
        },
        waitForSelector: {
          selector,
          timeout: waitFor
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Browserless error for ${url}:`, response.status, errorText.substring(0, 200));
      return [];
    }

    const data = await response.json();
    // v2 API returns data in a slightly different format
    const elements = data.data?.[0]?.results || data.elements?.[0]?.results || [];
    
    const headlines: ScrapedHeadline[] = [];
    const seenTitles = new Set<string>();

    for (const el of elements) {
      const text = el.text?.trim();
      const href = el.attributes?.find((a: any) => a.name === 'href')?.value;
      
      // Filter out short/long titles and duplicates
      if (text && text.length > 15 && text.length < 300 && !seenTitles.has(text.toLowerCase())) {
        seenTitles.add(text.toLowerCase());
        
        // Resolve relative URLs
        let fullUrl = href || url;
        if (href && !href.startsWith('http')) {
          const baseUrl = new URL(url);
          fullUrl = href.startsWith('/') ? `${baseUrl.origin}${href}` : `${baseUrl.origin}/${href}`;
        }
        
        headlines.push({ title: text, url: fullUrl, source });
        
        if (headlines.length >= 5) break;
      }
    }

    console.log(`Found ${headlines.length} headlines from ${source}`);
    return headlines;
  } catch (e) {
    console.error(`Browserless scrape error for ${url}:`, e);
    return [];
  }
}

// ========== ESPN SCRAPERS (EXISTING) ==========

// Scrape ESPN team page with Browserless
async function scrapeESPNTeamNews(league: string, espnSlug: string): Promise<ScrapedHeadline[]> {
  let espnLeaguePath: string;
  switch (league.toLowerCase()) {
    case 'nba': espnLeaguePath = 'nba'; break;
    case 'mlb': espnLeaguePath = 'mlb'; break;
    case 'nfl': espnLeaguePath = 'nfl'; break;
    case 'nhl': espnLeaguePath = 'nhl'; break;
    default: return [];
  }

  const teamUrl = `https://www.espn.com/${espnLeaguePath}/team/_/name/${espnSlug}`;
  return scrapeWithBrowserless(
    teamUrl,
    'article.contentItem a, .headlineStack a, .contentItem__content a',
    'espn.com'
  );
}

// Get yesterday's game score from ESPN API
async function getESPNGameScore(teamSlug: string, league: string): Promise<any> {
  try {
    let sport: string;
    switch (league.toLowerCase()) {
      case 'nba': sport = 'basketball/nba'; break;
      case 'mlb': sport = 'baseball/mlb'; break;
      case 'nfl': sport = 'football/nfl'; break;
      case 'nhl': sport = 'hockey/nhl'; break;
      default: return null;
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().slice(0, 10).replace(/-/g, '');

    const apiUrl = `https://site.api.espn.com/apis/site/v2/sports/${sport}/scoreboard?dates=${dateStr}`;
    const apiResponse = await fetch(apiUrl);
    
    if (!apiResponse.ok) return null;

    const data = await apiResponse.json();
    const events = data.events || [];
    
    for (const event of events) {
      const competitors = event.competitions?.[0]?.competitors || [];
      const teamInGame = competitors.find((c: any) => 
        c.team.abbreviation.toLowerCase() === teamSlug.toLowerCase() ||
        c.team.displayName.toLowerCase().includes(teamSlug.toLowerCase())
      );
      
      if (teamInGame) {
        const home = competitors.find((c: any) => c.homeAway === 'home');
        const away = competitors.find((c: any) => c.homeAway === 'away');
        
        return {
          date: new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          opponent: teamInGame.homeAway === 'home' ? away?.team.shortDisplayName : home?.team.shortDisplayName,
          score: `${away?.score}-${home?.score}`,
          result: teamInGame.winner ? 'W' : 'L'
        };
      }
    }

    return null;
  } catch (e) {
    console.error(`Error getting ESPN score for ${teamSlug}:`, e);
    return null;
  }
}

// ========== NEW BROWSERLESS SCRAPERS ==========

// The Athletic - Sports analysis and features
async function scrapeAthleticNews(teamName: string): Promise<ScrapedHeadline[]> {
  const searchQuery = encodeURIComponent(teamName);
  const url = `https://theathletic.com/search/?q=${searchQuery}`;
  
  return scrapeWithBrowserless(
    url,
    '.article-card__title a, .search-results__item a, [data-testid="article-card"] a',
    'theathletic.com',
    15000,
    4000  // Athletic needs more time to load search results
  );
}

// Tech News - Hacker News
async function scrapeHackerNews(): Promise<ScrapedHeadline[]> {
  return scrapeWithBrowserless(
    'https://news.ycombinator.com',
    '.titleline a',
    'news.ycombinator.com',
    10000,
    2000
  );
}

// Tech News - TechCrunch
async function scrapeTechCrunch(topics?: string): Promise<ScrapedHeadline[]> {
  const url = topics 
    ? `https://techcrunch.com/search/${encodeURIComponent(topics)}`
    : 'https://techcrunch.com/category/artificial-intelligence/';
  
  return scrapeWithBrowserless(
    url,
    '.post-block__title a, .river-byline__title a, article h2 a',
    'techcrunch.com',
    12000,
    3000
  );
}

// Business News - Bloomberg
async function scrapeBloombergNews(category: 'business' | 'markets'): Promise<ScrapedHeadline[]> {
  const url = category === 'markets' 
    ? 'https://www.bloomberg.com/markets'
    : 'https://www.bloomberg.com/';
  
  return scrapeWithBrowserless(
    url,
    '[data-component="headline"] a, .story-package-module__headline a, .single-story-module__headline a, article a[href*="/news/"]',
    'bloomberg.com',
    15000,
    4000
  );
}

// Business News - Yahoo Finance
async function scrapeYahooFinance(): Promise<ScrapedHeadline[]> {
  return scrapeWithBrowserless(
    'https://finance.yahoo.com/topic/stock-market-news/',
    '.stream-item a, .js-content-viewer, [data-test="quoteLink"]',
    'finance.yahoo.com',
    12000,
    3000
  );
}

// Trading/Markets - MarketWatch
async function scrapeMarketWatch(): Promise<ScrapedHeadline[]> {
  return scrapeWithBrowserless(
    'https://www.marketwatch.com/latest-news',
    '.article__headline a, .story__headline a, .latestNews__headline a',
    'marketwatch.com',
    12000,
    3000
  );
}

// Politics News - Reuters
async function scrapeReutersPolitics(): Promise<ScrapedHeadline[]> {
  return scrapeWithBrowserless(
    'https://www.reuters.com/world/us/',
    '[data-testid="Heading"] a, .media-story-card__headline a, article a[href*="/world/"]',
    'reuters.com',
    15000,
    4000
  );
}

// Politics News - AP News
async function scrapeAPNews(): Promise<ScrapedHeadline[]> {
  return scrapeWithBrowserless(
    'https://apnews.com/politics',
    '.PagePromo-title a, .PageList-items-item a, [data-key="card-headline"] a',
    'apnews.com',
    12000,
    3000
  );
}

// Science News - Phys.org
async function scrapePhysOrg(topics?: string): Promise<ScrapedHeadline[]> {
  const url = topics 
    ? `https://phys.org/search/?search=${encodeURIComponent(topics)}`
    : 'https://phys.org/';
  
  return scrapeWithBrowserless(
    url,
    '.news-link, .sorted-articles-list a, article.sorted-article a',
    'phys.org',
    12000,
    3000
  );
}

// Science News - ScienceDaily
async function scrapeScienceDaily(): Promise<ScrapedHeadline[]> {
  return scrapeWithBrowserless(
    'https://www.sciencedaily.com/',
    '.latest-head a, #featured_articles a, .story-headline a',
    'sciencedaily.com',
    12000,
    3000
  );
}

// Health News - Healthline
async function scrapeHealthline(): Promise<ScrapedHeadline[]> {
  return scrapeWithBrowserless(
    'https://www.healthline.com/health-news',
    '.css-1jytyml a, article a[href*="/health-news/"], .article-card a',
    'healthline.com',
    12000,
    3000
  );
}

// Health News - Medical News Today
async function scrapeMedicalNewsToday(): Promise<ScrapedHeadline[]> {
  return scrapeWithBrowserless(
    'https://www.medicalnewstoday.com/news',
    '.css-1izdjxi a, article a[href*="/articles/"], .card a',
    'medicalnewstoday.com',
    12000,
    3000
  );
}

// Entertainment - Variety (Film/TV)
async function scrapeVariety(): Promise<ScrapedHeadline[]> {
  return scrapeWithBrowserless(
    'https://variety.com/v/tv/',
    '.c-title a, .lrv-u-color-brand-primary, article h3 a',
    'variety.com',
    12000,
    3000
  );
}

// Entertainment - Deadline (Film/TV)
async function scrapeDeadline(): Promise<ScrapedHeadline[]> {
  return scrapeWithBrowserless(
    'https://deadline.com/',
    '.c-title a, article h2 a, .pmc-list-item a',
    'deadline.com',
    12000,
    3000
  );
}

// Music - Pitchfork
async function scrapePitchfork(): Promise<ScrapedHeadline[]> {
  return scrapeWithBrowserless(
    'https://pitchfork.com/news/',
    '.title-link, .summary-item__hed-link, article a[href*="/news/"]',
    'pitchfork.com',
    12000,
    3000
  );
}

// Music - Billboard
async function scrapeBillboard(): Promise<ScrapedHeadline[]> {
  return scrapeWithBrowserless(
    'https://www.billboard.com/music/',
    '.c-title a, article h3 a, .lrv-a-unstyle-link',
    'billboard.com',
    12000,
    3000
  );
}

// Gaming - IGN
async function scrapeIGN(): Promise<ScrapedHeadline[]> {
  return scrapeWithBrowserless(
    'https://www.ign.com/news',
    '.item-title a, article a[href*="/articles/"], .content-item a',
    'ign.com',
    12000,
    3000
  );
}

// Gaming - Kotaku
async function scrapeKotaku(): Promise<ScrapedHeadline[]> {
  return scrapeWithBrowserless(
    'https://kotaku.com/',
    '.sc-759qgu-0 a, article h2 a, .js_post_title a',
    'kotaku.com',
    12000,
    3000
  );
}

// Books - BookRiot
async function scrapeBookRiot(): Promise<ScrapedHeadline[]> {
  return scrapeWithBrowserless(
    'https://bookriot.com/',
    '.entry-title a, article h2 a, .post-title a',
    'bookriot.com',
    12000,
    3000
  );
}

// Custom Topics - Google News Search (fallback)
async function scrapeGoogleNews(query: string): Promise<ScrapedHeadline[]> {
  const url = `https://news.google.com/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
  
  return scrapeWithBrowserless(
    url,
    'article a[href*="./articles/"], article h3 a, .JtKRv a',
    'news.google.com',
    15000,
    4000
  );
}

// ========== MAIN HANDLER ==========

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: ScrapeRequest = await req.json();
    const { categories = {} } = body;

    console.log('Scrape request - categories:', JSON.stringify(categories));
    console.log('Scrape request - sports_teams:', body.sports_teams);
    console.log('Scrape request - custom_topics:', body.custom_topics);

    const result: ScrapedData = {
      scraped_at: new Date().toISOString(),
      sports: {},
      tech: { ai_news: [], general_tech: [] },
      business: [],
      science: [],
      health: [],
      politics: [],
      trading: [],
      books: [],
      film_tv: [],
      music: [],
      gaming: [],
      markets: { headlines: [] },
      custom: [],
      sources_succeeded: [],
      sources_failed: []
    };

    const scrapePromises: Promise<void>[] = [];

    // ========== SPORTS: Tavily search (primary) + ESPN API (scores) ==========
    if (categories.sports && body.sports_teams) {
      const teams = body.sports_teams.split(',').map(t => t.trim().toLowerCase());
      console.log('Processing sports teams:', teams);
      
      for (const team of teams) {
        const mapping = TEAM_MAPPINGS[team];
        const teamName = mapping?.fullName || team;
        
        scrapePromises.push(
          (async () => {
            const teamData: any = {
              name: teamName,
              headlines: [],
              last_game: null
            };

            // Get yesterday's game score from ESPN API (reliable, no scraping)
            if (mapping && mapping.league !== 'soccer' && mapping.league !== 'mls') {
              const gameScore = await getESPNGameScore(mapping.slug, mapping.league);
              if (gameScore) {
                teamData.last_game = gameScore;
              }
            }

            // Use Tavily for news headlines (primary)
            const tavilyNews = await searchWithTavily(`${teamName} latest news today`, 5);
            if (tavilyNews.length > 0) {
              teamData.headlines = tavilyNews;
              result.sources_succeeded.push(`sports:${team}:tavily`);
            } else {
              // Fallback to Browserless if Tavily fails
              if (mapping?.espnSlug) {
                const espnHeadlines = await scrapeESPNTeamNews(mapping.league, mapping.espnSlug);
                if (espnHeadlines.length > 0) {
                  teamData.headlines = espnHeadlines;
                  result.sources_succeeded.push(`sports:${team}:espn`);
                }
              }
            }

            // Only add team if we have ANY data
            if (teamData.last_game || teamData.headlines.length > 0) {
              result.sports[team] = teamData;
            } else {
              result.sources_failed.push(`sports:${team}`);
            }
          })().catch(e => {
            console.error(`Sports scrape error for ${team}:`, e);
            result.sources_failed.push(`sports:${team}`);
          })
        );
      }
    }

    // ========== TECH/AI: Tavily search (primary) ==========
    if (categories.tech) {
      scrapePromises.push(
        (async () => {
          const techQuery = body.tech_topics 
            ? `${body.tech_topics} technology news today`
            : 'AI artificial intelligence technology news today';
          
          const techNews = await searchWithTavily(techQuery, 5);
          
          if (techNews.length > 0) {
            result.tech.ai_news = techNews;
            result.sources_succeeded.push('tech:tavily');
          } else {
            // Fallback to Browserless
            const [hnNews, tcNews] = await Promise.all([
              scrapeHackerNews(),
              scrapeTechCrunch(body.tech_topics)
            ]);
            result.tech.ai_news = [...hnNews, ...tcNews].slice(0, 5);
            if (hnNews.length > 0) result.sources_succeeded.push('tech:hackernews');
            if (tcNews.length > 0) result.sources_succeeded.push('tech:techcrunch');
            if (result.tech.ai_news.length === 0) result.sources_failed.push('tech');
          }
        })().catch(e => {
          console.error('Tech scrape error:', e);
          result.sources_failed.push('tech');
        })
      );
    }

    // ========== BUSINESS: Tavily search (primary) ==========
    if (categories.business) {
      scrapePromises.push(
        (async () => {
          const businessQuery = body.business_topics 
            ? `${body.business_topics} business news today`
            : 'business finance economy news today';
          
          const businessNews = await searchWithTavily(businessQuery, 5);
          
          if (businessNews.length > 0) {
            result.business = businessNews;
            result.sources_succeeded.push('business:tavily');
          } else {
            // Fallback to Browserless
            const [bloombergNews, yahooNews] = await Promise.all([
              scrapeBloombergNews('business'),
              scrapeYahooFinance()
            ]);
            result.business = [...bloombergNews, ...yahooNews].slice(0, 5);
            if (bloombergNews.length > 0) result.sources_succeeded.push('business:bloomberg');
            if (yahooNews.length > 0) result.sources_succeeded.push('business:yahoo');
            if (result.business.length === 0) result.sources_failed.push('business');
          }
        })().catch(e => {
          console.error('Business scrape error:', e);
          result.sources_failed.push('business');
        })
      );
    }

    // ========== TRADING/MARKETS: Tavily search (primary) ==========
    if (categories.trading) {
      scrapePromises.push(
        (async () => {
          const tradingNews = await searchWithTavily('stock market trading finance news today', 5);
          
          if (tradingNews.length > 0) {
            result.trading = tradingNews;
            result.markets.headlines = tradingNews.map(h => h.title);
            result.sources_succeeded.push('trading:tavily');
          } else {
            // Fallback to Browserless
            const [bloombergMarkets, marketWatchNews] = await Promise.all([
              scrapeBloombergNews('markets'),
              scrapeMarketWatch()
            ]);
            result.trading = [...bloombergMarkets, ...marketWatchNews].slice(0, 5);
            result.markets.headlines = result.trading.map(h => h.title);
            if (bloombergMarkets.length > 0) result.sources_succeeded.push('trading:bloomberg');
            if (marketWatchNews.length > 0) result.sources_succeeded.push('trading:marketwatch');
            if (result.trading.length === 0) result.sources_failed.push('trading');
          }
        })().catch(e => {
          console.error('Trading scrape error:', e);
          result.sources_failed.push('trading');
        })
      );
    }

    // ========== POLITICS: Reuters + AP News ==========
    if (categories.politics) {
      scrapePromises.push(
        (async () => {
          const [reutersNews, apNews] = await Promise.all([
            scrapeReutersPolitics(),
            scrapeAPNews()
          ]);
          
          result.politics = [...reutersNews, ...apNews].slice(0, 5);
          
          if (reutersNews.length > 0) result.sources_succeeded.push('politics:reuters');
          if (apNews.length > 0) result.sources_succeeded.push('politics:ap');
          if (reutersNews.length === 0 && apNews.length === 0) {
            const googlePolitics = await scrapeGoogleNews(body.politics_topics || 'US politics news');
            result.politics = googlePolitics;
            if (googlePolitics.length > 0) result.sources_succeeded.push('politics:google');
            else result.sources_failed.push('politics');
          }
        })().catch(e => {
          console.error('Politics scrape error:', e);
          result.sources_failed.push('politics');
        })
      );
    }

    // ========== SCIENCE: Phys.org + ScienceDaily ==========
    if (categories.science) {
      scrapePromises.push(
        (async () => {
          const [physNews, sciDailyNews] = await Promise.all([
            scrapePhysOrg(body.science_topics),
            scrapeScienceDaily()
          ]);
          
          result.science = [...physNews, ...sciDailyNews].slice(0, 5);
          
          if (physNews.length > 0) result.sources_succeeded.push('science:physorg');
          if (sciDailyNews.length > 0) result.sources_succeeded.push('science:sciencedaily');
          if (physNews.length === 0 && sciDailyNews.length === 0) {
            const googleScience = await scrapeGoogleNews(body.science_topics || 'science discoveries news');
            result.science = googleScience;
            if (googleScience.length > 0) result.sources_succeeded.push('science:google');
            else result.sources_failed.push('science');
          }
        })().catch(e => {
          console.error('Science scrape error:', e);
          result.sources_failed.push('science');
        })
      );
    }

    // ========== HEALTH: Healthline + Medical News Today ==========
    if (categories.health) {
      scrapePromises.push(
        (async () => {
          const [healthlineNews, mntNews] = await Promise.all([
            scrapeHealthline(),
            scrapeMedicalNewsToday()
          ]);
          
          result.health = [...healthlineNews, ...mntNews].slice(0, 5);
          
          if (healthlineNews.length > 0) result.sources_succeeded.push('health:healthline');
          if (mntNews.length > 0) result.sources_succeeded.push('health:medicalnewstoday');
          if (healthlineNews.length === 0 && mntNews.length === 0) {
            const googleHealth = await scrapeGoogleNews(body.health_topics || 'health wellness news');
            result.health = googleHealth;
            if (googleHealth.length > 0) result.sources_succeeded.push('health:google');
            else result.sources_failed.push('health');
          }
        })().catch(e => {
          console.error('Health scrape error:', e);
          result.sources_failed.push('health');
        })
      );
    }

    // ========== FILM/TV: Variety + Deadline ==========
    if (categories.film_tv) {
      scrapePromises.push(
        (async () => {
          const [varietyNews, deadlineNews] = await Promise.all([
            scrapeVariety(),
            scrapeDeadline()
          ]);
          
          result.film_tv = [...varietyNews, ...deadlineNews].slice(0, 5);
          
          if (varietyNews.length > 0) result.sources_succeeded.push('film_tv:variety');
          if (deadlineNews.length > 0) result.sources_succeeded.push('film_tv:deadline');
          if (varietyNews.length === 0 && deadlineNews.length === 0) {
            const googleFilmTV = await scrapeGoogleNews('film tv entertainment news');
            result.film_tv = googleFilmTV;
            if (googleFilmTV.length > 0) result.sources_succeeded.push('film_tv:google');
            else result.sources_failed.push('film_tv');
          }
        })().catch(e => {
          console.error('Film/TV scrape error:', e);
          result.sources_failed.push('film_tv');
        })
      );
    }

    // ========== MUSIC: Pitchfork + Billboard ==========
    if (categories.music) {
      scrapePromises.push(
        (async () => {
          const [pitchforkNews, billboardNews] = await Promise.all([
            scrapePitchfork(),
            scrapeBillboard()
          ]);
          
          result.music = [...pitchforkNews, ...billboardNews].slice(0, 5);
          
          if (pitchforkNews.length > 0) result.sources_succeeded.push('music:pitchfork');
          if (billboardNews.length > 0) result.sources_succeeded.push('music:billboard');
          if (pitchforkNews.length === 0 && billboardNews.length === 0) {
            const googleMusic = await scrapeGoogleNews(body.music_topics || 'music news');
            result.music = googleMusic;
            if (googleMusic.length > 0) result.sources_succeeded.push('music:google');
            else result.sources_failed.push('music');
          }
        })().catch(e => {
          console.error('Music scrape error:', e);
          result.sources_failed.push('music');
        })
      );
    }

    // ========== GAMING: IGN + Kotaku ==========
    if (categories.gaming) {
      scrapePromises.push(
        (async () => {
          const [ignNews, kotakuNews] = await Promise.all([
            scrapeIGN(),
            scrapeKotaku()
          ]);
          
          result.gaming = [...ignNews, ...kotakuNews].slice(0, 5);
          
          if (ignNews.length > 0) result.sources_succeeded.push('gaming:ign');
          if (kotakuNews.length > 0) result.sources_succeeded.push('gaming:kotaku');
          if (ignNews.length === 0 && kotakuNews.length === 0) {
            const googleGaming = await scrapeGoogleNews(body.gaming_topics || 'video game news');
            result.gaming = googleGaming;
            if (googleGaming.length > 0) result.sources_succeeded.push('gaming:google');
            else result.sources_failed.push('gaming');
          }
        })().catch(e => {
          console.error('Gaming scrape error:', e);
          result.sources_failed.push('gaming');
        })
      );
    }

    // ========== BOOKS: BookRiot ==========
    if (categories.books) {
      scrapePromises.push(
        (async () => {
          const bookNews = await scrapeBookRiot();
          
          if (bookNews.length > 0) {
            result.books = bookNews;
            result.sources_succeeded.push('books:bookriot');
          } else {
            const googleBooks = await scrapeGoogleNews(body.books_topics || 'new book releases news');
            result.books = googleBooks;
            if (googleBooks.length > 0) result.sources_succeeded.push('books:google');
            else result.sources_failed.push('books');
          }
        })().catch(e => {
          console.error('Books scrape error:', e);
          result.sources_failed.push('books');
        })
      );
    }

    // ========== CUSTOM TOPICS: Tavily search (primary) ==========
    if (body.custom_topics) {
      scrapePromises.push(
        (async () => {
          const customNews = await searchWithTavily(`${body.custom_topics} news today`, 5);
          if (customNews.length > 0) {
            result.custom = customNews;
            result.sources_succeeded.push('custom:tavily');
          } else {
            // Fallback to Google News scraping
            const googleCustom = await scrapeGoogleNews(body.custom_topics!);
            result.custom = googleCustom;
            if (googleCustom.length > 0) result.sources_succeeded.push('custom:google');
            else result.sources_failed.push('custom');
          }
        })().catch(e => {
          console.error('Custom topics scrape error:', e);
          result.sources_failed.push('custom');
        })
      );
    }

    await Promise.all(scrapePromises);

    console.log('Scrape complete. Sports data:', JSON.stringify(result.sports));
    console.log('Scrape complete. Succeeded:', result.sources_succeeded, 'Failed:', result.sources_failed);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in scrape-briefing-news:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      sources_succeeded: [],
      sources_failed: ['all']
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
