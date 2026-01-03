import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useTerminalMode } from '@/hooks/useTerminalMode';
import { useResetAudits } from '@/hooks/useResetAudits';
import { AuditStrip } from '@/components/reset/AuditStrip';
import { DailyAuditChecklist } from '@/components/reset/DailyAuditChecklist';
import { PhaseIndicator } from '@/components/reset/PhaseIndicator';
import { cn } from '@/lib/utils';
import { RotateCcw } from 'lucide-react';

export default function Reset() {
  const { isTerminal } = useTerminalMode();
  const { 
    audits, 
    todayAudit, 
    isLoading, 
    getScore, 
    getCurrentPhase, 
    toggleRule, 
    updateNote 
  } = useResetAudits();

  const [note, setNote] = useState('');
  const [noteSaved, setNoteSaved] = useState(false);

  // Initialize note from today's audit
  useEffect(() => {
    if (todayAudit?.post_op_note) {
      setNote(todayAudit.post_op_note);
    }
  }, [todayAudit]);

  const handleSaveNote = () => {
    updateNote.mutate(note, {
      onSuccess: () => {
        setNoteSaved(true);
        setTimeout(() => setNoteSaved(false), 2000);
      },
    });
  };

  const phase = getCurrentPhase();
  const todayScore = getScore(todayAudit);

  return (
    <DashboardLayout>
      <Helmet>
        <title>7-Day Reset | GP 🌸</title>
        <meta name="description" content="The 7-Day Reset - A system stabilization protocol for pure reliability." />
      </Helmet>

      <div className="space-y-6 max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <RotateCcw className="h-6 w-6 text-primary" />
            <h1 className={cn(
              "text-2xl font-bold",
              isTerminal && "font-mono text-[hsl(34,100%,58%)]"
            )}>
              {isTerminal ? '7-DAY RESET <GO>' : 'The 7-Day Reset'}
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {isTerminal 
              ? 'OPERATIONAL AUDIT • 8/8 OR THE DAY DOESN\'T COUNT'
              : 'System stabilization protocol. 8/8 or the day doesn\'t count.'}
          </p>
        </div>

        {/* Phase Indicator */}
        <PhaseIndicator phase={phase} />

        {/* 7-Day Audit Strip */}
        <Card className={cn(isTerminal && "border-[hsl(0,0%,20%)] rounded-none")}>
          <CardHeader className="pb-3">
            <CardTitle className={cn(
              "text-sm font-medium text-muted-foreground uppercase tracking-wider text-center",
              isTerminal && "font-mono"
            )}>
              {isTerminal ? 'AUDIT STRIP' : '7-Day Arc'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AuditStrip audits={audits} />
          </CardContent>
        </Card>

        {/* Daily Audit Checklist */}
        <Card className={cn(isTerminal && "border-[hsl(0,0%,20%)] rounded-none")}>
          <CardHeader className="pb-3">
            <CardTitle className={cn(
              "text-sm font-medium text-muted-foreground uppercase tracking-wider",
              isTerminal && "font-mono"
            )}>
              {isTerminal ? 'DAILY AUDIT' : 'Today\'s Checklist'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <DailyAuditChecklist
              todayAudit={todayAudit}
              onToggle={(ruleKey, value) => toggleRule.mutate({ ruleKey, value })}
              isLoading={toggleRule.isPending}
            />
          </CardContent>
        </Card>

        {/* Post-Operational Note */}
        <Card className={cn(isTerminal && "border-[hsl(0,0%,20%)] rounded-none")}>
          <CardHeader className="pb-3">
            <CardTitle className={cn(
              "text-sm font-medium text-muted-foreground uppercase tracking-wider",
              isTerminal && "font-mono"
            )}>
              {isTerminal ? 'POST-OPERATIONAL NOTE' : 'End-of-Day Reflection'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              What actually mattered today?
            </p>
            <div className="flex gap-2">
              <Input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="One sentence..."
                className={cn(
                  "flex-1",
                  isTerminal && "rounded-none border-[hsl(0,0%,20%)] font-mono"
                )}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSaveNote();
                  }
                }}
              />
              <Button
                onClick={handleSaveNote}
                disabled={updateNote.isPending}
                variant={noteSaved ? 'default' : 'secondary'}
                className={cn(isTerminal && "rounded-none")}
              >
                {noteSaved ? 'Saved' : 'Save'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Score Summary */}
        {todayScore === 8 && (
          <div className="text-center py-4">
            <span className={cn(
              "text-lg font-bold text-[hsl(160,88%,63%)]",
              isTerminal && "font-mono"
            )}>
              ✓ OPERATIONAL EXCELLENCE ACHIEVED
            </span>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
