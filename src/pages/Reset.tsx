import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { format, subDays } from 'date-fns';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useTerminalMode } from '@/hooks/useTerminalMode';
import { useResetAudits } from '@/hooks/useResetAudits';
import { useResetPreference } from '@/hooks/useResetPreference';
import { AuditStrip } from '@/components/reset/AuditStrip';
import { DailyAuditChecklist } from '@/components/reset/DailyAuditChecklist';
import { PhaseIndicator } from '@/components/reset/PhaseIndicator';
import { cn } from '@/lib/utils';
import { RotateCcw, BookOpen, X, ChevronLeft, ChevronRight } from 'lucide-react';

export default function Reset() {
  const { isTerminal } = useTerminalMode();
  const { 
    audits, 
    todayAudit, 
    getAuditForDate,
    getScore, 
    getCurrentPhase, 
    toggleRule, 
    updateNote 
  } = useResetAudits();
  const { isResetActive, startReset, endReset, isLoading: prefLoading } = useResetPreference();

  const today = format(new Date(), 'yyyy-MM-dd');
  const [selectedDate, setSelectedDate] = useState(today);
  const [note, setNote] = useState('');
  const [noteSaved, setNoteSaved] = useState(false);

  // Get the audit for selected date
  const selectedAudit = getAuditForDate(selectedDate);

  // Initialize note from selected day's audit
  useEffect(() => {
    if (selectedAudit?.post_op_note) {
      setNote(selectedAudit.post_op_note);
    } else {
      setNote('');
    }
  }, [selectedAudit, selectedDate]);

  const handleSaveNote = () => {
    updateNote.mutate({ note, auditDate: selectedDate }, {
      onSuccess: () => {
        setNoteSaved(true);
        setTimeout(() => setNoteSaved(false), 2000);
      },
    });
  };

  const phase = getCurrentPhase();
  const selectedScore = getScore(selectedAudit);
  const isToday = selectedDate === today;

  // Opt-in screen when reset is not active
  if (!prefLoading && !isResetActive) {
    return (
      <DashboardLayout>
        <Helmet>
          <title>7-Day Reset | GP 🌸</title>
          <meta name="description" content="The 7-Day Reset - A system stabilization protocol for pure reliability." />
        </Helmet>

        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className={cn(
            "max-w-md w-full",
            isTerminal && "border-[hsl(0,0%,20%)] rounded-none"
          )}>
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <div className={cn(
                  "w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center",
                  isTerminal && "rounded-none"
                )}>
                  <RotateCcw className="h-8 w-8 text-primary" />
                </div>
              </div>
              <CardTitle className={cn(
                "text-2xl",
                isTerminal && "font-mono text-[hsl(34,100%,58%)]"
              )}>
                {isTerminal ? 'INITIATE 7-DAY RESET' : 'The 7-Day Reset'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-center text-muted-foreground">
                A system stabilization protocol for pure reliability. 8 rules. 7 days. No negotiation.
              </p>
              
              <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground space-y-2">
                <p><strong>01.</strong> WAKE — ±15 min target</p>
                <p><strong>02.</strong> MOVE — 30m intentional</p>
                <p><strong>03.</strong> WORK — 45m focused</p>
                <p><strong>04.</strong> READ — 10 pages</p>
                <p><strong>05.</strong> INPUT — No junk</p>
                <p><strong>06.</strong> SLEEP — Target bedtime</p>
                <p><strong>07.</strong> FUEL — 3 meals / protein</p>
                <p><strong>08.</strong> RESET — 0 sugar / 0 alc</p>
              </div>

              <div className="flex flex-col gap-3">
                <Button 
                  size="lg" 
                  onClick={() => startReset.mutate()}
                  disabled={startReset.isPending}
                  className={cn("w-full", isTerminal && "rounded-none")}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  {startReset.isPending ? 'Starting...' : 'Initiate Reset'}
                </Button>
                
                <Link to="/blog/reset" className="w-full">
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className={cn("w-full", isTerminal && "rounded-none")}
                  >
                    <BookOpen className="h-4 w-4 mr-2" />
                    Learn More
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // Active reset view
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
          
          {/* Exit Reset button */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-muted-foreground hover:text-destructive"
              >
                <X className="h-4 w-4 mr-1" />
                Exit Reset
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Exit the 7-Day Reset?</AlertDialogTitle>
                <AlertDialogDescription>
                  Your progress will be saved, but the Reset will no longer appear on your Today page. You can restart anytime.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Continue Reset</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={() => endReset.mutate()}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Exit Reset
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
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
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedDate(format(subDays(new Date(selectedDate), 1), 'yyyy-MM-dd'))}
                disabled={selectedDate <= format(subDays(new Date(), 6), 'yyyy-MM-dd')}
                className="h-8 w-8"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-center">
                <CardTitle className={cn(
                  "text-sm font-medium text-muted-foreground uppercase tracking-wider",
                  isTerminal && "font-mono"
                )}>
                  {isToday 
                    ? (isTerminal ? 'DAILY AUDIT' : "Today's Checklist")
                    : format(new Date(selectedDate), 'EEE, MMM d')}
                </CardTitle>
                {!isToday && (
                  <button 
                    onClick={() => setSelectedDate(today)}
                    className="text-xs text-primary hover:underline mt-1"
                  >
                    Back to Today
                  </button>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedDate(format(new Date(new Date(selectedDate).getTime() + 86400000), 'yyyy-MM-dd'))}
                disabled={selectedDate >= today}
                className="h-8 w-8"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <DailyAuditChecklist
              todayAudit={selectedAudit}
              onToggle={(ruleKey, value) => toggleRule.mutate({ ruleKey, value, auditDate: selectedDate })}
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
              {isToday ? 'What actually mattered today?' : `What mattered on ${format(new Date(selectedDate), 'MMM d')}?`}
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
        {selectedScore === 8 && (
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
