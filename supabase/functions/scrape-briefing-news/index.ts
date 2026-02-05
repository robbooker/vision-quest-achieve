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
};

// Scrape ESPN team page with Browserless
async function scrapeESPNTeamNews(league: string, espnSlug: string): Promise<Array<{ title: string; url: string }>> {
  const BROWSERLESS_API_KEY = Deno.env.get('BROWSERLESS_API_KEY');
  if (!BROWSERLESS_API_KEY) {
    console.log('BROWSERLESS_API_KEY not configured, skipping ESPN scrape');
    return [];
  }

  try {
    let espnLeaguePath: string;
    switch (league.toLowerCase()) {
      case 'nba': espnLeaguePath = 'nba'; break;
      case 'mlb': espnLeaguePath = 'mlb'; break;
      case 'nfl': espnLeaguePath = 'nfl'; break;
      case 'nhl': espnLeaguePath = 'nhl'; break;
      default: return [];
    }

    const teamUrl = `https://www.espn.com/${espnLeaguePath}/team/_/name/${espnSlug}`;
    console.log(`Scraping ESPN team page: ${teamUrl}`);

    const response = await fetch(`https://chrome.browserless.io/scrape?token=${BROWSERLESS_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: teamUrl,
        elements: [
          {
            selector: 'article.contentItem a, .headlineStack a, .contentItem__content a',
            timeout: 15000
          }
        ],
        waitFor: 3000
      })
    });

    if (!response.ok) {
      console.error('Browserless error:', response.status);
      return [];
    }

    const data = await response.json();
    const elements = data.data?.[0]?.results || [];
    
    const headlines: Array<{ title: string; url: string }> = [];
    const seenTitles = new Set<string>();

    for (const el of elements) {
      const text = el.text?.trim();
      const href = el.attributes?.find((a: any) => a.name === 'href')?.value;
      
      if (text && text.length > 15 && text.length < 200 && !seenTitles.has(text.toLowerCase())) {
        seenTitles.add(text.toLowerCase());
        const fullUrl = href?.startsWith('http') ? href : `https://www.espn.com${href}`;
        headlines.push({ title: text, url: fullUrl });
        
        if (headlines.length >= 5) break;
      }
    }

    console.log(`Found ${headlines.length} ESPN headlines for ${espnSlug}`);
    return headlines;
  } catch (e) {
    console.error('ESPN scrape error:', e);
    return [];
  }
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

// Fetch sports news via Tavily as fallback
async function fetchSportsNewsWithTavily(teamName: string): Promise<Array<{ title: string; source: string; url: string }>> {
  const TAVILY_API_KEY = Deno.env.get('TAVILY_API_KEY');
  if (!TAVILY_API_KEY) return [];

  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: TAVILY_API_KEY,
        query: `${teamName} latest news today`,
        topic: 'news',
        time_range: 'day',
        max_results: 5,
        search_depth: 'basic',
        include_domains: ['espn.com', 'bleacherreport.com', 'theathletic.com', 'cbssports.com', 'nba.com', 'mlb.com', 'nfl.com']
      })
    });

    if (!response.ok) return [];

    const data = await response.json();
    return (data.results || []).map((r: any) => ({
      title: r.title,
      source: new URL(r.url).hostname.replace('www.', ''),
      url: r.url
    }));
  } catch (e) {
    console.error('Tavily sports error:', e);
    return [];
  }
}

// Fetch general news with Tavily
async function fetchNewsWithTavily(query: string, domains?: string[]): Promise<Array<{ title: string; source: string; url: string }>> {
  const TAVILY_API_KEY = Deno.env.get('TAVILY_API_KEY');
  if (!TAVILY_API_KEY) return [];

  try {
    const body: any = {
      api_key: TAVILY_API_KEY,
      query,
      topic: 'news',
      time_range: 'day',
      max_results: 5,
      search_depth: 'basic'
    };
    
    if (domains) {
      body.include_domains = domains;
    }

    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!response.ok) return [];

    const data = await response.json();
    return (data.results || []).map((r: any) => ({
      title: r.title,
      source: new URL(r.url).hostname.replace('www.', ''),
      url: r.url
    }));
  } catch (e) {
    console.error('Tavily error:', e);
    return [];
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: ScrapeRequest = await req.json();
    const { categories = {} } = body;

    const result: ScrapedData = {
      scraped_at: new Date().toISOString(),
      sports: {},
      tech: { ai_news: [], general_tech: [] },
      business: [],
      markets: { headlines: [] },
      custom: [],
      sources_succeeded: [],
      sources_failed: []
    };

    const scrapePromises: Promise<void>[] = [];

    // Sports - now with ESPN scraping AND Tavily fallback
    if (categories.sports && body.sports_teams) {
      const teams = body.sports_teams.split(',').map(t => t.trim().toLowerCase());
      
      for (const team of teams) {
        const mapping = TEAM_MAPPINGS[team];
        if (mapping) {
          scrapePromises.push(
            (async () => {
              const teamData: any = {
                name: mapping.fullName,
                headlines: [],
                last_game: null
              };

              // Try to get game score from ESPN API
              const gameScore = await getESPNGameScore(mapping.slug, mapping.league);
              if (gameScore) {
                teamData.last_game = gameScore;
              }

              // Scrape ESPN team page for headlines
              const espnHeadlines = await scrapeESPNTeamNews(mapping.league, mapping.espnSlug);
              if (espnHeadlines.length > 0) {
                teamData.headlines = espnHeadlines.map(h => ({
                  title: h.title,
                  source: 'espn.com',
                  url: h.url
                }));
                result.sources_succeeded.push(`sports:${team}:espn`);
              }

              // If no ESPN headlines, use Tavily as fallback
              if (teamData.headlines.length === 0) {
                const tavilyNews = await fetchSportsNewsWithTavily(mapping.fullName);
                if (tavilyNews.length > 0) {
                  teamData.headlines = tavilyNews;
                  result.sources_succeeded.push(`sports:${team}:tavily`);
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
    }

    // Tech/AI News via Tavily
    if (categories.tech) {
      const techQuery = body.tech_topics 
        ? `latest AI technology news ${body.tech_topics}`
        : 'latest AI LLM Claude GPT Gemini technology news';

      scrapePromises.push(
        fetchNewsWithTavily(techQuery, ['techcrunch.com', 'theverge.com', 'arstechnica.com', 'wired.com', 'engadget.com'])
          .then(data => {
            result.tech.ai_news = data;
            if (data.length > 0) result.sources_succeeded.push('tech');
          })
          .catch(() => result.sources_failed.push('tech'))
      );
    }

    // Business news
    if (categories.business) {
      const businessQuery = body.business_topics 
        ? `latest business news ${body.business_topics}`
        : 'latest business news today';

      scrapePromises.push(
        fetchNewsWithTavily(businessQuery, ['wsj.com', 'bloomberg.com', 'reuters.com', 'cnbc.com', 'ft.com'])
          .then(data => {
            result.business = data;
            if (data.length > 0) result.sources_succeeded.push('business');
          })
          .catch(() => result.sources_failed.push('business'))
      );
    }

    // Custom topics
    if (body.custom_topics) {
      scrapePromises.push(
        fetchNewsWithTavily(body.custom_topics)
          .then(data => {
            result.custom = data;
            if (data.length > 0) result.sources_succeeded.push('custom');
          })
          .catch(() => result.sources_failed.push('custom'))
      );
    }

    await Promise.all(scrapePromises);

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
