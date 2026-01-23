import { useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Map, MapPin, Bird } from 'lucide-react';
import { useBirdwatching } from '@/hooks/useBirdwatching';
import { format } from 'date-fns';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in React/Vite
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

interface BirdMapProps {
  onSelectSpecies: (species: string) => void;
}

// Component to recenter map when sightings change
function MapRecenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
}

export function BirdMap({ onSelectSpecies }: BirdMapProps) {
  const { sightings, getPhotosForSighting } = useBirdwatching();

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
                <MapContainer 
                  center={[mapCenter.lat, mapCenter.lng]} 
                  zoom={8} 
                  className="h-[400px] w-full"
                  scrollWheelZoom={true}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <MapRecenter lat={mapCenter.lat} lng={mapCenter.lng} />
                  {locatedSightings.map(sighting => {
                    const photos = getPhotosForSighting(sighting.id);
                    return (
                      <Marker 
                        key={sighting.id} 
                        position={[sighting.latitude!, sighting.longitude!]}
                      >
                        <Popup>
                          <div className="min-w-[180px]">
                            {photos.length > 0 && (
                              <img 
                                src={photos[0].photo_url} 
                                alt={sighting.species_name}
                                className="w-full h-24 object-cover rounded mb-2"
                              />
                            )}
                            <button
                              onClick={() => onSelectSpecies(sighting.species_name)}
                              className="font-semibold text-primary hover:underline cursor-pointer block"
                            >
                              {sighting.species_name}
                            </button>
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(new Date(sighting.sighting_date), 'MMM d, yyyy')}
                              {sighting.sighting_time && ` at ${sighting.sighting_time.slice(0, 5)}`}
                            </p>
                            {sighting.location_name && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                <MapPin className="h-3 w-3" />
                                {sighting.location_name}
                              </p>
                            )}
                          </div>
                        </Popup>
                      </Marker>
                    );
                  })}
                </MapContainer>
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
