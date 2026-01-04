import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { 
  ImageIcon, 
  RefreshCw, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  ChevronDown, 
  ChevronUp,
  Sparkles 
} from 'lucide-react';
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
  useDeleteJournalImage 
} from '@/hooks/useJournal';

interface JournalEntryCardProps {
  entry: JournalEntry;
}

export const JournalEntryCard = ({ entry }: JournalEntryCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notes, setNotes] = useState(entry.user_notes || '');
  
  const updateNotes = useUpdateJournalNotes();
  const generateImage = useGenerateJournalImage();
  const deleteImage = useDeleteJournalImage();

  const isGenerating = generateImage.isPending;
  const isDeleting = deleteImage.isPending;

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

  const totalAccomplishments = entry.completed_tasks.length + entry.completed_habits.length;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">{formattedDate}</CardTitle>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Badge variant="secondary">{entry.completed_tasks.length} tasks</Badge>
          <Badge variant="secondary">{entry.completed_habits.length} habits</Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Image Section */}
        <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
          {isGenerating ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <RefreshCw className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Generating your journal art...</p>
            </div>
          ) : entry.image_url ? (
            <>
              <img 
                src={entry.image_url} 
                alt={`Journal art for ${formattedDate}`}
                className="w-full h-full object-cover"
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
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
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
            </div>
          )}
        </div>

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
      </CardContent>
    </Card>
  );
};
