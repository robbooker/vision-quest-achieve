import { useState } from "react";
import { Book } from "@/hooks/useBooks";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTerminalMode } from "@/hooks/useTerminalMode";
import { useBooks } from "@/hooks/useBooks";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ArchivedBookCardProps {
  book: Book;
}

export const ArchivedBookCard = ({ book }: ArchivedBookCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const { isTerminal } = useTerminalMode();
  const { deleteBook } = useBooks();

  return (
    <div className="goal-card p-4 space-y-3 font-mono">
      {/* Header with ranking */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground leading-tight typewriter-text">
            {book.title}
          </h3>
          <p className="text-sm text-muted-foreground typewriter-text">
            {book.author}
            {book.year_published && ` (${book.year_published})`}
          </p>
        </div>
        
        {/* Nixie-style ranking display */}
        {book.ranking && (
          <div className="nixie-display w-10 h-10 flex items-center justify-center rounded-md bg-background/50 border border-border shrink-0">
            <span className="text-xl font-bold text-nixie-glow">
              {book.ranking}
            </span>
          </div>
        )}
      </div>

      {/* Dates */}
      <div className="text-xs text-muted-foreground flex gap-4">
        <span>Started: {new Date(book.started_at).toLocaleDateString()}</span>
        {book.finished_at && (
          <span>Finished: {new Date(book.finished_at).toLocaleDateString()}</span>
        )}
      </div>

      {/* Expand/Collapse button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setExpanded(!expanded)}
        className="w-full justify-between text-xs uppercase tracking-wider"
      >
        {expanded ? "Hide Details" : "View Details"}
        {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </Button>

      {/* Expanded content */}
      {expanded && (
        <div className="space-y-4 pt-2 border-t border-border">
          {/* Notes */}
          {book.notes && (
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Notes
              </p>
              <p className="text-sm whitespace-pre-wrap typewriter-text">
                {book.notes}
              </p>
            </div>
          )}

          {/* Operational Change */}
          {book.operational_change && (
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wider text-primary">
                {isTerminal ? "DIRECTIVE MODIFICATION" : "Operational Change"}
              </p>
              <p className="text-sm whitespace-pre-wrap typewriter-text italic">
                {book.operational_change}
              </p>
            </div>
          )}

          {/* Delete button */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                <Trash2 className="h-3 w-3 mr-2" />
                Delete Record
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Book Record?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete "{book.title}" from your archive.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteBook.mutate(book.id)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  );
};
