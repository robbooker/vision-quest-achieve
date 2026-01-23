import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Bird, MapPin, Clock, Camera, Loader2 } from 'lucide-react';
import { useBirdwatching, SightingFormData } from '@/hooks/useBirdwatching';
import { format } from 'date-fns';

type LocationMode = 'gps' | 'manual' | 'city';

export function LogSightingForm() {
  const { addSighting, uploadPhoto, sightings } = useBirdwatching();
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);
  const [locationMode, setLocationMode] = useState<LocationMode>('city');
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');
  
  const [formData, setFormData] = useState<SightingFormData>({
    species_name: '',
    sighting_date: format(new Date(), 'yyyy-MM-dd'),
    sighting_time: format(new Date(), 'HH:mm'),
    location_name: '',
    latitude: undefined,
    longitude: undefined,
    behavior_notes: '',
    field_marks: '',
  });

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }));
        setManualLat(position.coords.latitude.toString());
        setManualLng(position.coords.longitude.toString());
        setIsGettingLocation(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        setIsGettingLocation(false);
      }
    );
  };

  const handleManualCoordsChange = (lat: string, lng: string) => {
    setManualLat(lat);
    setManualLng(lng);
    
    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);
    
    setFormData(prev => ({
      ...prev,
      latitude: !isNaN(parsedLat) ? parsedLat : undefined,
      longitude: !isNaN(parsedLng) ? parsedLng : undefined,
    }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setPhotos(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.species_name.trim()) return;

    const result = await addSighting.mutateAsync(formData);
    
    // Upload photos if any
    if (photos.length > 0 && result.sighting) {
      for (const photo of photos) {
        await uploadPhoto.mutateAsync({ sightingId: result.sighting.id, file: photo });
      }
    }

    // Reset form
    setFormData({
      species_name: '',
      sighting_date: format(new Date(), 'yyyy-MM-dd'),
      sighting_time: format(new Date(), 'HH:mm'),
      location_name: '',
      latitude: undefined,
      longitude: undefined,
      behavior_notes: '',
      field_marks: '',
    });
    setPhotos([]);
    setManualLat('');
    setManualLng('');
  };

  // Get unique species for autocomplete suggestions
  const uniqueSpecies = [...new Set(sightings.map(s => s.species_name))].sort();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bird className="h-5 w-5" />
          Log a Sighting
        </CardTitle>
        <CardDescription>
          Record a new bird observation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Species Name */}
          <div className="space-y-2">
            <Label htmlFor="species">Species Name *</Label>
            <Input
              id="species"
              placeholder="e.g., Northern Cardinal"
              value={formData.species_name}
              onChange={(e) => setFormData(prev => ({ ...prev, species_name: e.target.value }))}
              list="species-list"
              required
            />
            <datalist id="species-list">
              {uniqueSpecies.map(species => (
                <option key={species} value={species} />
              ))}
            </datalist>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 min-w-0">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.sighting_date}
                onChange={(e) => setFormData(prev => ({ ...prev, sighting_date: e.target.value }))}
                required
                className="w-full"
              />
            </div>
            <div className="space-y-2 min-w-0">
              <Label htmlFor="time">Time</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="time"
                  type="time"
                  className="pl-10 w-full"
                  value={formData.sighting_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, sighting_time: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Location Name (City, State or Description)</Label>
            <Input
              id="location"
              placeholder="e.g., Austin, TX or Central Park, NYC"
              value={formData.location_name}
              onChange={(e) => setFormData(prev => ({ ...prev, location_name: e.target.value }))}
            />
          </div>

          {/* GPS Coordinates Options */}
          <div className="space-y-3">
            <Label>GPS Coordinates (Optional)</Label>
            <RadioGroup 
              value={locationMode} 
              onValueChange={(value) => setLocationMode(value as LocationMode)}
              className="flex flex-wrap gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="city" id="loc-city" />
                <Label htmlFor="loc-city" className="font-normal cursor-pointer">None</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="gps" id="loc-gps" />
                <Label htmlFor="loc-gps" className="font-normal cursor-pointer">Use Device GPS</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="manual" id="loc-manual" />
                <Label htmlFor="loc-manual" className="font-normal cursor-pointer">Enter Manually</Label>
              </div>
            </RadioGroup>

            {locationMode === 'gps' && (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGetLocation}
                  disabled={isGettingLocation}
                >
                  {isGettingLocation ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <MapPin className="h-4 w-4 mr-2" />
                  )}
                  Get Current Location
                </Button>
                {formData.latitude && formData.longitude && (
                  <span className="text-sm text-muted-foreground">
                    {formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)}
                  </span>
                )}
              </div>
            )}

            {locationMode === 'manual' && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="manual-lat" className="text-xs text-muted-foreground">Latitude</Label>
                  <Input
                    id="manual-lat"
                    type="number"
                    step="any"
                    placeholder="e.g., 30.2672"
                    value={manualLat}
                    onChange={(e) => handleManualCoordsChange(e.target.value, manualLng)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="manual-lng" className="text-xs text-muted-foreground">Longitude</Label>
                  <Input
                    id="manual-lng"
                    type="number"
                    step="any"
                    placeholder="e.g., -97.7431"
                    value={manualLng}
                    onChange={(e) => handleManualCoordsChange(manualLat, e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Photos */}
          <div className="space-y-2">
            <Label htmlFor="photos">Photos</Label>
            <div className="flex items-center gap-2">
              <Input
                id="photos"
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoChange}
                className="flex-1"
              />
              {photos.length > 0 && (
                <span className="text-sm text-muted-foreground">
                  {photos.length} photo(s) selected
                </span>
              )}
            </div>
            {photos.length > 0 && (
              <div className="flex gap-2 mt-2 flex-wrap">
                {photos.map((photo, idx) => (
                  <img
                    key={idx}
                    src={URL.createObjectURL(photo)}
                    alt={`Preview ${idx + 1}`}
                    className="w-16 h-16 object-cover rounded border"
                  />
                ))}
              </div>
            )}
          </div>

          {/* Behavior Notes */}
          <div className="space-y-2">
            <Label htmlFor="behavior">Behavior Notes</Label>
            <Textarea
              id="behavior"
              placeholder="What was the bird doing? Feeding, singing, nesting..."
              value={formData.behavior_notes}
              onChange={(e) => setFormData(prev => ({ ...prev, behavior_notes: e.target.value }))}
              rows={2}
            />
          </div>

          {/* Field Marks */}
          <div className="space-y-2">
            <Label htmlFor="fieldmarks">Field Marks</Label>
            <Textarea
              id="fieldmarks"
              placeholder="Distinctive features: colors, size, markings..."
              value={formData.field_marks}
              onChange={(e) => setFormData(prev => ({ ...prev, field_marks: e.target.value }))}
              rows={2}
            />
          </div>

          {/* Submit */}
          <Button 
            type="submit" 
            className="w-full"
            disabled={addSighting.isPending || !formData.species_name.trim()}
          >
            {addSighting.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Bird className="h-4 w-4 mr-2" />
            )}
            Log Sighting
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
