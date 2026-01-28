import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useOuraMetrics } from '@/hooks/useOuraMetrics';
import { format, subDays } from 'date-fns';
import { Moon, Star, Clock } from 'lucide-react';

interface ManualSleepEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ManualSleepEntryDialog({ open, onOpenChange }: ManualSleepEntryDialogProps) {
  const { logManualSleep, formatSleepDuration } = useOuraMetrics();
  
  // Defaults: yesterday 10pm bedtime, today 7am wake
  const yesterday = subDays(new Date(), 1);
  const [bedtime, setBedtime] = useState('22:00');
  const [wakeTime, setWakeTime] = useState('07:00');
  const [quality, setQuality] = useState(3);

  // Calculate duration
  const calculateDuration = () => {
    const bedDate = new Date(`${format(yesterday, 'yyyy-MM-dd')}T${bedtime}:00`);
    const wakeDate = new Date(`${format(new Date(), 'yyyy-MM-dd')}T${wakeTime}:00`);
    
    // Handle overnight sleep
    let diffMs = wakeDate.getTime() - bedDate.getTime();
    if (diffMs < 0) {
      // If negative, wake time is before bedtime on same day logic issue
      // This shouldn't happen with our date setup, but just in case
      diffMs = 0;
    }
    
    return Math.floor(diffMs / 1000); // seconds
  };

  const handleSubmit = () => {
    const bedtimeISO = new Date(`${format(yesterday, 'yyyy-MM-dd')}T${bedtime}:00`).toISOString();
    const wakeTimeISO = new Date(`${format(new Date(), 'yyyy-MM-dd')}T${wakeTime}:00`).toISOString();
    
    logManualSleep.mutate({
      bedtime: bedtimeISO,
      wakeTime: wakeTimeISO,
      quality,
    }, {
      onSuccess: () => onOpenChange(false),
    });
  };

  const qualityLabels = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'];
  const duration = calculateDuration();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Moon className="h-5 w-5 text-indigo-400" />
            Log Last Night's Sleep
          </DialogTitle>
          <DialogDescription>
            Enter your bedtime and wake time to track your sleep
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Bedtime */}
          <div className="space-y-2">
            <Label htmlFor="bedtime" className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Bedtime (last night)
            </Label>
            <Input
              id="bedtime"
              type="time"
              value={bedtime}
              onChange={(e) => setBedtime(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              {format(yesterday, 'EEEE, MMM d')}
            </p>
          </div>

          {/* Wake time */}
          <div className="space-y-2">
            <Label htmlFor="wakeTime" className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Wake time (this morning)
            </Label>
            <Input
              id="wakeTime"
              type="time"
              value={wakeTime}
              onChange={(e) => setWakeTime(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              {format(new Date(), 'EEEE, MMM d')}
            </p>
          </div>

          {/* Duration display */}
          <div className="p-3 rounded-lg bg-muted/50 text-center">
            <p className="text-sm text-muted-foreground">Total Sleep</p>
            <p className="text-2xl font-bold">{formatSleepDuration(duration)}</p>
          </div>

          {/* Quality rating */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Star className="h-4 w-4 text-muted-foreground" />
              Sleep Quality
            </Label>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  type="button"
                  onClick={() => setQuality(rating)}
                  className={`p-2 rounded-lg transition-colors ${
                    rating <= quality
                      ? 'text-yellow-500'
                      : 'text-muted-foreground/30 hover:text-muted-foreground/60'
                  }`}
                >
                  <Star
                    className="h-8 w-8"
                    fill={rating <= quality ? 'currentColor' : 'none'}
                  />
                </button>
              ))}
            </div>
            <p className="text-center text-sm font-medium">{qualityLabels[quality]}</p>
            <p className="text-center text-xs text-muted-foreground">
              Converts to Sleep Score: {quality * 20}/100
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={logManualSleep.isPending}
          >
            {logManualSleep.isPending ? 'Saving...' : 'Save Sleep'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
