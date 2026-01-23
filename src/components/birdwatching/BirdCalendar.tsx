import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { ImageLightbox } from '@/components/ui/image-lightbox';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Bird, Pencil, Trash2, Camera } from 'lucide-react';
import { useBirdwatching, BirdSighting } from '@/hooks/useBirdwatching';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, addMonths, subMonths } from 'date-fns';
import { EditSightingDialog } from './EditSightingDialog';

interface BirdCalendarProps {
  onSelectSpecies: (species: string) => void;
}

export function BirdCalendar({ onSelectSpecies }: BirdCalendarProps) {
  const { sightings, getSightingsByDate, deleteSighting, getPhotosForSighting } = useBirdwatching();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [editingSighting, setEditingSighting] = useState<BirdSighting | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const sightingsByDate = getSightingsByDate();

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get day of week for first day (0 = Sunday)
  const startDayOfWeek = monthStart.getDay();

  const selectedDateSightings = selectedDate 
    ? sightingsByDate[format(selectedDate, 'yyyy-MM-dd')] || []
    : [];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              {format(currentMonth, 'MMMM yyyy')}
            </CardTitle>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for days before month starts */}
            {Array.from({ length: startDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}

            {/* Days */}
            {days.map(day => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const daySightings = sightingsByDate[dateStr] || [];
              const hasSightings = daySightings.length > 0;
              const isSelected = selectedDate && isSameDay(day, selectedDate);

              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDate(day)}
                  className={`
                    aspect-square p-1 rounded-lg text-sm relative flex flex-col items-center justify-center
                    transition-colors
                    ${isToday(day) ? 'bg-primary/10 font-bold' : ''}
                    ${isSelected ? 'ring-2 ring-primary' : ''}
                    ${hasSightings ? 'hover:bg-primary/20' : 'hover:bg-muted/50'}
                  `}
                >
                  <span>{format(day, 'd')}</span>
                  {hasSightings && (
                    <div className="flex gap-0.5 mt-0.5">
                      {daySightings.slice(0, 3).map((_, i) => (
                        <div key={i} className="w-1.5 h-1.5 rounded-full bg-primary" />
                      ))}
                      {daySightings.length > 3 && (
                        <span className="text-[8px] text-primary">+{daySightings.length - 3}</span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Selected Day's Sightings */}
      {selectedDate && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </CardTitle>
            <CardDescription>
              {selectedDateSightings.length} sighting{selectedDateSightings.length !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedDateSightings.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No sightings on this day
              </p>
            ) : (
              <div className="space-y-2">
                {selectedDateSightings.map(sighting => {
                  const photos = getPhotosForSighting(sighting.id);
                  return (
                    <div
                      key={sighting.id}
                      className="w-full flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      {/* Photo thumbnail */}
                      {photos.length > 0 && (
                        <button
                          onClick={() => setLightboxImage(photos[0].photo_url)}
                          className="h-12 w-12 rounded-md overflow-hidden flex-shrink-0 hover:opacity-80 transition-opacity"
                        >
                          <img 
                            src={photos[0].photo_url} 
                            alt={sighting.species_name}
                            className="h-full w-full object-cover"
                          />
                        </button>
                      )}
                      
                      <button
                        onClick={() => onSelectSpecies(sighting.species_name)}
                        className="flex items-center gap-3 flex-1 text-left"
                      >
                        {photos.length === 0 && <Bird className="h-5 w-5 text-primary" />}
                        <div className="flex-1">
                          <p className="font-medium">{sighting.species_name}</p>
                          {sighting.location_name && (
                            <p className="text-sm text-muted-foreground">{sighting.location_name}</p>
                          )}
                        </div>
                      </button>
                      
                      <div className="flex items-center gap-1">
                        {sighting.sighting_time && (
                          <Badge variant="outline">{sighting.sighting_time.slice(0, 5)}</Badge>
                        )}
                        {photos.length > 1 && (
                          <Badge variant="secondary">
                            <Camera className="h-3 w-3 mr-1" />
                            {photos.length}
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingSighting(sighting)}
                          className="h-8 w-8"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete sighting?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete this {sighting.species_name} sighting. 
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteSighting.mutate(sighting.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <EditSightingDialog
        sighting={editingSighting}
        open={!!editingSighting}
        onOpenChange={(open) => !open && setEditingSighting(null)}
      />

      <ImageLightbox 
        imageUrl={lightboxImage} 
        alt="Bird sighting" 
        onClose={() => setLightboxImage(null)} 
      />
    </div>
  );
}
