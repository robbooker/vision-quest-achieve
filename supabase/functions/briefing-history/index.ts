import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get API key from Authorization header OR Supabase JWT
    const authHeader = req.headers.get('Authorization');
    let userId: string;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      
      // Try as API key first
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('api_key', token)
        .single();

      if (profile) {
        userId = profile.user_id;
      } else {
        // Try as JWT
        const anonClient = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY')!, {
          global: { headers: { Authorization: authHeader } }
        });
        const { data: { user }, error } = await anonClient.auth.getUser();
        if (error || !user) {
          return new Response(JSON.stringify({ error: 'Invalid authentication' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        userId = user.id;
      }
    } else {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '30');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // Get briefings
    const { data: briefings, error: briefingsError } = await supabase
      .from('morning_briefings')
      .select('*')
      .eq('user_id', userId)
      .order('wake_date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (briefingsError) {
      throw briefingsError;
    }

    // Calculate stats
    const { data: allBriefings } = await supabase
      .from('morning_briefings')
      .select('wake_date, wake_time, topics, status')
      .eq('user_id', userId)
      .eq('status', 'played')
      .order('wake_date', { ascending: false });

    let currentStreak = 0;
    let totalBriefings = allBriefings?.length || 0;
    
    // Calculate streak
    if (allBriefings && allBriefings.length > 0) {
      const today = new Date();
      let checkDate = new Date(today);
      checkDate.setHours(0, 0, 0, 0);

      for (const b of allBriefings) {
        const briefingDate = new Date(b.wake_date);
        briefingDate.setHours(0, 0, 0, 0);
        
        const diffDays = Math.floor((checkDate.getTime() - briefingDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0 || diffDays === 1) {
          currentStreak++;
          checkDate = briefingDate;
        } else {
          break;
        }
      }
    }

    // Calculate average wake time
    let avgWakeTime = '07:00';
    if (allBriefings && allBriefings.length > 0) {
      const wakeMinutes = allBriefings.map(b => {
        const [h, m] = b.wake_time.split(':').map(Number);
        return h * 60 + m;
      });
      const avgMinutes = Math.round(wakeMinutes.reduce((a, b) => a + b, 0) / wakeMinutes.length);
      const avgHours = Math.floor(avgMinutes / 60);
      const avgMins = avgMinutes % 60;
      avgWakeTime = `${avgHours.toString().padStart(2, '0')}:${avgMins.toString().padStart(2, '0')}`;
    }

    // Get most common topics
    const topicCounts: Record<string, number> = {};
    allBriefings?.forEach(b => {
      (b.topics as string[] || []).forEach((topic: string) => {
        topicCounts[topic.toLowerCase()] = (topicCounts[topic.toLowerCase()] || 0) + 1;
      });
    });
    const mostCommonTopics = Object.entries(topicCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([topic]) => topic);

    return new Response(JSON.stringify({
      briefings: briefings || [],
      stats: {
        total_briefings: totalBriefings,
        current_streak: currentStreak,
        average_wake_time: avgWakeTime,
        most_common_topics: mostCommonTopics
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    console.error('Error in briefing-history:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
