import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useGoals } from "@/hooks/useGoals";
import { useCycles } from "@/hooks/useCycles";

const PILLARS = [
  { value: "physical", label: "Physical" },
  { value: "relations", label: "Relations" },
  { value: "income", label: "Income" },
  { value: "mental", label: "Mental" },
  { value: "excellence", label: "Excellence" },
  { value: "direction", label: "Direction" },
];

interface CreateListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (data: { 
    title: string; 
    description?: string;
    pillar?: string;
    goal_id?: string;
  }) => Promise<void>;
  isLoading?: boolean;
}

export function CreateListDialog({ open, onOpenChange, onCreate, isLoading }: CreateListDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [pillar, setPillar] = useState<string>("");
  const [goalId, setGoalId] = useState<string>("");

  const { getActiveCycle } = useCycles();
  const activeCycle = getActiveCycle();
  const { goals } = useGoals(activeCycle?.id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    await onCreate({ 
      title: title.trim(), 
      description: description.trim() || undefined,
      pillar: pillar || undefined,
      goal_id: goalId || undefined,
    });
    
    setTitle("");
    setDescription("");
    setPillar("");
    setGoalId("");
    onOpenChange(false);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setTitle("");
      setDescription("");
      setPillar("");
      setGoalId("");
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create new list</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="My List"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this list for?"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>PRIMED Pillar (optional)</Label>
            <Select value={pillar} onValueChange={setPillar}>
              <SelectTrigger>
                <SelectValue placeholder="Select a pillar..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {PILLARS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {goals.length > 0 && (
            <div className="space-y-2">
              <Label>Link to Goal (optional)</Label>
              <Select value={goalId} onValueChange={setGoalId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a goal..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {goals.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !title.trim()}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Create
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
