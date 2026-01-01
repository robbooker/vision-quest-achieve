import { useState } from 'react';
import { Goal } from '@/hooks/useGoals';
import { useTactics, Tactic, CreateTacticInput } from '@/hooks/useTactics';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TacticCard } from './TacticCard';
import { TacticForm } from './TacticForm';
import { Plus, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TacticsManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal: Goal;
}

export function TacticsManagerDialog({ open, onOpenChange, goal }: TacticsManagerDialogProps) {
  const { tactics, isLoading, createTactic, updateTactic, deleteTactic } = useTactics(goal.id);
  const [showForm, setShowForm] = useState(false);
  const [editingTactic, setEditingTactic] = useState<Tactic | null>(null);
  const { toast } = useToast();

  const handleCreate = async (data: CreateTacticInput) => {
    try {
      await createTactic.mutateAsync({ ...data, goal_id: goal.id });
      setShowForm(false);
      toast({ title: 'Tactic added', description: 'Your new tactic has been created.' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to create tactic.', variant: 'destructive' });
    }
  };

  const handleUpdate = async (data: Partial<Tactic> & { id: string }) => {
    try {
      await updateTactic.mutateAsync(data);
      setEditingTactic(null);
      toast({ title: 'Tactic updated' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update tactic.', variant: 'destructive' });
    }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    try {
      await updateTactic.mutateAsync({ id, is_active: isActive });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to toggle tactic.', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTactic.mutateAsync(id);
      toast({ title: 'Tactic deleted' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete tactic.', variant: 'destructive' });
    }
  };

  const handleFormSubmit = (data: CreateTacticInput | Partial<Tactic>) => {
    if (editingTactic) {
      handleUpdate(data as Partial<Tactic> & { id: string });
    } else {
      handleCreate(data as CreateTacticInput);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingTactic(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Manage Tactics
          </DialogTitle>
          <DialogDescription>
            Tactics for: {goal.title}
          </DialogDescription>
        </DialogHeader>

        {showForm || editingTactic ? (
          <TacticForm
            tactic={editingTactic ?? undefined}
            onSubmit={handleFormSubmit}
            onCancel={handleCancel}
            isLoading={createTactic.isPending || updateTactic.isPending}
          />
        ) : (
          <div className="space-y-4">
            <Button onClick={() => setShowForm(true)} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Tactic
            </Button>

            {isLoading ? (
              <p className="text-center text-muted-foreground py-4">Loading tactics...</p>
            ) : tactics.length === 0 ? (
              <div className="text-center py-8 space-y-2">
                <Zap className="h-10 w-10 mx-auto text-muted-foreground/50" />
                <p className="text-muted-foreground">No tactics yet</p>
                <p className="text-xs text-muted-foreground">
                  Add daily or weekly habits to build momentum
                </p>
              </div>
            ) : (
              <ScrollArea className="max-h-[400px]">
                <div className="space-y-2 pr-4">
                  {tactics.map((tactic) => (
                    <TacticCard
                      key={tactic.id}
                      tactic={tactic}
                      onToggle={handleToggle}
                      onEdit={setEditingTactic}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
