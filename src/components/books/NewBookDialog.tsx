import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { useBooks } from "@/hooks/useBooks";
import { useTerminalMode } from "@/hooks/useTerminalMode";

export const NewBookDialog = () => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [yearPublished, setYearPublished] = useState("");
  const [startedAt, setStartedAt] = useState(new Date().toISOString().split('T')[0]);
  
  const { createBook } = useBooks();
  const { isTerminal } = useTerminalMode();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !author.trim()) return;

    createBook.mutate({
      title: title.trim(),
      author: author.trim(),
      year_published: yearPublished ? parseInt(yearPublished) : null,
      started_at: startedAt,
    });

    setTitle("");
    setAuthor("");
    setYearPublished("");
    setStartedAt(new Date().toISOString().split('T')[0]);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          {isTerminal ? "NEW INTEL FILE" : "New Record"}
        </Button>
      </DialogTrigger>
      <DialogContent className="goal-card">
        <DialogHeader>
          <DialogTitle className="font-mono text-lg">
            {isTerminal ? "// NEW INTEL FILE" : "File New Record"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="font-mono text-xs uppercase tracking-wider">
              Title
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter book title..."
              className="font-mono"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="author" className="font-mono text-xs uppercase tracking-wider">
              Author
            </Label>
            <Input
              id="author"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Enter author name..."
              className="font-mono"
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="year" className="font-mono text-xs uppercase tracking-wider">
                Year Published
              </Label>
              <Input
                id="year"
                type="number"
                value={yearPublished}
                onChange={(e) => setYearPublished(e.target.value)}
                placeholder="1984"
                className="font-mono"
                min="1000"
                max={new Date().getFullYear()}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="started" className="font-mono text-xs uppercase tracking-wider">
                Start Date
              </Label>
              <Input
                id="started"
                type="date"
                value={startedAt}
                onChange={(e) => setStartedAt(e.target.value)}
                className="font-mono"
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full font-mono uppercase tracking-wider"
            disabled={createBook.isPending || !title.trim() || !author.trim()}
          >
            {createBook.isPending ? "Filing..." : isTerminal ? "COMMIT FILE" : "File Record"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
