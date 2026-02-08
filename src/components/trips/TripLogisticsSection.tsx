import { useState } from 'react';
import { Plane, Hotel, Car, Bus, Calendar, Plus, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { useTripLogistics, LogisticsType, TripLogistics } from '@/hooks/useTripLogistics';
import { Trip } from '@/hooks/useTrips';
import { LogisticsCard } from './LogisticsCard';
import { AddLogisticsDialog } from './AddLogisticsDialog';

interface TripLogisticsSectionProps {
  trip: Trip;
}

const logisticsConfig: Record<LogisticsType, { label: string; icon: React.ReactNode; description: string }> = {
  flight: { label: 'Flights', icon: <Plane className="h-4 w-4" />, description: 'Flight bookings' },
  stay: { label: 'Accommodations', icon: <Hotel className="h-4 w-4" />, description: 'Hotels, Airbnb, etc.' },
  car_rental: { label: 'Car Rentals', icon: <Car className="h-4 w-4" />, description: 'Rental car bookings' },
  transportation: { label: 'Other Transport', icon: <Bus className="h-4 w-4" />, description: 'Train, shuttle, etc.' },
  activity: { label: 'Activities', icon: <Calendar className="h-4 w-4" />, description: 'Reservations & tickets' },
};

export function TripLogisticsSection({ trip }: TripLogisticsSectionProps) {
  const { groupedLogistics, isLoading, addLogistics, updateLogistics, deleteLogistics } = useTripLogistics(
    trip.id,
    trip.destination,
    trip.start_date
  );
  const [openSections, setOpenSections] = useState<Set<LogisticsType>>(new Set(['flight', 'stay', 'car_rental']));
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addDialogType, setAddDialogType] = useState<LogisticsType>('stay');
  const [editingItem, setEditingItem] = useState<TripLogistics | null>(null);

  const toggleSection = (type: LogisticsType) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  const handleAdd = (type: LogisticsType) => {
    setAddDialogType(type);
    setEditingItem(null);
    setAddDialogOpen(true);
  };

  const handleEdit = (item: TripLogistics) => {
    setAddDialogType(item.logistics_type);
    setEditingItem(item);
    setAddDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    await deleteLogistics.mutateAsync(id);
  };

  const handleSave = async (data: Omit<TripLogistics, 'id' | 'trip_id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (editingItem) {
      await updateLogistics.mutateAsync({ id: editingItem.id, updates: data });
    } else {
      await addLogistics.mutateAsync({ ...data, trip_id: trip.id });
    }
    setAddDialogOpen(false);
    setEditingItem(null);
  };

  // Determine which sections to show
  const sectionsToShow: LogisticsType[] = trip.has_flight
    ? ['flight', 'stay', 'car_rental', 'transportation', 'activity']
    : ['stay', 'car_rental', 'transportation', 'activity'];

  const totalItems = Object.values(groupedLogistics).flat().length;

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 w-40 bg-muted rounded" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-20 bg-muted rounded" />
            <div className="h-20 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-gradient-to-br from-primary/5 via-transparent to-transparent border-primary/10">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">Travel Logistics</CardTitle>
              {totalItems > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {totalItems} {totalItems === 1 ? 'item' : 'items'}
                </Badge>
              )}
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Track your bookings, confirmations, and reservations
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {sectionsToShow.map((type) => {
            const config = logisticsConfig[type];
            const items = groupedLogistics[type] || [];
            const isOpen = openSections.has(type);

            return (
              <Card key={type} className="overflow-hidden">
                <Collapsible open={isOpen} onOpenChange={() => toggleSection(type)}>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {isOpen ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span className="text-primary">{config.icon}</span>
                          <span className="font-medium">{config.label}</span>
                          {items.length > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {items.length}
                            </Badge>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAdd(type);
                          }}
                        >
                          <Plus className="h-3 w-3" />
                          Add
                        </Button>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="pt-0 pb-3">
                      {items.length === 0 ? (
                        <p className="text-sm text-muted-foreground italic py-2">
                          No {config.label.toLowerCase()} added yet
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {items.map((item) => (
                            <LogisticsCard
                              key={item.id}
                              item={item}
                              onEdit={() => handleEdit(item)}
                              onDelete={() => handleDelete(item.id)}
                            />
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            );
          })}
        </CardContent>
      </Card>

      <AddLogisticsDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        type={addDialogType}
        editingItem={editingItem}
        onSave={handleSave}
        isSaving={addLogistics.isPending || updateLogistics.isPending}
      />
    </>
  );
}
