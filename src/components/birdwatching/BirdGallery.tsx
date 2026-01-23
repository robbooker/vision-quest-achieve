import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ImageLightbox } from '@/components/ui/image-lightbox';
import { Camera, Calendar, MapPin } from 'lucide-react';
import { useBirdwatching } from '@/hooks/useBirdwatching';
import { format } from 'date-fns';

interface GalleryPhoto {
  id: string;
  photo_url: string;
  species_name: string;
  sighting_date: string;
  location_name: string | null;
}

interface BirdGalleryProps {
  onSelectSpecies: (species: string) => void;
}

export function BirdGallery({ onSelectSpecies }: BirdGalleryProps) {
  const { sightings, allPhotos } = useBirdwatching();
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);

  // Combine photos with their sighting data
  const galleryPhotos: GalleryPhoto[] = allPhotos.map(photo => {
    const sighting = sightings.find(s => s.id === photo.sighting_id);
    return {
      id: photo.id,
      photo_url: photo.photo_url,
      species_name: sighting?.species_name || 'Unknown',
      sighting_date: sighting?.sighting_date || '',
      location_name: sighting?.location_name || null,
    };
  }).sort((a, b) => new Date(b.sighting_date).getTime() - new Date(a.sighting_date).getTime());

  const handlePhotoClick = (index: number) => {
    setSelectedPhotoIndex(index);
  };

  // Prepare images array for lightbox navigation
  const lightboxImages = galleryPhotos.map(photo => ({
    url: photo.photo_url,
    alt: photo.species_name,
  }));

  const selectedPhoto = selectedPhotoIndex !== null ? galleryPhotos[selectedPhotoIndex] : null;

  if (galleryPhotos.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Camera className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No Photos Yet</h3>
          <p className="text-muted-foreground max-w-sm">
            Start adding photos to your bird sightings to build your gallery! 
            You can add photos when logging a new sighting or editing an existing one.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Group photos by species for a nice overview
  const speciesGroups = galleryPhotos.reduce((acc, photo) => {
    if (!acc[photo.species_name]) {
      acc[photo.species_name] = [];
    }
    acc[photo.species_name].push(photo);
    return acc;
  }, {} as Record<string, GalleryPhoto[]>);

  const uniqueSpeciesCount = Object.keys(speciesGroups).length;

  return (
    <div className="space-y-6">
      {/* Stats Header */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-center gap-8 text-center">
            <div>
              <p className="text-2xl font-bold text-foreground">{galleryPhotos.length}</p>
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
            {galleryPhotos.map((photo) => (
              <div
                key={photo.id}
                className="group relative aspect-square rounded-lg overflow-hidden cursor-pointer bg-muted"
                onClick={() => handlePhotoClick(galleryPhotos.indexOf(photo))}
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
                    <p 
                      className="text-white text-sm font-medium truncate cursor-pointer hover:underline"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectSpecies(photo.species_name);
                      }}
                    >
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
              .map(([species, photos]) => (
                <Badge 
                  key={species} 
                  variant="secondary" 
                  className="cursor-pointer hover:bg-secondary/80 transition-colors"
                  onClick={() => onSelectSpecies(species)}
                >
                  {species} ({photos.length})
                </Badge>
              ))}
          </div>
        </CardContent>
      </Card>

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
