import { format, subDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { ResetAudit, RULES } from '@/hooks/useResetAudits';

interface AuditStripProps {
  audits: ResetAudit[];
}

export function AuditStrip({ audits }: AuditStripProps) {
  const getScoreForDate = (date: string): number => {
    const audit = audits.find(a => a.audit_date === date);
    if (!audit) return 0;
    return RULES.filter(rule => audit[rule.key]).length;
  };

  const getColorClass = (score: number): string => {
    if (score === 8) return 'bg-[hsl(160,88%,63%)]'; // Terminal Green
    if (score >= 6) return 'bg-[hsl(45,100%,50%)]'; // Terminal Amber
    if (score > 0) return 'bg-[hsl(4,100%,62%)]'; // Terminal Red
    return 'bg-muted'; // No data
  };

  const days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    return {
      date: format(date, 'yyyy-MM-dd'),
      dayLabel: format(date, 'EEE'),
      dayNum: format(date, 'd'),
    };
  });

  return (
    <div className="flex gap-2 justify-center">
      {days.map(({ date, dayLabel, dayNum }) => {
        const score = getScoreForDate(date);
        const isToday = date === format(new Date(), 'yyyy-MM-dd');
        
        return (
          <div key={date} className="flex flex-col items-center gap-1">
            <span className={cn(
              "text-xs text-muted-foreground uppercase",
              isToday && "font-bold text-foreground"
            )}>
              {dayLabel}
            </span>
            <div
              className={cn(
                "w-10 h-10 flex items-center justify-center font-mono text-sm font-bold transition-colors",
                getColorClass(score),
                score === 8 && "text-background",
                score >= 6 && score < 8 && "text-background",
                score > 0 && score < 6 && "text-background",
                score === 0 && "text-muted-foreground",
                isToday && "ring-2 ring-foreground ring-offset-2 ring-offset-background"
              )}
            >
              {score > 0 ? score : '-'}
            </div>
            <span className="text-xs text-muted-foreground">
              {dayNum}
            </span>
          </div>
        );
      })}
    </div>
  );
}
