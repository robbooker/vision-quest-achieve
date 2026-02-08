import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ImageLightbox } from '@/components/ui/image-lightbox';
import { Bird, ArrowLeft, Calendar, Camera, List, Share2, Check, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { toast } from 'sonner';
interface GalleryPhoto {
  id: string;
  photo_url: string;
  species_name: string;
  sighting_date: string;
  location_name: string | null;
}

// Rob's user ID
const ROB_USER_ID = 'a0bff1ab-02c1-4d2a-ad68-2b48cf4bdd9a';

export default function PublicBirdGallery() {
  const { username } = useParams<{ username: string }>();
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const shareUrl = `https://groovyplanning.ai/birds/${username}/gallery`;
  const displayName = username?.toLowerCase() === 'rob' ? "Rob's" : `${username}'s`;
  
  // Use first photo as OG image, or fallback
  const ogImage = photos.length > 0 
    ? photos[0].photo_url 
    : 'https://groovyplanning.ai/og-image.jpeg';

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

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
        <div className="max-w-lg mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          {[1, 2, 3].map(i => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-[4/3] w-full rounded-lg" />
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{displayName} Bird Gallery | GroovyPlanning</title>
        <meta name="description" content={`${displayName} bird photography gallery - ${photos.length} photos of ${uniqueSpeciesCount} species`} />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={shareUrl} />
        <meta property="og:title" content={`${displayName} Bird Gallery`} />
        <meta property="og:description" content={`Check out ${displayName} bird photos! ${photos.length} photos of ${uniqueSpeciesCount} different species.`} />
        <meta property="og:image" content={ogImage} />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={shareUrl} />
        <meta name="twitter:title" content={`${displayName} Bird Gallery`} />
        <meta name="twitter:description" content={`Check out ${displayName} bird photos! ${photos.length} photos of ${uniqueSpeciesCount} different species.`} />
        <meta name="twitter:image" content={ogImage} />
      </Helmet>
      
      <div className="min-h-screen bg-muted/30 py-4 md:py-8">
        <div className="max-w-lg mx-auto px-4 space-y-6">
          {/* Header */}
          <Card className="border-0 shadow-sm">
            <CardContent className="py-4">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Camera className="h-7 w-7 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl font-bold truncate">{displayName} Bird Photos</h1>
                  <p className="text-sm text-muted-foreground">
                    {photos.length} photos · {uniqueSpeciesCount} species
                  </p>
                </div>
              </div>
              
              {/* Action buttons */}
              <div className="flex gap-2 mt-4 flex-wrap">
                <Button 
                  variant="default" 
                  onClick={handleCopyLink}
                  className="gap-2 flex-1"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Share2 className="h-4 w-4" />
                      Share
                    </>
                  )}
                </Button>
                <Button variant="outline" asChild className="flex-1">
                  <Link to={`/birds/${username}`}>
                    <List className="h-4 w-4 mr-2" />
                    Life List
                  </Link>
                </Button>
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
            /* Feed-style Photo Cards */
            <div className="space-y-4">
              {photos.map((photo, index) => (
                <Card 
                  key={photo.id} 
                  className="overflow-hidden border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedPhotoIndex(index)}
                >
                  {/* Photo */}
                  <div className="relative aspect-[4/3] bg-muted">
                    <img
                      src={photo.photo_url}
                      alt={photo.species_name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  
                  {/* Caption */}
                  <CardContent className="py-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-foreground">{photo.species_name}</h3>
                      <Badge variant="secondary" className="text-xs">
                        <Bird className="h-3 w-3 mr-1" />
                        Spotted
                      </Badge>
                    </div>
                    
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      {photo.sighting_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {format(new Date(photo.sighting_date), 'MMMM d, yyyy')}
                        </span>
                      )}
                      {photo.location_name && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {photo.location_name}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
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
    </>
  );
}
