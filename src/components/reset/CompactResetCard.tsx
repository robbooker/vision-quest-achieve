import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useTerminalMode } from '@/hooks/useTerminalMode';
import { useResetAudits, RULES, ResetAudit } from '@/hooks/useResetAudits';
import { DailyAuditChecklist } from './DailyAuditChecklist';
import { cn } from '@/lib/utils';
import { RotateCcw, ChevronRight } from 'lucide-react';
import { format, subDays } from 'date-fns';

interface MiniAuditStripProps {
  audits: ResetAudit[];
}

function MiniAuditStrip({ audits }: MiniAuditStripProps) {
  const getScoreForDate = (date: string): number => {
    const audit = audits.find(a => a.audit_date === date);
    if (!audit) return 0;
    return RULES.filter(rule => audit[rule.key]).length;
  };

  const getColorClass = (score: number): string => {
    if (score === 8) return 'bg-[hsl(160,88%,63%)]';
    if (score >= 6) return 'bg-[hsl(34,100%,58%)]';
    if (score > 0) return 'bg-[hsl(0,84%,60%)]';
    return 'bg-muted-foreground/30';
  };

  const days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    return format(date, 'yyyy-MM-dd');
  });

  return (
    <div className="flex gap-1">
      {days.map((date) => {
        const score = getScoreForDate(date);
        return (
          <div
            key={date}
            className={cn(
              'w-3 h-3 rounded-sm',
              getColorClass(score)
            )}
            title={`${format(new Date(date), 'EEE')}: ${score}/8`}
          />
        );
      })}
    </div>
  );
}

export function CompactResetCard() {
  const { isTerminal } = useTerminalMode();
  const { 
    audits, 
    todayAudit, 
    getScore, 
    getCurrentPhase, 
    toggleRule 
  } = useResetAudits();

  const phase = getCurrentPhase();
  const todayScore = getScore(todayAudit);

  const getScoreColor = (score: number): string => {
    if (score === 8) return 'text-[hsl(160,88%,63%)]';
    if (score >= 6) return 'text-[hsl(34,100%,58%)]';
    return 'text-[hsl(0,84%,60%)]';
  };

  return (
    <Card className={cn(
      "border-primary/30 bg-card/50",
      isTerminal && "border-[hsl(0,0%,20%)] rounded-none bg-black"
    )}>
      <CardContent className="py-3 px-4">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Title + Phase */}
          <div className="flex items-center gap-3">
            <RotateCcw className="h-4 w-4 text-primary flex-shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <span className={cn(
                  "font-semibold text-sm",
                  isTerminal && "font-mono text-[hsl(34,100%,58%)]"
                )}>
                  7-DAY RESET
                </span>
                {phase && (
                  <span className="text-xs text-muted-foreground">
                    Day {phase.day}: {phase.name}
                  </span>
                )}
              </div>
              <MiniAuditStrip audits={audits} />
            </div>
          </div>

          {/* Right: Score + Actions */}
          <div className="flex items-center gap-3">
            <span className={cn(
              "font-bold text-lg",
              getScoreColor(todayScore),
              isTerminal && "font-mono"
            )}>
              {todayScore}/8
            </span>

            <Sheet>
              <SheetTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={cn(
                    "text-xs h-7 px-2",
                    isTerminal && "rounded-none"
                  )}
                >
                  Checklist
                  <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[80vh]">
                <SheetHeader>
                  <SheetTitle className={cn(
                    "flex items-center gap-2",
                    isTerminal && "font-mono"
                  )}>
                    <RotateCcw className="h-5 w-5" />
                    {isTerminal ? 'DAILY AUDIT' : 'Today\'s Checklist'}
                  </SheetTitle>
                </SheetHeader>
                <div className="mt-4 overflow-y-auto">
                  <DailyAuditChecklist
                    todayAudit={todayAudit}
                    onToggle={(ruleKey, value) => toggleRule.mutate({ ruleKey, value, auditDate: format(new Date(), 'yyyy-MM-dd') })}
                    isLoading={toggleRule.isPending}
                  />
                  <div className="mt-4 text-center">
                    <Link to="/reset">
                      <Button variant="outline" size="sm">
                        Open Full Reset Page
                      </Button>
                    </Link>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
