const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate URL format
    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `https://${formattedUrl}`;
    }

    try {
      new URL(formattedUrl);
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid URL format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Fetching metadata for:', formattedUrl);

    // Fetch HTML with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(formattedUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MetadataBot/1.0)',
        'Accept': 'text/html,application/xhtml+xml',
      },
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error('Failed to fetch URL:', response.status);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to fetch URL' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const html = await response.text();

    // Parse metadata
    const getMetaContent = (property: string): string | null => {
      // Try og: tags
      const ogMatch = html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i'))
        || html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${property}["']`, 'i'));
      return ogMatch ? ogMatch[1] : null;
    };

    // Get title
    let title = getMetaContent('og:title');
    if (!title) {
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      title = titleMatch ? titleMatch[1].trim() : null;
    }

    // Get description
    let description = getMetaContent('og:description');
    if (!description) {
      description = getMetaContent('description');
    }

    // Get image
    const image = getMetaContent('og:image');

    // Get site name
    let siteName = getMetaContent('og:site_name');
    if (!siteName) {
      try {
        siteName = new URL(formattedUrl).hostname.replace('www.', '');
      } catch {
        siteName = null;
      }
    }

    console.log('Metadata extracted:', { title, description, image: !!image, siteName });

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          title: title || null,
          description: description || null,
          image: image || null,
          siteName: siteName || null,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching metadata:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch metadata';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
