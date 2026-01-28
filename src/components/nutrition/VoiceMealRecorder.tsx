import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Mic, Square, Loader2, X } from 'lucide-react';

interface VoiceMealRecorderProps {
  onTranscript: (transcript: string) => void;
  onCancel: () => void;
}

export function VoiceMealRecorder({ onTranscript, onCancel }: VoiceMealRecorderProps) {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        
        if (chunksRef.current.length > 0) {
          const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType });
          await transcribeAudio(blob);
        }
      };

      mediaRecorder.start(1000);
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Failed to start recording:', error);
      toast({ 
        title: 'Microphone access denied', 
        description: 'Please allow microphone access to use voice input',
        variant: 'destructive' 
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const transcribeAudio = async (blob: Blob) => {
    setIsTranscribing(true);
    
    try {
      // Convert blob to base64
      const arrayBuffer = await blob.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(arrayBuffer).reduce(
          (data, byte) => data + String.fromCharCode(byte),
          ''
        )
      );

      // Use a simple transcription approach via Gemini
      const { data, error } = await supabase.functions.invoke('transcribe-audio', {
        body: {
          audioData: base64,
          mimeType: blob.type,
          mode: 'simple', // Just transcription, no journal entry
        },
      });

      if (error) throw error;

      const transcript = data?.transcript || data?.text || '';
      if (transcript) {
        onTranscript(transcript);
      } else {
        toast({ 
          title: 'Could not transcribe audio', 
          description: 'Please try again or type your meal',
          variant: 'destructive' 
        });
      }
    } catch (error) {
      console.error('Transcription error:', error);
      toast({ 
        title: 'Transcription failed', 
        description: 'Please try again or type your meal',
        variant: 'destructive' 
      });
    } finally {
      setIsTranscribing(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center py-8 space-y-4">
      {isTranscribing ? (
        <>
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          </div>
          <p className="text-sm text-muted-foreground">Transcribing...</p>
        </>
      ) : isRecording ? (
        <>
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center animate-pulse">
              <Mic className="h-8 w-8 text-destructive" />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-destructive rounded-full animate-ping" />
          </div>
          <p className="text-lg font-mono">{formatTime(recordingTime)}</p>
          <p className="text-sm text-muted-foreground">Describe what you ate...</p>
          <Button
            variant="destructive"
            size="lg"
            className="rounded-full"
            onClick={stopRecording}
          >
            <Square className="h-4 w-4 mr-2" />
            Stop Recording
          </Button>
        </>
      ) : (
        <>
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Mic className="h-8 w-8 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Tap to record your meal
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onCancel}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              size="lg"
              className="rounded-full"
              onClick={startRecording}
            >
              <Mic className="h-4 w-4 mr-2" />
              Start Recording
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
