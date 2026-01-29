import { useState, useEffect } from 'react';
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
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { useOuraMetrics, OuraMetrics } from '@/hooks/useOuraMetrics';
import { format, subDays, parseISO, isSameDay } from 'date-fns';
import { Moon, Star, Clock, CalendarIcon, Info, Heart, Activity } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ManualSleepEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingEntry?: OuraMetrics | null; // For edit mode
  initialDate?: Date; // For creating entry on specific date
}

export function ManualSleepEntryDialog({ 
  open, 
  onOpenChange, 
  existingEntry,
  initialDate 
}: ManualSleepEntryDialogProps) {
  const { logManualSleep, formatSleepDuration } = useOuraMetrics();
  
  const isEditMode = !!existingEntry;
  
  // Date state for selecting which day to log
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate || new Date());
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  
  // Defaults: 10pm bedtime, 7am wake
  const [bedtime, setBedtime] = useState('22:00');
  const [wakeTime, setWakeTime] = useState('07:00');
  const [bedtimeAfterMidnight, setBedtimeAfterMidnight] = useState(false);
  const [quality, setQuality] = useState(3);

  // Pre-populate fields when editing
  useEffect(() => {
    if (existingEntry) {
      try {
        const metricDate = parseISO(existingEntry.metric_date);
        setSelectedDate(metricDate);
        
        if (existingEntry.manual_bedtime) {
          // Handle ISO timestamp strings safely
          const bedDate = new Date(existingEntry.manual_bedtime);
          if (!isNaN(bedDate.getTime())) {
            setBedtime(format(bedDate, 'HH:mm'));
            
            // Check if bedtime was on same day as wake (after midnight)
            if (existingEntry.manual_wake_time) {
              const wakeDate = new Date(existingEntry.manual_wake_time);
              if (!isNaN(wakeDate.getTime())) {
                setBedtimeAfterMidnight(isSameDay(bedDate, wakeDate));
              }
            }
          }
        }
        if (existingEntry.manual_wake_time) {
          const wakeDate = new Date(existingEntry.manual_wake_time);
          if (!isNaN(wakeDate.getTime())) {
            setWakeTime(format(wakeDate, 'HH:mm'));
          }
        }
        if (existingEntry.manual_sleep_quality) {
          setQuality(existingEntry.manual_sleep_quality);
        } else if (existingEntry.sleep_score) {
          // Convert sleep score back to quality rating
          setQuality(Math.round(existingEntry.sleep_score / 20));
        }
      } catch (e) {
        console.error('Error parsing sleep entry dates:', e);
        // Keep defaults if parsing fails
      }
    } else {
      // Reset to defaults for new entry
      setBedtime('22:00');
      setWakeTime('07:00');
      setQuality(3);
      setBedtimeAfterMidnight(false);
      if (initialDate) {
        setSelectedDate(initialDate);
      } else {
        setSelectedDate(new Date());
      }
    }
  }, [existingEntry, initialDate, open]);

  // Auto-detect after-midnight bedtime (00:00-06:00)
  useEffect(() => {
    if (!existingEntry) {
      const hour = parseInt(bedtime.split(':')[0], 10);
      if (hour >= 0 && hour < 6) {
        setBedtimeAfterMidnight(true);
      }
    }
  }, [bedtime, existingEntry]);

  // Calculate bedtime date (night before or same day if after midnight)
  const getBedtimeDate = () => {
    if (bedtimeAfterMidnight) {
      return selectedDate;
    }
    return subDays(selectedDate, 1);
  };

  // Calculate duration
  const calculateDuration = () => {
    const bedtimeDateValue = getBedtimeDate();
    const bedDate = new Date(`${format(bedtimeDateValue, 'yyyy-MM-dd')}T${bedtime}:00`);
    const wakeDate = new Date(`${format(selectedDate, 'yyyy-MM-dd')}T${wakeTime}:00`);
    
    let diffMs = wakeDate.getTime() - bedDate.getTime();
    if (diffMs < 0) {
      diffMs = 0;
    }
    
    return Math.floor(diffMs / 1000); // seconds
  };

  const handleSubmit = () => {
    const bedtimeDateValue = getBedtimeDate();
    const bedtimeISO = new Date(`${format(bedtimeDateValue, 'yyyy-MM-dd')}T${bedtime}:00`).toISOString();
    const wakeTimeISO = new Date(`${format(selectedDate, 'yyyy-MM-dd')}T${wakeTime}:00`).toISOString();
    
    logManualSleep.mutate({
      bedtime: bedtimeISO,
      wakeTime: wakeTimeISO,
      quality,
      date: format(selectedDate, 'yyyy-MM-dd'),
      entryId: existingEntry?.id,
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
            {isEditMode ? 'Edit Sleep Entry' : 'Log Sleep'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode 
              ? 'Update your sleep data for this day' 
              : 'Enter your bedtime and wake time to track your sleep'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Date Selector (hidden in edit mode) */}
          {!isEditMode && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                Date (morning you woke up)
              </Label>
              <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(selectedDate, 'EEEE, MMM d, yyyy')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      if (date) {
                        setSelectedDate(date);
                        setDatePickerOpen(false);
                      }
                    }}
                    disabled={(date) => date > new Date()}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}

          {/* Show date in edit mode (read-only) */}
          {isEditMode && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{format(selectedDate, 'EEEE, MMM d, yyyy')}</span>
              </div>
              <Badge variant="secondary">
                {existingEntry?.source === 'oura' ? 'Oura' : 'Manual'}
              </Badge>
            </div>
          )}

          {/* Show Oura biometrics if editing an Oura entry (read-only) */}
          {isEditMode && existingEntry?.source === 'oura' && (
            <div className="p-3 rounded-lg bg-muted/30 space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Info className="h-4 w-4" />
                Oura biometrics (read-only)
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm">
                {existingEntry.readiness_score && (
                  <div className="flex items-center gap-1">
                    <Activity className="h-3 w-3" />
                    <span>Readiness: {existingEntry.readiness_score}</span>
                  </div>
                )}
                {existingEntry.hrv_balance && (
                  <div className="flex items-center gap-1">
                    <Activity className="h-3 w-3" />
                    <span>HRV: {existingEntry.hrv_balance}</span>
                  </div>
                )}
                {existingEntry.resting_heart_rate && (
                  <div className="flex items-center gap-1">
                    <Heart className="h-3 w-3" />
                    <span>RHR: {existingEntry.resting_heart_rate}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Bedtime */}
          <div className="space-y-2">
            <Label htmlFor="bedtime" className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              {bedtimeAfterMidnight ? 'Bedtime (same day)' : 'Bedtime (night before)'}
            </Label>
            <Input
              id="bedtime"
              type="time"
              value={bedtime}
              onChange={(e) => setBedtime(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              {format(getBedtimeDate(), 'EEEE, MMM d')}
            </p>
          </div>

          {/* After midnight toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
            <Label htmlFor="after-midnight" className="text-sm cursor-pointer">
              I went to bed after midnight
            </Label>
            <Switch
              id="after-midnight"
              checked={bedtimeAfterMidnight}
              onCheckedChange={setBedtimeAfterMidnight}
            />
          </div>

          {/* Wake time */}
          <div className="space-y-2">
            <Label htmlFor="wakeTime" className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Wake time
            </Label>
            <Input
              id="wakeTime"
              type="time"
              value={wakeTime}
              onChange={(e) => setWakeTime(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              {format(selectedDate, 'EEEE, MMM d')}
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
            {logManualSleep.isPending 
              ? 'Saving...' 
              : isEditMode 
                ? 'Update Sleep' 
                : 'Save Sleep'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
