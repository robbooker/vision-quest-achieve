import { useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Bird, List, Heart, Calendar, BarChart3, Map, Info, Camera } from 'lucide-react';
import { useBirdwatching } from '@/hooks/useBirdwatching';
import { LogSightingForm } from '@/components/birdwatching/LogSightingForm';
import { LifeList } from '@/components/birdwatching/LifeList';
import { Wishlist } from '@/components/birdwatching/Wishlist';
import { BirdCalendar } from '@/components/birdwatching/BirdCalendar';
import { SeasonalTimeline } from '@/components/birdwatching/SeasonalTimeline';
import { BirdStats } from '@/components/birdwatching/BirdStats';
import { BirdMap } from '@/components/birdwatching/BirdMap';
import { SpeciesDetail } from '@/components/birdwatching/SpeciesDetail';
import { BirdGallery } from '@/components/birdwatching/BirdGallery';

export default function Birdwatching() {
  const [activeTab, setActiveTab] = useState('log');
  const [selectedSpecies, setSelectedSpecies] = useState<string | null>(null);
  const { sightings, lifeList, wishlist, stats, seasonalData, sightingsLoading } = useBirdwatching();

  if (selectedSpecies) {
    return (
      <DashboardLayout>
        <SpeciesDetail 
          species={selectedSpecies} 
          onBack={() => setSelectedSpecies(null)} 
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Bird className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Birdwatching</h1>
            <p className="text-muted-foreground">Track your bird sightings</p>
          </div>
        </div>

        {/* Friendly Note */}
        <Alert className="bg-primary/5 border-primary/20">
          <Info className="h-4 w-4" />
          <AlertDescription>
            This feature is mostly for{' '}
            <Link 
              to="/birds/rob/gallery" 
              className="font-medium text-primary hover:underline"
            >
              Rob
            </Link>
            . But of course you are welcome to use it. 🐦
          </AlertDescription>
        </Alert>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="log" className="text-xs sm:text-sm">
              <Bird className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Log</span>
            </TabsTrigger>
            <TabsTrigger value="lifelist" className="text-xs sm:text-sm">
              <List className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Life List</span>
            </TabsTrigger>
            <TabsTrigger value="gallery" className="text-xs sm:text-sm">
              <Camera className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Gallery</span>
            </TabsTrigger>
            <TabsTrigger value="wishlist" className="text-xs sm:text-sm">
              <Heart className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Wishlist</span>
            </TabsTrigger>
            <TabsTrigger value="calendar" className="text-xs sm:text-sm">
              <Calendar className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Calendar</span>
            </TabsTrigger>
            <TabsTrigger value="seasonal" className="text-xs sm:text-sm">
              <BarChart3 className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Seasonal</span>
            </TabsTrigger>
            <TabsTrigger value="stats" className="text-xs sm:text-sm">
              <BarChart3 className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Stats</span>
            </TabsTrigger>
            <TabsTrigger value="map" className="text-xs sm:text-sm">
              <Map className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Map</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="log" className="mt-6">
            <LogSightingForm />
          </TabsContent>

          <TabsContent value="lifelist" className="mt-6">
            <LifeList onSelectSpecies={setSelectedSpecies} />
          </TabsContent>

          <TabsContent value="gallery" className="mt-6">
            <BirdGallery onSelectSpecies={setSelectedSpecies} />
          </TabsContent>

          <TabsContent value="wishlist" className="mt-6">
            <Wishlist />
          </TabsContent>

          <TabsContent value="calendar" className="mt-6">
            <BirdCalendar onSelectSpecies={setSelectedSpecies} />
          </TabsContent>

          <TabsContent value="seasonal" className="mt-6">
            <SeasonalTimeline />
          </TabsContent>

          <TabsContent value="stats" className="mt-6">
            <BirdStats />
          </TabsContent>

          <TabsContent value="map" className="mt-6">
            <BirdMap onSelectSpecies={setSelectedSpecies} />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
