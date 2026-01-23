import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Bird, MapPin, Clock, Loader2, X } from 'lucide-react';
import { useBirdwatching, SightingFormData } from '@/hooks/useBirdwatching';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

type LocationMode = 'gps' | 'manual' | 'city';

export function LogSightingForm() {
  const { addSighting, uploadPhoto, sightings } = useBirdwatching();
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);
  const [locationMode, setLocationMode] = useState<LocationMode>('city');
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');
  
  // Custom autocomplete state
  const [speciesInput, setSpeciesInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  
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

  // Get unique species for autocomplete suggestions
  const uniqueSpecies = [...new Set(sightings.map(s => s.species_name))].sort();
  
  // Filter suggestions based on input
  const filteredSuggestions = speciesInput.trim().length > 0
    ? uniqueSpecies.filter(species => 
        species.toLowerCase().includes(speciesInput.toLowerCase())
      ).slice(0, 8)
    : [];

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        inputRef.current && 
        !inputRef.current.contains(e.target as Node) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSpeciesInputChange = (value: string) => {
    setSpeciesInput(value);
    setFormData(prev => ({ ...prev, species_name: value }));
    setShowSuggestions(true);
    setHighlightedIndex(-1);
  };

  const selectSpecies = (species: string) => {
    setSpeciesInput(species);
    setFormData(prev => ({ ...prev, species_name: species }));
    setShowSuggestions(false);
    setHighlightedIndex(-1);
  };

  const handleSpeciesKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || filteredSuggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => 
        prev < filteredSuggestions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => 
        prev > 0 ? prev - 1 : filteredSuggestions.length - 1
      );
    } else if (e.key === 'Enter' && highlightedIndex >= 0) {
      e.preventDefault();
      selectSpecies(filteredSuggestions[highlightedIndex]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

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

    try {
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
      setSpeciesInput('');
      setPhotos([]);
      setManualLat('');
      setManualLng('');
    } catch (error) {
      console.error('Failed to log sighting:', error);
    }
  };

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
          {/* Species Name - Custom Autocomplete */}
          <div className="space-y-2">
            <Label htmlFor="species-input">Species Name *</Label>
            <div className="relative">
              <Input
                ref={inputRef}
                id="species-input"
                type="text"
                placeholder="e.g., Northern Cardinal"
                value={speciesInput}
                onChange={(e) => handleSpeciesInputChange(e.target.value)}
                onFocus={() => speciesInput.trim() && setShowSuggestions(true)}
                onKeyDown={handleSpeciesKeyDown}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="words"
                spellCheck={false}
                data-form-type="other"
                data-lpignore="true"
                data-1p-ignore="true"
                aria-autocomplete="list"
                aria-expanded={showSuggestions && filteredSuggestions.length > 0}
                className="pr-8"
              />
              {speciesInput && (
                <button
                  type="button"
                  onClick={() => {
                    setSpeciesInput('');
                    setFormData(prev => ({ ...prev, species_name: '' }));
                    inputRef.current?.focus();
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              
              {/* Suggestions dropdown */}
              {showSuggestions && filteredSuggestions.length > 0 && (
                <div
                  ref={suggestionsRef}
                  className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-48 overflow-auto"
                >
                  {filteredSuggestions.map((species, index) => (
                    <button
                      key={species}
                      type="button"
                      onClick={() => selectSpecies(species)}
                      className={cn(
                        "w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground",
                        highlightedIndex === index && "bg-accent text-accent-foreground"
                      )}
                    >
                      {species}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {uniqueSpecies.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Start typing to see suggestions from your {uniqueSpecies.length} species
              </p>
            )}
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
              autoComplete="off"
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
