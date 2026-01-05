import { useCallback, useRef } from "react";

// Toast pop sound - a short, satisfying "pop" sound
const TOAST_POP_SOUND_URL = "https://cdn.freesound.org/previews/256/256116_3263906-lq.mp3";

export function useToastSound() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playToastPop = useCallback(() => {
    // Create audio element if it doesn't exist
    if (!audioRef.current) {
      audioRef.current = new Audio(TOAST_POP_SOUND_URL);
      audioRef.current.volume = 0.5;
    }

    // Reset and play
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch((error) => {
      // Silently handle autoplay restrictions
      console.log("Audio playback prevented:", error);
    });
  }, []);

  return { playToastPop };
}
