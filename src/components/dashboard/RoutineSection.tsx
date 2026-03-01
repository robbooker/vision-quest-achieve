import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useRoutines } from '@/hooks/useRoutines';
import { Sun, Moon, Plus, CheckCircle2, Circle, Trash2, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface RoutineBlockProps {
  type: 'morning' | 'evening';
  items: ReturnType<typeof useRoutines>['morningItems'];
  isItemCompleted: (id: string) => boolean;
  completionCount: number;
  onToggle: (id: string) => void;
  onAdd: (title: string) => void;
  onDelete: (id: string) => void;
  isAdding: boolean;
}

function RoutineBlock({ type, items, isItemCompleted, completionCount, onToggle, onAdd, onDelete, isAdding }: RoutineBlockProps) {
  const [showInput, setShowInput] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const icon = type === 'morning' ? <Sun className="h-4 w-4 text-amber-500" /> : <Moon className="h-4 w-4 text-indigo-400" />;
  const label = type === 'morning' ? 'Morning Routine' : 'Evening Routine';
  const total = items.length;

  const handleAdd = () => {
    if (!newTitle.trim()) return;
    onAdd(newTitle.trim());
    setNewTitle('');
    setShowInput(false);
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between">
          <span className="flex items-center gap-2">
            {icon}
            {label}
            {total > 0 && (
              <Badge variant="secondary" className="text-xs">
                {completionCount}/{total}
              </Badge>
            )}
          </span>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowInput(!showInput)}>
            {showInput ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {showInput && (
          <form
            className="flex gap-2"
            onSubmit={(e) => { e.preventDefault(); handleAdd(); }}
          >
            <Input
              placeholder="Add step..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              autoFocus
              className="h-8 text-sm"
            />
            <Button size="sm" type="submit" disabled={!newTitle.trim() || isAdding} className="h-8">
              Add
            </Button>
          </form>
        )}

        {items.length === 0 && !showInput && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No steps yet — tap + to add one
          </p>
        )}

        {items.map(item => {
          const done = isItemCompleted(item.id);
          return (
            <div
              key={item.id}
              className={`flex items-center gap-3 p-2.5 rounded-lg border transition-colors ${
                done ? 'bg-primary/5 border-primary/20' : 'hover:bg-muted/50'
              }`}
            >
              <button onClick={() => onToggle(item.id)} className="flex-shrink-0">
                {done ? (
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground hover:text-primary" />
                )}
              </button>
              <span className={`flex-1 text-sm ${done ? 'line-through text-muted-foreground' : ''}`}>
                {item.title}
              </span>
              <button
                onClick={() => onDelete(item.id)}
                className="opacity-0 group-hover:opacity-100 hover:text-destructive text-muted-foreground"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

export function RoutineSection() {
  const {
    morningItems,
    eveningItems,
    isItemCompleted,
    completionCount,
    addItem,
    deleteItem,
    toggleLog,
  } = useRoutines();
  const { toast } = useToast();

  const handleAdd = (title: string, routineType: 'morning' | 'evening') => {
    addItem.mutate({ title, routineType }, {
      onSuccess: () => toast({ title: 'Step added' }),
      onError: () => toast({ title: 'Error adding step', variant: 'destructive' }),
    });
  };

  const handleDelete = (id: string) => {
    deleteItem.mutate(id);
  };

  const handleToggle = (id: string) => {
    toggleLog.mutate(id);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <RoutineBlock
        type="morning"
        items={morningItems}
        isItemCompleted={isItemCompleted}
        completionCount={completionCount('morning')}
        onToggle={handleToggle}
        onAdd={(title) => handleAdd(title, 'morning')}
        onDelete={handleDelete}
        isAdding={addItem.isPending}
      />
      <RoutineBlock
        type="evening"
        items={eveningItems}
        isItemCompleted={isItemCompleted}
        completionCount={completionCount('evening')}
        onToggle={handleToggle}
        onAdd={(title) => handleAdd(title, 'evening')}
        onDelete={handleDelete}
        isAdding={addItem.isPending}
      />
    </div>
  );
}
