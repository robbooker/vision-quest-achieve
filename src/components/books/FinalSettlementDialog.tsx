import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Book, useBooks } from "@/hooks/useBooks";
import { useTerminalMode } from "@/hooks/useTerminalMode";

interface FinalSettlementDialogProps {
  book: Book;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const FinalSettlementDialog = ({ book, open, onOpenChange }: FinalSettlementDialogProps) => {
  const [ranking, setRanking] = useState(7);
  const [operationalChange, setOperationalChange] = useState("");
  const { archiveBook } = useBooks();
  const { isTerminal } = useTerminalMode();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!operationalChange.trim()) return;

    archiveBook.mutate({
      id: book.id,
      ranking,
      operational_change: operationalChange.trim(),
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="goal-card sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-mono text-lg">
            {isTerminal ? "// FINAL SETTLEMENT" : "Final Settlement"}
          </DialogTitle>
          <DialogDescription className="font-mono text-sm">
            {book.title} by {book.author}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Ranking Section */}
          <div className="space-y-3">
            <Label className="font-mono text-xs uppercase tracking-wider">
              {isTerminal ? "PRIORITY LEVEL" : "Ranking"}
            </Label>
            <div className="flex items-center gap-4">
              <Slider
                value={[ranking]}
                onValueChange={(v) => setRanking(v[0])}
                min={1}
                max={10}
                step={1}
                className="flex-1"
              />
              <div className="nixie-display w-12 h-12 flex items-center justify-center rounded-md bg-background/50 border border-border">
                <span className="font-mono text-2xl font-bold text-nixie-glow">
                  {ranking}
                </span>
              </div>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground font-mono">
              <span>1</span>
              <span>5</span>
              <span>10</span>
            </div>
          </div>

          {/* Operational Change Section */}
          <div className="space-y-2">
            <Label className="font-mono text-xs uppercase tracking-wider">
              {isTerminal ? "DIRECTIVE MODIFICATION" : "Operational Change"}
            </Label>
            <p className="text-xs text-muted-foreground italic">
              What will you do differently because of this book?
            </p>
            <Textarea
              value={operationalChange}
              onChange={(e) => setOperationalChange(e.target.value)}
              placeholder={isTerminal 
                ? "// Document behavioral modifications..." 
                : "I will..."
              }
              className="font-mono min-h-[100px]"
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full font-mono uppercase tracking-wider"
            disabled={archiveBook.isPending || !operationalChange.trim()}
          >
            {archiveBook.isPending ? "Archiving..." : isTerminal ? "ARCHIVE FILE" : "Archive"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
