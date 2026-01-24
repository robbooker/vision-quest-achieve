import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ImageLightbox } from '@/components/ui/image-lightbox';
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
  ArrowLeft, 
  Bird, 
  Calendar, 
  MapPin, 
  Eye, 
  Sparkles, 
  Save,
  Loader2,
  Camera,
  BookOpen,
  RefreshCw,
  Undo2,
  Trash2,
  Check,
  Pencil,
  ChevronDown
} from 'lucide-react';
import { useBirdwatching, BirdSighting } from '@/hooks/useBirdwatching';
import { useAIBirdResearch } from '@/hooks/useAIBirdResearch';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import { EditSightingDialog } from './EditSightingDialog';

interface SpeciesDetailProps {
  species: string;
  onBack: () => void;
}

export function SpeciesDetail({ species, onBack }: SpeciesDetailProps) {
  const { 
    sightings, 
    getPhotosForSighting, 
    getNotesForSpecies, 
    saveSpeciesNotes,
    saveAIResearch,
    deleteSighting,
    allPhotos 
  } = useBirdwatching();
  
  // Get cached data for this species
  const existingNotes = getNotesForSpecies(species);
  
  const handleSaveResearch = useCallback(async (research: string) => {
    await saveAIResearch.mutateAsync({ species_name: species, research });
  }, [saveAIResearch, species]);
  
  const { 
    research, 
    isLoading: researchLoading, 
    isSaved,
    savedAt,
    hasPrevious,
    fetchResearch,
    regenerate,
    saveResearch,
    restorePrevious
  } = useAIBirdResearch(species, {
    cachedResearch: existingNotes?.ai_research_cache,
    cachedAt: existingNotes?.ai_research_fetched_at,
    previousResearch: existingNotes?.ai_research_previous,
    onSave: handleSaveResearch,
  });
  
  const [personalNotes, setPersonalNotes] = useState(
    existingNotes?.personal_notes || ''
  );
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false);
  const [editingSighting, setEditingSighting] = useState<BirdSighting | null>(null);

  const speciesSightings = sightings.filter(
    s => s.species_name.toLowerCase() === species.toLowerCase()
  ).sort((a, b) => new Date(b.sighting_date).getTime() - new Date(a.sighting_date).getTime());

  const firstSighting = speciesSightings[speciesSightings.length - 1];
  const lastSighting = speciesSightings[0];

  // Get all photos for this species
  const speciesPhotos = speciesSightings.flatMap(s => getPhotosForSighting(s.id));

  // Get unique locations
  const locations = [...new Set(speciesSightings.filter(s => s.location_name).map(s => s.location_name))];

  const handleSaveNotes = () => {
    saveSpeciesNotes.mutate({ species_name: species, personal_notes: personalNotes });
  };

  const handleRegenerate = async () => {
    setShowRegenerateConfirm(false);
    await regenerate();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bird className="h-6 w-6 text-primary" />
            {species}
          </h1>
          <p className="text-muted-foreground">
            {speciesSightings.length} sighting{speciesSightings.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Hero Photo - Most Recent */}
      {speciesPhotos.length > 0 && (
        <div 
          className="relative aspect-[16/9] md:aspect-[21/9] rounded-xl overflow-hidden cursor-pointer group"
          onClick={() => setLightboxImage(speciesPhotos[0].photo_url)}
        >
          <img
            src={speciesPhotos[0].photo_url}
            alt={`${species} - most recent photo`}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          <div className="absolute bottom-3 left-3 text-white/90 text-sm">
            <span className="font-medium">Most recent photo</span>
            {lastSighting && (
              <span className="ml-2 text-white/70">
                • {format(new Date(lastSighting.sighting_date), 'MMM d, yyyy')}
              </span>
            )}
          </div>
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-black/40 rounded-full p-3">
              <Camera className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <Eye className="h-5 w-5 mx-auto text-primary mb-1" />
            <p className="text-2xl font-bold">{speciesSightings.length}</p>
            <p className="text-xs text-muted-foreground">Total Sightings</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <Calendar className="h-5 w-5 mx-auto text-green-500 mb-1" />
            <p className="text-sm font-medium">
              {firstSighting ? format(new Date(firstSighting.sighting_date), 'MMM d, yyyy') : 'N/A'}
            </p>
            <p className="text-xs text-muted-foreground">First Seen</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <Calendar className="h-5 w-5 mx-auto text-blue-500 mb-1" />
            <p className="text-sm font-medium">
              {lastSighting ? format(new Date(lastSighting.sighting_date), 'MMM d, yyyy') : 'N/A'}
            </p>
            <p className="text-xs text-muted-foreground">Last Seen</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <MapPin className="h-5 w-5 mx-auto text-amber-500 mb-1" />
            <p className="text-2xl font-bold">{locations.length}</p>
            <p className="text-xs text-muted-foreground">Locations</p>
          </CardContent>
        </Card>
      </div>

      {/* Photos Grid - Skip first photo since it's the hero */}
      {speciesPhotos.length > 1 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Camera className="h-4 w-4" />
              All Photos
              <Badge variant="secondary">{speciesPhotos.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {speciesPhotos.slice(1).map((photo) => (
                <button
                  key={photo.id}
                  onClick={() => setLightboxImage(photo.photo_url)}
                  className="aspect-[4/3] rounded-lg overflow-hidden hover:ring-2 hover:ring-primary transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary group"
                >
                  <img
                    src={photo.photo_url}
                    alt={species}
                    className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                  />
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Research */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                AI Research
                {isSaved && (
                  <Badge variant="secondary" className="ml-2">
                    <Check className="h-3 w-3 mr-1" />
                    Saved
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                {savedAt ? (
                  <>Saved {format(new Date(savedAt), 'MMM d, yyyy')}</>
                ) : (
                  'Learn about this species from AI-powered research'
                )}
              </CardDescription>
            </div>
            {research && (
              <div className="flex gap-2">
                {!isSaved && (
                  <Button 
                    size="sm" 
                    onClick={saveResearch}
                    disabled={saveAIResearch.isPending}
                  >
                    {saveAIResearch.isPending ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-1" />
                    )}
                    Save
                  </Button>
                )}
                {hasPrevious && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={restorePrevious}
                  >
                    <Undo2 className="h-4 w-4 mr-1" />
                    Restore
                  </Button>
                )}
                <AlertDialog open={showRegenerateConfirm} onOpenChange={setShowRegenerateConfirm}>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="outline" disabled={researchLoading}>
                      <RefreshCw className={`h-4 w-4 mr-1 ${researchLoading ? 'animate-spin' : ''}`} />
                      Regenerate
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Regenerate AI Research?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will replace your saved research with a fresh version. 
                        Don't worry — you can restore the previous version if you prefer it.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleRegenerate}>
                        Regenerate
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!research && !researchLoading && (
            <div className="text-center py-6">
              <BookOpen className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground mb-4">
                Get AI-generated information about {species}
              </p>
              <Button onClick={() => fetchResearch()}>
                <Sparkles className="h-4 w-4 mr-2" />
                Fetch Research
              </Button>
            </div>
          )}

          {researchLoading && (
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          )}

          {research && !researchLoading && (
            <Collapsible defaultOpen className="space-y-3">
              <CollapsibleTrigger className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors group">
                <ChevronDown className="h-3.5 w-3.5 transition-transform group-data-[state=closed]:-rotate-90" />
                <span className="group-data-[state=open]:hidden">Show</span>
                <span className="group-data-[state=closed]:hidden">Hide</span>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="prose prose-base dark:prose-invert max-w-none pt-4 pb-2
                  [&>*:first-child]:mt-0
                  prose-p:text-[15px] prose-p:leading-7 prose-p:my-4 prose-p:text-foreground/90
                  prose-headings:text-foreground prose-headings:font-bold prose-headings:tracking-tight
                  prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-4 prose-h2:pb-2 prose-h2:border-b prose-h2:border-border/60
                  prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-3
                  prose-h4:text-base prose-h4:mt-4 prose-h4:mb-2 prose-h4:font-semibold
                  [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-4 [&_ul]:space-y-2
                  [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-4 [&_ol]:space-y-2
                  [&_li]:text-[15px] [&_li]:leading-7 [&_li]:pl-1
                  [&_li::marker]:text-muted-foreground
                  [&_strong]:font-semibold [&_strong]:text-foreground
                  [&_p:first-of-type]:text-[1.05rem] [&_p:first-of-type]:leading-loose
                  prose-blockquote:border-l-4 prose-blockquote:border-primary/30 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-muted-foreground
                ">
                  <ReactMarkdown>{research}</ReactMarkdown>
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
        </CardContent>
      </Card>

      {/* Personal Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Personal Notes</CardTitle>
          <CardDescription>
            Add your own observations and notes about {species}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            placeholder="Your personal observations, tips for finding this species, favorite memories..."
            value={personalNotes}
            onChange={(e) => setPersonalNotes(e.target.value)}
            rows={4}
          />
          <Button 
            onClick={handleSaveNotes} 
            disabled={saveSpeciesNotes.isPending}
            size="sm"
          >
            {saveSpeciesNotes.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Notes
          </Button>
        </CardContent>
      </Card>

      {/* Sighting History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sighting History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {speciesSightings.map(sighting => {
              const sightingPhotos = getPhotosForSighting(sighting.id);
              return (
                <div
                  key={sighting.id}
                  className="p-3 rounded-lg border bg-card"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium">
                        {format(new Date(sighting.sighting_date), 'MMMM d, yyyy')}
                        {sighting.sighting_time && (
                          <span className="text-muted-foreground ml-2">
                            at {sighting.sighting_time.slice(0, 5)}
                          </span>
                        )}
                      </p>
                      {sighting.location_name && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {sighting.location_name}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingSighting(sighting)}
                        className="h-8 w-8"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete sighting?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete this {species} sighting from {format(new Date(sighting.sighting_date), 'MMMM d, yyyy')}.
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteSighting.mutate(sighting.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                  {(sighting.behavior_notes || sighting.field_marks) && (
                    <div className="mt-2 text-sm text-muted-foreground">
                      {sighting.behavior_notes && <p>📝 {sighting.behavior_notes}</p>}
                      {sighting.field_marks && <p>🔍 {sighting.field_marks}</p>}
                    </div>
                  )}
                  {/* Inline Photo Thumbnails */}
                  {sightingPhotos.length > 0 && (
                    <div className="flex items-center gap-2 mt-3">
                      {sightingPhotos.slice(0, 4).map((photo) => (
                        <button
                          key={photo.id}
                          onClick={() => setLightboxImage(photo.photo_url)}
                          className="h-14 w-14 rounded-md overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary transition-all focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          <img
                            src={photo.photo_url}
                            alt={species}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                      {sightingPhotos.length > 4 && (
                        <button 
                          className="h-14 w-14 rounded-md bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground cursor-pointer hover:bg-accent transition-colors"
                          onClick={() => setLightboxImage(sightingPhotos[4].photo_url)}
                        >
                          +{sightingPhotos.length - 4}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Edit Sighting Dialog */}
      <EditSightingDialog
        sighting={editingSighting}
        open={!!editingSighting}
        onOpenChange={(open) => !open && setEditingSighting(null)}
      />

      {/* Photo Lightbox */}
      <ImageLightbox 
        imageUrl={lightboxImage} 
        alt={species} 
        onClose={() => setLightboxImage(null)} 
      />
    </div>
  );
}
