import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Behavior, LEVEL_NAMES, LEVEL_DESCRIPTIONS, PillarLevel } from '@/data/primedBehaviors';
import { cn } from '@/lib/utils';

interface BehaviorChecklistProps {
  behaviors: Behavior[];
  level: PillarLevel;
  checkedBehaviors: Set<string>;
  onToggle: (behaviorKey: string) => void;
}

export function BehaviorChecklist({ behaviors, level, checkedBehaviors, onToggle }: BehaviorChecklistProps) {
  const checkedCount = behaviors.filter(b => checkedBehaviors.has(b.key)).length;
  const majorityThreshold = Math.ceil(behaviors.length / 2);
  const hasMajority = checkedCount >= majorityThreshold;

  return (
    <Card className={cn(
      "transition-all",
      hasMajority && level > 0 && "border-primary/50 bg-primary/5",
      hasMajority && level === 0 && "border-destructive/50 bg-destructive/5"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              Level {level}: {LEVEL_NAMES[level]}
              {hasMajority && (
                <Badge variant={level === 0 ? "destructive" : "default"} className="text-xs">
                  ✓ Majority
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              {LEVEL_DESCRIPTIONS[level]}
            </CardDescription>
          </div>
          <span className="text-sm text-muted-foreground">
            {checkedCount}/{behaviors.length}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {behaviors.map(behavior => (
          <div key={behavior.key} className="flex items-start gap-3">
            <Checkbox
              id={behavior.key}
              checked={checkedBehaviors.has(behavior.key)}
              onCheckedChange={() => onToggle(behavior.key)}
              className="mt-0.5"
            />
            <Label 
              htmlFor={behavior.key} 
              className={cn(
                "text-sm cursor-pointer leading-relaxed",
                checkedBehaviors.has(behavior.key) && "text-foreground",
                !checkedBehaviors.has(behavior.key) && "text-muted-foreground"
              )}
            >
              {behavior.text}
            </Label>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
