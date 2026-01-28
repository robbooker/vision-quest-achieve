import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useCalendarConnection, useUserPreferences } from '@/hooks/useCalendar';
import { Calendar, CheckCircle, Loader2, Settings, Unplug, RefreshCw } from 'lucide-react';
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
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const HOURS = Array.from({ length: 24 }, (_, i) => ({
  value: i.toString(),
  label: `${i === 0 ? 12 : i > 12 ? i - 12 : i}:00 ${i < 12 ? 'AM' : 'PM'}`,
}));

const BLOCK_SIZES = [
  { value: '15', label: '15 minutes' },
  { value: '30', label: '30 minutes' },
  { value: '45', label: '45 minutes' },
  { value: '60', label: '1 hour' },
  { value: '90', label: '1.5 hours' },
  { value: '120', label: '2 hours' },
];

const BUFFER_SIZES = [
  { value: '0', label: 'No buffer' },
  { value: '5', label: '5 minutes' },
  { value: '10', label: '10 minutes' },
  { value: '15', label: '15 minutes' },
  { value: '30', label: '30 minutes' },
];

export function CalendarSettings() {
  const { isConnected, isLoading, isConnecting, connect, disconnect } = useCalendarConnection();
  const { preferences, isLoading: prefsLoading, updatePreferences } = useUserPreferences();
  const [isBackfilling, setIsBackfilling] = useState(false);

  const handleBackfillJanuary = async () => {
    setIsBackfilling(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please log in to backfill calendar events');
        return;
      }

      const response = await supabase.functions.invoke('backfill-calendar-pillars', {
        body: { startDate: '2025-01-01', endDate: '2025-01-31' },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const results = response.data;
      toast.success(
        `Backfill complete! Processed ${results.processed} events, tagged ${results.tagged} with pillars.`,
        { duration: 5000 }
      );

      if (results.tagged > 0) {
        const pillarSummary = Object.entries(results.byPillar)
          .map(([pillar, count]) => `${pillar}: ${count}`)
          .join(', ');
        toast.info(`Pillars assigned: ${pillarSummary}`, { duration: 5000 });
      }
    } catch (error) {
      console.error('Backfill error:', error);
      toast.error('Failed to backfill calendar events');
    } finally {
      setIsBackfilling(false);
    }
  };

  if (isLoading || prefsLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Google Calendar
        </CardTitle>
        <CardDescription>
          Connect your calendar to see your availability and create task holds.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Connection Status */}
        <div className="flex items-center justify-between p-4 rounded-lg border">
          <div className="flex items-center gap-3">
            {isConnected ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <Calendar className="h-5 w-5 text-muted-foreground" />
            )}
            <div>
              <p className="font-medium">
                {isConnected ? 'Calendar Connected' : 'Not Connected'}
              </p>
              <p className="text-sm text-muted-foreground">
                {isConnected
                  ? 'Your Google Calendar is synced with 12-Week Year'
                  : 'Connect to see your availability'}
              </p>
            </div>
          </div>
          {isConnected ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Unplug className="h-4 w-4 mr-2" />
                  Disconnect
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Disconnect Calendar?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will remove your Google Calendar connection. You'll no longer see
                    availability data or be able to create task holds.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={disconnect}>Disconnect</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <Button onClick={connect} disabled={isConnecting}>
              {isConnecting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Calendar className="h-4 w-4 mr-2" />
                  Connect Calendar
                </>
              )}
            </Button>
          )}
        </div>

        {/* Pillar Backfill Section - Only show when connected */}
        {isConnected && (
          <>
            <Separator />
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-medium">PRIMED Pillar Backfill</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Automatically assign PRIMED pillars to your January 2025 calendar events based on keywords in event titles.
              </p>
              <Button
                onClick={handleBackfillJanuary}
                disabled={isBackfilling}
                variant="outline"
              >
                {isBackfilling ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Backfilling...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Backfill January 2025
                  </>
                )}
              </Button>
            </div>
          </>
        )}

        {/* Work Hours Settings */}
        <Separator />
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-medium">Work Hours</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="work-start">Start Time</Label>
              <Select
                value={preferences.work_start_hour.toString()}
                onValueChange={(v) => updatePreferences({ work_start_hour: parseInt(v) })}
              >
                <SelectTrigger id="work-start">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HOURS.map((hour) => (
                    <SelectItem key={hour.value} value={hour.value}>
                      {hour.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="work-end">End Time</Label>
              <Select
                value={preferences.work_end_hour.toString()}
                onValueChange={(v) => updatePreferences({ work_end_hour: parseInt(v) })}
              >
                <SelectTrigger id="work-end">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HOURS.map((hour) => (
                    <SelectItem key={hour.value} value={hour.value}>
                      {hour.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Task Block Settings */}
        <Separator />
        <div className="space-y-4">
          <h3 className="font-medium">Task Scheduling</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="min-block">Minimum Task Block</Label>
              <Select
                value={preferences.min_task_block_minutes.toString()}
                onValueChange={(v) => updatePreferences({ min_task_block_minutes: parseInt(v) })}
              >
                <SelectTrigger id="min-block">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BLOCK_SIZES.map((size) => (
                    <SelectItem key={size.value} value={size.value}>
                      {size.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Minimum available time needed to schedule a task
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="buffer">Buffer Between Events</Label>
              <Select
                value={preferences.buffer_minutes.toString()}
                onValueChange={(v) => updatePreferences({ buffer_minutes: parseInt(v) })}
              >
                <SelectTrigger id="buffer">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BUFFER_SIZES.map((size) => (
                    <SelectItem key={size.value} value={size.value}>
                      {size.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Time buffer before and after calendar events
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
