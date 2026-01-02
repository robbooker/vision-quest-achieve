import { useRef, useEffect, useCallback, useState } from 'react';
import { MessageCircle, X, Send, Trash2, Sparkles, Mic, Plus, History, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useGoals } from '@/hooks/useGoals';
import { useMilestones } from '@/hooks/useMilestones';
import { useTactics } from '@/hooks/useTactics';
import { useCycles } from '@/hooks/useCycles';
import { useVision } from '@/hooks/useVision';
import { useChatPersistence } from '@/hooks/useChatPersistence';
import { useGlobalChat } from '@/hooks/useGlobalChat';
import { cn } from '@/lib/utils';
import { InterviewMode } from './InterviewMode';
import { GoalProposalDialog } from './GoalProposalDialog';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import type { ExtractedGoal } from '@/hooks/useGoalInterview';
import type { ChatMessage } from '@/types/chat';
import { format } from 'date-fns';

export type { ChatMessage };

interface GoalCoachChatProps {
  cycleId?: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/goal-coach`;

function ChatMessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  
  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-4 py-3 text-sm',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-foreground'
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-strong:text-foreground prose-headings:text-foreground prose-li:my-0.5">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}

export function GoalCoachChat({ cycleId }: GoalCoachChatProps) {
  const { isOpen, setIsOpen, initialTab } = useGlobalChat();
  const [input, setInput] = useState('');
  const [activeTab, setActiveTab] = useState<'chat' | 'interview'>(initialTab);
  const [showProposal, setShowProposal] = useState(false);
  const [proposedGoal, setProposedGoal] = useState<ExtractedGoal | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  
  const {
    conversations,
    activeConversationId,
    messages,
    setMessages,
    loadMessages,
    createConversation,
    saveMessage,
    updateConversationTitle,
    deleteConversation,
    startNewChat,
  } = useChatPersistence();
  
  const { goals } = useGoals(cycleId);
  const { getActiveCycle, getCurrentWeekNumber } = useCycles();
  const { vision } = useVision();
  const { createGoal } = useGoals(cycleId);
  const { createMilestone } = useMilestones(cycleId);
  const { createTactic } = useTactics();
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeCycle = getActiveCycle();
  const currentWeek = activeCycle ? getCurrentWeekNumber(activeCycle) : null;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Sync activeTab when chat opens with a specific initialTab
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  useEffect(() => {
    if (isOpen && inputRef.current && activeTab === 'chat') {
      inputRef.current.focus();
    }
  }, [isOpen, activeTab]);

  const sendMessage = useCallback(async (userMessage: string) => {
    const userMsg: ChatMessage = { role: 'user', content: userMessage };
    setMessages(prev => [...prev, userMsg]);
    setIsStreaming(true);
    setError(null);

    let conversationId = activeConversationId;
    
    // Create new conversation if none exists
    if (!conversationId) {
      conversationId = await createConversation(userMessage);
      if (!conversationId) {
        setError('Failed to create conversation');
        setIsStreaming(false);
        return;
      }
    } else {
      // Update title if this is the first user message
      if (messages.length === 0) {
        await updateConversationTitle(conversationId, userMessage);
      }
    }

    // Save user message
    await saveMessage(userMsg);

    let assistantContent = '';

    try {
      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
          context: {
            goals: goals.map(g => ({
              title: g.title,
              target_value: g.target_value,
              metric_type: g.metric_type,
              why: g.why,
            })),
            cycle: activeCycle,
            currentWeek,
            vision,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';

      // Add empty assistant message to update incrementally
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        // Process line by line
        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantContent += content;
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: 'assistant', content: assistantContent };
                return updated;
              });
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      // Final flush
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split('\n')) {
          if (!raw) continue;
          if (raw.endsWith('\r')) raw = raw.slice(0, -1);
          if (raw.startsWith(':') || raw.trim() === '') continue;
          if (!raw.startsWith('data: ')) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantContent += content;
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: 'assistant', content: assistantContent };
                return updated;
              });
            }
          } catch {
            /* ignore partial leftovers */
          }
        }
      }

      // Save assistant message
      if (assistantContent) {
        await saveMessage({ role: 'assistant', content: assistantContent });
      }
    } catch (err) {
      console.error('Goal coach error:', err);
      setError(err instanceof Error ? err.message : 'Failed to get response');
      setMessages(prev => prev.filter((_, i) => i !== prev.length - 1 || prev[i].content !== ''));
    } finally {
      setIsStreaming(false);
    }
  }, [messages, goals, activeCycle, currentWeek, vision, activeConversationId, createConversation, saveMessage, updateConversationTitle, setMessages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;
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
      const createdGoal = await createGoal.mutateAsync({
        cycle_id: cycleId,
        title: goal.title,
        target_value: goal.target_value,
        metric_type: goal.metric_type,
        why: goal.why,
      });

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

  const handleNewChat = () => {
    startNewChat();
    setShowHistory(false);
  };

  const handleSelectConversation = (conversationId: string) => {
    loadMessages(conversationId);
    setShowHistory(false);
  };

  const handleDeleteConversation = async (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation();
    await deleteConversation(conversationId);
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
        <div className="fixed inset-4 md:inset-8 lg:inset-12 bg-background border rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/50">
            <div className="flex items-center gap-3">
              {showHistory && (
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowHistory(false)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              )}
              <Sparkles className="h-5 w-5 text-primary" />
              <div>
                <h3 className="font-semibold text-sm">Goal Coach</h3>
                <p className="text-xs text-muted-foreground">Your witty planning partner</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8" 
                onClick={() => setShowHistory(!showHistory)} 
                title="Chat history"
              >
                <History className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleNewChat} title="New chat">
                <Plus className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* History Sidebar */}
            {showHistory && (
              <div className="w-64 border-r bg-muted/30 flex flex-col">
                <div className="p-3 border-b">
                  <Button onClick={handleNewChat} className="w-full" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    New Chat
                  </Button>
                </div>
                <ScrollArea className="flex-1">
                  <div className="p-2 space-y-1">
                    {conversations.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">No conversations yet</p>
                    ) : (
                      conversations.map((conv) => (
                        <button
                          key={conv.id}
                          onClick={() => handleSelectConversation(conv.id)}
                          className={cn(
                            'w-full text-left p-3 rounded-lg hover:bg-muted transition-colors group',
                            activeConversationId === conv.id && 'bg-muted'
                          )}
                        >
                          <p className="text-sm font-medium truncate">{conv.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(conv.updated_at), 'MMM d, h:mm a')}
                          </p>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => handleDeleteConversation(e, conv.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </button>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col">
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'chat' | 'interview')} className="flex-1 flex flex-col">
                <TabsList className="grid w-full grid-cols-2 mx-4 mt-2" style={{ width: 'calc(100% - 2rem)' }}>
                  <TabsTrigger value="chat">Chat</TabsTrigger>
                  <TabsTrigger value="interview" className="flex items-center gap-1">
                    <Mic className="h-3 w-3" />
                    Interview
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="chat" className="flex-1 flex flex-col mt-0 data-[state=inactive]:hidden">
                  <ScrollArea className="flex-1 p-6" ref={scrollRef}>
                    {messages.length === 0 ? (
                      <div className="max-w-lg mx-auto space-y-6 pt-8">
                        <div className="text-center text-muted-foreground">
                          <Sparkles className="h-12 w-12 mx-auto mb-4 text-primary/50" />
                          <p className="font-medium text-lg">Hey there, goal-setter.</p>
                          <p className="text-sm mt-2">I'm here to help you plan with rigor and charm.</p>
                        </div>
                        <div className="space-y-2">
                          <p className="text-xs text-muted-foreground text-center">Quick starts:</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {quickPrompts.map((prompt) => (
                              <Button 
                                key={prompt} 
                                variant="outline" 
                                size="sm" 
                                className="text-xs justify-start h-auto py-3 px-4 whitespace-normal text-left" 
                                onClick={() => sendMessage(prompt)} 
                                disabled={isStreaming}
                              >
                                {prompt}
                              </Button>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="max-w-2xl mx-auto space-y-4">
                        {messages.map((msg, i) => (
                          <ChatMessageBubble key={i} message={msg} />
                        ))}
                        {isStreaming && messages[messages.length - 1]?.content === '' && (
                          <div className="flex justify-start">
                            <div className="bg-muted rounded-2xl px-4 py-3">
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
                    {error && <div className="mt-4 text-sm text-destructive text-center">{error}</div>}
                  </ScrollArea>

                  <form onSubmit={handleSubmit} className="p-4 border-t bg-muted/30">
                    <div className="max-w-2xl mx-auto flex gap-3">
                      <Input 
                        ref={inputRef} 
                        value={input} 
                        onChange={(e) => setInput(e.target.value)} 
                        placeholder="Ask about goal planning..." 
                        className="flex-1" 
                        disabled={isStreaming} 
                      />
                      <Button type="submit" size="icon" disabled={!input.trim() || isStreaming}>
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
          </div>
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
