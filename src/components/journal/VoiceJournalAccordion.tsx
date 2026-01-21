import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Mic, Plus, Trash2, ChevronDown, ChevronUp, Volume2, RefreshCw, Pencil, Check, X } from 'lucide-react';
import { AudioPlayerWithWaveform } from './AudioPlayerWithWaveform';
import { AudioJournalRecorder } from './AudioJournalRecorder';
import {
  JournalAudioRecording,
  useJournalAudioRecordings,
  useDeleteAudioRecording,
  useTranscribeAudioRecording,
  useUpdateAudioTranscript,
} from '@/hooks/useJournalAudioRecordings';
import { MOOD_ICONS, getEnergyColor } from '@/hooks/useAudioJournal';
import { Skeleton } from '@/components/ui/skeleton';

interface VoiceJournalAccordionProps {
  entryId: string;
}

export function VoiceJournalAccordion({ entryId }: VoiceJournalAccordionProps) {
  const [showRecorder, setShowRecorder] = useState(false);
  const { data: recordings, isLoading } = useJournalAudioRecordings(entryId);
  const deleteRecording = useDeleteAudioRecording();

  const recordingCount = recordings?.length || 0;

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Mic className="w-4 h-4" />
            Voice Journal
          </h4>
        </div>
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <Mic className="w-4 h-4" />
          Voice Journal
          {recordingCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {recordingCount}
            </Badge>
          )}
        </h4>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowRecorder(true)}
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Voice Note
        </Button>
      </div>

      {recordingCount === 0 ? (
        <div className="p-4 text-center text-sm text-muted-foreground bg-muted/30 rounded-lg">
          No voice notes yet. Record one to capture your thoughts!
        </div>
      ) : (
        <Accordion type="single" collapsible className="w-full">
          {recordings?.map((recording, index) => (
            <VoiceRecordingItem
              key={recording.id}
              recording={recording}
              index={recordingCount - index}
              entryId={entryId}
              onDelete={() =>
                deleteRecording.mutate({ recordingId: recording.id, entryId })
              }
              isDeleting={deleteRecording.isPending}
            />
          ))}
        </Accordion>
      )}

      <AudioJournalRecorder
        entryId={entryId}
        open={showRecorder}
        onOpenChange={setShowRecorder}
      />
    </div>
  );
}

interface VoiceRecordingItemProps {
  recording: JournalAudioRecording;
  index: number;
  entryId: string;
  onDelete: () => void;
  isDeleting: boolean;
}

function VoiceRecordingItem({
  recording,
  index,
  entryId,
  onDelete,
  isDeleting,
}: VoiceRecordingItemProps) {
  const [showTranscript, setShowTranscript] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTranscript, setEditedTranscript] = useState(recording.audio_transcript || '');
  
  const retranscribe = useTranscribeAudioRecording();
  const updateTranscript = useUpdateAudioTranscript();
  
  const metadata = recording.audio_metadata;
  const createdTime = format(parseISO(recording.created_at), 'h:mm a');

  const handleRetranscribe = () => {
    retranscribe.mutate({
      recordingId: recording.id,
      audioUrl: recording.audio_url,
      entryId,
    });
  };

  const handleSaveEdit = () => {
    updateTranscript.mutate({
      recordingId: recording.id,
      transcript: editedTranscript,
      entryId,
    });
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedTranscript(recording.audio_transcript || '');
    setIsEditing(false);
  };

  return (
    <AccordionItem value={recording.id} className="border rounded-lg px-3 mb-2">
      <AccordionTrigger className="hover:no-underline py-3">
        <div className="flex items-center gap-3 text-left flex-1">
          <div className="flex items-center gap-2">
            {metadata?.mood && (
              <span className="text-lg" title={`Mood: ${metadata.mood}`}>
                {MOOD_ICONS[metadata.mood] || '🎙️'}
              </span>
            )}
            <span className="font-medium text-sm">Voice Note #{index}</span>
          </div>
          <span className="text-xs text-muted-foreground">{createdTime}</span>
          {retranscribe.isPending && (
            <Badge variant="secondary" className="text-xs animate-pulse">
              <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
              Transcribing...
            </Badge>
          )}
          {metadata?.keyThemes && metadata.keyThemes.length > 0 && !retranscribe.isPending && (
            <div className="hidden sm:flex gap-1">
              {metadata.keyThemes.slice(0, 2).map((theme, i) => (
                <Badge key={i} variant="outline" className="text-xs">
                  {theme}
                </Badge>
              ))}
              {metadata.keyThemes.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{metadata.keyThemes.length - 2}
                </Badge>
              )}
            </div>
          )}
        </div>
      </AccordionTrigger>
      <AccordionContent className="pb-4">
        <div className="space-y-3">
          <AudioPlayerWithWaveform
            src={recording.audio_url}
            duration={recording.audio_duration_seconds || undefined}
          />

          {/* Mood & Energy indicators */}
          {metadata && (
            <div className="flex flex-wrap gap-2 text-xs">
              {metadata.mood && (
                <Badge variant="secondary" className="gap-1">
                  {MOOD_ICONS[metadata.mood]} {metadata.mood}
                </Badge>
              )}
              {metadata.energyLevel && (
                <Badge
                  variant="outline"
                  className={getEnergyColor(metadata.energyLevel)}
                >
                  ⚡ Energy: {metadata.energyLevel}/10
                </Badge>
              )}
            </div>
          )}

          {/* Key Themes */}
          {metadata?.keyThemes && metadata.keyThemes.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {metadata.keyThemes.map((theme, i) => (
                <Badge key={i} variant="outline" className="text-xs">
                  {theme}
                </Badge>
              ))}
            </div>
          )}

          {/* Highlights */}
          {metadata?.highlights && metadata.highlights.length > 0 && (
            <div className="space-y-2">
              {metadata.highlights.map((highlight, i) => (
                <blockquote
                  key={i}
                  className="border-l-2 border-primary pl-3 py-1 text-sm italic"
                >
                  "{highlight.text}"
                  <p className="text-xs text-muted-foreground not-italic mt-1">
                    {highlight.significance}
                  </p>
                </blockquote>
              ))}
            </div>
          )}

          {/* Transcript section */}
          {recording.audio_transcript && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setShowTranscript(!showTranscript)}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Volume2 className="w-3 h-3" />
                  {showTranscript ? 'Hide transcript' : 'Show transcript'}
                  {showTranscript ? (
                    <ChevronUp className="w-3 h-3" />
                  ) : (
                    <ChevronDown className="w-3 h-3" />
                  )}
                </button>
                
                {showTranscript && !isEditing && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2 text-xs"
                    onClick={() => setIsEditing(true)}
                  >
                    <Pencil className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                )}
              </div>

              {showTranscript && (
                <div className="space-y-2">
                  {isEditing ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editedTranscript}
                        onChange={(e) => setEditedTranscript(e.target.value)}
                        className="min-h-[100px] text-sm"
                        placeholder="Edit transcript..."
                      />
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleCancelEdit}
                          disabled={updateTranscript.isPending}
                        >
                          <X className="w-3 h-3 mr-1" />
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleSaveEdit}
                          disabled={updateTranscript.isPending}
                        >
                          <Check className="w-3 h-3 mr-1" />
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {recording.audio_transcript}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex justify-between items-center pt-2 border-t">
            <Button
              size="sm"
              variant="outline"
              onClick={handleRetranscribe}
              disabled={retranscribe.isPending}
            >
              <RefreshCw className={`w-3 h-3 mr-1 ${retranscribe.isPending ? 'animate-spin' : ''}`} />
              Re-transcribe
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  disabled={isDeleting}
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Remove
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Voice Note?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently remove this voice note and its
                    transcript.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
