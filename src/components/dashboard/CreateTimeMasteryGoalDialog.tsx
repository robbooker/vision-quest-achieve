import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { useGoals } from '@/hooks/useGoals';
import { useGoalSchedules } from '@/hooks/useGoalSchedules';
import { useTactics } from '@/hooks/useTactics';
import { useMilestones } from '@/hooks/useMilestones';
import { useCalendarConnection } from '@/hooks/useCalendar';
import { useToast } from '@/hooks/use-toast';
import { AIHelpButton } from './AIHelpButton';
import { ArrowLeft, ArrowRight, Clock, Check, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CreateTimeMasteryGoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cycleId: string;
  existingGoalsCount: number;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sun' },
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
];

const DURATION_OPTIONS = [15, 30, 45, 60, 90, 120];

export function CreateTimeMasteryGoalDialog({
  open,
  onOpenChange,
  cycleId,
  existingGoalsCount,
}: CreateTimeMasteryGoalDialogProps) {
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [inspiration, setInspiration] = useState('');
  const [goalTitle, setGoalTitle] = useState('');
  const [skillArea, setSkillArea] = useState('');
  const [why, setWhy] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]); // Mon-Fri default
  const [startTimes, setStartTimes] = useState<Record<number, string>>({});
  const [activities, setActivities] = useState(['', '', '']);
  const [reviewDay, setReviewDay] = useState(0); // Sunday default
  const [milestones, setMilestones] = useState(['', '', '']);
  const [addToCalendar, setAddToCalendar] = useState(true);

  const { createGoal } = useGoals(cycleId);
  const { createMultipleSchedules } = useGoalSchedules();
  const { createTactic } = useTactics();
  const { createMilestone } = useMilestones();
  const { isConnected: calendarConnected } = useCalendarConnection();
  const { toast } = useToast();

  const totalSteps = 8;

  const resetForm = () => {
    setStep(0);
    setInspiration('');
    setGoalTitle('');
    setSkillArea('');
    setWhy('');
    setDurationMinutes(30);
    setSelectedDays([1, 2, 3, 4, 5]);
    setStartTimes({});
    setActivities(['', '', '']);
    setReviewDay(0);
    setMilestones(['', '', '']);
    setAddToCalendar(true);
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const handleDayToggle = (day: number) => {
    setSelectedDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day].sort()
    );
  };

  const handleActivityChange = (index: number, value: string) => {
    const newActivities = [...activities];
    newActivities[index] = value;
    setActivities(newActivities);
  };

  const handleMilestoneChange = (index: number, value: string) => {
    const newMilestones = [...milestones];
    newMilestones[index] = value;
    setMilestones(newMilestones);
  };

  const handleSubmit = async () => {
  if (existingGoalsCount >= 6) {
      toast({
        title: 'Maximum goals reached',
        description: 'You can have a maximum of 6 goals per cycle.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Create the goal
      const goal = await createGoal.mutateAsync({
        cycle_id: cycleId,
        title: goalTitle.trim(),
        metric_type: 'minutes',
        target_value: durationMinutes * selectedDays.length * 6, // Total minutes over 6 weeks
        why: why.trim() || undefined,
        goal_type: 'time_mastery',
      });

      // 2. Create schedules for selected days
      const scheduleInputs = selectedDays.map(day => ({
        goal_id: goal.id,
        day_of_week: day,
        duration_minutes: durationMinutes,
        start_time: startTimes[day] || undefined,
        end_time: startTimes[day] ? calculateEndTime(startTimes[day], durationMinutes) : undefined,
      }));
      await createMultipleSchedules.mutateAsync(scheduleInputs);

      // 3. Create tactics for activities
      const validActivities = activities.filter(a => a.trim());
      for (const activity of validActivities) {
        await createTactic.mutateAsync({
          goal_id: goal.id,
          title: activity.trim(),
          frequency: 'daily',
          target_count: 1,
        });
      }

      // 4. Create weekly review tactic
      await createTactic.mutateAsync({
        goal_id: goal.id,
        title: 'Weekly progress review',
        frequency: 'weekly',
        target_count: 1,
      });

      // 5. Create milestones
      const validMilestones = milestones.filter(m => m.trim());
      const weekNumbers = [2, 4, 6];
      for (let i = 0; i < validMilestones.length; i++) {
        await createMilestone.mutateAsync({
          goal_id: goal.id,
          week_number: weekNumbers[i] || weekNumbers[weekNumbers.length - 1],
          target_value: (i + 1) * (100 / validMilestones.length),
          description: validMilestones[i].trim(),
        });
      }

      // TODO: 6. Add calendar events if connected and enabled
      // This would call the google-calendar-create-event function for recurring events

      toast({
        title: 'Time-Mastery Goal Created!',
        description: `"${goalTitle}" is ready. Your practice schedule has been set up.`,
      });

      handleClose();
    } catch (error) {
      console.error('Failed to create time-mastery goal:', error);
      toast({
        title: 'Error',
        description: 'Failed to create goal. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateEndTime = (startTime: string, duration: number): string => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + duration;
    const endHours = Math.floor(totalMinutes / 60) % 24;
    const endMinutes = totalMinutes % 60;
    return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
  };

  const canProceed = () => {
    switch (step) {
      case 0: return true; // Inspiration is optional
      case 1: return goalTitle.trim().length > 0;
      case 2: return true; // Duration has default
      case 3: return selectedDays.length > 0;
      case 4: return activities.some(a => a.trim().length > 0);
      case 5: return true; // Review day has default
      case 6: return milestones.some(m => m.trim().length > 0);
      case 7: return true; // Review step
      default: return false;
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-4 py-4">
            <div className="text-center space-y-3">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold">Start with a powerful question</h3>
              <p className="text-muted-foreground text-sm max-w-md mx-auto">
                If you spent dedicated time every day for the next 6 weeks mastering something, what would be possible?
              </p>
            </div>
            <Textarea
              placeholder="Write your thoughts... What skill do you want to develop? What could you achieve?"
              value={inspiration}
              onChange={(e) => setInspiration(e.target.value)}
              rows={4}
              className="mt-4"
            />
          </div>
        );

      case 1:
        return (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="goalTitle">What do you want to master?</Label>
                <AIHelpButton
                  helpType="goal_name"
                  context={{ skillArea }}
                  onSuggestionSelect={setGoalTitle}
                />
              </div>
              <Input
                id="goalTitle"
                placeholder="e.g., Conversational Spanish, Jazz piano basics"
                value={goalTitle}
                onChange={(e) => setGoalTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="skillArea">Skill category (optional)</Label>
              <Input
                id="skillArea"
                placeholder="e.g., Language, Music, Coding, Writing"
                value={skillArea}
                onChange={(e) => setSkillArea(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="why">Why is this important to you?</Label>
              <Textarea
                id="why"
                placeholder="Your motivation..."
                value={why}
                onChange={(e) => setWhy(e.target.value)}
                rows={2}
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>How long will each practice session be?</Label>
                <AIHelpButton
                  helpType="time_commitment"
                  context={{ skillArea, goalTitle }}
                  onSuggestionSelect={(s) => {
                    const match = s.match(/(\d+)\s*min/i);
                    if (match) setDurationMinutes(parseInt(match[1]));
                  }}
                />
              </div>
            </div>
            <div className="flex items-center justify-center gap-4 py-4">
              <Clock className="h-8 w-8 text-primary" />
              <span className="text-4xl font-bold">{durationMinutes}</span>
              <span className="text-xl text-muted-foreground">minutes</span>
            </div>
            <Slider
              value={[durationMinutes]}
              onValueChange={([v]) => setDurationMinutes(v)}
              min={15}
              max={120}
              step={15}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              {DURATION_OPTIONS.map(d => (
                <button 
                  key={d} 
                  onClick={() => setDurationMinutes(d)}
                  className={cn(
                    "px-2 py-1 rounded",
                    durationMinutes === d && "bg-primary/10 text-primary"
                  )}
                >
                  {d}m
                </button>
              ))}
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Research shows 30-60 minutes of focused practice is optimal for most skills.
            </p>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Which days will you practice?</Label>
                <AIHelpButton
                  helpType="schedule"
                  context={{ skillArea, goalTitle, durationMinutes }}
                  onSuggestionSelect={() => {}}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Select the days and optionally set a specific time.
              </p>
            </div>
            <div className="grid grid-cols-7 gap-2">
              {DAYS_OF_WEEK.map(day => (
                <button
                  key={day.value}
                  onClick={() => handleDayToggle(day.value)}
                  className={cn(
                    "py-3 rounded-lg text-sm font-medium transition-colors",
                    selectedDays.includes(day.value)
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-muted/80"
                  )}
                >
                  {day.label}
                </button>
              ))}
            </div>
            {selectedDays.length > 0 && (
              <div className="space-y-2 pt-4">
                <Label>Set practice times (optional)</Label>
                <div className="grid gap-2">
                  {selectedDays.map(day => {
                    const dayLabel = DAYS_OF_WEEK.find(d => d.value === day)?.label;
                    return (
                      <div key={day} className="flex items-center gap-3">
                        <span className="w-12 text-sm">{dayLabel}</span>
                        <Input
                          type="time"
                          value={startTimes[day] || ''}
                          onChange={(e) => setStartTimes(prev => ({ ...prev, [day]: e.target.value }))}
                          className="w-32"
                        />
                        {startTimes[day] && (
                          <span className="text-sm text-muted-foreground">
                            to {calculateEndTime(startTimes[day], durationMinutes)}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            <p className="text-sm text-muted-foreground">
              Total: {durationMinutes * selectedDays.length} minutes per week
            </p>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>What will you do during each practice session?</Label>
                <AIHelpButton
                  helpType="activities"
                  context={{ skillArea, goalTitle, durationMinutes }}
                  onSuggestionSelect={(s) => {
                    const emptyIndex = activities.findIndex(a => !a.trim());
                    if (emptyIndex !== -1) {
                      handleActivityChange(emptyIndex, s);
                    }
                  }}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Define 2-3 specific activities for your practice sessions.
              </p>
            </div>
            <div className="space-y-3">
              {activities.map((activity, index) => (
                <div key={index} className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Activity {index + 1}</Label>
                  <Input
                    placeholder={
                      index === 0 ? "e.g., Practice vocabulary flashcards" :
                      index === 1 ? "e.g., Listen to podcast in target language" :
                      "e.g., Write a journal entry"
                    }
                    value={activity}
                    onChange={(e) => handleActivityChange(index, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Which day will you do your weekly review?</Label>
                <AIHelpButton
                  helpType="review"
                  context={{ skillArea, goalTitle }}
                  onSuggestionSelect={() => {}}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Set aside one day each week to reflect on your progress.
              </p>
            </div>
            <div className="grid grid-cols-7 gap-2">
              {DAYS_OF_WEEK.map(day => (
                <button
                  key={day.value}
                  onClick={() => setReviewDay(day.value)}
                  className={cn(
                    "py-3 rounded-lg text-sm font-medium transition-colors",
                    reviewDay === day.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-muted/80"
                  )}
                >
                  {day.label}
                </button>
              ))}
            </div>
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <p className="text-sm font-medium">During your weekly review, consider:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• What went well this week?</li>
                <li>• What needs adjustment?</li>
                <li>• Is my practice approach working?</li>
              </ul>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Define 3 milestones to track your progress</Label>
                <AIHelpButton
                  helpType="milestones"
                  context={{ skillArea, goalTitle, activities: activities.filter(a => a.trim()) }}
                  onSuggestionSelect={(s) => {
                    const emptyIndex = milestones.findIndex(m => !m.trim());
                    if (emptyIndex !== -1) {
                      handleMilestoneChange(emptyIndex, s);
                    }
                  }}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                What observable achievements will show you're making progress?
              </p>
            </div>
            <div className="space-y-3">
              {milestones.map((milestone, index) => (
                <div key={index} className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    Week {index === 0 ? 2 : index === 1 ? 4 : 6} Milestone
                  </Label>
                  <Input
                    placeholder={
                      index === 0 ? "e.g., Complete beginner course" :
                      index === 1 ? "e.g., Have a 5-minute conversation" :
                      "e.g., Read a short article without help"
                    }
                    value={milestone}
                    onChange={(e) => handleMilestoneChange(index, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>
        );

      case 7:
        return (
          <div className="space-y-4 py-4">
            <h3 className="font-semibold text-lg">Review Your Goal</h3>
            
            <div className="space-y-3">
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Goal</p>
                <p className="font-medium">{goalTitle}</p>
              </div>

              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Schedule</p>
                <p className="font-medium">
                  {durationMinutes} min/day on {selectedDays.map(d => DAYS_OF_WEEK.find(day => day.value === d)?.label).join(', ')}
                </p>
                <p className="text-sm text-muted-foreground">
                  = {durationMinutes * selectedDays.length} min/week
                </p>
              </div>

              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Daily Activities</p>
                <ul className="text-sm">
                  {activities.filter(a => a.trim()).map((a, i) => (
                    <li key={i}>• {a}</li>
                  ))}
                </ul>
              </div>

              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Milestones</p>
                <ul className="text-sm">
                  {milestones.filter(m => m.trim()).map((m, i) => (
                    <li key={i}>• Week {i === 0 ? 2 : i === 1 ? 4 : 6}: {m}</li>
                  ))}
                </ul>
              </div>
            </div>

            {calendarConnected && (
              <div className="flex items-center space-x-2 pt-2">
                <Checkbox
                  id="addToCalendar"
                  checked={addToCalendar}
                  onCheckedChange={(checked) => setAddToCalendar(checked === true)}
                />
                <Label htmlFor="addToCalendar" className="text-sm">
                  Add practice sessions to my Google Calendar
                </Label>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Time-Mastery Goal
          </DialogTitle>
          <DialogDescription>
            Step {step + 1} of {totalSteps}
          </DialogDescription>
        </DialogHeader>

        {/* Progress indicator */}
        <div className="flex gap-1">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors",
                i <= step ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>

        {renderStep()}

        <div className="flex justify-between pt-4">
          <Button
            variant="outline"
            onClick={() => step > 0 ? setStep(step - 1) : handleClose()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {step > 0 ? 'Back' : 'Cancel'}
          </Button>

          {step < totalSteps - 1 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canProceed()}>
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isSubmitting || !canProceed()}>
              {isSubmitting ? 'Creating...' : 'Create Goal'}
              <Check className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
