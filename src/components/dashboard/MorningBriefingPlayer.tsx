import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Sunrise, Play, Pause, FileText, Clock, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';

interface MorningBriefing {
  id: string;
  status: string;
  podcast_url: string | null;
  script: string | null;
  duration_seconds: number | null;
  played_at: string | null;
}

export function MorningBriefingPlayer() {
  const { user } = useAuth();
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null);

  // Check if briefing is enabled first
  const { data: preferences } = useQuery({
    queryKey: ['briefing-preferences', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('briefing_preferences')
        .select('enabled')
        .eq('user_id', user?.id)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch today's briefing
  const { data: todayBriefing, isLoading } = useQuery({
    queryKey: ['today-briefing-player', user?.id],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('morning_briefings')
        .select('id, status, podcast_url, script, duration_seconds, played_at')
        .eq('user_id', user?.id)
        .eq('wake_date', today)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data as MorningBriefing | null;
    },
    enabled: !!user?.id && preferences?.enabled === true,
  });

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    if (!audioRef) return;
    
    if (isPlaying) {
      audioRef.pause();
    } else {
      audioRef.play();
    }
    setIsPlaying(!isPlaying);
  };

  // Don't show if briefing not enabled or no ready briefing today
  if (!preferences?.enabled) {
    return null;
  }

  if (isLoading) {
    return null; // Don't show loading state to avoid UI flicker
  }

  // Only show if we have a ready briefing with a podcast URL
  if (!todayBriefing || todayBriefing.status !== 'ready' || !todayBriefing.podcast_url) {
    return null;
  }

  return (
    <Card className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/30">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 p-2 rounded-lg bg-amber-500/20">
            <Sunrise className="h-5 w-5 text-amber-500" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground">Morning Briefing</h3>
                {todayBriefing.duration_seconds && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDuration(todayBriefing.duration_seconds)}
                  </span>
                )}
              </div>
              <Link to="/settings" className="text-muted-foreground hover:text-foreground">
                <Settings className="h-4 w-4" />
              </Link>
            </div>

            <div className="flex items-center gap-3">
              <Button
                size="sm"
                variant="secondary"
                className="gap-2"
                onClick={handlePlayPause}
              >
                {isPlaying ? (
                  <>
                    <Pause className="h-4 w-4" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Play
                  </>
                )}
              </Button>
              
              {todayBriefing.played_at && (
                <span className="text-xs text-muted-foreground">
                  Played earlier today
                </span>
              )}
            </div>

            {/* Hidden audio element */}
            <audio
              ref={(el) => setAudioRef(el)}
              src={todayBriefing.podcast_url}
              onEnded={() => setIsPlaying(false)}
              onPause={() => setIsPlaying(false)}
              onPlay={() => setIsPlaying(true)}
              className="hidden"
            />

            {/* Script accordion */}
            {todayBriefing.script && (
              <Accordion type="single" collapsible className="mt-2">
                <AccordionItem value="script" className="border-none">
                  <AccordionTrigger className="text-xs py-1 text-muted-foreground hover:text-foreground">
                    <span className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      View Transcript
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="text-sm text-muted-foreground whitespace-pre-wrap bg-background/50 p-3 rounded-md max-h-40 overflow-y-auto">
                      {todayBriefing.script}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
