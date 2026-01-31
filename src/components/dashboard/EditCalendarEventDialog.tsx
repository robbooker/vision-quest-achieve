import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CalendarIcon, Loader2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

const PILLARS = [
  { value: 'physical', label: 'Physical', letter: 'P', color: 'text-red-500' },
  { value: 'relations', label: 'Relations', letter: 'R', color: 'text-orange-500' },
  { value: 'income', label: 'Income', letter: 'I', color: 'text-yellow-600' },
  { value: 'mental', label: 'Mental', letter: 'M', color: 'text-green-500' },
  { value: 'excellence', label: 'Excellence', letter: 'E', color: 'text-blue-500' },
  { value: 'direction', label: 'Direction', letter: 'D', color: 'text-purple-500' },
  { value: 'spiritual', label: 'Spiritual', letter: 'S', color: 'text-pink-500' },
];

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay?: boolean;
}

interface EditCalendarEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: CalendarEvent | null;
  onUpdate: (eventId: string, data: { title: string; date: Date; startTime: string; endTime: string }) => Promise<void>;
  onDelete: (eventId: string) => Promise<void>;
  isLoading: boolean;
  currentPillar?: string | null;
  onPillarChange?: (pillar: string | null) => void;
}

export function EditCalendarEventDialog({
  open,
  onOpenChange,
  event,
  onUpdate,
  onDelete,
  isLoading,
  currentPillar,
  onPillarChange,
}: EditCalendarEventDialogProps) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedPillar, setSelectedPillar] = useState<string | null>(null);

  // Populate form when event changes
  useEffect(() => {
    if (event) {
      setTitle(event.title);
      const startDate = new Date(event.start);
      const endDate = new Date(event.end);
      setDate(startDate);
      setStartTime(format(startDate, "HH:mm"));
      setEndTime(format(endDate, "HH:mm"));
    }
  }, [event]);

  // Sync pillar when prop changes
  useEffect(() => {
    setSelectedPillar(currentPillar ?? null);
  }, [currentPillar, open]);

  const handlePillarChange = (value: string) => {
    const newPillar = value === 'none' ? null : value;
    setSelectedPillar(newPillar);
    onPillarChange?.(newPillar);
  };

  // Populate form when event changes
  useEffect(() => {
    if (event) {
      setTitle(event.title);
      const startDate = new Date(event.start);
      const endDate = new Date(event.end);
      setDate(startDate);
      setStartTime(format(startDate, "HH:mm"));
      setEndTime(format(endDate, "HH:mm"));
    }
  }, [event]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date || !event) return;
    
    await onUpdate(event.id, { title: title.trim(), date, startTime, endTime });
  };

  const handleDelete = async () => {
    if (!event) return;
    await onDelete(event.id);
    setShowDeleteConfirm(false);
  };

  const isValid = title.trim() && date && startTime < endTime;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Edit Calendar Event</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-event-title">Event Title</Label>
              <Input
                id="edit-event-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Meeting, Call, etc."
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(d) => d && setDate(d)}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-start-time">Start Time</Label>
                <Input
                  id="edit-start-time"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-end-time">End Time</Label>
                <Input
                  id="edit-end-time"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>
            {startTime >= endTime && (
              <p className="text-sm text-destructive">End time must be after start time</p>
            )}

            {/* Pillar Selector */}
            <div className="space-y-2">
              <Label>PRIMED Pillar</Label>
              <Select value={selectedPillar || 'none'} onValueChange={handlePillarChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select pillar (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {PILLARS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      <span className="flex items-center gap-2">
                        <span className={`font-bold ${p.color}`}>{p.letter}</span>
                        <span>{p.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="flex justify-between sm:justify-between">
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isLoading}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={!isValid || isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{event?.title}"? This will remove it from your Google Calendar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
