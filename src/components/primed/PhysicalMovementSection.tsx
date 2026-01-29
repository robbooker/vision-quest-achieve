import { Skeleton } from '@/components/ui/skeleton';
import { useResetAudits, RuleKey } from '@/hooks/useResetAudits';
import { format, subDays, parseISO } from 'date-fns';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

// Physical-related rules from Reset
const PHYSICAL_RULES: { key: RuleKey; label: string; icon: string }[] = [
  { key: 'rule_wake', label: 'WAKE', icon: '🌅' },
  { key: 'rule_move', label: 'MOVE', icon: '🏃' },
  { key: 'rule_fuel', label: 'FUEL', icon: '🍽️' },
  { key: 'rule_reset', label: 'RESET', icon: '🚫' },
];

export function PhysicalMovementSection() {
  const { audits, isLoading, getScore } = useResetAudits();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
        <Skeleton className="h-32" />
      </div>
    );
  }

  // Generate last 7 days
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const audit = audits.find(a => a.audit_date === dateStr);
    return {
      date,
      dateStr,
      dayLabel: format(date, 'EEE'),
      audit,
    };
  });

  // Calculate compliance rates for physical rules
  const complianceStats = PHYSICAL_RULES.map(rule => {
    const completed = audits.filter(a => a[rule.key]).length;
    const rate = audits.length > 0 ? Math.round((completed / audits.length) * 100) : 0;
    return { ...rule, completed, rate };
  });

  const avgPhysicalCompliance = complianceStats.length > 0
    ? Math.round(complianceStats.reduce((sum, s) => sum + s.rate, 0) / complianceStats.length)
    : 0;

  const physicalPerfectDays = audits.filter(audit => 
    PHYSICAL_RULES.every(rule => audit[rule.key])
  ).length;

  if (audits.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p className="text-sm">No reset audit data yet.</p>
        <p className="text-xs mt-1">Track your daily habits on the Reset page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold">{avgPhysicalCompliance}%</p>
          <p className="text-xs text-muted-foreground">Avg Compliance</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold">{physicalPerfectDays}</p>
          <p className="text-xs text-muted-foreground">Perfect Days</p>
        </div>
      </div>

      {/* Compliance by Rule */}
      <div className="grid grid-cols-2 gap-2">
        {complianceStats.map(stat => (
          <div 
            key={stat.key} 
            className="flex items-center justify-between bg-muted/30 rounded-lg p-2"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm">{stat.icon}</span>
              <span className="text-xs font-medium">{stat.label}</span>
            </div>
            <span className={cn(
              "text-sm font-bold",
              stat.rate >= 80 ? "text-primary" : stat.rate < 50 ? "text-destructive" : "text-muted-foreground"
            )}>
              {stat.rate}%
            </span>
          </div>
        ))}
      </div>

      {/* 7-Day Heatmap */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">Last 7 Days</p>
        <div className="grid grid-cols-7 gap-1">
          {days.map(day => (
            <div key={day.dateStr} className="text-center">
              <p className="text-[10px] text-muted-foreground mb-1">{day.dayLabel}</p>
              <div className="space-y-0.5">
                {PHYSICAL_RULES.map(rule => {
                  const completed = day.audit?.[rule.key] ?? false;
                  return (
                    <div 
                      key={rule.key}
                      className={cn(
                        "w-full h-4 rounded-sm flex items-center justify-center",
                        completed ? "bg-primary/80" : "bg-muted"
                      )}
                      title={`${rule.label}: ${completed ? 'Done' : 'Missed'}`}
                    >
                      {completed ? (
                        <Check className="h-2.5 w-2.5 text-primary-foreground" />
                      ) : (
                        <X className="h-2.5 w-2.5 text-muted-foreground/50" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-2 text-[10px] text-muted-foreground">
          {PHYSICAL_RULES.map(r => (
            <span key={r.key}>{r.icon} {r.label}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
