import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Play, Square, Pause, PlayCircle, Send, Sparkles } from 'lucide-react';

interface ArenaControlsProps {
  isRunning: boolean;
  isPaused: boolean;
  onStart: (topic: string) => void;
  onStop: () => void;
  onPause: () => void;
  onResume: () => void;
  onSendMessage: (message: string) => void;
}

const SUGGESTED_TOPICS = [
  "My productivity patterns and what they reveal about my priorities",
  "The relationship between my sleep and trading performance",
  "Whether my daily actions align with my 3-year vision",
  "My habit consistency and what's working vs what's not",
  "How balanced is my life across the PRIMED pillars?",
];

export function ArenaControls({
  isRunning,
  isPaused,
  onStart,
  onStop,
  onPause,
  onResume,
  onSendMessage,
}: ArenaControlsProps) {
  const [topic, setTopic] = useState('');
  const [message, setMessage] = useState('');

  const handleStart = () => {
    if (topic.trim()) {
      onStart(topic.trim());
    }
  };

  const handleSendMessage = () => {
    if (message.trim()) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  if (!isRunning) {
    return (
      <Card className="border-2">
        <CardContent className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Debate Topic</label>
            <Textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="What should Claude and Gemini debate about your life data?"
              className="min-h-[80px]"
            />
          </div>

          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Suggested topics:</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_TOPICS.map((suggestion, i) => (
                <Button
                  key={i}
                  variant="outline"
                  size="sm"
                  className="text-xs h-auto py-1 px-2"
                  onClick={() => setTopic(suggestion)}
                >
                  {suggestion.length > 50 ? suggestion.slice(0, 50) + '...' : suggestion}
                </Button>
              ))}
            </div>
          </div>

          <Button
            onClick={handleStart}
            disabled={!topic.trim()}
            className="w-full"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Start Debate
            <Play className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2">
      <CardContent className="p-4 space-y-3">
        {/* Control buttons */}
        <div className="flex gap-2">
          {isPaused ? (
            <Button onClick={onResume} variant="outline" className="flex-1">
              <PlayCircle className="mr-2 h-4 w-4" />
              Resume
            </Button>
          ) : (
            <Button onClick={onPause} variant="outline" className="flex-1">
              <Pause className="mr-2 h-4 w-4" />
              Pause
            </Button>
          )}
          <Button onClick={onStop} variant="destructive" className="flex-1">
            <Square className="mr-2 h-4 w-4" />
            Stop Debate
          </Button>
        </div>

        {/* Host interjection input */}
        <div className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Interject with a question or comment..."
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            className="flex-1"
          />
          <Button onClick={handleSendMessage} disabled={!message.trim()} size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
