import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Trash2, Sparkles, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useGoalCoach, ChatMessage } from '@/hooks/useGoalCoach';
import { useGoals } from '@/hooks/useGoals';
import { useMilestones } from '@/hooks/useMilestones';
import { useTactics } from '@/hooks/useTactics';
import { cn } from '@/lib/utils';
import { InterviewMode } from './InterviewMode';
import { GoalProposalDialog } from './GoalProposalDialog';
import { toast } from 'sonner';
import type { ExtractedGoal } from '@/hooks/useGoalInterview';

interface GoalCoachChatProps {
  cycleId?: string;
}

function ChatMessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  
  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-4 py-2 text-sm',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-foreground'
        )}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
      </div>
    </div>
  );
}

export function GoalCoachChat({ cycleId }: GoalCoachChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [activeTab, setActiveTab] = useState<'chat' | 'interview'>('chat');
  const [showProposal, setShowProposal] = useState(false);
  const [proposedGoal, setProposedGoal] = useState<ExtractedGoal | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  
  const { messages, isLoading, error, sendMessage, clearChat } = useGoalCoach(cycleId);
  const { createGoal } = useGoals(cycleId);
  const { createMilestone } = useMilestones(cycleId);
  const { createTactic } = useTactics();
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current && activeTab === 'chat') {
      inputRef.current.focus();
    }
  }, [isOpen, activeTab]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage(input.trim());
    setInput('');
  };

  const handleInterviewComplete = (goal: ExtractedGoal) => {
    setProposedGoal(goal);
    setShowProposal(true);
  };

  const handleApproveGoal = async (goal: ExtractedGoal) => {
    if (!cycleId) {
      toast.error('No active cycle selected');
      return;
    }

    setIsCreating(true);
    try {
      // Create the goal
      const createdGoal = await createGoal.mutateAsync({
        cycle_id: cycleId,
        title: goal.title,
        target_value: goal.target_value,
        metric_type: goal.metric_type,
        why: goal.why,
      });

      // Create milestones
      if (goal.milestones?.length) {
        for (const milestone of goal.milestones) {
          await createMilestone.mutateAsync({
            goal_id: createdGoal.id,
            week_number: milestone.week_number,
            target_value: milestone.target_value,
            description: milestone.description,
          });
        }
      }

      // Create tactics
      if (goal.tactics?.length) {
        for (const tactic of goal.tactics) {
          await createTactic.mutateAsync({
            goal_id: createdGoal.id,
            title: tactic.title,
            frequency: tactic.frequency,
            target_count: tactic.target_count,
          });
        }
      }

      toast.success('Goal created with milestones and tactics!');
      setShowProposal(false);
      setProposedGoal(null);
      setActiveTab('chat');
    } catch (e) {
      console.error('Failed to create goal:', e);
      toast.error('Failed to create goal');
    } finally {
      setIsCreating(false);
    }
  };

  const quickPrompts = [
    "Help me define a clear goal",
    "Review my current goals",
    "Suggest tactics for my goals",
    "What obstacles should I anticipate?",
  ];

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className={cn(
          'fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50',
          'bg-primary hover:bg-primary/90',
          isOpen && 'hidden'
        )}
        size="icon"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>

      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-background border rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/50">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <div>
                <h3 className="font-semibold text-sm">Goal Coach</h3>
                <p className="text-xs text-muted-foreground">Your witty planning partner</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={clearChat} title="Clear chat">
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'chat' | 'interview')} className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-2 mx-4 mt-2" style={{ width: 'calc(100% - 2rem)' }}>
              <TabsTrigger value="chat">Chat</TabsTrigger>
              <TabsTrigger value="interview" className="flex items-center gap-1">
                <Mic className="h-3 w-3" />
                Interview
              </TabsTrigger>
            </TabsList>

            <TabsContent value="chat" className="flex-1 flex flex-col mt-0 data-[state=inactive]:hidden">
              <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                {messages.length === 0 ? (
                  <div className="space-y-4">
                    <div className="text-center text-muted-foreground text-sm py-4">
                      <Sparkles className="h-8 w-8 mx-auto mb-2 text-primary/50" />
                      <p className="font-medium">Hey there, goal-setter.</p>
                      <p className="text-xs mt-1">I'm here to help you plan with rigor and charm.</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground text-center">Quick starts:</p>
                      {quickPrompts.map((prompt) => (
                        <Button key={prompt} variant="outline" size="sm" className="w-full text-xs justify-start" onClick={() => sendMessage(prompt)} disabled={isLoading}>
                          {prompt}
                        </Button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {messages.map((msg, i) => (
                      <ChatMessageBubble key={i} message={msg} />
                    ))}
                    {isLoading && messages[messages.length - 1]?.content === '' && (
                      <div className="flex justify-start">
                        <div className="bg-muted rounded-2xl px-4 py-2">
                          <div className="flex gap-1">
                            <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" />
                            <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:0.1s]" />
                            <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:0.2s]" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {error && <div className="mt-2 text-xs text-destructive text-center">{error}</div>}
              </ScrollArea>

              <form onSubmit={handleSubmit} className="p-3 border-t bg-muted/30">
                <div className="flex gap-2">
                  <Input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about goal planning..." className="flex-1 text-sm" disabled={isLoading} />
                  <Button type="submit" size="icon" disabled={!input.trim() || isLoading}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="interview" className="flex-1 mt-0 data-[state=inactive]:hidden">
              <InterviewMode
                cycleId={cycleId}
                onComplete={handleInterviewComplete}
                onCancel={() => setActiveTab('chat')}
              />
            </TabsContent>
          </Tabs>
        </div>
      )}

      <GoalProposalDialog
        open={showProposal}
        onOpenChange={setShowProposal}
        goal={proposedGoal}
        onApprove={handleApproveGoal}
        onStartOver={() => {
          setShowProposal(false);
          setProposedGoal(null);
        }}
        isCreating={isCreating}
      />
    </>
  );
}
