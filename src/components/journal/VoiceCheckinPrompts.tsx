import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, ChevronLeft, ChevronRight, Volume2 } from "lucide-react";

const DAILY_PROMPTS = [
  {
    id: "feeling",
    prompt: "How are you feeling right now?",
    description: "Check in with your emotional state",
  },
  {
    id: "grateful",
    prompt: "What's one thing you're grateful for today?",
    description: "Practice gratitude",
  },
  {
    id: "mind",
    prompt: "What's on your mind that you want to process?",
    description: "Release what's weighing on you",
  },
  {
    id: "highlight",
    prompt: "What was the highlight of your day so far?",
    description: "Celebrate small wins",
  },
  {
    id: "challenge",
    prompt: "What's one challenge you're facing and how might you approach it?",
    description: "Problem-solve out loud",
  },
  {
    id: "energy",
    prompt: "What's giving you energy lately? What's draining it?",
    description: "Understand your patterns",
  },
  {
    id: "intention",
    prompt: "What's your intention for the rest of the day?",
    description: "Set direction",
  },
  {
    id: "reflection",
    prompt: "What would you tell your past self from a week ago?",
    description: "Reflect on growth",
  },
];

interface VoiceCheckinPromptsProps {
  onSelectPrompt?: (prompt: string) => void;
  dynamicPrompt?: string;
  className?: string;
}

export function VoiceCheckinPrompts({
  onSelectPrompt,
  dynamicPrompt,
  className = "",
}: VoiceCheckinPromptsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const allPrompts = dynamicPrompt
    ? [{ id: "dynamic", prompt: dynamicPrompt, description: "Based on your recent activity" }, ...DAILY_PROMPTS]
    : DAILY_PROMPTS;

  const currentPrompt = allPrompts[currentIndex];

  const goNext = () => {
    setCurrentIndex((prev) => (prev + 1) % allPrompts.length);
  };

  const goPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + allPrompts.length) % allPrompts.length);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Sparkles className="h-4 w-4" />
        <span>Voice prompt suggestions</span>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={goPrev}
          className="h-8 w-8 shrink-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex-1 text-center">
          <p className="text-sm font-medium">{currentPrompt.prompt}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {currentPrompt.description}
          </p>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={goNext}
          className="h-8 w-8 shrink-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {onSelectPrompt && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onSelectPrompt(currentPrompt.prompt)}
          className="w-full"
        >
          <Volume2 className="h-4 w-4 mr-2" />
          Use this prompt
        </Button>
      )}

      <div className="flex justify-center gap-1">
        {allPrompts.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-1.5 h-1.5 rounded-full transition-colors ${
              index === currentIndex
                ? "bg-primary"
                : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
