import { useState } from 'react';
import { Plus, Plane, Package } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlanTripDialog } from '@/components/trips/PlanTripDialog';
import { TripCard } from '@/components/trips/TripCard';
import { PackingListView } from '@/components/trips/PackingListView';
import { MasterLockerView } from '@/components/trips/MasterLockerView';
import { useTrips, Trip } from '@/hooks/useTrips';
import { Skeleton } from '@/components/ui/skeleton';

export default function Trips() {
  const { trips, tripsLoading, deleteTrip } = useTrips();
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('trips');

  const selectedTrip = trips.find((t) => t.id === selectedTripId);

  const upcomingTrips = trips.filter((t) => new Date(t.end_date) >= new Date());
  const pastTrips = trips.filter((t) => new Date(t.end_date) < new Date());

  const handleTripCreated = (tripId: string) => {
    setSelectedTripId(tripId);
  };

  const handleBack = () => {
    setSelectedTripId(null);
  };

  if (selectedTrip) {
    return (
      <DashboardLayout>
        <PackingListView trip={selectedTrip} onBack={handleBack} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Plane className="h-6 w-6 text-primary" />
              Trips
            </h1>
            <p className="text-muted-foreground">
              Plan your adventures with AI-powered packing lists
            </p>
          </div>
          <Button onClick={() => setPlanDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Plan a Trip
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="trips" className="gap-2">
              <Plane className="h-4 w-4" />
              My Trips
            </TabsTrigger>
            <TabsTrigger value="locker" className="gap-2">
              <Package className="h-4 w-4" />
              Master Locker
            </TabsTrigger>
          </TabsList>

          <TabsContent value="trips" className="mt-6">
            {tripsLoading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-48 rounded-lg" />
                ))}
              </div>
            ) : upcomingTrips.length === 0 && pastTrips.length === 0 ? (
              <div className="text-center py-16">
                <Plane className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Trips Planned</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Start planning your next adventure. Our AI will create a personalized packing list based on your destination and activities.
                </p>
                <Button onClick={() => setPlanDialogOpen(true)} size="lg">
                  <Plus className="h-4 w-4 mr-2" />
                  Plan Your First Trip
                </Button>
              </div>
            ) : (
              <div className="space-y-8">
                {upcomingTrips.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Upcoming Trips</h3>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {upcomingTrips.map((trip) => (
                        <TripCard
                          key={trip.id}
                          trip={trip}
                          onSelect={setSelectedTripId}
                          onDelete={(id) => deleteTrip.mutate(id)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {pastTrips.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4 text-muted-foreground">
                      Past Trips
                    </h3>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {pastTrips.map((trip) => (
                        <TripCard
                          key={trip.id}
                          trip={trip}
                          onSelect={setSelectedTripId}
                          onDelete={(id) => deleteTrip.mutate(id)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="locker" className="mt-6">
            <MasterLockerView />
          </TabsContent>
        </Tabs>

        <PlanTripDialog
          open={planDialogOpen}
          onOpenChange={setPlanDialogOpen}
          onTripCreated={handleTripCreated}
        />
      </div>
    </DashboardLayout>
  );
}
