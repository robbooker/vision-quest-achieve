import { format, differenceInDays, isPast, isFuture, isToday } from 'date-fns';
import { MapPin, Calendar, Trash2, ChevronRight, Briefcase, Palmtree, Mountain, Users, PartyPopper } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Trip, usePackingList } from '@/hooks/useTrips';
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

interface TripCardProps {
  trip: Trip;
  onSelect: (tripId: string) => void;
  onDelete: (tripId: string) => void;
}

const purposeIcons: Record<string, React.ReactNode> = {
  leisure: <Palmtree className="h-4 w-4" />,
  business: <Briefcase className="h-4 w-4" />,
  adventure: <Mountain className="h-4 w-4" />,
  family: <Users className="h-4 w-4" />,
  wedding: <PartyPopper className="h-4 w-4" />,
};

const purposeLabels: Record<string, string> = {
  leisure: 'Leisure',
  business: 'Business',
  adventure: 'Adventure',
  family: 'Family',
  wedding: 'Event',
};

export function TripCard({ trip, onSelect, onDelete }: TripCardProps) {
  const { progressPercent, packedCount, totalCount } = usePackingList(trip.id);
  
  const startDate = new Date(trip.start_date);
  const endDate = new Date(trip.end_date);
  const daysUntil = differenceInDays(startDate, new Date());
  const tripDuration = differenceInDays(endDate, startDate) + 1;

  const getStatusBadge = () => {
    if (isPast(endDate)) {
      return <Badge variant="secondary">Completed</Badge>;
    }
    if (isToday(startDate) || (isFuture(startDate) === false && isPast(endDate) === false)) {
      return <Badge className="bg-primary/10 text-primary border-primary/20">In Progress</Badge>;
    }
    if (daysUntil <= 7) {
      return <Badge variant="destructive">In {daysUntil} days</Badge>;
    }
    return <Badge variant="outline">{daysUntil} days away</Badge>;
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 cursor-pointer border-border/50 hover:border-primary/30">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1" onClick={() => onSelect(trip.id)}>
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-lg">{trip.destination}</h3>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {format(startDate, 'MMM d')} - {format(endDate, 'MMM d, yyyy')}
              </span>
              <span>•</span>
              <span>{tripDuration} days</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge()}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Trip?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete your trip to {trip.destination} and all associated packing list items.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDelete(trip.id)}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardHeader>
      <CardContent onClick={() => onSelect(trip.id)}>
        <div className="flex items-center gap-2 mb-3">
          <Badge variant="outline" className="flex items-center gap-1">
            {purposeIcons[trip.purpose] || purposeIcons.leisure}
            {purposeLabels[trip.purpose] || 'Leisure'}
          </Badge>
          {trip.planned_activities && (
            <span className="text-xs text-muted-foreground truncate max-w-[200px]">
              {trip.planned_activities}
            </span>
          )}
        </div>

        {totalCount > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Packing Progress</span>
              <span className="font-medium">{progressPercent}%</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {packedCount} of {totalCount} items packed
            </p>
          </div>
        )}

        <div className="flex items-center justify-end mt-3 text-sm text-primary font-medium group-hover:translate-x-1 transition-transform">
          View Packing List
          <ChevronRight className="h-4 w-4 ml-1" />
        </div>
      </CardContent>
    </Card>
  );
}
