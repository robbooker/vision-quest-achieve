import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { BookOpen, Library } from "lucide-react";
import { useBooks } from "@/hooks/useBooks";
import { useTerminalMode } from "@/hooks/useTerminalMode";
import { NewBookDialog } from "@/components/books/NewBookDialog";
import { ActiveBookCard } from "@/components/books/ActiveBookCard";
import { ArchivedBookCard } from "@/components/books/ArchivedBookCard";
import { Skeleton } from "@/components/ui/skeleton";

const Books = () => {
  const { activeBooks, archivedBooks, isLoading } = useBooks();
  const { isTerminal } = useTerminalMode();

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold font-mono">
              {isTerminal ? "INTEL ARCHIVES" : "Book Dossier"}
            </h1>
          </div>
          <NewBookDialog />
        </div>

        {/* Currently Reading Section */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold font-mono flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            {isTerminal ? "ACTIVE INTEL" : "Currently Reading"}
          </h2>

          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-64 w-full" />
            </div>
          ) : activeBooks.length === 0 ? (
            <div className="goal-card p-8 text-center">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground font-mono">
                {isTerminal 
                  ? "// No active intel files" 
                  : "No books in progress"}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Click "New Record" to start tracking a book
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeBooks.map((book) => (
                <ActiveBookCard key={book.id} book={book} />
              ))}
            </div>
          )}
        </section>

        {/* The Archive Section */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold font-mono flex items-center gap-2">
            <Library className="h-4 w-4" />
            {isTerminal ? "CLASSIFIED FILES" : "The Archive"}
            {archivedBooks.length > 0 && (
              <span className="text-sm font-normal text-muted-foreground">
                ({archivedBooks.length})
              </span>
            )}
          </h2>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-40 w-full" />
              ))}
            </div>
          ) : archivedBooks.length === 0 ? (
            <div className="goal-card p-8 text-center">
              <Library className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground font-mono">
                {isTerminal 
                  ? "// Archive empty" 
                  : "No finished books yet"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {archivedBooks.map((book) => (
                <ArchivedBookCard key={book.id} book={book} />
              ))}
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
};

export default Books;
