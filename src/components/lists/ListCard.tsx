import { Card, CardContent } from "@/components/ui/card";
import { List as ListType } from "@/hooks/useLists";
import { List, Share2, Lock } from "lucide-react";

interface ListCardProps {
  list: ListType;
  onClick: () => void;
}

export function ListCard({ list, onClick }: ListCardProps) {
  return (
    <Card 
      className="cursor-pointer hover:bg-accent/50 transition-colors"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <List className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium truncate">{list.title}</h3>
            {list.description && (
              <p className="text-sm text-muted-foreground truncate mt-0.5">
                {list.description}
              </p>
            )}
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              <span>{list.item_count || 0} items</span>
              {(list.share_count || 0) > 0 ? (
                <span className="flex items-center gap-1">
                  <Share2 className="h-3 w-3" />
                  Shared with {list.share_count}
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <Lock className="h-3 w-3" />
                  Private
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
