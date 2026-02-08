import { format } from 'date-fns';
import { Plane, Hotel, Car, Bus, Calendar, Copy, Pencil, Trash2, MapPin, Phone, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TripLogistics, LogisticsType } from '@/hooks/useTripLogistics';
import { toast } from 'sonner';

interface LogisticsCardProps {
  item: TripLogistics;
  onEdit: () => void;
  onDelete: () => void;
}

const typeIcons: Record<LogisticsType, React.ReactNode> = {
  flight: <Plane className="h-4 w-4" />,
  stay: <Hotel className="h-4 w-4" />,
  car_rental: <Car className="h-4 w-4" />,
  transportation: <Bus className="h-4 w-4" />,
  activity: <Calendar className="h-4 w-4" />,
};

export function LogisticsCard({ item, onEdit, onDelete }: LogisticsCardProps) {
  const copyConfirmation = () => {
    if (item.confirmation_code) {
      navigator.clipboard.writeText(item.confirmation_code);
      toast.success('Confirmation code copied!');
    }
  };

  const formatDateTime = (datetime: string | null) => {
    if (!datetime) return null;
    return format(new Date(datetime), "MMM d 'at' h:mm a");
  };

  const formatDate = (datetime: string | null) => {
    if (!datetime) return null;
    return format(new Date(datetime), 'MMM d');
  };

  const renderFlightDetails = () => (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {item.provider_name && (
          <span className="font-medium">{item.provider_name}</span>
        )}
        {item.flight_number && (
          <Badge variant="secondary" className="font-mono">
            {item.flight_number}
          </Badge>
        )}
        {item.seat_assignment && (
          <Badge variant="outline" className="text-xs">
            Seat {item.seat_assignment}
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        {item.start_location && item.start_datetime && (
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {item.start_location} → {formatDateTime(item.start_datetime)}
          </span>
        )}
      </div>
      {item.end_location && item.end_datetime && (
        <div className="text-sm text-muted-foreground">
          Arrives: {item.end_location} at {format(new Date(item.end_datetime), 'h:mm a')}
        </div>
      )}
    </div>
  );

  const renderStayDetails = () => (
    <div className="space-y-2">
      {item.provider_name && (
        <span className="font-medium">{item.provider_name}</span>
      )}
      {item.start_location && (
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="h-3 w-3" />
          {item.start_location}
        </div>
      )}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        {item.start_datetime && (
          <span>Check-in: {formatDate(item.start_datetime)}</span>
        )}
        {item.end_datetime && (
          <span>Check-out: {formatDate(item.end_datetime)}</span>
        )}
      </div>
      {item.contact_phone && (
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Phone className="h-3 w-3" />
          {item.contact_phone}
        </div>
      )}
    </div>
  );

  const renderCarRentalDetails = () => (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {item.provider_name && (
          <span className="font-medium">{item.provider_name}</span>
        )}
        {item.vehicle_type && (
          <Badge variant="outline" className="text-xs">
            {item.vehicle_type}
          </Badge>
        )}
      </div>
      <div className="text-sm text-muted-foreground space-y-1">
        {item.start_location && item.start_datetime && (
          <div>Pickup: {item.start_location} on {formatDateTime(item.start_datetime)}</div>
        )}
        {item.end_location && item.end_datetime && (
          <div>Dropoff: {item.end_location} on {formatDateTime(item.end_datetime)}</div>
        )}
      </div>
    </div>
  );

  const renderTransportationDetails = () => (
    <div className="space-y-2">
      {item.provider_name && (
        <span className="font-medium">{item.provider_name}</span>
      )}
      <div className="text-sm text-muted-foreground">
        {item.start_location && item.end_location && (
          <div>{item.start_location} → {item.end_location}</div>
        )}
        {item.start_datetime && (
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDateTime(item.start_datetime)}
          </div>
        )}
      </div>
    </div>
  );

  const renderActivityDetails = () => (
    <div className="space-y-2">
      {item.provider_name && (
        <span className="font-medium">{item.provider_name}</span>
      )}
      {item.start_location && (
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="h-3 w-3" />
          {item.start_location}
        </div>
      )}
      {item.start_datetime && (
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Clock className="h-3 w-3" />
          {formatDateTime(item.start_datetime)}
        </div>
      )}
    </div>
  );

  const renderDetails = () => {
    switch (item.logistics_type) {
      case 'flight':
        return renderFlightDetails();
      case 'stay':
        return renderStayDetails();
      case 'car_rental':
        return renderCarRentalDetails();
      case 'transportation':
        return renderTransportationDetails();
      case 'activity':
        return renderActivityDetails();
      default:
        return null;
    }
  };

  return (
    <div className="group relative rounded-lg border bg-card p-4 hover:bg-muted/30 transition-colors">
      <div className="flex items-start gap-3">
        <div className="mt-1 text-primary">
          {typeIcons[item.logistics_type]}
        </div>
        <div className="flex-1 min-w-0">
          {renderDetails()}
          {item.notes && (
            <p className="mt-2 text-xs text-muted-foreground italic">
              {item.notes}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          {item.confirmation_code && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1 font-mono text-xs h-7"
              onClick={copyConfirmation}
            >
              <Copy className="h-3 w-3" />
              {item.confirmation_code}
            </Button>
          )}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit}>
              <Pencil className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={onDelete}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
