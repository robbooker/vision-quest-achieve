import { useState, useEffect } from 'react';
import { Check, Edit3, Target, Milestone, Zap, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import type { ExtractedGoal } from '@/hooks/useGoalInterview';

interface GoalProposalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal: ExtractedGoal | null;
  onApprove: (goal: ExtractedGoal) => void;
  onStartOver: () => void;
  isCreating?: boolean;
}

export function GoalProposalDialog({
  open,
  onOpenChange,
  goal,
  onApprove,
  onStartOver,
  isCreating = false,
}: GoalProposalDialogProps) {
  const [editedGoal, setEditedGoal] = useState<ExtractedGoal | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (goal) {
      setEditedGoal({ ...goal });
      setIsEditing(false);
    }
  }, [goal]);

  if (!editedGoal) return null;

  const handleApprove = () => {
    onApprove(editedGoal);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Goal Proposal
          </DialogTitle>
          <DialogDescription>
            Review and approve this goal structure, or edit before creating.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[50vh] pr-4">
          <div className="space-y-4">
            {/* Goal Title & Target */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Goal</Label>
              {isEditing ? (
                <Input
                  value={editedGoal.title}
                  onChange={(e) => setEditedGoal({ ...editedGoal, title: e.target.value })}
                  className="font-medium"
                />
              ) : (
                <p className="font-medium text-foreground">{editedGoal.title}</p>
              )}
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  Target: {editedGoal.target_value} {editedGoal.metric_type}
                </Badge>
              </div>
            </div>

            <Separator />

            {/* Why */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Why This Matters</Label>
              {isEditing ? (
                <Textarea
                  value={editedGoal.why}
                  onChange={(e) => setEditedGoal({ ...editedGoal, why: e.target.value })}
                  className="min-h-[60px]"
                />
              ) : (
                <p className="text-sm text-muted-foreground">{editedGoal.why}</p>
              )}
            </div>

            {/* Milestones */}
            {editedGoal.milestones && editedGoal.milestones.length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                    <Milestone className="h-3 w-3" />
                    Milestones
                  </Label>
                  <div className="space-y-2">
                    {editedGoal.milestones.map((milestone, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-muted/50 rounded-lg text-sm"
                      >
                        <span className="font-medium">Week {milestone.week_number}</span>
                        <span className="text-muted-foreground">
                          {milestone.target_value} {editedGoal.metric_type}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Tactics */}
            {editedGoal.tactics && editedGoal.tactics.length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    Weekly Tactics
                  </Label>
                  <div className="space-y-2">
                    {editedGoal.tactics.map((tactic, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-muted/50 rounded-lg text-sm"
                      >
                        <span>{tactic.title}</span>
                        <Badge variant="outline" className="text-xs">
                          {tactic.target_count}x {tactic.frequency}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <div className="flex gap-2 flex-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onStartOver}
              className="flex-1 sm:flex-none"
            >
              <X className="h-4 w-4 mr-1" />
              Start Over
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
              className="flex-1 sm:flex-none"
            >
              <Edit3 className="h-4 w-4 mr-1" />
              {isEditing ? 'Done Editing' : 'Edit'}
            </Button>
          </div>
          <Button onClick={handleApprove} disabled={isCreating} className="flex-1 sm:flex-none">
            {isCreating ? (
              'Creating...'
            ) : (
              <>
                <Check className="h-4 w-4 mr-1" />
                Create Goal
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
