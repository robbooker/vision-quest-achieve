import { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, Send, Volume2, VolumeX, MessageSquare, Loader2, RotateCcw, Plus, Trash2, Clock, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { useCoachVoice } from '@/hooks/useCoachVoice';
import { useWoopInterview, WoopMessage, WoopPhase, ExtractedWoop } from '@/hooks/useWoopInterview';
import { useGoals } from '@/hooks/useGoals';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

const PHASE_LABELS: Record<WoopPhase, string> = {
  wish: 'W — What do you wish?',
  outcome: 'O — Best outcome?',
  obstacle: 'O — Internal obstacle?',
  plan: 'P — If-then plan?',
  complete: 'Ready to create!',
};

interface CreateWoopGoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cycleId: string;
  onSuccess?: () => void;
}

function MessageBubble({ message, isLatest }: { message: WoopMessage; isLatest?: boolean }) {
  const isUser = message.role === 'user';
  
  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-4 py-2 text-sm',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-foreground',
          isLatest && !isUser && 'ring-2 ring-primary/20'
        )}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
      </div>
    </div>
  );
}

export function CreateWoopGoalDialog({ open, onOpenChange, cycleId, onSuccess }: CreateWoopGoalDialogProps) {
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [hasStarted, setHasStarted] = useState(false);
  const [isCreatingGoal, setIsCreatingGoal] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const interview = useWoopInterview({
    cycleId,
    onWoopExtracted: () => {
      // WOOP extracted, user can click to create
    },
  });

  const { createGoal } = useGoals(cycleId);
  const voice = useCoachVoice();
  
  const handleVoiceResult = useCallback((text: string) => {
    if (text.trim()) {
      interview.sendMessage(text).then((response) => {
        if (isVoiceMode && isVoiceEnabled && response) {
          voice.speak(response);
        }
      });
    }
  }, [interview, voice, isVoiceMode, isVoiceEnabled]);

  const voiceInput = useVoiceInput({
    onResult: handleVoiceResult,
  });

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [interview.messages]);

  // Auto-resume if there's an existing interview
  useEffect(() => {
    if (interview.hasExistingInterview && !hasStarted) {
      setHasStarted(true);
    }
  }, [interview.hasExistingInterview, hasStarted]);

  // Focus input when switching to text mode
  useEffect(() => {
    if (!isVoiceMode && inputRef.current && hasStarted) {
      inputRef.current.focus();
    }
  }, [isVoiceMode, hasStarted]);

  // Reset when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setHasStarted(false);
      setTextInput('');
    }
  }, [open]);

  const handleStart = async () => {
    setHasStarted(true);
    try {
      await interview.startInterview();
    } catch (e) {
      console.error('Failed to start WOOP interview:', e);
    }
  };

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim() || interview.isLoading) return;
    
    const text = textInput;
    setTextInput('');
    
    const response = await interview.sendMessage(text);
    if (isVoiceMode && isVoiceEnabled && response) {
      voice.speak(response);
    }
  };

  const handleCreateGoal = async () => {
    if (!cycleId) {
      toast.error('No active cycle. Please create a cycle first.');
      return;
    }

    setIsCreatingGoal(true);
    
    try {
      const extracted = interview.extractedWoop || await interview.extractWoop();
      
      if (!extracted) {
        toast.error('Could not extract WOOP from conversation');
        return;
      }

      await createGoal.mutateAsync({
        cycle_id: cycleId,
        title: extracted.wish,
        metric_type: 'completion',
        target_value: 1,
        goal_type: 'woop',
        outcome_visualization: extracted.outcome_visualization,
        primary_obstacle: extracted.primary_obstacle,
        implementation_intention: extracted.implementation_intention,
      });

      toast.success('WOOP goal created successfully!');
      onSuccess?.();
      onOpenChange(false);
    } catch (e) {
      console.error('Failed to create WOOP goal:', e);
      toast.error('Failed to create goal');
    } finally {
      setIsCreatingGoal(false);
    }
  };

  const handleMicToggle = () => {
    if (voiceInput.isListening) {
      voiceInput.stopListening();
    } else {
      voiceInput.startListening();
    }
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[80vh] flex flex-col p-0 gap-0">
        {/* Loading state */}
        {interview.isLoadingHistory && (
          <div className="flex flex-col items-center justify-center h-full p-6">
            <div className="space-y-3 w-full max-w-sm">
              <Skeleton className="h-6 w-32 mx-auto" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4 mx-auto" />
              <Skeleton className="h-10 w-full mt-4" />
            </div>
          </div>
        )}

        {/* Pre-start screen */}
        {!interview.isLoadingHistory && !hasStarted && (
          <div className="flex flex-col h-full p-6">
            <div className="space-y-4 max-w-md mx-auto w-full">
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <Brain className="h-6 w-6 text-primary" />
                  <h3 className="text-lg font-semibold">WOOP Goal</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Mental contrasting + implementation intentions for powerful goal achievement.
                </p>
              </div>
              
              <div className="bg-muted/50 rounded-lg p-4 space-y-3 text-sm">
                <p className="font-medium">The WOOP method:</p>
                <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                  <li><span className="text-foreground font-medium">Wish</span> — What do you want to accomplish?</li>
                  <li><span className="text-foreground font-medium">Outcome</span> — What's the best outcome if you achieve it?</li>
                  <li><span className="text-foreground font-medium">Obstacle</span> — What internal obstacle might stop you?</li>
                  <li><span className="text-foreground font-medium">Plan</span> — If [obstacle], then I will [action]</li>
                </ol>
                <p className="text-muted-foreground pt-1 text-xs">
                  Based on 20+ years of research by Dr. Gabriele Oettingen.
                </p>
              </div>
              
              <div className="flex items-center justify-center gap-2 py-2">
                <Switch
                  id="voice-mode"
                  checked={isVoiceMode}
                  onCheckedChange={setIsVoiceMode}
                />
                <Label htmlFor="voice-mode" className="text-sm">
                  {isVoiceMode ? 'Voice Mode' : 'Text Mode'}
                </Label>
              </div>

              {!voiceInput.isSupported && isVoiceMode && (
                <p className="text-xs text-destructive text-center">
                  Voice input not supported in this browser. Try Chrome or Edge.
                </p>
              )}

              <div className="flex gap-2">
                <Button variant="outline" onClick={handleClose} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleStart} className="flex-1">
                  <Plus className="h-4 w-4 mr-1" />
                  Start WOOP
                </Button>
              </div>

              {/* Past WOOP interviews */}
              {interview.pastInterviews.length > 0 && (
                <div className="pt-4 border-t">
                  <h4 className="text-sm font-medium mb-2">Resume a previous WOOP</h4>
                  <ScrollArea className="h-[150px]">
                    <div className="space-y-2 pr-2">
                      {interview.pastInterviews.map((conv) => (
                        <div
                          key={conv.id}
                          className="flex items-center gap-2 p-2 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                        >
                          <button
                            className="flex-1 text-left"
                            onClick={async () => {
                              await interview.loadInterview(conv.id);
                              setHasStarted(true);
                            }}
                          >
                            <div className="text-sm font-medium truncate">
                              {conv.title.replace('[WOOP] ', '')}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {formatDistanceToNow(new Date(conv.updated_at), { addSuffix: true })}
                              <span>•</span>
                              <span>{conv.message_count} messages</span>
                            </div>
                          </button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() => interview.deleteInterview(conv.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Active interview */}
        {!interview.isLoadingHistory && hasStarted && (
          <>
            {/* Header */}
            <div className="flex-shrink-0 px-4 py-3 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-primary" />
                <Badge variant="secondary" className="text-xs">
                  {PHASE_LABELS[interview.phase]}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
                  title={isVoiceEnabled ? 'Mute coach voice' : 'Enable coach voice'}
                >
                  {isVoiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setIsVoiceMode(!isVoiceMode)}
                  title={isVoiceMode ? 'Switch to text' : 'Switch to voice'}
                >
                  {isVoiceMode ? <MessageSquare className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => {
                    interview.reset();
                    setHasStarted(false);
                  }}
                  title="Start over"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 h-0">
              <div className="p-4 space-y-3">
                {interview.messages.map((msg, i) => (
                  <MessageBubble 
                    key={i} 
                    message={msg} 
                    isLatest={i === interview.messages.length - 1 && msg.role === 'assistant'}
                  />
                ))}
                
                {interview.isLoading && (
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

                {voice.isSpeaking && (
                  <div className="flex justify-center">
                    <Badge variant="outline" className="animate-pulse">
                      <Volume2 className="h-3 w-3 mr-1" />
                      Coach is speaking...
                    </Badge>
                  </div>
                )}

                {interview.error && (
                  <div className="mt-2 text-xs text-destructive text-center">
                    {interview.error}
                  </div>
                )}

                {/* Create Goal button */}
                {interview.messages.length >= 4 && !interview.isLoading && (
                  <div className="flex justify-center pt-4">
                    <Button
                      onClick={handleCreateGoal}
                      disabled={isCreatingGoal}
                      variant={interview.messages.length >= 8 ? 'default' : 'outline'}
                      className="gap-2"
                    >
                      {isCreatingGoal ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Creating WOOP Goal...
                        </>
                      ) : (
                        <>
                          <Brain className="h-4 w-4" />
                          Create WOOP Goal
                        </>
                      )}
                    </Button>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="flex-shrink-0 p-3 border-t bg-muted/30">
              {isVoiceMode ? (
                <div className="flex flex-col items-center gap-2">
                  {voiceInput.transcript && (
                    <p className="text-sm text-muted-foreground italic">
                      "{voiceInput.transcript}"
                    </p>
                  )}
                  <Button
                    size="lg"
                    variant={voiceInput.isListening ? 'destructive' : 'default'}
                    className={cn(
                      'h-14 w-14 rounded-full',
                      voiceInput.isListening && 'animate-pulse'
                    )}
                    onClick={handleMicToggle}
                    disabled={interview.isLoading || voice.isSpeaking}
                  >
                    {voiceInput.isListening ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    {voiceInput.isListening ? 'Listening... tap to stop' : 'Tap to speak'}
                  </p>
                  {voiceInput.error && (
                    <p className="text-xs text-destructive">{voiceInput.error}</p>
                  )}
                </div>
              ) : (
                <form onSubmit={handleTextSubmit} className="flex gap-2">
                  <Input
                    ref={inputRef}
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Type your response..."
                    className="flex-1 text-sm"
                    disabled={interview.isLoading}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={!textInput.trim() || interview.isLoading}
                  >
                    {interview.isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </form>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
