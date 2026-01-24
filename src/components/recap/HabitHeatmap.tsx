import { useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, startOfWeek, addDays } from 'date-fns';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface HabitHeatmapProps {
  month: string; // Format: YYYY-MM
  data: Record<string, number>; // { "2024-01-15": 3, ... } - count of habits completed per day
  maxValue?: number;
}

export function HabitHeatmap({ month, data, maxValue: providedMax }: HabitHeatmapProps) {
  const { days, weekLabels, maxValue } = useMemo(() => {
    const monthStart = startOfMonth(new Date(month + '-01'));
    const monthEnd = endOfMonth(monthStart);
    
    // Get all days in the month
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    // Calculate the max value for color scaling
    const values = Object.values(data);
    const max = providedMax || Math.max(...values, 1);
    
    // Calculate week labels (Sun-Sat)
    const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    
    return {
      days: daysInMonth,
      weekLabels: weekDays,
      maxValue: max,
    };
  }, [month, data, providedMax]);

  // Get color intensity based on value (0-4 levels like GitHub)
  const getIntensity = (value: number): number => {
    if (value === 0) return 0;
    const ratio = value / maxValue;
    if (ratio <= 0.25) return 1;
    if (ratio <= 0.5) return 2;
    if (ratio <= 0.75) return 3;
    return 4;
  };

  // Organize days into a grid (7 rows for days of week, columns for weeks)
  const grid = useMemo(() => {
    const weeks: (Date | null)[][] = [];
    let currentWeek: (Date | null)[] = [];
    
    // Fill in empty days at the start
    const firstDayOfWeek = getDay(days[0]);
    for (let i = 0; i < firstDayOfWeek; i++) {
      currentWeek.push(null);
    }
    
    days.forEach((day) => {
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
      currentWeek.push(day);
    });
    
    // Fill in empty days at the end
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    weeks.push(currentWeek);
    
    return weeks;
  }, [days]);

  const monthLabel = format(new Date(month + '-01'), 'MMMM yyyy');

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Daily Activity</h4>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>Less</span>
          <div className="flex gap-0.5">
            {[0, 1, 2, 3, 4].map((level) => (
              <div
                key={level}
                className={cn(
                  "w-3 h-3 rounded-sm",
                  level === 0 && "bg-muted",
                  level === 1 && "bg-primary/20",
                  level === 2 && "bg-primary/40",
                  level === 3 && "bg-primary/60",
                  level === 4 && "bg-primary"
                )}
              />
            ))}
          </div>
          <span>More</span>
        </div>
      </div>

      <div className="flex gap-1">
        {/* Day labels */}
        <div className="flex flex-col gap-0.5 pr-1">
          {weekLabels.map((label, i) => (
            <div
              key={i}
              className="w-3 h-3 text-[9px] text-muted-foreground flex items-center justify-center"
            >
              {i % 2 === 1 ? label : ''}
            </div>
          ))}
        </div>

        {/* Heatmap grid */}
        <div className="flex gap-0.5 overflow-x-auto">
          {grid.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-0.5">
              {week.map((day, dayIndex) => {
                if (!day) {
                  return (
                    <div
                      key={dayIndex}
                      className="w-3 h-3 rounded-sm"
                    />
                  );
                }

                const dateKey = format(day, 'yyyy-MM-dd');
                const value = data[dateKey] || 0;
                const intensity = getIntensity(value);

                return (
                  <Tooltip key={dayIndex}>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          "w-3 h-3 rounded-sm cursor-default transition-colors",
                          intensity === 0 && "bg-muted hover:bg-muted/80",
                          intensity === 1 && "bg-primary/20 hover:bg-primary/30",
                          intensity === 2 && "bg-primary/40 hover:bg-primary/50",
                          intensity === 3 && "bg-primary/60 hover:bg-primary/70",
                          intensity === 4 && "bg-primary hover:bg-primary/90"
                        )}
                      />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      <p className="font-medium">{format(day, 'MMM d, yyyy')}</p>
                      <p className="text-muted-foreground">
                        {value === 0 ? 'No activity' : `${value} habit${value === 1 ? '' : 's'} completed`}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
