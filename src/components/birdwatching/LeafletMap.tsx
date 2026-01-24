import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { format } from 'date-fns';
import { MapPin } from 'lucide-react';
import type { BirdSighting, BirdSightingPhoto } from '@/hooks/useBirdwatching';

// Fix for default marker icons in React/Vite
// These imports are resolved at build time
const markerIcon2x = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png';
const markerIcon = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
const markerShadow = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

interface LeafletMapProps {
  sightings: BirdSighting[];
  getPhotosForSighting: (sightingId: string) => BirdSightingPhoto[];
  onSelectSpecies: (species: string) => void;
  center: { lat: number; lng: number };
}

// Component to recenter map when sightings change
function MapRecenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
}

// Component to invalidate map size after mount (fixes gray tiles issue)
function MapInvalidator() {
  const map = useMap();
  useEffect(() => {
    // Small delay to ensure container is fully rendered
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 100);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

export function LeafletMap({ sightings, getPhotosForSighting, onSelectSpecies, center }: LeafletMapProps) {
  return (
    <MapContainer 
      center={[center.lat, center.lng]} 
      zoom={8} 
      className="h-[400px] w-full"
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapRecenter lat={center.lat} lng={center.lng} />
      <MapInvalidator />
      {sightings.map(sighting => {
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
  );
}
