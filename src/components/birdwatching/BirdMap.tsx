import { useMemo, Suspense, lazy, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Map, MapPin, Bird, AlertTriangle } from 'lucide-react';
import { useBirdwatching } from '@/hooks/useBirdwatching';

// Lazy load the Leaflet map component to prevent SSR issues
const LeafletMap = lazy(() => import('./LeafletMap').then(mod => ({ default: mod.LeafletMap })));

interface BirdMapProps {
  onSelectSpecies: (species: string) => void;
}

// Error boundary for map component
function MapErrorFallback({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="h-[400px] w-full flex flex-col items-center justify-center bg-muted/30 rounded-lg border">
      <AlertTriangle className="h-10 w-10 text-muted-foreground mb-3" />
      <p className="text-sm text-muted-foreground mb-3">Failed to load the map</p>
      <button
        onClick={onRetry}
        className="text-sm text-primary hover:underline"
      >
        Try again
      </button>
    </div>
  );
}

function MapLoadingSkeleton() {
  return (
    <div className="h-[400px] w-full">
      <Skeleton className="h-full w-full rounded-lg" />
    </div>
  );
}

export function BirdMap({ onSelectSpecies }: BirdMapProps) {
  const { sightings, getPhotosForSighting } = useBirdwatching();
  const [mapKey, setMapKey] = useState(0);
  const [hasError, setHasError] = useState(false);

  // Filter sightings with location data
  const locatedSightings = useMemo(() => 
    sightings.filter(s => s.latitude && s.longitude),
    [sightings]
  );

  // Group by location name
  const byLocation = useMemo(() => {
    return locatedSightings.reduce((acc, s) => {
      const key = s.location_name || `${s.latitude?.toFixed(2)}, ${s.longitude?.toFixed(2)}`;
      if (!acc[key]) {
        acc[key] = {
          name: key,
          lat: s.latitude!,
          lng: s.longitude!,
          sightings: [],
        };
      }
      acc[key].sightings.push(s);
      return acc;
    }, {} as Record<string, { name: string; lat: number; lng: number; sightings: typeof sightings }>);
  }, [locatedSightings]);

  const locations = useMemo(() => 
    Object.values(byLocation).sort((a, b) => b.sightings.length - a.sightings.length),
    [byLocation]
  );

  // Calculate map center - use most recent sighting or fallback
  const mapCenter = useMemo(() => {
    if (locatedSightings.length === 0) {
      return { lat: 39.8283, lng: -98.5795 }; // US center as fallback
    }
    // Use the most recent sighting as center
    const mostRecent = locatedSightings[0];
    return {
      lat: mostRecent.latitude!,
      lng: mostRecent.longitude!,
    };
  }, [locatedSightings]);

  const handleRetry = () => {
    setHasError(false);
    setMapKey(k => k + 1);
  };

  // Reset error state when tab becomes visible
  useEffect(() => {
    setHasError(false);
  }, []);

  if (sightings.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Map className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold mb-2">No Location Data Yet</h3>
          <p className="text-sm text-muted-foreground">
            Log sightings with GPS coordinates to see them on the map!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Map className="h-5 w-5" />
            Sighting Locations
            <Badge variant="secondary" className="ml-2">
              {locatedSightings.length} with GPS
            </Badge>
          </CardTitle>
          <CardDescription>
            Places where you've spotted birds
          </CardDescription>
        </CardHeader>
        <CardContent>
          {locatedSightings.length === 0 ? (
            <div className="text-center py-8">
              <MapPin className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                Add GPS coordinates to your sightings to see them here
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Interactive Map */}
              <div className="rounded-lg overflow-hidden border">
                {hasError ? (
                  <MapErrorFallback onRetry={handleRetry} />
                ) : (
                  <Suspense fallback={<MapLoadingSkeleton />}>
                    <LeafletMap
                      key={mapKey}
                      sightings={locatedSightings}
                      getPhotosForSighting={getPhotosForSighting}
                      onSelectSpecies={onSelectSpecies}
                      center={mapCenter}
                    />
                  </Suspense>
                )}
              </div>

              {/* Location List */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-muted-foreground">All Locations</h4>
                {locations.map(location => {
                  const uniqueSpecies = [...new Set(location.sightings.map(s => s.species_name))];
                  return (
                    <div
                      key={location.name}
                      className="p-3 rounded-lg border bg-card"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <MapPin className="h-5 w-5 text-primary mt-0.5" />
                          <div>
                            <p className="font-medium">{location.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline">
                          {location.sightings.length} sighting{location.sightings.length !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {uniqueSpecies.slice(0, 5).map(species => (
                          <button
                            key={species}
                            onClick={() => onSelectSpecies(species)}
                            className="text-xs bg-muted px-2 py-0.5 rounded hover:bg-muted/80 transition-colors"
                          >
                            {species}
                          </button>
                        ))}
                        {uniqueSpecies.length > 5 && (
                          <span className="text-xs text-muted-foreground px-2 py-0.5">
                            +{uniqueSpecies.length - 5} more
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
