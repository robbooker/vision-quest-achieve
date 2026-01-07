import { useState, useRef, useEffect, useCallback } from 'react';
import { Volume2, VolumeX, Music, Headphones, Radio, AudioLines } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
// AudioWaveform disabled due to Web Audio API crashes
import { useTerminalMode } from '@/hooks/useTerminalMode';

import { Moon } from 'lucide-react';

const SOUNDS = [
  { id: 'newer-wave', label: 'Newer Wave', icon: Music, url: '/sounds/newer-wave.mp3' },
  { id: 'chill-study-1', label: 'Chill Study', icon: Headphones, url: '/sounds/chill-study-1.mp3' },
  { id: 'frequency', label: 'Focus Frequency', icon: Radio, url: '/sounds/focus-frequency.mp3' },
  { id: 'chill-study-2', label: 'Deep Focus', icon: AudioLines, url: '/sounds/chill-study-2.mp3' },
  { id: 'good-night', label: 'Good Night', icon: Moon, url: '/sounds/good-night-lofi.mp3' },
];

const VOLUME_STORAGE_KEY = 'focus-audio-volume';
const CROSSFADE_DURATION = 300;
const FADEOUT_DURATION = 500;

interface AmbientSoundsProps {
  onSoundChange?: (soundId: string | null) => void;
  isBreakMode?: boolean;
  shouldStop?: boolean;
}

export function AmbientSounds({ onSoundChange, isBreakMode = false, shouldStop = false }: AmbientSoundsProps) {
  const { isTerminal } = useTerminalMode();
  
  // Load saved volume from localStorage
  const getSavedVolume = () => {
    const saved = localStorage.getItem(VOLUME_STORAGE_KEY);
    return saved ? parseInt(saved, 10) : 50;
  };

  const [activeSound, setActiveSound] = useState<string | null>(null);
  const [volume, setVolume] = useState(getSavedVolume);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeIntervalRef = useRef<number | null>(null);
  const pausedForBreakRef = useRef(false);

  // Save volume to localStorage when it changes
  useEffect(() => {
    localStorage.setItem(VOLUME_STORAGE_KEY, volume.toString());
  }, [volume]);

  // Clear any ongoing fade
  const clearFade = useCallback(() => {
    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
      fadeIntervalRef.current = null;
    }
  }, []);

  // Fade volume
  const fadeVolume = useCallback((
    audio: HTMLAudioElement,
    from: number,
    to: number,
    duration: number,
    onComplete?: () => void
  ) => {
    clearFade();
    const steps = 20;
    const stepDuration = duration / steps;
    const volumeStep = (to - from) / steps;
    let currentStep = 0;

    fadeIntervalRef.current = window.setInterval(() => {
      currentStep++;
      const newVolume = from + volumeStep * currentStep;
      audio.volume = Math.max(0, Math.min(1, newVolume));

      if (currentStep >= steps) {
        clearFade();
        onComplete?.();
      }
    }, stepDuration);
  }, [clearFade]);

  // Web Audio API waveform visualization removed due to crashes
  // Audio plays fine through standard HTMLAudioElement

  // Handle sound selection with crossfade
  const handleSoundToggle = useCallback(async (soundId: string) => {
    const isSameSound = activeSound === soundId;
    
    if (isSameSound) {
      // Stop current sound with fade
      if (audioRef.current) {
        const currentVolume = audioRef.current.volume;
        fadeVolume(audioRef.current, currentVolume, 0, CROSSFADE_DURATION, () => {
          audioRef.current?.pause();
          setIsPlaying(false);
        });
      }
      setActiveSound(null);
      onSoundChange?.(null);
      return;
    }

    const sound = SOUNDS.find(s => s.id === soundId);
    if (!sound) return;

    // Fade out current sound if playing
    if (audioRef.current && activeSound) {
      const currentVolume = audioRef.current.volume;
      fadeVolume(audioRef.current, currentVolume, 0, CROSSFADE_DURATION, () => {
        audioRef.current?.pause();
      });
      
      // Wait a bit before starting new sound
      await new Promise(r => setTimeout(r, CROSSFADE_DURATION / 2));
    }

    // Create new audio element
    const newAudio = new Audio(sound.url);
    newAudio.loop = true;
    newAudio.volume = 0;
    audioRef.current = newAudio;
    
    try {
      await newAudio.play();
      
      // Fade in
      const targetVolume = isMuted ? 0 : volume / 100;
      fadeVolume(newAudio, 0, targetVolume, CROSSFADE_DURATION);
      
      setActiveSound(soundId);
      setIsPlaying(true);
      onSoundChange?.(soundId);
      
    } catch (e) {
      console.log('Audio playback failed:', e);
      setActiveSound(null);
      setIsPlaying(false);
    }
  }, [activeSound, volume, isMuted, fadeVolume, onSoundChange]);

  // Handle volume changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume / 100;
    }
  }, [volume, isMuted]);

  // Handle break mode - pause/resume
  useEffect(() => {
    if (isBreakMode && audioRef.current && isPlaying) {
      // Pause for break
      pausedForBreakRef.current = true;
      const currentVolume = audioRef.current.volume;
      fadeVolume(audioRef.current, currentVolume, 0, CROSSFADE_DURATION, () => {
        audioRef.current?.pause();
        setIsPlaying(false);
      });
    } else if (!isBreakMode && pausedForBreakRef.current && activeSound) {
      // Resume after break
      pausedForBreakRef.current = false;
      if (audioRef.current) {
        audioRef.current.play().then(() => {
          const targetVolume = isMuted ? 0 : volume / 100;
          fadeVolume(audioRef.current!, 0, targetVolume, CROSSFADE_DURATION);
          setIsPlaying(true);
        }).catch(e => console.log('Resume failed:', e));
      }
    }
  }, [isBreakMode, activeSound, volume, isMuted, fadeVolume, isPlaying]);

  // Handle session end - graceful fadeout
  useEffect(() => {
    if (shouldStop && audioRef.current && isPlaying) {
      const currentVolume = audioRef.current.volume;
      fadeVolume(audioRef.current, currentVolume, 0, FADEOUT_DURATION, () => {
        audioRef.current?.pause();
        setActiveSound(null);
        setIsPlaying(false);
        onSoundChange?.(null);
      });
    }
  }, [shouldStop, fadeVolume, isPlaying, onSoundChange]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearFade();
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [clearFade]);

  const activeSoundData = SOUNDS.find(s => s.id === activeSound);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className={cn(
          "text-sm font-medium",
          isTerminal && "font-mono uppercase tracking-wider text-xs"
        )}>
          {isTerminal ? 'AUDIO FEED' : 'Ambient Sounds'}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setIsMuted(!isMuted)}
          disabled={!activeSound}
        >
          {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </Button>
      </div>

      <div className="flex gap-2">
        {SOUNDS.map(sound => {
          const Icon = sound.icon;
          const isActive = activeSound === sound.id;
          return (
            <Button
              key={sound.id}
              variant={isActive ? 'default' : 'outline'}
              size="sm"
              className={cn(
                "flex-1 flex-col h-auto py-2 gap-1",
                isActive && "ring-2 ring-primary"
              )}
              onClick={() => handleSoundToggle(sound.id)}
            >
              <Icon className="h-4 w-4" />
              <span className="text-xs">{sound.label}</span>
            </Button>
          );
        })}
      </div>

      {/* Now Playing indicator (waveform disabled) */}
      {isPlaying && activeSoundData && (
        <div className="flex flex-col items-center gap-2 py-2">
          <div className={cn(
            "text-xs text-muted-foreground flex items-center gap-1.5",
            isTerminal && "font-mono uppercase tracking-wider"
          )}>
            <Music className="h-3 w-3" />
            {isTerminal ? `PLAYING: ${activeSoundData.label.toUpperCase()}` : `Now Playing: ${activeSoundData.label}`}
          </div>
        </div>
      )}

      {activeSound && (
        <div className="flex items-center gap-3">
          <VolumeX className="h-4 w-4 text-muted-foreground" />
          <Slider
            value={[volume]}
            onValueChange={([v]) => setVolume(v)}
            max={100}
            step={5}
            className="flex-1"
          />
          <Volume2 className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
    </div>
  );
}
