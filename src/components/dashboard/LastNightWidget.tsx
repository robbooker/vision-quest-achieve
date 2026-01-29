import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useOuraMetrics } from '@/hooks/useOuraMetrics';
import { ManualSleepEntryDialog } from './ManualSleepEntryDialog';
import { Moon, Plus, Pencil } from 'lucide-react';

export function LastNightWidget() {
  const [manualSleepOpen, setManualSleepOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<any>(null);
  
  const {
    todayMetrics,
    isLoading,
    isOuraConnected,
    isManualMode,
    formatSleepDuration,
  } = useOuraMetrics();

  const handleEditClick = () => {
    setEditEntry(todayMetrics);
    setManualSleepOpen(true);
  };

  const handleNewEntryClick = () => {
    setEditEntry(null);
    setManualSleepOpen(true);
  };

  const handleDialogClose = (open: boolean) => {
    setManualSleepOpen(open);
    if (!open) {
      setEditEntry(null);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Moon className="h-4 w-4" />
            Last Night
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  // No connection and no manual mode - show setup prompt
  if (!isOuraConnected && !isManualMode && !todayMetrics) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Moon className="h-4 w-4" />
              Last Night
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={handleNewEntryClick}
            >
              <Plus className="h-3 w-3 mr-1" />
              LOG
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-2">
            No sleep data yet
          </p>
        </CardContent>
        <ManualSleepEntryDialog 
          open={manualSleepOpen} 
          onOpenChange={handleDialogClose}
          existingEntry={editEntry}
        />
      </Card>
    );
  }

  const metrics = todayMetrics;

  if (!metrics) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Moon className="h-4 w-4" />
              Last Night
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={handleNewEntryClick}
            >
              <Plus className="h-3 w-3 mr-1" />
              LOG
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-2">
            No sleep data for today
          </p>
        </CardContent>
        <ManualSleepEntryDialog 
          open={manualSleepOpen} 
          onOpenChange={handleDialogClose}
          existingEntry={editEntry}
        />
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Moon className="h-4 w-4" />
            Last Night
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={handleEditClick}
          >
            <Pencil className="h-3 w-3 mr-1" />
            EDIT
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-baseline gap-2">
          <p className="text-3xl font-bold">
            {formatSleepDuration(metrics?.total_sleep_seconds ?? null)}
          </p>
          {metrics?.sleep_score && (
            <span className="text-sm text-muted-foreground">
              • Score: {metrics.sleep_score}
            </span>
          )}
        </div>
        <Link 
          to="/reset" 
          className="block text-xs text-primary hover:underline"
        >
          View Performance Audit →
        </Link>
      </CardContent>
      <ManualSleepEntryDialog 
        open={manualSleepOpen} 
        onOpenChange={handleDialogClose}
        existingEntry={editEntry}
      />
    </Card>
  );
}
