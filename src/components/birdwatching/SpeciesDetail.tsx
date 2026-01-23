import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  Pencil
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

      {/* Photos */}
      {speciesPhotos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Camera className="h-4 w-4" />
              Photos
              <Badge variant="secondary">{speciesPhotos.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {speciesPhotos.map((photo) => (
                <button
                  key={photo.id}
                  onClick={() => setLightboxImage(photo.photo_url)}
                  className="aspect-square rounded-lg overflow-hidden hover:opacity-80 transition-opacity cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <img
                    src={photo.photo_url}
                    alt={species}
                    className="w-full h-full object-cover"
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
            <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-strong:text-foreground prose-headings:text-foreground prose-li:my-0.5 prose-h2:text-lg prose-h2:mt-4 prose-h2:mb-2">
              <ReactMarkdown>{research}</ReactMarkdown>
            </div>
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
            {speciesSightings.map(sighting => (
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
                    {getPhotosForSighting(sighting.id).length > 0 && (
                      <Badge variant="outline">
                        <Camera className="h-3 w-3 mr-1" />
                        {getPhotosForSighting(sighting.id).length}
                      </Badge>
                    )}
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
              </div>
            ))}
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
