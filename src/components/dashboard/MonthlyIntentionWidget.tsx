import { useState, useRef, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { Sparkles, Edit2, Play, Pause, Radio } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrentMonthIntention } from '@/hooks/useMonthlyIntention';
import { SetIntentionDialog } from './SetIntentionDialog';
import { useBriefingLabEpisodes } from '@/hooks/useBriefingLab';
import { supabase } from '@/integrations/supabase/client';

// Jingle URL - stored in Supabase storage
const JINGLE_URL = 'https://gogzkyjylruuziseprfw.supabase.co/storage/v1/object/public/briefing-audio/jingles/jingle-option-1.mp3';

export const MonthlyIntentionWidget = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data: intention, isLoading } = useCurrentMonthIntention();
  const { data: episodes } = useBriefingLabEpisodes(1);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPlayingJingle, setIsPlayingJingle] = useState(false);
  const jingleRef = useRef<HTMLAudioElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentMonth = format(new Date(), 'MMMM');
  
  // Get the latest ready briefing from briefing_lab_episodes
  const latestBriefing = episodes?.find(ep => ep.status === 'ready' && ep.podcast_url);
  const hasBriefing = !!latestBriefing;

  // Initialize jingle audio
  useEffect(() => {
    jingleRef.current = new Audio(JINGLE_URL);
    jingleRef.current.volume = 0.8;
    
    return () => {
      if (jingleRef.current) {
        jingleRef.current.pause();
        jingleRef.current = null;
      }
    };
  }, []);

  const handlePlayPause = useCallback(async () => {
    if (isPlaying || isPlayingJingle) {
      // Stop everything
      if (jingleRef.current) jingleRef.current.pause();
      if (audioRef.current) audioRef.current.pause();
      setIsPlaying(false);
      setIsPlayingJingle(false);
      return;
    }

    // Start with jingle, then play briefing
    if (jingleRef.current && audioRef.current) {
      setIsPlayingJingle(true);
      
      jingleRef.current.currentTime = 0;
      audioRef.current.currentTime = 0;
      
      // When jingle ends, start briefing
      jingleRef.current.onended = () => {
        setIsPlayingJingle(false);
        setIsPlaying(true);
        audioRef.current?.play();
      };
      
      try {
        await jingleRef.current.play();
      } catch (e) {
        console.error('Failed to play jingle:', e);
        // Fallback: just play the briefing
        setIsPlayingJingle(false);
        setIsPlaying(true);
        audioRef.current.play();
      }
    }
  }, [isPlaying, isPlayingJingle]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const handleEnded = () => setIsPlaying(false);
    const handlePause = () => setIsPlaying(false);
    const handlePlay = () => setIsPlaying(true);
    
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('play', handlePlay);
    
    return () => {
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('play', handlePlay);
    };
  }, [latestBriefing?.podcast_url]);

  if (isLoading) {
    return (
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="py-3 px-4">
          <Skeleton className="h-8 w-32" />
        </CardContent>
      </Card>
    );
  }

  if (!intention) {
    return (
      <>
        <Card 
          className="border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-transparent cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => setDialogOpen(true)}
        >
          <CardContent className="py-3 px-4 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm text-muted-foreground">
              Set your word for {currentMonth}
            </span>
          </CardContent>
        </Card>
        <SetIntentionDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      </>
    );
  }

  return (
    <>
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent group">
        <CardContent className="py-3 px-4">
          <div className={`flex items-center ${hasBriefing ? 'justify-between' : 'justify-between'}`}>
            {/* Left: Monthly Word */}
            <div className="flex items-center gap-3">
              <Sparkles className="h-4 w-4 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">{currentMonth}'s Word</p>
                <p className="text-lg font-bold tracking-wide uppercase text-primary">
                  {intention.word}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => setDialogOpen(true)}
              >
                <Edit2 className="h-3 w-3" />
              </Button>
            </div>
            
            {/* Right: Briefing Player (if available) */}
            {hasBriefing && latestBriefing && (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2 text-primary">
                  <Radio className="h-4 w-4" />
                  <span className="text-xs font-medium">Briefing</span>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  className="gap-2"
                  onClick={handlePlayPause}
                >
                  {isPlaying || isPlayingJingle ? (
                    <>
                      <Pause className="h-4 w-4" />
                      <span className="hidden sm:inline">{isPlayingJingle ? 'Stop' : 'Pause'}</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      <span className="hidden sm:inline">Play</span>
                    </>
                  )}
                </Button>
                
                {/* Hidden audio element */}
                <audio
                  ref={audioRef}
                  src={latestBriefing.podcast_url || undefined}
                  className="hidden"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      <SetIntentionDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen} 
        existingIntention={intention}
      />
    </>
  );
};
