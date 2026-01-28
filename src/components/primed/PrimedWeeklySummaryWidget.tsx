import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { usePrimedWeeklySummary } from '@/hooks/usePrimedWeeklySummary';
import { PILLARS, PillarKey } from '@/data/primedBehaviors';
import { Hexagon, Clock, CheckSquare, AlertCircle, TrendingUp, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function PrimedWeeklySummaryWidget() {
  const { pillarData, recommendations, totalFocusMinutes, totalTasks, isLoading } = usePrimedWeeklySummary();

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Find max activity for scaling
  const maxActivity = Math.max(...pillarData.map(p => p.totalActivity), 1);

  // Get priority recommendation
  const priorityRec = recommendations.find(r => r.priority === 'high') || recommendations[0];

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Hexagon className="h-4 w-4 text-primary" />
            P.R.I.M.E.D. This Week
          </CardTitle>
          <Link to="/primed">
            <Button variant="ghost" size="sm" className="h-7 text-xs">
              View All
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Stats */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{totalFocusMinutes}m</span>
            <span className="text-muted-foreground">focused</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{totalTasks}</span>
            <span className="text-muted-foreground">tasks</span>
          </div>
        </div>

        {/* Pillar Balance Bars */}
        <div className="space-y-2">
          {pillarData.slice(0, 6).map((p) => {
            const pillarInfo = PILLARS[p.pillar];
            const percentage = (p.totalActivity / maxActivity) * 100;
            
            return (
              <div key={p.pillar} className="flex items-center gap-2">
                <div 
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground flex-shrink-0"
                  style={{ backgroundColor: pillarInfo.color }}
                >
                  {pillarInfo.letter}
                </div>
                <div className="flex-1">
                  <Progress 
                    value={percentage} 
                    className="h-2"
                  />
                </div>
                <span className="text-xs text-muted-foreground w-12 text-right">
                  {p.focusMinutes > 0 && `${p.focusMinutes}m`}
                  {p.focusMinutes === 0 && p.tasksCompleted > 0 && `${p.tasksCompleted}t`}
                  {p.totalActivity === 0 && '—'}
                </span>
              </div>
            );
          })}
        </div>

        {/* Priority Recommendation */}
        {priorityRec && (
          <div className={`rounded-lg p-3 text-sm ${
            priorityRec.priority === 'high' 
              ? 'bg-destructive/10 border border-destructive/20' 
              : priorityRec.priority === 'medium'
              ? 'bg-amber-500/10 border border-amber-500/20'
              : 'bg-primary/5 border border-primary/20'
          }`}>
            <div className="flex items-start gap-2">
              {priorityRec.priority === 'high' ? (
                <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
              ) : priorityRec.priority === 'medium' ? (
                <TrendingUp className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
              ) : (
                <Sparkles className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              )}
              <div>
                <p className={`font-medium ${
                  priorityRec.priority === 'high' 
                    ? 'text-destructive' 
                    : priorityRec.priority === 'medium'
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-primary'
                }`}>
                  {priorityRec.pillarName}
                </p>
                <p className="text-muted-foreground text-xs mt-0.5">
                  {priorityRec.message}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
