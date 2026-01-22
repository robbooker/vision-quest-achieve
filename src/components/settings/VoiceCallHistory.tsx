import { useState } from "react";
import { format } from "date-fns";
import { Phone, Clock, CheckCircle, Plus, Trash2, ChevronDown, ChevronUp, MessageSquare } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useVoiceCallLogs, VoiceCallLog } from "@/hooks/useVoiceCallLogs";
import { toast } from "sonner";

function CallLogCard({ log, onDelete }: { log: VoiceCallLog; onDelete: (id: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);

  const duration = log.call_ended_at
    ? Math.round((new Date(log.call_ended_at).getTime() - new Date(log.call_started_at).getTime()) / 1000 / 60)
    : null;

  const handleDelete = async () => {
    try {
      await onDelete(log.id);
      toast.success("Call log deleted");
    } catch {
      toast.error("Failed to delete call log");
    }
  };

  return (
    <Card className="mb-4">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10">
                  <Phone className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">
                    {format(new Date(log.call_started_at), "MMM d, yyyy 'at' h:mm a")}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-1">
                    {log.caller_number && (
                      <span>{log.caller_number}</span>
                    )}
                    {duration !== null && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {duration} min
                      </span>
                    )}
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {log.tasks_created?.length > 0 && (
                  <Badge variant="secondary" className="gap-1">
                    <Plus className="h-3 w-3" />
                    {log.tasks_created.length} created
                  </Badge>
                )}
                {log.tasks_completed?.length > 0 && (
                  <Badge variant="secondary" className="gap-1">
                    <CheckCircle className="h-3 w-3" />
                    {log.tasks_completed.length} completed
                  </Badge>
                )}
                <Badge variant="outline" className="gap-1">
                  <MessageSquare className="h-3 w-3" />
                  {log.messages?.length || 0}
                </Badge>
                {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="space-y-4">
              {/* Conversation transcript */}
              {log.messages && log.messages.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm mb-2 text-muted-foreground">Conversation</h4>
                  <ScrollArea className="h-[300px] rounded-lg border p-4">
                    <div className="space-y-3">
                      {log.messages.map((message, index) => (
                        <div
                          key={index}
                          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                              message.role === 'user'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            }`}
                          >
                            <p>{message.content}</p>
                            <p className="text-xs opacity-60 mt-1">
                              {format(new Date(message.timestamp), "h:mm a")}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}

              {/* Tasks created during call */}
              {log.tasks_created && log.tasks_created.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm mb-2 text-muted-foreground flex items-center gap-1">
                    <Plus className="h-4 w-4" />
                    Tasks Created
                  </h4>
                  <ul className="space-y-1">
                    {log.tasks_created.map((task, index) => (
                      <li key={index} className="text-sm flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                        {task.title}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Tasks completed during call */}
              {log.tasks_completed && log.tasks_completed.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm mb-2 text-muted-foreground flex items-center gap-1">
                    <CheckCircle className="h-4 w-4" />
                    Tasks Completed
                  </h4>
                  <ul className="space-y-1">
                    {log.tasks_completed.map((task, index) => (
                      <li key={index} className="text-sm flex items-center gap-2 line-through text-muted-foreground">
                        <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
                        {task.title}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Delete button */}
              <div className="flex justify-end pt-2 border-t">
                <Button variant="ghost" size="sm" onClick={handleDelete} className="text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

export function VoiceCallHistory() {
  const { callLogs, isLoading, deleteCallLog } = useVoiceCallLogs();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Voice Call History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">Loading call history...</div>
        </CardContent>
      </Card>
    );
  }

  if (!callLogs.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Voice Call History
          </CardTitle>
          <CardDescription>
            View transcripts and actions from your phone calls with Groovy Planning
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Phone className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>No call history yet</p>
            <p className="text-sm mt-1">Call your Groovy Planning number to get started</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Phone className="h-5 w-5" />
          Voice Call History
        </h2>
        <Badge variant="outline">{callLogs.length} calls</Badge>
      </div>
      <div>
        {callLogs.map((log) => (
          <CallLogCard key={log.id} log={log} onDelete={deleteCallLog} />
        ))}
      </div>
    </div>
  );
}
