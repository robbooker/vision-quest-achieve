import { useEffect, useRef } from "react";

interface AudioWaveformVisualizerProps {
  analyser: AnalyserNode | null;
  isRecording: boolean;
  className?: string;
}

export function AudioWaveformVisualizer({ 
  analyser, 
  isRecording,
  className = "" 
}: AudioWaveformVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    if (!analyser || !canvasRef.current || !isRecording) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!isRecording) return;
      
      animationRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      // Clear canvas with transparent background
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barCount = 32;
      const barWidth = canvas.width / barCount;
      const gap = 2;

      for (let i = 0; i < barCount; i++) {
        // Sample from frequency data
        const dataIndex = Math.floor((i / barCount) * bufferLength);
        const value = dataArray[dataIndex];
        const barHeight = (value / 255) * canvas.height * 0.8;

        // Use CSS custom property colors via computed style
        const computedStyle = getComputedStyle(document.documentElement);
        const primaryColor = computedStyle.getPropertyValue("--primary").trim();
        
        // Create gradient effect
        const gradient = ctx.createLinearGradient(
          0, 
          canvas.height - barHeight, 
          0, 
          canvas.height
        );
        gradient.addColorStop(0, `hsl(${primaryColor})`);
        gradient.addColorStop(1, `hsl(${primaryColor} / 0.5)`);

        ctx.fillStyle = gradient;
        ctx.fillRect(
          i * barWidth + gap / 2,
          canvas.height - barHeight,
          barWidth - gap,
          barHeight
        );
      }
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [analyser, isRecording]);

  // Draw idle state when not recording
  useEffect(() => {
    if (isRecording || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const barCount = 32;
    const barWidth = canvas.width / barCount;
    const gap = 2;

    const computedStyle = getComputedStyle(document.documentElement);
    const mutedColor = computedStyle.getPropertyValue("--muted-foreground").trim();

    for (let i = 0; i < barCount; i++) {
      const barHeight = 4;
      ctx.fillStyle = `hsl(${mutedColor} / 0.3)`;
      ctx.fillRect(
        i * barWidth + gap / 2,
        canvas.height / 2 - barHeight / 2,
        barWidth - gap,
        barHeight
      );
    }
  }, [isRecording]);

  return (
    <canvas
      ref={canvasRef}
      width={256}
      height={64}
      className={`w-full h-16 ${className}`}
    />
  );
}
