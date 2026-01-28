import { useParams } from "react-router-dom";
import { usePublicListByToken } from "@/hooks/useListShares";
import { ListItemComponent } from "@/components/lists/ListItem";
import { List, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function PublicListView() {
  const { token } = useParams<{ token: string }>();
  const { data, isLoading, error } = usePublicListByToken(token);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="p-4 rounded-full bg-muted inline-block mb-4">
            <List className="h-8 w-8 text-muted-foreground" />
          </div>
          <h1 className="text-xl font-semibold mb-2">List not found</h1>
          <p className="text-muted-foreground">
            This list may have been deleted or the link is invalid.
          </p>
        </div>
      </div>
    );
  }

  const { list, items } = data;

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <List className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">{list.title}</h1>
                {list.description && (
                  <p className="text-sm text-muted-foreground">{list.description}</p>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                This list is empty.
              </p>
            ) : (
              <div className="space-y-2">
                {items.map((item) => (
                  <ListItemComponent
                    key={item.id}
                    item={item}
                    onToggle={() => {}}
                    onDelete={() => {}}
                    onUpdate={() => {}}
                    readOnly
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Shared via Goal Planner
        </p>
      </div>
    </div>
  );
}
