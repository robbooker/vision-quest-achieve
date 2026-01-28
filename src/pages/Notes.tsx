import { useState, useCallback } from "react";
import { Helmet } from "react-helmet-async";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { useLists, useList } from "@/hooks/useLists";
import { ListCard } from "@/components/lists/ListCard";
import { ListDetail } from "@/components/lists/ListDetail";
import { CreateListDialog } from "@/components/lists/CreateListDialog";
import { Plus, FileText, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { useSharedNotesRealtime, markNoteAsViewed } from "@/hooks/useSharedNotesRealtime";
import { useToastNotification } from "@/components/notifications/ToastProvider";

export default function Notes() {
  const { lists, isLoading, createList, deleteList, updateList } = useLists();
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const { showToast } = useToastNotification();
  
  // Hook up realtime notifications for shared notes
  const handleToast = useCallback((notification: { title: string; message: string; type: string }) => {
    showToast(notification);
  }, [showToast]);
  
  useSharedNotesRealtime(handleToast);

  const { data: selectedList } = useList(selectedListId || undefined);

  const filteredLists = lists.filter(list => 
    list.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    list.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = async (data: { title: string; description?: string }) => {
    await createList.mutateAsync(data);
  };

  const handleDelete = async () => {
    if (selectedListId) {
      await deleteList.mutateAsync(selectedListId);
      setSelectedListId(null);
    }
  };

  const handleUpdateTitle = (title: string) => {
    if (selectedListId) {
      updateList.mutate({ id: selectedListId, title });
    }
  };

  const handleSelectNote = (listId: string) => {
    markNoteAsViewed(listId);
    setSelectedListId(listId);
  };

  return (
    <DashboardLayout>
      <Helmet>
        <title>Notes | Groovy Planning</title>
        <meta name="description" content="Capture thoughts, ideas, and notes organized by your goals and pillars" />
      </Helmet>

      <div className="container max-w-4xl py-6">
        {selectedList ? (
          <ListDetail
            list={selectedList}
            onBack={() => setSelectedListId(null)}
            onDelete={handleDelete}
            onUpdateTitle={handleUpdateTitle}
          />
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold">Notes</h1>
              <Button onClick={() => setCreateOpen(true)} size="sm">
                <Plus className="h-4 w-4 mr-1" />
                New Note
              </Button>
            </div>

            {/* Search bar */}
            {lists.length > 0 && (
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            )}

            {/* Notes grid */}
            {isLoading ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className="h-28" />
                ))}
              </div>
            ) : lists.length === 0 ? (
              <div className="text-center py-16">
                <div className="p-4 rounded-full bg-muted inline-block mb-4">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
                <h2 className="text-lg font-medium mb-2">No notes yet</h2>
                <p className="text-muted-foreground mb-4 max-w-sm mx-auto">
                  Create notes to capture your thoughts, ideas, and learnings. Link them to your goals for better organization.
                </p>
                <Button onClick={() => setCreateOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Create Your First Note
                </Button>
              </div>
            ) : filteredLists.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No notes match your search</p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {filteredLists.map((list) => (
                  <ListCard
                    key={list.id}
                    list={list}
                    onClick={() => handleSelectNote(list.id)}
                  />
                ))}
              </div>
            )}

            {/* Create dialog */}
            <CreateListDialog
              open={createOpen}
              onOpenChange={setCreateOpen}
              onCreate={handleCreate}
              isLoading={createList.isPending}
            />
          </>
        )}
      </div>
    </DashboardLayout>
  );
}