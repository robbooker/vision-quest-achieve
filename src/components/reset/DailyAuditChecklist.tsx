import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { ResetAudit, RuleKey, RULES } from '@/hooks/useResetAudits';

interface DailyAuditChecklistProps {
  todayAudit: ResetAudit | undefined;
  onToggle: (ruleKey: RuleKey, value: boolean) => void;
  isLoading?: boolean;
}

export function DailyAuditChecklist({ todayAudit, onToggle, isLoading }: DailyAuditChecklistProps) {
  const score = RULES.filter(rule => todayAudit?.[rule.key]).length;

  return (
    <div className="space-y-1">
      {/* Header */}
      <div className="grid grid-cols-[1fr_auto_auto] gap-4 px-4 py-2 border-b border-border text-xs font-bold text-muted-foreground uppercase tracking-wider">
        <span>Rule</span>
        <span className="w-32 text-right">Metric</span>
        <span className="w-12 text-center">Status</span>
      </div>

      {/* Rules */}
      {RULES.map((rule) => {
        const isChecked = todayAudit?.[rule.key] ?? false;
        
        return (
          <div
            key={rule.key}
            className={cn(
              "grid grid-cols-[1fr_auto_auto] gap-4 px-4 py-3 items-center transition-colors",
              isChecked && "bg-[hsl(160,88%,63%)]/10"
            )}
          >
            <span className={cn(
              "font-mono text-sm font-medium",
              isChecked && "text-[hsl(160,88%,63%)]"
            )}>
              {rule.label}
            </span>
            <span className="w-32 text-right text-sm text-muted-foreground">
              {rule.metric}
            </span>
            <div className="w-12 flex justify-center">
              <Checkbox
                checked={isChecked}
                onCheckedChange={(checked) => onToggle(rule.key, checked as boolean)}
                disabled={isLoading}
                className={cn(
                  "h-6 w-6 border-2",
                  isChecked && "bg-[hsl(160,88%,63%)] border-[hsl(160,88%,63%)]"
                )}
              />
            </div>
          </div>
        );
      })}

      {/* Score Footer */}
      <div className="grid grid-cols-[1fr_auto_auto] gap-4 px-4 py-3 border-t border-border items-center">
        <span className="font-mono text-sm font-bold">DAILY SCORE</span>
        <span className="w-32"></span>
        <div className="w-12 text-center">
          <span className={cn(
            "font-mono text-lg font-bold",
            score === 8 && "text-[hsl(160,88%,63%)]",
            score >= 6 && score < 8 && "text-[hsl(45,100%,50%)]",
            score < 6 && score > 0 && "text-[hsl(4,100%,62%)]",
            score === 0 && "text-muted-foreground"
          )}>
            {score}/8
          </span>
        </div>
      </div>
    </div>
  );
}
