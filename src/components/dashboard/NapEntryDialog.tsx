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
import { Bed } from 'lucide-react';

interface NapEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentNapMinutes?: number | null;
}

export function NapEntryDialog({ open, onOpenChange, currentNapMinutes }: NapEntryDialogProps) {
  const { logNap } = useOuraMetrics();
  const [napMinutes, setNapMinutes] = useState(currentNapMinutes?.toString() || '20');

  const handleSubmit = () => {
    const minutes = parseInt(napMinutes, 10);
    if (isNaN(minutes) || minutes < 0) return;
    
    logNap.mutate({ napMinutes: minutes }, {
      onSuccess: () => onOpenChange(false),
    });
  };

  const presets = [15, 20, 30, 45, 60, 90];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bed className="h-5 w-5 text-indigo-400" />
            Log Nap
          </DialogTitle>
          <DialogDescription>
            Track a nap for today
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Quick presets */}
          <div className="space-y-2">
            <Label>Quick Select</Label>
            <div className="flex flex-wrap gap-2">
              {presets.map((mins) => (
                <Button
                  key={mins}
                  type="button"
                  variant={napMinutes === mins.toString() ? "default" : "outline"}
                  size="sm"
                  onClick={() => setNapMinutes(mins.toString())}
                >
                  {mins}m
                </Button>
              ))}
            </div>
          </div>

          {/* Custom input */}
          <div className="space-y-2">
            <Label htmlFor="napMinutes">Duration (minutes)</Label>
            <Input
              id="napMinutes"
              type="number"
              min="1"
              max="180"
              value={napMinutes}
              onChange={(e) => setNapMinutes(e.target.value)}
              placeholder="20"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={logNap.isPending || !napMinutes}
          >
            {logNap.isPending ? 'Saving...' : 'Save Nap'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
