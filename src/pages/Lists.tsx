import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { useLists, useList } from "@/hooks/useLists";
import { ListCard } from "@/components/lists/ListCard";
import { ListDetail } from "@/components/lists/ListDetail";
import { CreateListDialog } from "@/components/lists/CreateListDialog";
import { Plus, List } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Lists() {
  const { lists, isLoading, createList, deleteList, updateList } = useLists();
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const { data: selectedList } = useList(selectedListId || undefined);

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

  return (
    <DashboardLayout>
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
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <List className="h-6 w-6 text-primary" />
                </div>
                <h1 className="text-2xl font-bold">Lists</h1>
              </div>
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-1" />
                New List
              </Button>
            </div>

            {/* Lists grid */}
            {isLoading ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-24" />
                ))}
              </div>
            ) : lists.length === 0 ? (
              <div className="text-center py-12">
                <div className="p-4 rounded-full bg-muted inline-block mb-4">
                  <List className="h-8 w-8 text-muted-foreground" />
                </div>
                <h2 className="text-lg font-medium mb-2">No lists yet</h2>
                <p className="text-muted-foreground mb-4">
                  Create your first list to get started
                </p>
                <Button onClick={() => setCreateOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Create List
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {lists.map((list) => (
                  <ListCard
                    key={list.id}
                    list={list}
                    onClick={() => setSelectedListId(list.id)}
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
