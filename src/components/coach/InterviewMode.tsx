import { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, Send, Volume2, VolumeX, MessageSquare, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { useCoachVoice } from '@/hooks/useCoachVoice';
import { useGoalInterview, InterviewMessage, InterviewPhase } from '@/hooks/useGoalInterview';

const PHASE_LABELS: Record<InterviewPhase, string> = {
  vision: 'What do you want?',
  metrics: 'How will you measure?',
  motivation: 'Why does it matter?',
  milestones: 'Weekly checkpoints',
  tactics: 'Daily/weekly actions',
  complete: 'Ready to create!',
};

interface InterviewModeProps {
  cycleId?: string;
  onComplete: (goal: ReturnType<typeof useGoalInterview>['extractedGoal']) => void;
  onCancel: () => void;
}

function MessageBubble({ message, isLatest }: { message: InterviewMessage; isLatest?: boolean }) {
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

export function InterviewMode({ cycleId, onComplete, onCancel }: InterviewModeProps) {
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [hasStarted, setHasStarted] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const interview = useGoalInterview({
    cycleId,
    onGoalExtracted: (goal) => {
      onComplete(goal);
    },
  });

  const voice = useCoachVoice();
  
  const handleVoiceResult = useCallback((text: string) => {
    if (text.trim()) {
      interview.sendMessage(text).then((response) => {
        // Only speak if in voice mode AND voice is enabled
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
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [interview.messages]);

  // Focus input when switching to text mode
  useEffect(() => {
    if (!isVoiceMode && inputRef.current && hasStarted) {
      inputRef.current.focus();
    }
  }, [isVoiceMode, hasStarted]);

  // Start interview
  const handleStart = async () => {
    setHasStarted(true);
    try {
      await interview.startInterview();
      // Voice will speak the first message via the messages array
    } catch (e) {
      console.error('Failed to start interview:', e);
    }
  };

  // Send text message
  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim() || interview.isLoading) return;
    
    const text = textInput;
    setTextInput('');
    
    const response = await interview.sendMessage(text);
    // Only speak if in voice mode AND voice is enabled
    if (isVoiceMode && isVoiceEnabled && response) {
      voice.speak(response);
    }
  };

  // Toggle microphone
  const handleMicToggle = () => {
    if (voiceInput.isListening) {
      voiceInput.stopListening();
    } else {
      voiceInput.startListening();
    }
  };

  if (!hasStarted) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <div className="space-y-4 max-w-sm">
          <h3 className="text-lg font-semibold">Goal Interview</h3>
          <p className="text-sm text-muted-foreground">
            I'll ask you a few questions to help define your goal, milestones, and tactics. 
            You can respond by voice or text.
          </p>
          
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
            <p className="text-xs text-destructive">
              Voice input not supported in this browser. Try Chrome or Edge.
            </p>
          )}

          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={onCancel} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleStart} className="flex-1">
              Start Interview
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header with phase indicator */}
      <div className="px-4 py-2 border-b flex items-center justify-between">
        <Badge variant="secondary" className="text-xs">
          {PHASE_LABELS[interview.phase]}
        </Badge>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
            title={isVoiceEnabled ? 'Mute coach voice' : 'Enable coach voice'}
          >
            {isVoiceEnabled ? (
              <Volume2 className="h-4 w-4" />
            ) : (
              <VolumeX className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setIsVoiceMode(!isVoiceMode)}
            title={isVoiceMode ? 'Switch to text' : 'Switch to voice'}
          >
            {isVoiceMode ? (
              <MessageSquare className="h-4 w-4" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-3">
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

          {/* Voice speaking indicator */}
          {voice.isSpeaking && (
            <div className="flex justify-center">
              <Badge variant="outline" className="animate-pulse">
                <Volume2 className="h-3 w-3 mr-1" />
                Coach is speaking...
              </Badge>
            </div>
          )}
        </div>

        {interview.error && (
          <div className="mt-2 text-xs text-destructive text-center">
            {interview.error}
          </div>
        )}
      </ScrollArea>

      {/* Input area */}
      <div className="p-3 border-t bg-muted/30">
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
              {voiceInput.isListening ? (
                <MicOff className="h-6 w-6" />
              ) : (
                <Mic className="h-6 w-6" />
              )}
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
              {interview.isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
