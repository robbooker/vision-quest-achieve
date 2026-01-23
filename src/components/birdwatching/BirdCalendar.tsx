import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Bird } from 'lucide-react';
import { useBirdwatching } from '@/hooks/useBirdwatching';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, addMonths, subMonths } from 'date-fns';

interface BirdCalendarProps {
  onSelectSpecies: (species: string) => void;
}

export function BirdCalendar({ onSelectSpecies }: BirdCalendarProps) {
  const { sightings, getSightingsByDate } = useBirdwatching();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

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
                {selectedDateSightings.map(sighting => (
                  <button
                    key={sighting.id}
                    onClick={() => onSelectSpecies(sighting.species_name)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors text-left"
                  >
                    <Bird className="h-5 w-5 text-primary" />
                    <div className="flex-1">
                      <p className="font-medium">{sighting.species_name}</p>
                      {sighting.location_name && (
                        <p className="text-sm text-muted-foreground">{sighting.location_name}</p>
                      )}
                    </div>
                    {sighting.sighting_time && (
                      <Badge variant="outline">{sighting.sighting_time.slice(0, 5)}</Badge>
                    )}
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
