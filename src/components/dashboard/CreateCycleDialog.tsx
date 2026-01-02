import { useState } from 'react';
import { format, addWeeks } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCycles } from '@/hooks/useCycles';
import { useToast } from '@/hooks/use-toast';

interface CreateCycleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateCycleDialog({ open, onOpenChange }: CreateCycleDialogProps) {
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState<Date>();
  const { createCycle } = useCycles();
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast({
        title: 'Name required',
        description: 'Please enter a name for your cycle.',
        variant: 'destructive',
      });
      return;
    }

    if (!startDate) {
      toast({
        title: 'Start date required',
        description: 'Please select a start date for your cycle.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await createCycle.mutateAsync({
        name: name.trim(),
        start_date: format(startDate, 'yyyy-MM-dd'),
      });

      toast({
        title: 'Cycle created',
        description: `"${name}" has been created. You can now add goals.`,
      });

      setName('');
      setStartDate(undefined);
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create cycle. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const endDate = startDate ? addWeeks(startDate, 6) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Cycle</DialogTitle>
          <DialogDescription>
            Start a new 6-week sprint. Choose a name and start date.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Cycle Name</Label>
            <Input
              id="name"
              placeholder="e.g., Q1 2026 Sprint"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Start Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !startDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {endDate && (
            <div className="rounded-lg bg-muted/50 p-3 text-sm">
              <span className="text-muted-foreground">End date: </span>
              <span className="font-medium">{format(endDate, 'PPP')}</span>
              <span className="text-muted-foreground"> (6 weeks + 2 week reset)</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={createCycle.isPending}>
            {createCycle.isPending ? 'Creating...' : 'Create Cycle'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
