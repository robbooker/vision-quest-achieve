import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, X, Hexagon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

const PRIMED_PILLARS = [
  { value: 'physical', label: 'Physical' },
  { value: 'relations', label: 'Relations' },
  { value: 'income', label: 'Income' },
  { value: 'mental', label: 'Mental' },
  { value: 'excellence', label: 'Excellence' },
  { value: 'direction', label: 'Direction' },
];

interface EditQuickTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: {
    id: string;
    title: string;
    due_date: string | null;
    pillar: string | null;
  } | null;
  onSave: (id: string, title: string, dueDate: string | null, pillar: string | null) => Promise<void>;
}

export function EditQuickTaskDialog({
  open,
  onOpenChange,
  task,
  onSave,
}: EditQuickTaskDialogProps) {
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [pillar, setPillar] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDueDate(task.due_date ? new Date(task.due_date) : undefined);
      setPillar(task.pillar || null);
    }
  }, [task]);

  const handleSave = async () => {
    if (!task || !title.trim()) return;
    
    setIsSaving(true);
    try {
      await onSave(
        task.id,
        title.trim(),
        dueDate ? format(dueDate, 'yyyy-MM-dd') : null,
        pillar
      );
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  const clearDueDate = () => {
    setDueDate(undefined);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
              }}
            />
          </div>
          <div className="grid gap-2">
            <Label>Due Date (optional)</Label>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "flex-1 justify-start text-left font-normal",
                      !dueDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {dueDate && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={clearDueDate}
                  className="shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          <div className="grid gap-2">
            <Label className="flex items-center gap-2">
              <Hexagon className="h-4 w-4" />
              PRIMED Pillar (optional)
            </Label>
            <Select value={pillar || ''} onValueChange={(v) => setPillar(v || null)}>
              <SelectTrigger>
                <SelectValue placeholder="Select pillar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {PRIMED_PILLARS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !title.trim()}>
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
