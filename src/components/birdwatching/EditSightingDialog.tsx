import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ImageLightbox } from '@/components/ui/image-lightbox';
import { MapPin, Clock, Loader2, Save, Camera, X, Plus } from 'lucide-react';
import { useBirdwatching, BirdSighting, SightingFormData } from '@/hooks/useBirdwatching';

type LocationMode = 'none' | 'gps' | 'manual';

interface EditSightingDialogProps {
  sighting: BirdSighting | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditSightingDialog({ sighting, open, onOpenChange }: EditSightingDialogProps) {
  const { updateSighting, sightings, getPhotosForSighting, uploadPhoto } = useBirdwatching();
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationMode, setLocationMode] = useState<LocationMode>('none');
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');
  const [newPhotos, setNewPhotos] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<SightingFormData>({
    species_name: '',
    sighting_date: '',
    sighting_time: '',
    location_name: '',
    latitude: undefined,
    longitude: undefined,
    behavior_notes: '',
    field_marks: '',
  });

  // Get existing photos for this sighting
  const existingPhotos = sighting ? getPhotosForSighting(sighting.id) : [];

  // Initialize form when sighting changes
  useEffect(() => {
    if (sighting) {
      setFormData({
        species_name: sighting.species_name,
        sighting_date: sighting.sighting_date,
        sighting_time: sighting.sighting_time || '',
        location_name: sighting.location_name || '',
        latitude: sighting.latitude ?? undefined,
        longitude: sighting.longitude ?? undefined,
        behavior_notes: sighting.behavior_notes || '',
        field_marks: sighting.field_marks || '',
      });
      
      if (sighting.latitude !== null && sighting.longitude !== null) {
        setLocationMode('manual');
        setManualLat(sighting.latitude.toString());
        setManualLng(sighting.longitude.toString());
      } else {
        setLocationMode('none');
        setManualLat('');
        setManualLng('');
      }
      
      // Reset new photos when dialog opens
      setNewPhotos([]);
    }
  }, [sighting]);

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
        setLocationMode('manual');
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

  const handleLocationModeChange = (mode: LocationMode) => {
    setLocationMode(mode);
    if (mode === 'none') {
      setFormData(prev => ({ ...prev, latitude: undefined, longitude: undefined }));
      setManualLat('');
      setManualLng('');
    }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setNewPhotos(prev => [...prev, ...files]);
    // Reset input so the same file can be selected again
    e.target.value = '';
  };

  const removeNewPhoto = (index: number) => {
    setNewPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sighting || !formData.species_name.trim()) return;

    setIsUploading(true);
    
    try {
      // Update sighting data
      await updateSighting.mutateAsync({ id: sighting.id, data: formData });
      
      // Upload new photos
      for (const file of newPhotos) {
        await uploadPhoto.mutateAsync({ sightingId: sighting.id, file });
      }
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating sighting:', error);
    } finally {
      setIsUploading(false);
    }
  };

  // Get unique species for autocomplete suggestions
  const uniqueSpecies = [...new Set(sightings.map(s => s.species_name))].sort();

  if (!sighting) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Sighting</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Species Name */}
            <div className="space-y-2">
              <Label htmlFor="edit-species">Species Name *</Label>
              <Input
                id="edit-species"
                placeholder="e.g., Northern Cardinal"
                value={formData.species_name}
                onChange={(e) => setFormData(prev => ({ ...prev, species_name: e.target.value }))}
                list="edit-species-list"
                required
              />
              <datalist id="edit-species-list">
                {uniqueSpecies.map(species => (
                  <option key={species} value={species} />
                ))}
              </datalist>
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-date">Date *</Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={formData.sighting_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, sighting_date: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-time">Time</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="edit-time"
                    type="time"
                    className="pl-10"
                    value={formData.sighting_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, sighting_time: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="edit-location">Location Name (City, State or Description)</Label>
              <Input
                id="edit-location"
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
                onValueChange={(value) => handleLocationModeChange(value as LocationMode)}
                className="flex flex-wrap gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="none" id="edit-loc-none" />
                  <Label htmlFor="edit-loc-none" className="font-normal cursor-pointer">None</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="gps" id="edit-loc-gps" />
                  <Label htmlFor="edit-loc-gps" className="font-normal cursor-pointer">Use Device GPS</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="manual" id="edit-loc-manual" />
                  <Label htmlFor="edit-loc-manual" className="font-normal cursor-pointer">Enter Manually</Label>
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
                    <Label htmlFor="edit-manual-lat" className="text-xs text-muted-foreground">Latitude</Label>
                    <Input
                      id="edit-manual-lat"
                      type="number"
                      step="any"
                      placeholder="e.g., 30.2672"
                      value={manualLat}
                      onChange={(e) => handleManualCoordsChange(e.target.value, manualLng)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="edit-manual-lng" className="text-xs text-muted-foreground">Longitude</Label>
                    <Input
                      id="edit-manual-lng"
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

            {/* Existing Photos */}
            {existingPhotos.length > 0 && (
              <div className="space-y-2">
                <Label>Existing Photos</Label>
                <div className="flex flex-wrap gap-2">
                  {existingPhotos.map((photo) => (
                    <button
                      key={photo.id}
                      type="button"
                      onClick={() => setLightboxImage(photo.photo_url)}
                      className="h-16 w-16 rounded-md overflow-hidden hover:opacity-80 transition-opacity"
                    >
                      <img 
                        src={photo.photo_url} 
                        alt="Sighting"
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Add Photos */}
            <div className="space-y-2">
              <Label>Add Photos</Label>
              <div className="flex flex-wrap gap-2 items-start">
                {newPhotos.map((file, index) => (
                  <div key={index} className="relative h-16 w-16">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`New photo ${index + 1}`}
                      className="h-full w-full object-cover rounded-md"
                    />
                    <button
                      type="button"
                      onClick={() => removeNewPhoto(index)}
                      className="absolute -top-1 -right-1 h-5 w-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center hover:bg-destructive/90"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  className="h-16 w-16 border-2 border-dashed p-0"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                >
                  <Plus className="h-6 w-6 text-muted-foreground" />
                </Button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handlePhotoSelect}
              />
              {newPhotos.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {newPhotos.length} new photo{newPhotos.length !== 1 ? 's' : ''} to upload
                </p>
              )}
            </div>

            {/* Behavior Notes */}
            <div className="space-y-2">
              <Label htmlFor="edit-behavior">Behavior Notes</Label>
              <Textarea
                id="edit-behavior"
                placeholder="What was the bird doing? Feeding, singing, nesting..."
                value={formData.behavior_notes}
                onChange={(e) => setFormData(prev => ({ ...prev, behavior_notes: e.target.value }))}
                rows={2}
              />
            </div>

            {/* Field Marks */}
            <div className="space-y-2">
              <Label htmlFor="edit-fieldmarks">Field Marks</Label>
              <Textarea
                id="edit-fieldmarks"
                placeholder="Distinctive features: colors, size, markings..."
                value={formData.field_marks}
                onChange={(e) => setFormData(prev => ({ ...prev, field_marks: e.target.value }))}
                rows={2}
              />
            </div>

            {/* Submit */}
            <div className="flex gap-2 pt-2">
              <Button 
                type="button" 
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="flex-1"
                disabled={isUploading || updateSighting.isPending || !formData.species_name.trim()}
              >
                {isUploading || updateSighting.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {newPhotos.length > 0 ? 'Save & Upload' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Lightbox outside Dialog to avoid nested dialog issues */}
      <ImageLightbox 
        imageUrl={lightboxImage} 
        alt="Sighting photo" 
        onClose={() => setLightboxImage(null)} 
      />
    </>
  );
}
