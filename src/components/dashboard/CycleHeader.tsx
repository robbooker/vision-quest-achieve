import { Cycle } from '@/hooks/useCycles';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

interface CycleHeaderProps {
  cycle: Cycle;
  currentWeek: number;
}

export function CycleHeader({ cycle, currentWeek }: CycleHeaderProps) {
  const isReviewWeek = currentWeek === 7;
  const isPlanningWeek = currentWeek === 8;
  const isResetPeriod = isReviewWeek || isPlanningWeek;
  const endDate = new Date(cycle.end_date);
  const today = new Date();
  const daysRemaining = differenceInDays(endDate, today);

  const getStatusBadge = () => {
    if (isReviewWeek) {
      return <Badge variant="secondary">Week 7: Review</Badge>;
    }
    if (isPlanningWeek) {
      return <Badge variant="outline">Week 8: Planning</Badge>;
    }
    switch (cycle.status) {
      case 'planning':
        return <Badge variant="outline">Planning</Badge>;
      case 'active':
        return <Badge>Active</Badge>;
      case 'completed':
        return <Badge variant="secondary">Completed</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-foreground">{cycle.name}</h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {format(new Date(cycle.start_date), 'MMM d')} – {format(endDate, 'MMM d, yyyy')}
            </span>
            {daysRemaining > 0 && !isResetPeriod && (
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {daysRemaining} days remaining
              </span>
            )}
          </div>
        </div>
        {getStatusBadge()}
      </div>

      {/* Week indicator */}
      <div className="rounded-lg border bg-card p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-muted-foreground">Progress</span>
          <span className="text-sm font-medium">
            {isReviewWeek ? 'Review Week' : isPlanningWeek ? 'Planning Week' : `Week ${currentWeek} of 6`}
          </span>
        </div>
        
        {/* Week progress bar */}
        <div className="flex gap-1">
          {Array.from({ length: 6 }, (_, i) => i + 1).map((week) => (
            <div
              key={week}
              className={`h-2 flex-1 rounded-sm transition-colors ${
                week < currentWeek
                  ? 'bg-primary'
                  : week === currentWeek && !isResetPeriod
                  ? 'bg-primary/60'
                  : 'bg-muted'
              }`}
              title={`Week ${week}`}
            />
          ))}
          {/* Week 7-8 indicator (reset period) */}
          <div
            className={`h-2 w-3 rounded-sm transition-colors ${
              isReviewWeek ? 'bg-secondary' : 'bg-muted'
            }`}
            title="Week 7 (Review)"
          />
          <div
            className={`h-2 w-3 rounded-sm transition-colors ${
              isPlanningWeek ? 'bg-secondary' : 'bg-muted'
            }`}
            title="Week 8 (Planning)"
          />
        </div>
      </div>
    </div>
  );
}
