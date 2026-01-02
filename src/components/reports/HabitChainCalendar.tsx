import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ChevronLeft, ChevronRight, Flame, Link2 } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, getDay, isSameDay, isFuture } from 'date-fns';
import { useHabitChainData, GoalHabitChain, HabitDayStatus } from '@/hooks/useHabitChainData';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface HabitChainCalendarProps {
  className?: string;
}

export function HabitChainCalendar({ className }: HabitChainCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { goalChains, isLoading, getCurrentStreak } = useHabitChainData(currentMonth);

  const handlePrevMonth = () => setCurrentMonth(prev => subMonths(prev, 1));
  const handleNextMonth = () => setCurrentMonth(prev => addMonths(prev, 1));

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (goalChains.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Link2 className="h-4 w-4" />
            Habit Chains
          </CardTitle>
          <CardDescription>Track your daily habit streaks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
            <Link2 className="h-8 w-8 mb-2" />
            <p>No daily habits found.</p>
            <p className="text-sm">Add daily tactics to your goals to track habit chains.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Link2 className="h-5 w-5" />
          Habit Chains
        </h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-medium min-w-[120px] text-center">
            {format(currentMonth, 'MMMM yyyy')}
          </span>
          <Button variant="outline" size="icon" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Goal Calendars */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {goalChains.map(chain => (
          <GoalChainCard
            key={chain.goalId}
            chain={chain}
            streak={getCurrentStreak(chain.goalId)}
          />
        ))}
      </div>
    </div>
  );
}

interface GoalChainCardProps {
  chain: GoalHabitChain;
  streak: number;
}

function GoalChainCard({ chain, streak }: GoalChainCardProps) {
  const monthStart = startOfMonth(chain.days[0]?.date || new Date());
  const firstDayOfWeek = getDay(monthStart);
  
  // Pad the beginning with empty cells
  const paddedDays: (HabitDayStatus | null)[] = [
    ...Array(firstDayOfWeek).fill(null),
    ...chain.days,
  ];

  const today = new Date();

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="text-sm font-medium truncate">
              {chain.goalTitle}
            </CardTitle>
            <CardDescription className="text-xs">
              {chain.tactics.length} habit{chain.tactics.length !== 1 ? 's' : ''}
            </CardDescription>
          </div>
          {streak > 0 && (
            <Badge variant="secondary" className="flex items-center gap-1 shrink-0">
              <Flame className="h-3 w-3 text-orange-500" />
              {streak}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {WEEKDAYS.map(day => (
            <div
              key={day}
              className="text-[10px] text-muted-foreground text-center font-medium"
            >
              {day[0]}
            </div>
          ))}
        </div>
        
        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {paddedDays.map((day, index) => (
            <DayCell
              key={index}
              day={day}
              isToday={day ? isSameDay(day.date, today) : false}
              isFutureDay={day ? isFuture(day.date) : false}
              tacticCount={chain.tactics.length}
            />
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-3 text-[10px] text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-green-500" />
            <span>Done</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-destructive" />
            <span>Missed</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-muted" />
            <span>Future</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface DayCellProps {
  day: HabitDayStatus | null;
  isToday: boolean;
  isFutureDay: boolean;
  tacticCount: number;
}

function DayCell({ day, isToday, isFutureDay, tacticCount }: DayCellProps) {
  if (!day) {
    return <div className="aspect-square" />;
  }

  const dayNumber = format(day.date, 'd');

  // For future days, show neutral
  if (isFutureDay && !isToday) {
    return (
      <div className="aspect-square rounded-sm bg-muted flex items-center justify-center">
        <span className="text-[10px] text-muted-foreground">{dayNumber}</span>
      </div>
    );
  }

  // Single habit: simple green/red
  if (tacticCount === 1) {
    const isCompleted = day.allCompleted;
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "aspect-square rounded-sm flex items-center justify-center cursor-default transition-colors",
              isCompleted ? "bg-green-500" : "bg-destructive",
              isToday && "ring-2 ring-primary ring-offset-1 ring-offset-background"
            )}
          >
            <span className={cn(
              "text-[10px] font-medium",
              isCompleted ? "text-green-50" : "text-destructive-foreground"
            )}>
              {dayNumber}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">
            {format(day.date, 'MMM d')} - {isCompleted ? 'Completed' : 'Missed'}
          </p>
        </TooltipContent>
      </Tooltip>
    );
  }

  // Multiple habits: show split cells
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            "aspect-square rounded-sm overflow-hidden cursor-default relative",
            isToday && "ring-2 ring-primary ring-offset-1 ring-offset-background"
          )}
        >
          <MultiHabitCell day={day} tacticCount={tacticCount} />
          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-medium text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]">
            {dayNumber}
          </span>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <div className="text-xs space-y-1">
          <p className="font-medium">{format(day.date, 'MMM d')}</p>
          <p>
            {day.tactics.filter(t => t.completed).length}/{day.tactics.length} habits
          </p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

function MultiHabitCell({ day, tacticCount }: { day: HabitDayStatus; tacticCount: number }) {
  // Create a grid layout based on number of tactics
  const getGridLayout = () => {
    if (tacticCount === 2) return 'grid-cols-2';
    if (tacticCount === 3) return 'grid-cols-3';
    if (tacticCount === 4) return 'grid-cols-2 grid-rows-2';
    return 'grid-cols-2'; // fallback
  };

  return (
    <div className={cn("grid h-full w-full", getGridLayout())}>
      {day.tactics.map((tactic, idx) => (
        <div
          key={idx}
          className={cn(
            "w-full h-full",
            tactic.completed ? "bg-green-500" : "bg-destructive"
          )}
        />
      ))}
    </div>
  );
}
