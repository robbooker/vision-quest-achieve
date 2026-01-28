import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { List as ListType } from "@/hooks/useLists";
import { Share2, Lock, Hexagon, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { useNoteHasUpdates } from "@/hooks/useSharedNotesRealtime";

interface ListCardProps {
  list: ListType;
  onClick: () => void;
}

const PILLAR_LABELS: Record<string, string> = {
  physical: "Physical",
  relations: "Relations",
  income: "Income",
  mental: "Mental",
  excellence: "Excellence",
  direction: "Direction",
};

export function ListCard({ list, onClick }: ListCardProps) {
  const isShared = (list.share_count || 0) > 0;
  const hasUpdates = useNoteHasUpdates(list.id);

  return (
    <Card 
      className="cursor-pointer hover:shadow-md hover:border-primary/30 transition-all group relative"
      onClick={onClick}
    >
      {/* Update indicator badge */}
      {hasUpdates && (
        <div className="absolute -top-1 -right-1 z-10">
          <Badge className="bg-primary text-primary-foreground text-xs px-1.5 py-0.5 gap-1 animate-pulse">
            <Sparkles className="h-3 w-3" />
            Updated
          </Badge>
        </div>
      )}
      
      <CardContent className="p-4">
        {/* Title */}
        <h3 className="font-semibold text-base group-hover:text-primary transition-colors line-clamp-1">
          {list.title}
        </h3>

        {/* Preview text / description */}
        {list.description ? (
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            {list.description}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground mt-1 italic">
            {list.item_count || 0} {(list.item_count || 0) === 1 ? "entry" : "entries"}
          </p>
        )}

        {/* Footer with metadata */}
        <div className="flex items-center justify-between mt-3 pt-2 border-t">
          <div className="flex items-center gap-2">
            {/* Date */}
            <span className="text-xs text-muted-foreground">
              {format(new Date(list.updated_at || list.created_at), "MMM d")}
            </span>

            {/* Shared indicator */}
            {isShared ? (
              <Badge variant="secondary" className="text-xs h-5 px-1.5 gap-0.5">
                <Share2 className="h-2.5 w-2.5" />
                {list.share_count}
              </Badge>
            ) : (
              <Lock className="h-3 w-3 text-muted-foreground" />
            )}
          </div>

          {/* Pillar badge */}
          {list.pillar && (
            <Badge variant="outline" className="text-xs h-5 px-1.5 gap-0.5">
              <Hexagon className="h-2.5 w-2.5" />
              {PILLAR_LABELS[list.pillar]?.charAt(0) || list.pillar.charAt(0).toUpperCase()}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}