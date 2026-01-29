import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQuickTasks } from '@/hooks/useQuickTasks';
import { useBirdwatching } from '@/hooks/useBirdwatching';
import { useNutritionMutations } from '@/hooks/useNutrition';
import { useCreateJournalEntry, useJournalEntries, useUpdateJournalNotes } from '@/hooks/useJournal';
import { format } from 'date-fns';
import { 
  Mic, 
  Square, 
  Loader2, 
  BookOpen, 
  Utensils, 
  Bird, 
  CheckSquare 
} from 'lucide-react';
import { cn } from '@/lib/utils';

type RecordingType = 'journal' | 'nutrition' | 'bird' | 'task';

interface UniversalVoiceRecorderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const recordingTypes: { type: RecordingType; label: string; icon: typeof Mic; description: string }[] = [
  { type: 'journal', label: 'Journal', icon: BookOpen, description: 'Add to today\'s reflection' },
  { type: 'nutrition', label: 'Meal', icon: Utensils, description: 'Log what you ate' },
  { type: 'bird', label: 'Bird', icon: Bird, description: 'Log a sighting' },
  { type: 'task', label: 'Task', icon: CheckSquare, description: 'Create a quick task' },
];

export function UniversalVoiceRecorder({ open, onOpenChange }: UniversalVoiceRecorderProps) {
  const { toast } = useToast();
  const [selectedType, setSelectedType] = useState<RecordingType>('task');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Hooks for each type
  const { createTask } = useQuickTasks();
  const { addSighting } = useBirdwatching();
  const { logMeal, parseNutrition } = useNutritionMutations();
  const createJournalEntry = useCreateJournalEntry();
  const updateJournalNotes = useUpdateJournalNotes();
  const { entries: journalEntries } = useJournalEntries(1);

  // Cleanup on unmount or close
  useEffect(() => {
    return () => {
      cleanupRecording();
    };
  }, []);

  // Reset when dialog closes
  useEffect(() => {
    if (!open) {
      cleanupRecording();
      setIsRecording(false);
      setIsProcessing(false);
      setRecordingTime(0);
    }
  }, [open]);

  const cleanupRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
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
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
        
        if (chunksRef.current.length > 0) {
          const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType });
          await processRecording(blob);
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

  const transcribeAudio = async (blob: Blob): Promise<string> => {
    // Convert blob to base64
    const arrayBuffer = await blob.arrayBuffer();
    const base64 = btoa(
      new Uint8Array(arrayBuffer).reduce(
        (data, byte) => data + String.fromCharCode(byte),
        ''
      )
    );

    const { data, error } = await supabase.functions.invoke('transcribe-audio', {
      body: {
        audioData: base64,
        mimeType: blob.type,
        mode: 'simple',
      },
    });

    if (error) throw error;
    return data?.transcript || data?.text || '';
  };

  const processRecording = async (blob: Blob) => {
    setIsProcessing(true);
    
    try {
      const transcript = await transcribeAudio(blob);
      
      if (!transcript.trim()) {
        toast({ 
          title: 'Could not transcribe audio', 
          description: 'Please try again',
          variant: 'destructive' 
        });
        setIsProcessing(false);
        return;
      }

      // Route to appropriate handler based on selected type
      switch (selectedType) {
        case 'task':
          await handleTaskCreation(transcript);
          break;
        case 'nutrition':
          await handleNutritionLog(transcript);
          break;
        case 'bird':
          await handleBirdSighting(transcript);
          break;
        case 'journal':
          await handleJournalEntry(transcript);
          break;
      }

      onOpenChange(false);
    } catch (error) {
      console.error('Processing error:', error);
      toast({ 
        title: 'Processing failed', 
        description: 'Please try again',
        variant: 'destructive' 
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTaskCreation = async (transcript: string) => {
    const title = transcript.trim().slice(0, 200); // Limit title length
    await createTask.mutateAsync({
      title,
      category: 'personal',
    });
    toast({ title: 'Task created', description: title });
  };

  const handleNutritionLog = async (transcript: string) => {
    // Parse nutrition from transcript
    const parsed = await parseNutrition.mutateAsync(transcript);
    
    await logMeal.mutateAsync({
      meal_description: transcript,
      calories: parsed.calories,
      protein_g: parsed.protein_g,
      carbs_g: parsed.carbs_g,
      fats_g: parsed.fats_g,
      sugar_g: parsed.sugar_g,
      fiber_g: parsed.fiber_g,
      source: 'voice',
    });
    
    toast({ 
      title: 'Meal logged', 
      description: `${parsed.calories} cal | ${parsed.protein_g}g protein` 
    });
  };

  const handleBirdSighting = async (transcript: string) => {
    // Simple extraction: use the transcript as species name for now
    // User can edit after creation. Try to extract capitalized words as species.
    const words = transcript.split(' ');
    let speciesName = '';
    let behaviorNotes = '';
    
    // Look for consecutive capitalized words (likely species name)
    const capitalizedWords: string[] = [];
    let foundLowercase = false;
    
    for (const word of words) {
      const cleanWord = word.replace(/[,.!?]/g, '');
      if (cleanWord.length > 0 && cleanWord[0] === cleanWord[0].toUpperCase() && !foundLowercase) {
        capitalizedWords.push(cleanWord);
      } else if (capitalizedWords.length > 0) {
        foundLowercase = true;
      }
    }
    
    if (capitalizedWords.length > 0 && capitalizedWords.length <= 4) {
      speciesName = capitalizedWords.join(' ');
      // Rest is behavior notes
      const speciesEndIndex = transcript.toLowerCase().indexOf(speciesName.toLowerCase()) + speciesName.length;
      behaviorNotes = transcript.slice(speciesEndIndex).trim().replace(/^[,.\s]+/, '');
    } else {
      // Fallback: use first 3 words as species
      speciesName = words.slice(0, 3).join(' ').replace(/[,.!?]/g, '');
      behaviorNotes = words.slice(3).join(' ');
    }

    await addSighting.mutateAsync({
      species_name: speciesName || transcript.slice(0, 50),
      sighting_date: format(new Date(), 'yyyy-MM-dd'),
      behavior_notes: behaviorNotes || undefined,
    });
  };

  const handleJournalEntry = async (transcript: string) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    
    // Check if today's entry exists
    const todayEntry = journalEntries.find(e => e.entry_date === today);
    
    if (todayEntry) {
      // Append to existing notes
      const currentNotes = todayEntry.user_notes || '';
      const newNotes = currentNotes 
        ? `${currentNotes}\n\n${transcript}` 
        : transcript;
      
      await updateJournalNotes.mutateAsync({
        entryId: todayEntry.id,
        notes: newNotes,
      });
    } else {
      // Create new entry first, then update notes
      const entry = await createJournalEntry.mutateAsync(today);
      await updateJournalNotes.mutateAsync({
        entryId: entry.id,
        notes: transcript,
      });
    }
    
    toast({ title: 'Added to journal', description: 'Voice note saved' });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const selectedTypeInfo = recordingTypes.find(t => t.type === selectedType);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5" />
            Voice Capture
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Type Selector */}
          {!isRecording && !isProcessing && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">What are you recording?</p>
              <div className="grid grid-cols-4 gap-2">
                {recordingTypes.map(({ type, label, icon: Icon }) => (
                  <button
                    key={type}
                    onClick={() => setSelectedType(type)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-all",
                      selectedType === type 
                        ? "border-primary bg-primary/10 text-primary" 
                        : "border-border hover:border-primary/50 hover:bg-muted"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-xs font-medium">{label}</span>
                  </button>
                ))}
              </div>
              {selectedTypeInfo && (
                <p className="text-xs text-muted-foreground text-center">
                  {selectedTypeInfo.description}
                </p>
              )}
            </div>
          )}

          {/* Recording UI */}
          <div className="flex flex-col items-center py-4 space-y-4">
            {isProcessing ? (
              <>
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                </div>
                <p className="text-sm text-muted-foreground">Processing...</p>
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
                <p className="text-sm text-muted-foreground">
                  {selectedType === 'task' && 'Describe your task...'}
                  {selectedType === 'nutrition' && 'Describe what you ate...'}
                  {selectedType === 'bird' && 'Describe the bird you saw...'}
                  {selectedType === 'journal' && 'Share your thoughts...'}
                </p>
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
                  Tap to start recording
                </p>
                <Button
                  size="lg"
                  className="rounded-full"
                  onClick={startRecording}
                >
                  <Mic className="h-4 w-4 mr-2" />
                  Start Recording
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
