import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { PILLARS, LEVEL_NAMES, PillarKey, PillarLevel } from '@/data/primedBehaviors';
import { Lock, AlertCircle, Target, Repeat, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PillarProgress } from '@/hooks/usePrimedProgress';

interface PillarDetailCardProps {
  pillar: PillarKey;
  level: PillarLevel;
  isLocked?: boolean;
  isFoundationIncomplete?: boolean;
  progress?: PillarProgress;
  onClick?: () => void;
}

export function PillarDetailCard({ 
  pillar, 
  level, 
  isLocked = false,
  isFoundationIncomplete = false,
  progress,
  onClick 
}: PillarDetailCardProps) {
  const pillarInfo = PILLARS[pillar];
  const progressToNext = level < 3 ? (level / 3) * 100 : 100;
  
  return (
    <Card 
      className={cn(
        "relative transition-all cursor-pointer hover:shadow-md",
        isLocked && "opacity-60",
        !isLocked && "hover:border-primary/50"
      )}
      onClick={onClick}
    >
      {isLocked && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm rounded-lg z-10">
          <div className="text-center p-4">
            <Lock className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Complete foundation first</p>
          </div>
        </div>
      )}
      
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <span 
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground"
              style={{ backgroundColor: pillarInfo.color }}
            >
              {pillarInfo.letter}
            </span>
            {pillarInfo.name}
          </CardTitle>
          
          <Badge variant={level === 0 ? "destructive" : level === 3 ? "default" : "secondary"}>
            Lv {level}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{LEVEL_NAMES[level]}</span>
            {level < 3 && (
              <span className="text-muted-foreground">→ {LEVEL_NAMES[(level + 1) as PillarLevel]}</span>
            )}
          </div>
          <Progress value={progressToNext} className="h-1.5" />
        </div>

        {isFoundationIncomplete && !pillarInfo.isFoundation && (
          <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
            <AlertCircle className="h-3 w-3" />
            <span>Foundation incomplete</span>
          </div>
        )}

        {progress && (
          <div className="grid grid-cols-3 gap-2 pt-1">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-muted-foreground">
                <Target className="h-3 w-3" />
              </div>
              <p className="text-sm font-medium">{progress.goalsActive}</p>
              <p className="text-[10px] text-muted-foreground">Goals</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-muted-foreground">
                <Repeat className="h-3 w-3" />
              </div>
              <p className="text-sm font-medium">{progress.habitsActive}</p>
              <p className="text-[10px] text-muted-foreground">Habits</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-muted-foreground">
                <Clock className="h-3 w-3" />
              </div>
              <p className="text-sm font-medium">{Math.round(progress.focusMinutesThisMonth / 60)}h</p>
              <p className="text-[10px] text-muted-foreground">Focus</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
