import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Clock } from 'lucide-react';
import type { ArenaConversation } from '@/hooks/useAIArena';

interface ArenaHistoryProps {
  conversations: ArenaConversation[];
  isLoading: boolean;
  onSelect: (conversation: ArenaConversation) => void;
}

export function ArenaHistory({ conversations, isLoading, onSelect }: ArenaHistoryProps) {
  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader className="py-3">
          <CardTitle className="text-sm">Past Debates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="py-3 shrink-0">
        <CardTitle className="text-sm flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Past Debates
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0 overflow-hidden">
        <ScrollArea className="h-full px-4 pb-4">
          {conversations?.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No debates yet. Start one above!
            </p>
          ) : (
            <div className="space-y-2">
              {conversations?.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => onSelect(conv)}
                  className="w-full text-left p-3 rounded-lg border hover:bg-accent transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-sm font-medium line-clamp-2">
                      {conv.topic}
                    </p>
                    <Badge
                      variant={conv.status === 'active' ? 'default' : 'secondary'}
                      className="shrink-0 text-xs"
                    >
                      {conv.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      {conv.turn_count} turns
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(conv.created_at), { addSuffix: true })}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
