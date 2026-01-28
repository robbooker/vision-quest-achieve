import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { PILLARS, PillarKey } from '@/data/primedBehaviors';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { subDays, format } from 'date-fns';
import { TrendingUp, TrendingDown, Minus, Lightbulb, Clock, CheckSquare } from 'lucide-react';

interface PillarWeeklyData {
  pillar: PillarKey;
  focusMinutes: number;
  tasksCompleted: number;
  tasksTotal: number;
  habitsCompleted: number;
}

export function PrimedWeeklySummary() {
  const { user } = useAuth();
  const sevenDaysAgo = format(subDays(new Date(), 7), 'yyyy-MM-dd');

  const { data, isLoading } = useQuery({
    queryKey: ['primed-weekly-summary', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const pillars: PillarKey[] = ['physical', 'relations', 'income', 'mental', 'excellence', 'direction'];
      
      // Fetch all data in parallel
      const [focusResult, tasksResult, goalsResult, tacticsResult] = await Promise.all([
        // Focus sessions by pillar (last 7 days)
        supabase
          .from('focus_sessions')
          .select('pillar, actual_duration_minutes')
          .eq('user_id', user.id)
          .eq('status', 'completed')
          .not('pillar', 'is', null)
          .gte('started_at', sevenDaysAgo),
        
        // Tasks by pillar (last 7 days)
        supabase
          .from('quick_tasks')
          .select('pillar, completed, completed_at')
          .eq('user_id', user.id)
          .not('pillar', 'is', null)
          .gte('created_at', sevenDaysAgo),
        
        // Goals with pillars
        supabase
          .from('goals')
          .select('id, pillar')
          .eq('user_id', user.id)
          .not('pillar', 'is', null),
        
        // Tactic logs for the week (via goal -> tactic -> log)
        supabase
          .from('tactic_logs')
          .select(`
            completed_count,
            goal_tactics!inner(goal_id, goals!inner(pillar))
          `)
          .eq('user_id', user.id)
          .gte('logged_date', sevenDaysAgo),
      ]);

      // Build pillar data
      const pillarData: PillarWeeklyData[] = pillars.map(pillar => {
        const focusForPillar = focusResult.data?.filter(f => f.pillar === pillar) || [];
        const tasksForPillar = tasksResult.data?.filter(t => t.pillar === pillar) || [];
        
        // Count habit completions for goals in this pillar
        const goalsInPillar = goalsResult.data?.filter(g => g.pillar === pillar).map(g => g.id) || [];
        const habitsCompleted = tacticsResult.data?.filter((log: any) => {
          const goalId = log.goal_tactics?.goals?.id;
          return goalsInPillar.includes(goalId);
        }).reduce((sum: number, log: any) => sum + (log.completed_count || 0), 0) || 0;

        return {
          pillar,
          focusMinutes: focusForPillar.reduce((sum, f) => sum + (f.actual_duration_minutes || 0), 0),
          tasksCompleted: tasksForPillar.filter(t => t.completed).length,
          tasksTotal: tasksForPillar.length,
          habitsCompleted,
        };
      });

      // Calculate totals for percentages
      const totalFocus = pillarData.reduce((sum, p) => sum + p.focusMinutes, 0);
      const totalTasks = pillarData.reduce((sum, p) => sum + p.tasksCompleted, 0);

      return {
        pillarData,
        totalFocus,
        totalTasks,
      };
    },
    enabled: !!user?.id,
  });

  // Generate recommendations
  const recommendations = useMemo(() => {
    if (!data?.pillarData) return [];
    
    const recs: string[] = [];
    const sorted = [...data.pillarData].sort((a, b) => 
      (b.focusMinutes + b.tasksCompleted * 10) - (a.focusMinutes + a.tasksCompleted * 10)
    );
    
    // Find neglected pillars (bottom 2 with minimal activity)
    const neglected = sorted.filter(p => p.focusMinutes < 30 && p.tasksCompleted < 2).slice(-2);
    
    // Find over-invested pillars (top 1 with significantly more activity)
    const topPillar = sorted[0];
    const secondPillar = sorted[1];
    
    neglected.forEach(p => {
      const pillarName = PILLARS[p.pillar].name;
      if (p.focusMinutes === 0 && p.tasksCompleted === 0) {
        recs.push(`**${pillarName}** received no attention this week. Consider scheduling one focus block.`);
      } else if (p.focusMinutes < 30) {
        recs.push(`**${pillarName}** had minimal investment. Try adding a 30-minute focus session.`);
      }
    });

    // If one pillar dominates heavily, suggest balance
    if (topPillar && secondPillar) {
      const topScore = topPillar.focusMinutes + topPillar.tasksCompleted * 10;
      const secondScore = secondPillar.focusMinutes + secondPillar.tasksCompleted * 10;
      if (topScore > secondScore * 3 && topScore > 100) {
        recs.push(`Great focus on **${PILLARS[topPillar.pillar].name}**! Consider spreading energy to other pillars next week.`);
      }
    }

    // Celebrate wins
    const strongPillars = data.pillarData.filter(p => p.focusMinutes >= 60 && p.tasksCompleted >= 2);
    if (strongPillars.length >= 3) {
      recs.push(`Excellent balance! You invested meaningfully in ${strongPillars.length} pillars this week.`);
    }

    return recs.slice(0, 3);
  }, [data]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.totalFocus === 0 && data.totalTasks === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            P.R.I.M.E.D. Weekly Balance
          </CardTitle>
          <CardDescription>No pillar-tagged activity this week</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Tag your focus sessions and tasks with pillars to see your weekly balance here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="h-4 w-4" />
          P.R.I.M.E.D. Weekly Balance
        </CardTitle>
        <CardDescription>
          Last 7 days: {data.totalFocus}m focused · {data.totalTasks} tasks completed
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Pillar breakdown */}
        <div className="space-y-3">
          {data.pillarData.map(pillarData => {
            const pillarInfo = PILLARS[pillarData.pillar];
            const focusPercent = data.totalFocus > 0 ? (pillarData.focusMinutes / data.totalFocus) * 100 : 0;
            const hasActivity = pillarData.focusMinutes > 0 || pillarData.tasksCompleted > 0;
            
            return (
              <div key={pillarData.pillar} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground"
                      style={{ backgroundColor: pillarInfo.color }}
                    >
                      {pillarInfo.letter}
                    </div>
                    <span className="font-medium">{pillarInfo.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    {pillarData.focusMinutes > 0 && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {pillarData.focusMinutes}m
                      </span>
                    )}
                    {pillarData.tasksCompleted > 0 && (
                      <span className="flex items-center gap-1">
                        <CheckSquare className="h-3 w-3" />
                        {pillarData.tasksCompleted}
                      </span>
                    )}
                    {!hasActivity && (
                      <Badge variant="outline" className="text-xs">No activity</Badge>
                    )}
                  </div>
                </div>
                <Progress 
                  value={focusPercent} 
                  className="h-2"
                  style={{ 
                    '--progress-background': pillarInfo.color 
                  } as React.CSSProperties}
                />
              </div>
            );
          })}
        </div>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className="pt-4 border-t space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Lightbulb className="h-4 w-4 text-primary" />
              Recommendations for Next Week
            </div>
            <ul className="space-y-1.5">
              {recommendations.map((rec, i) => (
                <li key={i} className="text-xs text-muted-foreground">
                  <span dangerouslySetInnerHTML={{ __html: rec.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
