import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Plane, Hotel, Car, Bus, Calendar } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { TripLogistics, LogisticsType } from '@/hooks/useTripLogistics';

interface AddLogisticsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: LogisticsType;
  editingItem: TripLogistics | null;
  onSave: (data: Omit<TripLogistics, 'id' | 'trip_id' | 'user_id' | 'created_at' | 'updated_at'>) => void;
  isSaving: boolean;
}

const typeConfig: Record<LogisticsType, { label: string; icon: React.ReactNode }> = {
  flight: { label: 'Flight', icon: <Plane className="h-5 w-5" /> },
  stay: { label: 'Accommodation', icon: <Hotel className="h-5 w-5" /> },
  car_rental: { label: 'Car Rental', icon: <Car className="h-5 w-5" /> },
  transportation: { label: 'Transportation', icon: <Bus className="h-5 w-5" /> },
  activity: { label: 'Activity/Reservation', icon: <Calendar className="h-5 w-5" /> },
};

interface FormData {
  provider_name: string;
  confirmation_code: string;
  start_datetime: string;
  end_datetime: string;
  start_location: string;
  end_location: string;
  flight_number: string;
  seat_assignment: string;
  vehicle_type: string;
  contact_phone: string;
  notes: string;
}

export function AddLogisticsDialog({
  open,
  onOpenChange,
  type,
  editingItem,
  onSave,
  isSaving,
}: AddLogisticsDialogProps) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      provider_name: '',
      confirmation_code: '',
      start_datetime: '',
      end_datetime: '',
      start_location: '',
      end_location: '',
      flight_number: '',
      seat_assignment: '',
      vehicle_type: '',
      contact_phone: '',
      notes: '',
    },
  });

  useEffect(() => {
    if (editingItem) {
      reset({
        provider_name: editingItem.provider_name || '',
        confirmation_code: editingItem.confirmation_code || '',
        start_datetime: editingItem.start_datetime ? editingItem.start_datetime.slice(0, 16) : '',
        end_datetime: editingItem.end_datetime ? editingItem.end_datetime.slice(0, 16) : '',
        start_location: editingItem.start_location || '',
        end_location: editingItem.end_location || '',
        flight_number: editingItem.flight_number || '',
        seat_assignment: editingItem.seat_assignment || '',
        vehicle_type: editingItem.vehicle_type || '',
        contact_phone: editingItem.contact_phone || '',
        notes: editingItem.notes || '',
      });
    } else {
      reset({
        provider_name: '',
        confirmation_code: '',
        start_datetime: '',
        end_datetime: '',
        start_location: '',
        end_location: '',
        flight_number: '',
        seat_assignment: '',
        vehicle_type: '',
        contact_phone: '',
        notes: '',
      });
    }
  }, [editingItem, reset, open]);

  const onSubmit = (data: FormData) => {
    // Store times as Central Time strings — do NOT convert to UTC
    // Append CT offset so the value is unambiguous
    const formatAsCT = (dt: string) => {
      if (!dt) return null;
      // datetime-local gives "YYYY-MM-DDTHH:MM", store with CT offset
      return dt + ':00-06:00'; // CST offset; adjust to -05:00 for CDT if needed
    };

    onSave({
      logistics_type: type,
      provider_name: data.provider_name || null,
      confirmation_code: data.confirmation_code || null,
      start_datetime: formatAsCT(data.start_datetime),
      end_datetime: formatAsCT(data.end_datetime),
      start_location: data.start_location || null,
      end_location: data.end_location || null,
      flight_number: data.flight_number || null,
      seat_assignment: data.seat_assignment || null,
      vehicle_type: data.vehicle_type || null,
      contact_phone: data.contact_phone || null,
      notes: data.notes || null,
      metadata: null,
    });
  };

  const config = typeConfig[type];

  const renderFlightFields = () => (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="provider_name">Airline</Label>
          <Input id="provider_name" placeholder="e.g., Delta" {...register('provider_name')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="flight_number">Flight Number</Label>
          <Input id="flight_number" placeholder="e.g., DL1234" {...register('flight_number')} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start_location">Departure Airport</Label>
          <Input id="start_location" placeholder="e.g., MIA" {...register('start_location')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="start_datetime">Departure Time</Label>
          <Input id="start_datetime" type="datetime-local" {...register('start_datetime')} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="end_location">Arrival Airport</Label>
          <Input id="end_location" placeholder="e.g., ATL" {...register('end_location')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="end_datetime">Arrival Time</Label>
          <Input id="end_datetime" type="datetime-local" {...register('end_datetime')} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="confirmation_code">Confirmation Code</Label>
          <Input id="confirmation_code" placeholder="e.g., ABC123" {...register('confirmation_code')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="seat_assignment">Seat Assignment</Label>
          <Input id="seat_assignment" placeholder="e.g., 12A" {...register('seat_assignment')} />
        </div>
      </div>
    </>
  );

  const renderStayFields = () => (
    <>
      <div className="space-y-2">
        <Label htmlFor="provider_name">Property Name</Label>
        <Input id="provider_name" placeholder="e.g., Marriott Midtown" {...register('provider_name')} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="start_location">Address</Label>
        <Input id="start_location" placeholder="e.g., 123 Main St, Atlanta, GA" {...register('start_location')} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start_datetime">Check-in</Label>
          <Input id="start_datetime" type="datetime-local" {...register('start_datetime')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="end_datetime">Check-out</Label>
          <Input id="end_datetime" type="datetime-local" {...register('end_datetime')} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="confirmation_code">Confirmation Code</Label>
          <Input id="confirmation_code" placeholder="e.g., XYZ789" {...register('confirmation_code')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact_phone">Contact Phone</Label>
          <Input id="contact_phone" type="tel" placeholder="e.g., (555) 123-4567" {...register('contact_phone')} />
        </div>
      </div>
    </>
  );

  const renderCarRentalFields = () => (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="provider_name">Company</Label>
          <Input id="provider_name" placeholder="e.g., Hertz" {...register('provider_name')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="vehicle_type">Vehicle Type</Label>
          <Input id="vehicle_type" placeholder="e.g., Midsize SUV" {...register('vehicle_type')} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start_location">Pickup Location</Label>
          <Input id="start_location" placeholder="e.g., ATL Airport" {...register('start_location')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="start_datetime">Pickup Time</Label>
          <Input id="start_datetime" type="datetime-local" {...register('start_datetime')} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="end_location">Dropoff Location</Label>
          <Input id="end_location" placeholder="e.g., ATL Airport" {...register('end_location')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="end_datetime">Dropoff Time</Label>
          <Input id="end_datetime" type="datetime-local" {...register('end_datetime')} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmation_code">Confirmation Code</Label>
        <Input id="confirmation_code" placeholder="e.g., RES12345" {...register('confirmation_code')} />
      </div>
    </>
  );

  const renderTransportationFields = () => (
    <>
      <div className="space-y-2">
        <Label htmlFor="provider_name">Service/Provider</Label>
        <Input id="provider_name" placeholder="e.g., Amtrak, Uber reservation" {...register('provider_name')} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start_location">From</Label>
          <Input id="start_location" placeholder="Pickup location" {...register('start_location')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="end_location">To</Label>
          <Input id="end_location" placeholder="Destination" {...register('end_location')} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start_datetime">Departure Time</Label>
          <Input id="start_datetime" type="datetime-local" {...register('start_datetime')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmation_code">Confirmation Code</Label>
          <Input id="confirmation_code" placeholder="e.g., ABC123" {...register('confirmation_code')} />
        </div>
      </div>
    </>
  );

  const renderActivityFields = () => (
    <>
      <div className="space-y-2">
        <Label htmlFor="provider_name">Name/Venue</Label>
        <Input id="provider_name" placeholder="e.g., Georgia Aquarium" {...register('provider_name')} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="start_location">Address</Label>
        <Input id="start_location" placeholder="e.g., 225 Baker St NW, Atlanta, GA" {...register('start_location')} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start_datetime">Date & Time</Label>
          <Input id="start_datetime" type="datetime-local" {...register('start_datetime')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmation_code">Confirmation Code</Label>
          <Input id="confirmation_code" placeholder="e.g., TKT12345" {...register('confirmation_code')} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="contact_phone">Contact Phone</Label>
        <Input id="contact_phone" type="tel" placeholder="e.g., (555) 123-4567" {...register('contact_phone')} />
      </div>
    </>
  );

  const renderFields = () => {
    switch (type) {
      case 'flight':
        return renderFlightFields();
      case 'stay':
        return renderStayFields();
      case 'car_rental':
        return renderCarRentalFields();
      case 'transportation':
        return renderTransportationFields();
      case 'activity':
        return renderActivityFields();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-primary">{config.icon}</span>
            {editingItem ? 'Edit' : 'Add'} {config.label}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
          {renderFields()}
          
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Additional notes..."
              className="resize-none"
              rows={2}
              {...register('notes')}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : editingItem ? 'Update' : 'Add'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
