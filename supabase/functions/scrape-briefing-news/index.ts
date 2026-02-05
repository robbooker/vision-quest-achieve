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
  sources_succeeded: string[];
  sources_failed: string[];
}

async function scrapeESPNTeam(teamSlug: string, league: string): Promise<any> {
  try {
    let sport: string;
    
    switch (league.toLowerCase()) {
      case 'nba':
        sport = 'basketball/nba';
        break;
      case 'mlb':
        sport = 'baseball/mlb';
        break;
      case 'nfl':
        sport = 'football/nfl';
        break;
      case 'nhl':
        sport = 'hockey/nhl';
        break;
      default:
        return null;
    }

    // Use ESPN API for reliable data
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().slice(0, 10).replace(/-/g, '');

    const apiUrl = `https://site.api.espn.com/apis/site/v2/sports/${sport}/scoreboard?dates=${dateStr}`;
    const apiResponse = await fetch(apiUrl);
    
    if (apiResponse.ok) {
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
            last_game: {
              date: new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              opponent: teamInGame.homeAway === 'home' ? away?.team.shortDisplayName : home?.team.shortDisplayName,
              score: `${away?.score}-${home?.score}`,
              result: teamInGame.winner ? 'W' : 'L'
            }
          };
        }
      }
    }

    return null;
  } catch (e) {
    console.error(`Error scraping ESPN for ${teamSlug}:`, e);
    return null;
  }
}

// Use Tavily for news
async function fetchNewsWithTavily(query: string): Promise<Array<{ title: string; source: string; url: string }>> {
  const TAVILY_API_KEY = Deno.env.get('TAVILY_API_KEY');
  if (!TAVILY_API_KEY) return [];

  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: TAVILY_API_KEY,
        query,
        topic: 'news',
        time_range: 'day',
        max_results: 5,
        search_depth: 'basic'
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
      sources_succeeded: [],
      sources_failed: []
    };

    const scrapePromises: Promise<void>[] = [];

    // Sports
    if (categories.sports && body.sports_teams) {
      const teams = body.sports_teams.split(',').map(t => t.trim().toLowerCase());
      
      const teamMappings: Record<string, { slug: string; league: string }> = {
        'heat': { slug: 'mia', league: 'nba' },
        'miami heat': { slug: 'mia', league: 'nba' },
        'yankees': { slug: 'nyy', league: 'mlb' },
        'new york yankees': { slug: 'nyy', league: 'mlb' },
        'giants': { slug: 'nyg', league: 'nfl' },
        'jets': { slug: 'nyj', league: 'nfl' },
        'dolphins': { slug: 'mia', league: 'nfl' },
        'celtics': { slug: 'bos', league: 'nba' },
        'lakers': { slug: 'lal', league: 'nba' },
        'mets': { slug: 'nym', league: 'mlb' },
        'dodgers': { slug: 'lad', league: 'mlb' },
      };

      for (const team of teams) {
        const mapping = teamMappings[team];
        if (mapping) {
          scrapePromises.push(
            scrapeESPNTeam(mapping.slug, mapping.league)
              .then(data => {
                if (data) {
                  result.sports[team] = data;
                  result.sources_succeeded.push(`sports:${team}`);
                }
              })
              .catch(() => result.sources_failed.push(`sports:${team}`))
          );
        }
      }
    }

    // Tech/AI News via Tavily
    if (categories.tech) {
      const techQuery = body.tech_topics 
        ? `latest AI technology news ${body.tech_topics}`
        : 'latest AI LLM Claude GPT technology news';

      scrapePromises.push(
        fetchNewsWithTavily(techQuery)
          .then(data => {
            result.tech.ai_news = data;
            if (data.length > 0) result.sources_succeeded.push('tech');
          })
          .catch(() => result.sources_failed.push('tech'))
      );
    }

    // Business news
    if (categories.business) {
      scrapePromises.push(
        fetchNewsWithTavily('latest business news today')
          .then(data => {
            result.business = data;
            if (data.length > 0) result.sources_succeeded.push('business');
          })
          .catch(() => result.sources_failed.push('business'))
      );
    }

    await Promise.all(scrapePromises);

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
