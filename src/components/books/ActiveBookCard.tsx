import { useState, useEffect, useCallback } from "react";
import { Book, useBooks } from "@/hooks/useBooks";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { BookOpen, Check } from "lucide-react";
import { useTerminalMode } from "@/hooks/useTerminalMode";
import { FinalSettlementDialog } from "./FinalSettlementDialog";

interface ActiveBookCardProps {
  book: Book;
}

export const ActiveBookCard = ({ book }: ActiveBookCardProps) => {
  const [notes, setNotes] = useState(book.notes || "");
  const [showSettlement, setShowSettlement] = useState(false);
  const { updateBook } = useBooks();
  const { isTerminal } = useTerminalMode();

  // Debounced auto-save
  useEffect(() => {
    const timer = setTimeout(() => {
      if (notes !== book.notes) {
        updateBook.mutate({ id: book.id, notes });
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [notes, book.id, book.notes, updateBook]);

  const handleBlur = useCallback(() => {
    if (notes !== book.notes) {
      updateBook.mutate({ id: book.id, notes });
    }
  }, [notes, book.id, book.notes, updateBook]);

  return (
    <>
      <div className="goal-card p-4 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <BookOpen className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div className="min-w-0">
              <h3 className="font-mono font-semibold text-foreground leading-tight">
                {book.title}
              </h3>
              <p className="text-sm text-muted-foreground font-mono">
                {book.author}
                {book.year_published && ` (${book.year_published})`}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Started: {new Date(book.started_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSettlement(true)}
            className="shrink-0 gap-2 font-mono text-xs uppercase"
          >
            <Check className="h-3 w-3" />
            {isTerminal ? "FILE COMPLETE" : "Close File"}
          </Button>
        </div>

        {/* Yellow Legal Pad Notes Area */}
        <div className="legal-pad-container">
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={handleBlur}
            placeholder={isTerminal ? "// Enter operational notes..." : "Your reading notes..."}
            className="legal-pad min-h-[200px] resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>
      </div>

      <FinalSettlementDialog
        book={book}
        open={showSettlement}
        onOpenChange={setShowSettlement}
      />
    </>
  );
};
