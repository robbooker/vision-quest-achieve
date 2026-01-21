import { useState, useCallback, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AudioMetadata {
  mood?: string;
  energyLevel?: number;
  keyThemes?: string[];
  highlights?: { text: string; significance: string }[];
  suggestedPrompt?: string;
  transcribedAt?: string;
}

interface TranscriptionResult {
  success: boolean;
  transcript: string;
  mood: string;
  energyLevel: number;
  keyThemes: string[];
  highlights: { text: string; significance: string }[];
  suggestedPrompt: string;
  durationSeconds: number;
  chunksGenerated: number;
}

export function useAudioJournal() {
  const queryClient = useQueryClient();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const MAX_RECORDING_SECONDS = 600; // 10 minutes

  // Check if MediaRecorder is supported
  const isSupported = typeof MediaRecorder !== "undefined";

  const startRecording = useCallback(async () => {
    if (!isSupported) {
      toast.error("Audio recording is not supported in this browser");
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Set up audio context for visualization
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const analyserNode = audioContext.createAnalyser();
      analyserNode.fftSize = 256;
      source.connect(analyserNode);
      setAnalyser(analyserNode);

      // Set up MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/mp4";
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
      };

      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= MAX_RECORDING_SECONDS - 1) {
            stopRecording();
            toast.info("Maximum recording time reached (10 minutes)");
            return MAX_RECORDING_SECONDS;
          }
          return prev + 1;
        });
      }, 1000);

      return true;
    } catch (error) {
      console.error("Failed to start recording:", error);
      if (error instanceof DOMException && error.name === "NotAllowedError") {
        toast.error("Microphone permission denied. Please allow access to record audio.");
      } else {
        toast.error("Failed to start recording");
      }
      return false;
    }
  }, [isSupported]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setIsRecording(false);
    setAnalyser(null);
  }, [isRecording]);

  const cancelRecording = useCallback(() => {
    stopRecording();
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
  }, [stopRecording]);

  // Upload audio to storage
  const uploadAudio = useMutation({
    mutationFn: async ({
      entryId,
      blob,
    }: {
      entryId: string;
      blob: Blob;
    }): Promise<string> => {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) throw new Error("Not authenticated");

      const userId = session.session.user.id;
      const ext = blob.type.includes("webm") ? "webm" : "m4a";
      const fileName = `${userId}/${entryId}-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("journal-audio")
        .upload(fileName, blob, {
          contentType: blob.type,
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: publicUrl } = supabase.storage
        .from("journal-audio")
        .getPublicUrl(fileName);

      // Update journal entry with audio URL
      const { error: updateError } = await supabase
        .from("journal_entries")
        .update({ audio_url: publicUrl.publicUrl })
        .eq("id", entryId);

      if (updateError) throw updateError;

      return publicUrl.publicUrl;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journal-entries"] });
    },
    onError: (error) => {
      console.error("Upload error:", error);
      toast.error("Failed to upload audio");
    },
  });

  // Transcribe audio
  const transcribeAudio = useMutation({
    mutationFn: async ({
      audioUrl,
      entryId,
    }: {
      audioUrl: string;
      entryId: string;
    }): Promise<TranscriptionResult> => {
      const { data, error } = await supabase.functions.invoke(
        "transcribe-audio",
        {
          body: { audioUrl, entryId },
        }
      );

      if (error) throw error;
      if (!data.success) throw new Error(data.error || "Transcription failed");

      return data;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["journal-entries"] });
      toast.success(
        `Transcribed successfully! Detected mood: ${result.mood}`,
        {
          description: `${result.keyThemes.length} themes identified, ${result.chunksGenerated} chunks embedded`,
        }
      );
    },
    onError: (error) => {
      console.error("Transcription error:", error);
      toast.error("Failed to transcribe audio");
    },
  });

  // Delete audio from entry
  const deleteAudio = useMutation({
    mutationFn: async (entryId: string) => {
      const { data: entry } = await supabase
        .from("journal_entries")
        .select("audio_url")
        .eq("id", entryId)
        .single();

      if (entry?.audio_url) {
        // Extract file path from URL
        const url = new URL(entry.audio_url);
        const pathParts = url.pathname.split("/");
        const filePath = pathParts.slice(-2).join("/");

        await supabase.storage.from("journal-audio").remove([filePath]);
      }

      const { error } = await supabase
        .from("journal_entries")
        .update({
          audio_url: null,
          audio_transcript: null,
          audio_duration_seconds: null,
          audio_metadata: null,
        })
        .eq("id", entryId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journal-entries"] });
      toast.success("Audio removed");
    },
    onError: (error) => {
      console.error("Delete error:", error);
      toast.error("Failed to delete audio");
    },
  });

  // Update transcript (for manual edits)
  const updateTranscript = useMutation({
    mutationFn: async ({
      entryId,
      transcript,
    }: {
      entryId: string;
      transcript: string;
    }) => {
      const { error } = await supabase
        .from("journal_entries")
        .update({ audio_transcript: transcript })
        .eq("id", entryId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journal-entries"] });
      toast.success("Transcript updated");
    },
  });

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return {
    // Recording state
    isRecording,
    recordingTime,
    formattedTime: formatTime(recordingTime),
    maxRecordingTime: MAX_RECORDING_SECONDS,
    audioBlob,
    audioUrl,
    analyser,
    isSupported,

    // Recording actions
    startRecording,
    stopRecording,
    cancelRecording,

    // Mutations
    uploadAudio,
    transcribeAudio,
    deleteAudio,
    updateTranscript,

    // Helpers
    clearRecording: cancelRecording,
  };
}

// Type for mood icons
export const MOOD_ICONS: Record<string, string> = {
  happy: "😊",
  calm: "😌",
  reflective: "🤔",
  stressed: "😰",
  anxious: "😟",
  energetic: "⚡",
  sad: "😢",
  grateful: "🙏",
  frustrated: "😤",
  hopeful: "🌟",
  tired: "😴",
  excited: "🎉",
};

// Energy level colors
export const getEnergyColor = (level: number): string => {
  if (level <= 3) return "text-red-500";
  if (level <= 5) return "text-yellow-500";
  if (level <= 7) return "text-green-500";
  return "text-emerald-500";
};
