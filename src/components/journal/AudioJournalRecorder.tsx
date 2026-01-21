import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Mic, Square, Upload, X, Check, Loader2 } from "lucide-react";
import { useAudioJournal } from "@/hooks/useAudioJournal";
import { AudioWaveformVisualizer } from "./AudioWaveformVisualizer";
import { AudioPlayerWithWaveform } from "./AudioPlayerWithWaveform";
import { VoiceCheckinPrompts } from "./VoiceCheckinPrompts";
import { toast } from "sonner";

interface AudioJournalRecorderProps {
  entryId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
  dynamicPrompt?: string;
}

export function AudioJournalRecorder({
  entryId,
  open,
  onOpenChange,
  onComplete,
  dynamicPrompt,
}: AudioJournalRecorderProps) {
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    isRecording,
    recordingTime,
    formattedTime,
    maxRecordingTime,
    audioBlob,
    audioUrl,
    analyser,
    isSupported,
    startRecording,
    stopRecording,
    cancelRecording,
    uploadAudio,
    transcribeAudio,
  } = useAudioJournal();

  const isUploading = uploadAudio.isPending;
  const isTranscribing = transcribeAudio.isPending;
  const isProcessing = isUploading || isTranscribing;

  const handleStartRecording = async () => {
    const success = await startRecording();
    if (!success && !isSupported) {
      toast.error("Your browser doesn't support audio recording. Please upload a file instead.");
    }
  };

  const handleStopRecording = () => {
    stopRecording();
  };

  const handleCancel = () => {
    cancelRecording();
    onOpenChange(false);
  };

  const handleSubmit = async () => {
    if (!audioBlob) return;

    try {
      // Upload audio
      const publicUrl = await uploadAudio.mutateAsync({
        entryId,
        blob: audioBlob,
      });

      // Transcribe audio
      await transcribeAudio.mutateAsync({
        audioUrl: publicUrl,
        entryId,
      });

      // Clean up and close
      cancelRecording();
      onOpenChange(false);
      onComplete?.();
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["audio/mp3", "audio/mpeg", "audio/m4a", "audio/mp4", "audio/wav", "audio/webm"];
    if (!validTypes.some(type => file.type.includes(type.split("/")[1]))) {
      toast.error("Please upload an MP3, M4A, WAV, or WebM audio file");
      return;
    }

    // Validate file size (max 15MB)
    if (file.size > 15 * 1024 * 1024) {
      toast.error("File size must be under 15MB");
      return;
    }

    try {
      // Upload audio
      const publicUrl = await uploadAudio.mutateAsync({
        entryId,
        blob: file,
      });

      // Transcribe audio
      await transcribeAudio.mutateAsync({
        audioUrl: publicUrl,
        entryId,
      });

      // Clean up and close
      onOpenChange(false);
      onComplete?.();
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedPrompt(null);
    }
  }, [open]);

  const progressPercent = (recordingTime / maxRecordingTime) * 100;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5" />
            Voice Journal
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Prompt suggestion */}
          {!isRecording && !audioBlob && !isProcessing && (
            <VoiceCheckinPrompts
              dynamicPrompt={dynamicPrompt}
              onSelectPrompt={setSelectedPrompt}
            />
          )}

          {/* Selected prompt display */}
          {selectedPrompt && !isRecording && !audioBlob && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium">{selectedPrompt}</p>
            </div>
          )}

          {/* Recording visualization */}
          {(isRecording || audioBlob) && (
            <div className="space-y-4">
              {isRecording ? (
                <>
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-3 h-3 bg-destructive rounded-full animate-pulse" />
                    <span className="text-lg font-mono">{formattedTime}</span>
                  </div>
                  <AudioWaveformVisualizer 
                    analyser={analyser} 
                    isRecording={isRecording} 
                  />
                  <Progress value={progressPercent} className="h-1" />
                  <p className="text-xs text-muted-foreground text-center">
                    Max recording time: 10 minutes
                  </p>
                </>
              ) : audioUrl ? (
                <AudioPlayerWithWaveform src={audioUrl} duration={recordingTime} />
              ) : null}
            </div>
          )}

          {/* Processing status */}
          {isProcessing && (
            <div className="flex flex-col items-center gap-2 py-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                {isUploading ? "Uploading audio..." : "Transcribing with AI..."}
              </p>
              {isTranscribing && (
                <p className="text-xs text-muted-foreground text-center">
                  Analyzing mood, themes, and generating embeddings...
                </p>
              )}
            </div>
          )}

          {/* Action buttons */}
          {!isProcessing && (
            <div className="flex flex-col gap-3">
              {!isRecording && !audioBlob && (
                <>
                  {isSupported && (
                    <Button
                      onClick={handleStartRecording}
                      className="w-full"
                      size="lg"
                    >
                      <Mic className="h-5 w-5 mr-2" />
                      Start Recording
                    </Button>
                  )}

                  <div className="relative">
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Audio File
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="audio/mp3,audio/mpeg,audio/m4a,audio/mp4,audio/wav,audio/webm"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>

                  {!isSupported && (
                    <p className="text-xs text-muted-foreground text-center">
                      Recording not supported in this browser. Please upload an audio file.
                    </p>
                  )}
                </>
              )}

              {isRecording && (
                <Button
                  onClick={handleStopRecording}
                  variant="destructive"
                  className="w-full"
                  size="lg"
                >
                  <Square className="h-5 w-5 mr-2" />
                  Stop Recording
                </Button>
              )}

              {audioBlob && !isRecording && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    className="flex-1"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Discard
                  </Button>
                  <Button onClick={handleSubmit} className="flex-1">
                    <Check className="h-4 w-4 mr-2" />
                    Save & Transcribe
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
