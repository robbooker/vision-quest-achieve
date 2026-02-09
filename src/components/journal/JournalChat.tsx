import { useRef, useEffect, useState } from 'react';
import { MessageCircle, X, Send, Sparkles, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useJournalChat } from '@/hooks/useJournalChat';
import { useGlobalChat } from '@/hooks/useGlobalChat';
import ReactMarkdown from 'react-markdown';

const PRESET_QUESTIONS = [
  { label: "Add a task", prompt: "Add a task to my list" },
  { label: "Pillar balance", prompt: "How much time did I spend on each PRIMED pillar this month?" },
  { label: "Recent progress", prompt: "What have I accomplished in the last few days?" },
  { label: "Long-term patterns", prompt: "What patterns do you see across my entire history?" },
  { label: "Focus insights", prompt: "When am I most productive based on my focus sessions?" },
  { label: "Habit consistency", prompt: "Which habits have I been most consistent with over time?" },
  { label: "What am I avoiding?", prompt: "Are there any goals or tasks I seem to be avoiding?" },
  { label: "Which pillar needs work?", prompt: "Which PRIMED pillar have I been neglecting and should focus on?" },
];

export const JournalChat = () => {
  const { isOpen, setIsOpen } = useGlobalChat();
  const [input, setInput] = useState('');
  const { messages, isLoading, error, sendMessage, clearChat } = useJournalChat();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    sendMessage(input.trim());
    setInput('');
  };

  const handlePreset = (prompt: string) => {
    if (isLoading) return;
    sendMessage(prompt);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
        size="icon"
        title="Toasty (⌘K)"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 max-w-[calc(100vw-3rem)] h-[500px] max-h-[calc(100vh-6rem)] bg-background border rounded-lg shadow-xl flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <span className="font-semibold">Toasty</span>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <Button variant="ghost" size="icon" onClick={clearChat} className="h-8 w-8">
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-3" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              I can help you reflect on your recent activity and progress. Try one of these:
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {PRESET_QUESTIONS.map((q) => (
                <Button
                  key={q.label}
                  variant="outline"
                  size="sm"
                  onClick={() => handlePreset(q.prompt)}
                  disabled={isLoading}
                  className="text-xs"
                >
                  {q.label}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  {msg.role === 'assistant' ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown>{msg.content || '...'}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm">{msg.content}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {error && (
          <div className="text-sm text-destructive text-center mt-2">
            {error}
          </div>
        )}
      </ScrollArea>

      {/* Preset buttons when there are messages */}
      {messages.length > 0 && (
        <div className="px-3 pb-2">
          <div className="flex gap-1 overflow-x-auto pb-1">
            {PRESET_QUESTIONS.slice(0, 3).map((q) => (
              <Button
                key={q.label}
                variant="ghost"
                size="sm"
                onClick={() => handlePreset(q.prompt)}
                disabled={isLoading}
                className="text-xs shrink-0 h-7"
              >
                {q.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your progress..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button onClick={handleSend} disabled={isLoading || !input.trim()} size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
