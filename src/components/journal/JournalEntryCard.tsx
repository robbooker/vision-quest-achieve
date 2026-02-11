import { useState, useRef, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import { 
  ImageIcon, 
  RefreshCw, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  ChevronDown, 
  ChevronUp,
  Sparkles,
  Camera,
  Plus,
  Timer,
  Lightbulb,
  Bird
} from 'lucide-react';
import { ImageLightbox } from '@/components/ui/image-lightbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
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
import { 
  JournalEntry, 
  useUpdateJournalNotes, 
  useGenerateJournalImage, 
  useDeleteJournalImage,
  useUploadJournalPhoto,
  useDeleteJournalPhoto,
  useGenerateDailyInsight,
  useUpdateIntentionScore
} from '@/hooks/useJournal';
import { useIntentionForMonth } from '@/hooks/useMonthlyIntention';
import { VoiceJournalAccordion } from './VoiceJournalAccordion';
import { IntentionDailyTracker } from './IntentionDailyTracker';

interface JournalEntryCardProps {
  entry: JournalEntry;
}

export const JournalEntryCard = ({ entry }: JournalEntryCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notes, setNotes] = useState(entry.user_notes || '');
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Get the month from the entry date for intention lookup
  const entryMonth = entry.entry_date.substring(0, 7); // "2026-01"
  const { data: monthIntention } = useIntentionForMonth(entryMonth);
  
  const updateNotes = useUpdateJournalNotes();
  const generateImage = useGenerateJournalImage();
  const deleteImage = useDeleteJournalImage();
  const uploadPhoto = useUploadJournalPhoto();
  const deletePhoto = useDeleteJournalPhoto();
  const generateInsight = useGenerateDailyInsight();
  const updateIntention = useUpdateIntentionScore();

  const isGenerating = generateImage.isPending;
  const isDeleting = deleteImage.isPending;
  const isUploading = uploadPhoto.isPending;
  const isGeneratingInsight = generateInsight.isPending;

  // Auto-generate insight when entry is created without one and has activities
  useEffect(() => {
    const totalAccomplishments = entry.completed_tasks.length + entry.completed_habits.length + (entry.completed_focus_sessions?.length || 0);
    if (!entry.ai_daily_insight && totalAccomplishments > 0 && !isGeneratingInsight) {
      // Delay to not overwhelm on initial load
      const timer = setTimeout(() => {
        generateInsight.mutate(entry.id);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [entry.id, entry.ai_daily_insight]);

  const userPhotos = entry.user_photos || [];
  const canAddMorePhotos = userPhotos.length < 2;

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        return;
      }
      uploadPhoto.mutate({ entryId: entry.id, file });
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSaveNotes = () => {
    updateNotes.mutate({ entryId: entry.id, notes });
    setIsEditingNotes(false);
  };

  const handleCancelEdit = () => {
    setNotes(entry.user_notes || '');
    setIsEditingNotes(false);
  };

  const wordCount = notes.trim().split(/\s+/).filter(Boolean).length;
  const maxWords = 500;

  const formattedDate = format(parseISO(entry.entry_date), 'EEEE, MMMM d, yyyy');

  const focusSessions = entry.completed_focus_sessions || [];
  const createdNotes = entry.created_notes || [];
  const birdSightings = entry.bird_sightings || [];
  const totalAccomplishments = entry.completed_tasks.length + entry.completed_habits.length + focusSessions.length + createdNotes.length + birdSightings.length;

  const formatFocusDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">{formattedDate}</CardTitle>
        <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
          <Badge variant="secondary">{entry.completed_tasks.length} tasks</Badge>
          <Badge variant="secondary">{entry.completed_habits.length} habits</Badge>
          {focusSessions.length > 0 && (
            <Badge variant="secondary">{focusSessions.length} focus sessions</Badge>
          )}
          {createdNotes.length > 0 && (
            <Badge variant="secondary">{createdNotes.length} notes</Badge>
          )}
          {birdSightings.length > 0 && (
            <Badge variant="secondary">{birdSightings.length} birds</Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Image Section */}
        <div className="relative bg-muted rounded-lg overflow-hidden">
          {isGenerating ? (
            <div className="aspect-video flex flex-col items-center justify-center gap-2">
              <RefreshCw className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Generating your journal art...</p>
            </div>
          ) : entry.image_url ? (
            <>
              <img 
                src={entry.image_url} 
                alt={`Journal art for ${formattedDate}`}
                className="w-full h-auto cursor-pointer hover:opacity-95 transition-opacity"
                onClick={() => setLightboxImage(entry.image_url)}
              />
              <div className="absolute top-2 right-2 flex gap-2 opacity-0 hover:opacity-100 transition-opacity">
                <Button
                  size="icon"
                  variant="secondary"
                  onClick={() => generateImage.mutate(entry.id)}
                  disabled={isGenerating}
                  title="Regenerate image"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      size="icon"
                      variant="destructive"
                      disabled={isDeleting}
                      title="Delete image"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Image?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will remove the generated image. You can always regenerate a new one.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteImage.mutate(entry.id)}>
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </>
          ) : (
            <div className="aspect-video flex flex-col items-center justify-center gap-3">
              <ImageIcon className="w-12 h-12 text-muted-foreground/50" />
              <Button
                variant="secondary"
                onClick={() => generateImage.mutate(entry.id)}
                disabled={isGenerating || totalAccomplishments === 0}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Image
              </Button>
              {totalAccomplishments === 0 && (
                <p className="text-xs text-muted-foreground">No accomplishments to visualize</p>
              )}
            </div>
          )}
        </div>

        {/* User Photos Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Camera className="w-4 h-4" />
              Your Photos ({userPhotos.length}/2)
            </h4>
            {canAddMorePhotos && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4 mr-1" />
                  )}
                  Add Photo
                </Button>
              </>
            )}
          </div>
          
          {userPhotos.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {userPhotos.map((photo, index) => (
                <div key={photo.path} className="relative aspect-square rounded-lg overflow-hidden group">
                  <img
                    src={photo.url}
                    alt={`User photo ${index + 1}`}
                    className="w-full h-full object-cover cursor-pointer hover:opacity-95 transition-opacity"
                    onClick={() => setLightboxImage(photo.url)}
                  />
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="icon"
                        variant="destructive"
                        className="absolute top-1 right-1 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        disabled={deletePhoto.isPending}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Photo?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently remove this photo from your journal entry.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => deletePhoto.mutate({ entryId: entry.id, photoPath: photo.path })}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Voice Journal Section - Now using accordion for multiple recordings */}
        <VoiceJournalAccordion entryId={entry.id} />

        {/* AI Daily Insight Section */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-primary" />
              Daily Insight
            </h4>
            {entry.ai_daily_insight && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => generateInsight.mutate(entry.id)}
                disabled={isGeneratingInsight}
                className="h-7 text-xs"
              >
                {isGeneratingInsight ? (
                  <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                ) : (
                  <RefreshCw className="w-3 h-3 mr-1" />
                )}
                Regenerate
              </Button>
            )}
          </div>
          
          {isGeneratingInsight ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/6" />
            </div>
          ) : entry.ai_daily_insight ? (
            <div className="prose prose-sm dark:prose-invert max-w-none text-sm text-muted-foreground [&>p]:mb-3 [&>p:last-child]:mb-0 [&>strong]:text-foreground [&>strong]:font-semibold">
              <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{entry.ai_daily_insight}</ReactMarkdown>
            </div>
          ) : totalAccomplishments > 0 ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => generateInsight.mutate(entry.id)}
              disabled={isGeneratingInsight}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Insight
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              No activities to analyze for insights
            </p>
          )}
        </div>

        {/* Accomplishments Section */}
        <div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center justify-between w-full text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <span>{totalAccomplishments} accomplishments</span>
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          
          {isExpanded && (
            <div className="mt-3 space-y-3">
              {entry.completed_tasks.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1">Tasks</h4>
                  <ul className="space-y-1">
                    {entry.completed_tasks.map((task) => (
                      <li key={task.id} className="text-sm flex items-center gap-2">
                        <Check className="w-3 h-3 text-primary" />
                        <span>{task.title}</span>
                        <Badge variant="outline" className="text-xs">{task.category}</Badge>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {entry.completed_habits.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1">Habits</h4>
                  <ul className="space-y-1">
                    {entry.completed_habits.map((habit) => (
                      <li key={habit.id} className="text-sm flex items-center gap-2">
                        <Check className="w-3 h-3 text-primary" />
                        <span>{habit.title}</span>
                        <span className="text-muted-foreground">×{habit.completed_count}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {focusSessions.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1">Focus Sessions</h4>
                  <ul className="space-y-1">
                    {focusSessions.map((session) => (
                      <li key={session.id} className="text-sm flex items-center gap-2">
                        <Timer className="w-3 h-3 text-primary" />
                        <span>{session.objective}</span>
                        <Badge variant="outline" className="text-xs">
                          {formatFocusDuration(session.actual_duration_minutes)}
                        </Badge>
                        {session.rating && (
                          <span className="text-xs text-muted-foreground capitalize">
                            {session.rating}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {createdNotes.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1">Notes Created</h4>
                  <ul className="space-y-1">
                    {createdNotes.map((note) => (
                      <li key={note.id} className="text-sm flex items-center gap-2">
                        <Check className="w-3 h-3 text-primary" />
                        <span>{note.title}</span>
                        {note.pillar && (
                          <Badge variant="outline" className="text-xs capitalize">{note.pillar}</Badge>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {birdSightings.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1">Birds Spotted</h4>
                  <ul className="space-y-1">
                    {birdSightings.map((sighting) => (
                      <li key={sighting.id} className="text-sm flex items-center gap-2">
                        <Bird className="w-3 h-3 text-primary" />
                        <span>{sighting.species_name}</span>
                        {sighting.location_name && (
                          <span className="text-xs text-muted-foreground">@ {sighting.location_name}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Intention Daily Tracker - only show if month has an intention */}
        {monthIntention && (
          <IntentionDailyTracker
            intentionWord={monthIntention.word}
            currentScore={(entry as any).intention_score || null}
            currentReflection={(entry as any).intention_reflection || null}
            onScoreChange={(score) => updateIntention.mutate({ 
              entryId: entry.id, 
              intentionScore: score 
            })}
            onReflectionChange={(reflection) => updateIntention.mutate({ 
              entryId: entry.id, 
              intentionReflection: reflection 
            })}
            isUpdating={updateIntention.isPending}
          />
        )}

        {/* Notes Section */}
        <div className="border-t pt-4">
          {isEditingNotes ? (
            <div className="space-y-2">
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add your personal reflections for this day..."
                className="min-h-[100px]"
              />
              <div className="flex items-center justify-between">
                <span className={`text-xs ${wordCount > maxWords ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {wordCount}/{maxWords} words
                </span>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                    <X className="w-4 h-4 mr-1" /> Cancel
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={handleSaveNotes}
                    disabled={wordCount > maxWords || updateNotes.isPending}
                  >
                    <Check className="w-4 h-4 mr-1" /> Save
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div 
              className="group cursor-pointer"
              onClick={() => setIsEditingNotes(true)}
            >
              {entry.user_notes ? (
                <div className="relative">
                  <p className="text-sm whitespace-pre-wrap">{entry.user_notes}</p>
                  <Edit3 className="absolute top-0 right-0 w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic flex items-center gap-2">
                  <Edit3 className="w-4 h-4" />
                  Click to add your reflections...
                </p>
              )}
            </div>
          )}
        </div>

        {/* Image Lightbox */}
        <ImageLightbox
          imageUrl={lightboxImage}
          alt={`Journal image for ${formattedDate}`}
          onClose={() => setLightboxImage(null)}
        />
      </CardContent>
    </Card>
  );
};
