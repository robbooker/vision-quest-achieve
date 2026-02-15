import { useState } from 'react';
import { useReminders } from '@/hooks/useReminders';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { Plus, Trash2, CalendarIcon, Bell } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface RemindersListProps {
  selectedDate: Date;
}

export function RemindersList({ selectedDate }: RemindersListProps) {
  const { reminders, isLoading, createReminder, toggleComplete, deleteReminder } = useReminders(selectedDate);
  const [newText, setNewText] = useState('');
  const [newDate, setNewDate] = useState<Date>(selectedDate);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const { toast } = useToast();

  const handleAdd = async () => {
    if (!newText.trim()) return;
    try {
      await createReminder.mutateAsync({
        text: newText.trim(),
        date: format(newDate, 'yyyy-MM-dd'),
      });
      setNewText('');
      setNewDate(selectedDate);
      toast({ title: 'Reminder added' });
    } catch {
      toast({ title: 'Error', description: 'Failed to add reminder', variant: 'destructive' });
    }
  };

  return (
    <div className="p-4 space-y-3">
      {/* Add form */}
      <div className="flex gap-2">
        <Input
          placeholder="Add a reminder..."
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          className="flex-1"
        />
        <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon" className="shrink-0">
              <CalendarIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={newDate}
              onSelect={(d) => {
                if (d) {
                  setNewDate(d);
                  setShowDatePicker(false);
                }
              }}
            />
          </PopoverContent>
        </Popover>
        <Button
          size="icon"
          onClick={handleAdd}
          disabled={!newText.trim() || createReminder.isPending}
          className="shrink-0"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Date indicator if different from selected */}
      {format(newDate, 'yyyy-MM-dd') !== format(selectedDate, 'yyyy-MM-dd') && (
        <p className="text-xs text-muted-foreground">
          New reminder will be set for {format(newDate, 'MMM d, yyyy')}
        </p>
      )}

      {/* Reminders list */}
      {isLoading ? (
        <p className="text-sm text-muted-foreground py-4 text-center">Loading...</p>
      ) : reminders.length === 0 ? (
        <div className="flex flex-col items-center py-6 text-center">
          <Bell className="h-6 w-6 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No reminders for this day</p>
        </div>
      ) : (
        <div className="space-y-2">
          {reminders.map((r) => (
            <div
              key={r.id}
              className={cn(
                "flex items-center gap-3 p-2 rounded-lg border transition-colors",
                r.completed ? "bg-muted/50 opacity-60" : "bg-card"
              )}
            >
              <Checkbox
                checked={r.completed}
                onCheckedChange={(checked) =>
                  toggleComplete.mutate({ id: r.id, completed: !!checked })
                }
              />
              <span className={cn(
                "flex-1 text-sm",
                r.completed && "line-through text-muted-foreground"
              )}>
                {r.reminder_text}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={() => deleteReminder.mutate(r.id)}
              >
                <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
