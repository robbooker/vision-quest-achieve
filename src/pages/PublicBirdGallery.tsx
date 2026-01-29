import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ImageLightbox } from '@/components/ui/image-lightbox';
import { Bird, ArrowLeft, Calendar, Camera, List } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface GalleryPhoto {
  id: string;
  photo_url: string;
  species_name: string;
  sighting_date: string;
  location_name: string | null;
}

// Rob's user ID
const ROB_USER_ID = 'e28a3074-6c06-4686-a6c4-0e50b12aae26';

export default function PublicBirdGallery() {
  const { username } = useParams<{ username: string }>();
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);

  useEffect(() => {
    async function fetchGallery() {
      setIsLoading(true);
      
      if (username?.toLowerCase() !== 'rob') {
        setIsLoading(false);
        return;
      }

      try {
        // Fetch photos with sighting data via join
        const { data: photosData } = await supabase
          .from('bird_sighting_photos')
          .select(`
            id,
            photo_url,
            sighting_id,
            bird_sightings!inner (
              species_name,
              sighting_date,
              location_name
            )
          `)
          .eq('user_id', ROB_USER_ID)
          .order('created_at', { ascending: false });

        if (photosData) {
          const formattedPhotos: GalleryPhoto[] = photosData.map((photo: any) => ({
            id: photo.id,
            photo_url: photo.photo_url,
            species_name: photo.bird_sightings.species_name,
            sighting_date: photo.bird_sightings.sighting_date,
            location_name: photo.bird_sightings.location_name,
          }));
          setPhotos(formattedPhotos);
        }
      } catch (error) {
        console.error('Error fetching gallery:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchGallery();
  }, [username]);

  const lightboxImages = photos.map(photo => ({
    url: photo.photo_url,
    alt: photo.species_name,
  }));

  const selectedPhoto = selectedPhotoIndex !== null ? photos[selectedPhotoIndex] : null;

  // Group photos by species
  const speciesGroups = photos.reduce((acc, photo) => {
    if (!acc[photo.species_name]) {
      acc[photo.species_name] = [];
    }
    acc[photo.species_name].push(photo);
    return acc;
  }, {} as Record<string, GalleryPhoto[]>);

  const uniqueSpeciesCount = Object.keys(speciesGroups).length;

  if (username?.toLowerCase() !== 'rob') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8 pb-6">
            <Camera className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Gallery Not Found</h2>
            <p className="text-muted-foreground mb-4">
              This bird gallery doesn't exist or isn't public.
            </p>
            <Button asChild>
              <Link to="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Home
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="aspect-square" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
              <Camera className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Rob's Bird Photos</h1>
              <p className="text-muted-foreground">
                {photos.length} photos · {uniqueSpeciesCount} species
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to={`/birds/${username}`}>
                <List className="h-4 w-4 mr-2" />
                Life List
              </Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link to="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Home
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-center gap-8 text-center">
              <div>
                <p className="text-2xl font-bold text-foreground">{photos.length}</p>
                <p className="text-sm text-muted-foreground">Total Photos</p>
              </div>
              <div className="h-8 w-px bg-border" />
              <div>
                <p className="text-2xl font-bold text-foreground">{uniqueSpeciesCount}</p>
                <p className="text-sm text-muted-foreground">Species Photographed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {photos.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Camera className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No Photos Yet</h3>
              <p className="text-muted-foreground">
                No bird photos have been uploaded yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Photo Grid */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Photo Gallery
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {photos.map((photo, index) => (
                    <div
                      key={photo.id}
                      className="group relative aspect-square rounded-lg overflow-hidden cursor-pointer bg-muted"
                      onClick={() => setSelectedPhotoIndex(index)}
                    >
                      <img
                        src={photo.photo_url}
                        alt={photo.species_name}
                        className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                        loading="lazy"
                      />
                      {/* Overlay with species name */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <div className="absolute bottom-0 left-0 right-0 p-2">
                          <p className="text-white text-sm font-medium truncate">
                            {photo.species_name}
                          </p>
                          {photo.sighting_date && (
                            <p className="text-white/70 text-xs flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(photo.sighting_date), 'MMM d, yyyy')}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Species Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>By Species</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(speciesGroups)
                    .sort((a, b) => b[1].length - a[1].length)
                    .map(([species, speciesPhotos]) => (
                      <Link key={species} to={`/birds/${username}`}>
                        <Badge 
                          variant="secondary" 
                          className="cursor-pointer hover:bg-secondary/80 transition-colors"
                        >
                          {species} ({speciesPhotos.length})
                        </Badge>
                      </Link>
                    ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground py-4">
          <p>
            Tracked with{' '}
            <Link to="/" className="text-primary hover:underline">
              GroovyPlanning
            </Link>
          </p>
        </div>
      </div>

      {/* Lightbox with navigation */}
      <ImageLightbox
        imageUrl={selectedPhoto?.photo_url || null}
        alt={selectedPhoto?.species_name || 'Bird photo'}
        onClose={() => setSelectedPhotoIndex(null)}
        images={lightboxImages}
        currentIndex={selectedPhotoIndex ?? 0}
        onNavigate={setSelectedPhotoIndex}
      />
    </div>
  );
}
