import { useState, useEffect } from 'react';
import { Star, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface IntentionDailyTrackerProps {
  intentionWord: string;
  currentScore: number | null;
  currentReflection: string | null;
  onScoreChange: (score: number) => void;
  onReflectionChange: (reflection: string) => void;
  isUpdating?: boolean;
}

export const IntentionDailyTracker = ({
  intentionWord,
  currentScore,
  currentReflection,
  onScoreChange,
  onReflectionChange,
  isUpdating,
}: IntentionDailyTrackerProps) => {
  const [localReflection, setLocalReflection] = useState(currentReflection || '');
  const [showReflection, setShowReflection] = useState(!!currentReflection);

  useEffect(() => {
    setLocalReflection(currentReflection || '');
    setShowReflection(!!currentReflection);
  }, [currentReflection]);

  const handleScoreClick = (score: number) => {
    onScoreChange(score);
    if (score > 0 && !showReflection) {
      setShowReflection(true);
    }
  };

  const handleReflectionBlur = () => {
    if (localReflection !== currentReflection) {
      onReflectionChange(localReflection);
    }
  };

  return (
    <div className="border-t pt-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">
            How well did you live <span className="uppercase font-bold text-primary">{intentionWord}</span> today?
          </span>
        </div>
        {isUpdating && <Skeleton className="h-4 w-16" />}
      </div>

      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((score) => (
          <Button
            key={score}
            variant="ghost"
            size="sm"
            className={cn(
              "p-1 h-8 w-8",
              currentScore && score <= currentScore 
                ? "text-primary" 
                : "text-muted-foreground hover:text-primary/70"
            )}
            onClick={() => handleScoreClick(score)}
            disabled={isUpdating}
          >
            <Star 
              className={cn(
                "h-5 w-5 transition-all",
                currentScore && score <= currentScore && "fill-current"
              )} 
            />
          </Button>
        ))}
        {currentScore && (
          <span className="ml-2 text-sm text-muted-foreground">
            {currentScore === 5 && "Perfectly aligned"}
            {currentScore === 4 && "Mostly aligned"}
            {currentScore === 3 && "Somewhat aligned"}
            {currentScore === 2 && "Struggled today"}
            {currentScore === 1 && "Off track"}
          </span>
        )}
      </div>

      {showReflection && (
        <Textarea
          placeholder={`Reflect on how ${intentionWord} showed up (or didn't) today...`}
          value={localReflection}
          onChange={(e) => setLocalReflection(e.target.value)}
          onBlur={handleReflectionBlur}
          rows={2}
          className="text-sm resize-none"
          maxLength={500}
        />
      )}
    </div>
  );
};
