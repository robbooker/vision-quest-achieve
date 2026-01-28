import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { List as ListType } from "@/hooks/useLists";
import { FileText, Share2, Lock, Target, Timer, Hexagon } from "lucide-react";

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
  return (
    <Card 
      className="cursor-pointer hover:bg-accent/50 transition-colors"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium truncate">{list.title}</h3>
            {list.description && (
              <p className="text-sm text-muted-foreground truncate mt-0.5">
                {list.description}
              </p>
            )}

            {/* Relationship badges */}
            {(list.pillar || list.goal_id || list.focus_session_id) && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {list.pillar && (
                  <Badge variant="secondary" className="text-xs gap-1">
                    <Hexagon className="h-3 w-3" />
                    {PILLAR_LABELS[list.pillar] || list.pillar}
                  </Badge>
                )}
                {list.goal_id && list.goal_title && (
                  <Badge variant="outline" className="text-xs gap-1">
                    <Target className="h-3 w-3" />
                    {list.goal_title}
                  </Badge>
                )}
                {list.focus_session_id && list.focus_objective && (
                  <Badge variant="outline" className="text-xs gap-1">
                    <Timer className="h-3 w-3" />
                    {list.focus_objective}
                  </Badge>
                )}
              </div>
            )}

            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              <span>{list.item_count || 0} notes</span>
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
