import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, Volume2, VolumeX, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface AudioPlayerWithWaveformProps {
  src: string;
  duration?: number;
  className?: string;
}

// Extract storage path from various URL formats
function extractStoragePath(url: string): string | null {
  // Format: .../journal-audio/userId/filename
  const match = url.match(/journal-audio\/([^?]+)/);
  return match ? match[1] : null;
}

export function AudioPlayerWithWaveform({
  src,
  duration,
  className = "",
}: AudioPlayerWithWaveformProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(duration || 0);
  const [isMuted, setIsMuted] = useState(false);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Get signed URL for private bucket audio
  useEffect(() => {
    const getSignedUrl = async () => {
      setIsLoading(true);
      
      // Check if this is a storage URL that needs signing
      const storagePath = extractStoragePath(src);
      
      if (storagePath) {
        // Get a signed URL from Supabase (valid for 1 hour)
        const { data, error } = await supabase.storage
          .from("journal-audio")
          .createSignedUrl(storagePath, 3600);
        
        if (data && !error) {
          setSignedUrl(data.signedUrl);
        } else {
          console.error("Failed to get signed URL:", error);
          // Fallback to original URL (might work for public buckets or blob URLs)
          setSignedUrl(src);
        }
      } else {
        // Not a storage URL (might be a blob URL from recording)
        setSignedUrl(src);
      }
      
      setIsLoading(false);
    };

    getSignedUrl();
  }, [src]);

  // Generate static waveform visualization
  useEffect(() => {
    if (!signedUrl) return;
    
    const generateWaveform = async () => {
      try {
        const response = await fetch(signedUrl);
        const arrayBuffer = await response.arrayBuffer();
        const audioContext = new AudioContext();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        const rawData = audioBuffer.getChannelData(0);
        const samples = 64;
        const blockSize = Math.floor(rawData.length / samples);
        const filteredData: number[] = [];

        for (let i = 0; i < samples; i++) {
          let sum = 0;
          for (let j = 0; j < blockSize; j++) {
            sum += Math.abs(rawData[i * blockSize + j]);
          }
          filteredData.push(sum / blockSize);
        }

        // Normalize
        const max = Math.max(...filteredData);
        const normalized = filteredData.map(v => v / max);
        setWaveformData(normalized);
        
        audioContext.close();
      } catch (err) {
        // Fallback to random waveform if decoding fails
        const fallback = Array(64).fill(0).map(() => 0.2 + Math.random() * 0.8);
        setWaveformData(fallback);
      }
    };

    generateWaveform();
  }, [signedUrl]);

  // Draw waveform
  useEffect(() => {
    if (!canvasRef.current || waveformData.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const drawWaveform = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = canvas.width / waveformData.length;
      const gap = 2;
      const progress = audioDuration > 0 ? currentTime / audioDuration : 0;

      const computedStyle = getComputedStyle(document.documentElement);
      const primaryColor = computedStyle.getPropertyValue("--primary").trim();
      const mutedColor = computedStyle.getPropertyValue("--muted-foreground").trim();

      waveformData.forEach((value, index) => {
        const barHeight = value * canvas.height * 0.8;
        const x = index * barWidth + gap / 2;
        const y = (canvas.height - barHeight) / 2;
        
        const isPlayed = index / waveformData.length < progress;
        ctx.fillStyle = isPlayed 
          ? `hsl(${primaryColor})` 
          : `hsl(${mutedColor} / 0.4)`;
        
        ctx.fillRect(x, y, barWidth - gap, barHeight);
      });
    };

    drawWaveform();
  }, [waveformData, currentTime, audioDuration]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setAudioDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  const togglePlay = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleSeek = (value: number[]) => {
    if (!audioRef.current) return;
    const newTime = (value[0] / 100) * audioDuration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !audioRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * audioDuration;
    
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  if (isLoading) {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="w-full h-12 bg-muted/50 rounded-md flex items-center justify-center">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          <span className="ml-2 text-xs text-muted-foreground">Loading audio...</span>
        </div>
      </div>
    );
  }

  if (!signedUrl) {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="w-full h-12 bg-muted/50 rounded-md flex items-center justify-center">
          <span className="text-xs text-muted-foreground">Audio unavailable</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <audio ref={audioRef} src={signedUrl} preload="metadata" />
      
      <canvas
        ref={canvasRef}
        width={256}
        height={48}
        onClick={handleCanvasClick}
        className="w-full h-12 cursor-pointer rounded-md"
      />

      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={togglePlay}
          className="h-8 w-8"
        >
          {isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </Button>

        <div className="flex-1">
          <Slider
            value={[audioDuration > 0 ? (currentTime / audioDuration) * 100 : 0]}
            onValueChange={handleSeek}
            max={100}
            step={0.1}
            className="cursor-pointer"
          />
        </div>

        <span className="text-xs text-muted-foreground w-20 text-right">
          {formatTime(currentTime)} / {formatTime(audioDuration)}
        </span>

        <Button
          variant="ghost"
          size="icon"
          onClick={toggleMute}
          className="h-8 w-8"
        >
          {isMuted ? (
            <VolumeX className="h-4 w-4" />
          ) : (
            <Volume2 className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
