import { cn } from '@/lib/utils';

interface Phase {
  day: number;
  name: string;
  description: string;
}

interface PhaseIndicatorProps {
  phase: Phase | null;
}

export function PhaseIndicator({ phase }: PhaseIndicatorProps) {
  if (!phase) return null;

  return (
    <div className="text-center space-y-1">
      <div className="flex items-center justify-center gap-2">
        <span className="text-xs text-muted-foreground uppercase tracking-wider">
          Day {phase.day}
        </span>
        <span className="text-muted-foreground">•</span>
        <span className={cn(
          "font-mono font-bold uppercase tracking-wider",
          phase.day === 1 && "text-[hsl(4,100%,62%)]",
          phase.day === 2 && "text-[hsl(25,100%,55%)]",
          phase.day === 3 && "text-[hsl(45,100%,50%)]",
          phase.day === 4 && "text-[hsl(80,70%,50%)]",
          phase.day === 5 && "text-[hsl(120,60%,50%)]",
          phase.day === 6 && "text-[hsl(160,70%,50%)]",
          phase.day === 7 && "text-[hsl(160,88%,63%)]"
        )}>
          {phase.name}
        </span>
      </div>
      <p className="text-sm text-muted-foreground italic">
        {phase.description}
      </p>
    </div>
  );
}
