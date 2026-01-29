import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ImageLightbox } from '@/components/ui/image-lightbox';
import { 
  Bird, 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Eye, 
  Camera,
  ExternalLink,
  List,
  BarChart3,
  Map
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface PublicSighting {
  id: string;
  species_name: string;
  sighting_date: string;
  sighting_time: string | null;
  location_name: string | null;
  latitude: number | null;
  longitude: number | null;
}

interface PublicPhoto {
  id: string;
  sighting_id: string;
  photo_url: string;
}

// Rob's user ID - this would normally be fetched from a profiles table with usernames
const ROB_USER_ID = 'e28a3074-6c06-4686-a6c4-0e50b12aae26';

export default function PublicBirdProfile() {
  const { username } = useParams<{ username: string }>();
  const [sightings, setSightings] = useState<PublicSighting[]>([]);
  const [photos, setPhotos] = useState<PublicPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [selectedSpecies, setSelectedSpecies] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPublicData() {
      setIsLoading(true);
      
      // For now, only Rob has a public profile
      if (username?.toLowerCase() !== 'rob') {
        setIsLoading(false);
        return;
      }

      try {
        // Fetch sightings
        const { data: sightingsData } = await supabase
          .from('bird_sightings')
          .select('id, species_name, sighting_date, sighting_time, location_name, latitude, longitude')
          .eq('user_id', ROB_USER_ID)
          .order('sighting_date', { ascending: false });

        // Fetch photos
        const { data: photosData } = await supabase
          .from('bird_sighting_photos')
          .select('id, sighting_id, photo_url')
          .eq('user_id', ROB_USER_ID);

        setSightings(sightingsData || []);
        setPhotos(photosData || []);
      } catch (error) {
        console.error('Error fetching public bird data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPublicData();
  }, [username]);

  // Calculate life list
  const lifeList = [...new Set(sightings.map(s => s.species_name))].map(species => {
    const speciesSightings = sightings.filter(s => s.species_name === species);
    return {
      species,
      count: speciesSightings.length,
      firstSeen: speciesSightings[speciesSightings.length - 1]?.sighting_date,
      lastSeen: speciesSightings[0]?.sighting_date,
    };
  }).sort((a, b) => a.species.localeCompare(b.species));

  const getPhotosForSighting = (sightingId: string) => 
    photos.filter(p => p.sighting_id === sightingId);

  const allSpeciesPhotos = selectedSpecies 
    ? sightings
        .filter(s => s.species_name === selectedSpecies)
        .flatMap(s => getPhotosForSighting(s.id))
    : [];

  const selectedSpeciesSightings = selectedSpecies
    ? sightings.filter(s => s.species_name === selectedSpecies)
    : [];

  if (username?.toLowerCase() !== 'rob') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8 pb-6">
            <Bird className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Profile Not Found</h2>
            <p className="text-muted-foreground mb-4">
              This birdwatching profile doesn't exist or isn't public.
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
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  // Species Detail View
  if (selectedSpecies) {
    const firstSighting = selectedSpeciesSightings[selectedSpeciesSightings.length - 1];
    const lastSighting = selectedSpeciesSightings[0];
    const locations = [...new Set(selectedSpeciesSightings.filter(s => s.location_name).map(s => s.location_name))];

    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setSelectedSpecies(null)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Bird className="h-6 w-6 text-primary" />
                {selectedSpecies}
              </h1>
              <p className="text-muted-foreground">
                {selectedSpeciesSightings.length} sighting{selectedSpeciesSightings.length !== 1 ? 's' : ''} by Rob
              </p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4 text-center">
                <Eye className="h-5 w-5 mx-auto text-primary mb-1" />
                <p className="text-2xl font-bold">{selectedSpeciesSightings.length}</p>
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
          {allSpeciesPhotos.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Camera className="h-4 w-4" />
                  Photos
                  <Badge variant="secondary">{allSpeciesPhotos.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                  {allSpeciesPhotos.map((photo) => (
                    <button
                      key={photo.id}
                      onClick={() => setLightboxImage(photo.photo_url)}
                      className="aspect-square rounded-lg overflow-hidden hover:opacity-80 transition-opacity cursor-pointer"
                    >
                      <img
                        src={photo.photo_url}
                        alt={selectedSpecies}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sighting History */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sighting History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {selectedSpeciesSightings.map(sighting => (
                  <div
                    key={sighting.id}
                    className="p-3 rounded-lg border bg-card"
                  >
                    <div className="flex items-start justify-between">
                      <div>
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
                      {getPhotosForSighting(sighting.id).length > 0 && (
                        <Badge variant="outline">
                          <Camera className="h-3 w-3 mr-1" />
                          {getPhotosForSighting(sighting.id).length}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <ImageLightbox 
          imageUrl={lightboxImage} 
          alt={selectedSpecies} 
          onClose={() => setLightboxImage(null)} 
        />
      </div>
    );
  }

  // Main Profile View
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Bird className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Rob's Life List</h1>
              <p className="text-muted-foreground">
                {lifeList.length} species · {sightings.length} total sightings
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to={`/birds/${username}/gallery`}>
                <Camera className="h-4 w-4 mr-2" />
                Gallery
              </Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link to="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4 text-center">
              <List className="h-5 w-5 mx-auto text-primary mb-1" />
              <p className="text-2xl font-bold">{lifeList.length}</p>
              <p className="text-xs text-muted-foreground">Species</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <Eye className="h-5 w-5 mx-auto text-green-500 mb-1" />
              <p className="text-2xl font-bold">{sightings.length}</p>
              <p className="text-xs text-muted-foreground">Total Sightings</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <Camera className="h-5 w-5 mx-auto text-amber-500 mb-1" />
              <p className="text-2xl font-bold">{photos.length}</p>
              <p className="text-xs text-muted-foreground">Photos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <MapPin className="h-5 w-5 mx-auto text-blue-500 mb-1" />
              <p className="text-2xl font-bold">
                {new Set(sightings.filter(s => s.location_name).map(s => s.location_name)).size}
              </p>
              <p className="text-xs text-muted-foreground">Locations</p>
            </CardContent>
          </Card>
        </div>

        {/* Life List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <List className="h-5 w-5" />
              Life List
            </CardTitle>
            <CardDescription>
              All species Rob has observed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {lifeList.map((bird) => {
                const birdPhotos = sightings
                  .filter(s => s.species_name === bird.species)
                  .flatMap(s => getPhotosForSighting(s.id));
                
                return (
                  <button
                    key={bird.species}
                    onClick={() => setSelectedSpecies(bird.species)}
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors text-left w-full"
                  >
                    {birdPhotos.length > 0 ? (
                      <img 
                        src={birdPhotos[0].photo_url} 
                        alt={bird.species}
                        className="h-12 w-12 rounded-md object-cover"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-md bg-muted flex items-center justify-center">
                        <Bird className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{bird.species}</p>
                      <p className="text-sm text-muted-foreground">
                        {bird.count} sighting{bird.count !== 1 ? 's' : ''} · First: {format(new Date(bird.firstSeen), 'MMM yyyy')}
                      </p>
                    </div>
                    <Badge variant="secondary">{bird.count}</Badge>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent Sightings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Recent Sightings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {sightings.slice(0, 10).map(sighting => {
                const sightingPhotos = getPhotosForSighting(sighting.id);
                return (
                  <button
                    key={sighting.id}
                    onClick={() => setSelectedSpecies(sighting.species_name)}
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors text-left w-full"
                  >
                    {sightingPhotos.length > 0 ? (
                      <img 
                        src={sightingPhotos[0].photo_url} 
                        alt={sighting.species_name}
                        className="h-10 w-10 rounded-md object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center">
                        <Bird className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{sighting.species_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(sighting.sighting_date), 'MMM d, yyyy')}
                        {sighting.location_name && ` · ${sighting.location_name}`}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

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

      <ImageLightbox 
        imageUrl={lightboxImage} 
        alt="Bird photo" 
        onClose={() => setLightboxImage(null)} 
      />
    </div>
  );
}
