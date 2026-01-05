import { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX, CloudRain, Coffee, Wind, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

const SOUNDS = [
  { id: 'rain', label: 'Rain', icon: CloudRain, url: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_3b8e6d0a4f.mp3' },
  { id: 'cafe', label: 'Café', icon: Coffee, url: 'https://cdn.pixabay.com/download/audio/2021/08/09/audio_d4b4a8c2bd.mp3' },
  { id: 'wind', label: 'Wind', icon: Wind, url: 'https://cdn.pixabay.com/download/audio/2022/10/25/audio_c4b1a4e5b9.mp3' },
  { id: 'lofi', label: 'Lo-Fi', icon: Music, url: 'https://cdn.pixabay.com/download/audio/2022/05/13/audio_257112243c.mp3' },
];

interface AmbientSoundsProps {
  onSoundChange?: (soundId: string | null) => void;
}

export function AmbientSounds({ onSoundChange }: AmbientSoundsProps) {
  const [activeSound, setActiveSound] = useState<string | null>(null);
  const [volume, setVolume] = useState(50);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (activeSound) {
      const sound = SOUNDS.find(s => s.id === activeSound);
      if (sound) {
        if (audioRef.current) {
          audioRef.current.pause();
        }
        audioRef.current = new Audio(sound.url);
        audioRef.current.loop = true;
        audioRef.current.volume = isMuted ? 0 : volume / 100;
        audioRef.current.play().catch(e => {
          console.log('Audio playback failed:', e);
          setActiveSound(null);
        });
      }
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [activeSound]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume / 100;
    }
  }, [volume, isMuted]);

  const handleSoundToggle = (soundId: string) => {
    const newSound = activeSound === soundId ? null : soundId;
    setActiveSound(newSound);
    onSoundChange?.(newSound);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Ambient Sounds</span>
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
