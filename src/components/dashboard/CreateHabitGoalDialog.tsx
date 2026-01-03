import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useGoals, HabitDirection } from '@/hooks/useGoals';
import { useTactics } from '@/hooks/useTactics';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, ArrowRight, Play, StopCircle, Repeat, Lightbulb, Star, Link2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CreateHabitGoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cycleId: string;
  existingGoalsCount: number;
}

type Step = 'direction' | 'habit_loop' | 'environment' | 'stakes' | 'accountability' | 'review';

const directionOptions: { type: HabitDirection; title: string; description: string; icon: React.ElementType }[] = [
  {
    type: 'start',
    title: 'Start a New Habit',
    description: 'Build a positive behavior from scratch',
    icon: Play,
  },
  {
    type: 'stop',
    title: 'Stop a Bad Habit',
    description: 'Break free from a destructive pattern',
    icon: StopCircle,
  },
  {
    type: 'replace',
    title: 'Replace a Habit',
    description: 'Swap a bad habit with a good one (most effective!)',
    icon: Repeat,
  },
];

const cueCategories = ['Time', 'Location', 'Emotion', 'Preceding Action', 'People'];

export function CreateHabitGoalDialog({
  open,
  onOpenChange,
  cycleId,
  existingGoalsCount,
}: CreateHabitGoalDialogProps) {
  const [step, setStep] = useState<Step>('direction');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [direction, setDirection] = useState<HabitDirection | null>(null);
  const [title, setTitle] = useState('');
  const [cue, setCue] = useState('');
  const [currentRoutine, setCurrentRoutine] = useState('');
  const [newRoutine, setNewRoutine] = useState('');
  const [reward, setReward] = useState('');
  const [craving, setCraving] = useState('');
  const [environmentChange, setEnvironmentChange] = useState('');
  const [implementationIntention, setImplementationIntention] = useState('');
  const [successVision, setSuccessVision] = useState('');
  const [riskStatement, setRiskStatement] = useState('');
  const [isKeystoneHabit, setIsKeystoneHabit] = useState(false);
  const [partnerEmail, setPartnerEmail] = useState('');
  
  const { createGoal } = useGoals(cycleId);
  const { createTactic } = useTactics();
  const { toast } = useToast();

  const resetForm = () => {
    setStep('direction');
    setDirection(null);
    setTitle('');
    setCue('');
    setCurrentRoutine('');
    setNewRoutine('');
    setReward('');
    setCraving('');
    setEnvironmentChange('');
    setImplementationIntention('');
    setSuccessVision('');
    setRiskStatement('');
    setIsKeystoneHabit(false);
    setPartnerEmail('');
  };

  const handleClose = () => {
    onOpenChange(false);
    resetForm();
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

    if (!direction || !title) {
      toast({
        title: 'Missing information',
        description: 'Please complete all required fields.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Create the goal
      const goal = await createGoal.mutateAsync({
        cycle_id: cycleId,
        title,
        metric_type: 'habit_streak',
        target_value: 42, // 6 weeks * 7 days
        goal_type: 'habit',
        why: successVision,
        habit_direction: direction,
        habit_cue: cue,
        habit_current_routine: currentRoutine || undefined,
        habit_new_routine: newRoutine || undefined,
        habit_reward: reward,
        habit_craving: craving || undefined,
        habit_environment_change: environmentChange || undefined,
        implementation_intention: implementationIntention || undefined,
        is_keystone_habit: isKeystoneHabit,
        accountability_partner_email: partnerEmail || undefined,
      });

      // Auto-create a daily tactic for tracking
      const tacticTitle = direction === 'stop' 
        ? `Resist: ${currentRoutine || title}`
        : newRoutine || title;
      
      await createTactic.mutateAsync({
        goal_id: goal.id,
        title: tacticTitle,
        frequency: 'daily',
        target_count: 1,
      });

      toast({
        title: 'Habit goal created!',
        description: `Your "${title}" goal is ready. Track daily on the Today page.`,
      });

      handleClose();
    } catch (error) {
      console.error('Error creating habit goal:', error);
      toast({
        title: 'Error',
        description: 'Failed to create goal. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 'direction':
        return !!direction;
      case 'habit_loop':
        if (direction === 'start') return !!newRoutine && !!cue && !!reward;
        if (direction === 'stop') return !!currentRoutine && !!cue && !!reward;
        return !!currentRoutine && !!newRoutine && !!cue && !!reward;
      case 'environment':
        return true; // Optional step
      case 'stakes':
        return !!title;
      case 'accountability':
        return true; // Optional step
      case 'review':
        return true;
      default:
        return false;
    }
  };

  const goNext = () => {
    const steps: Step[] = ['direction', 'habit_loop', 'environment', 'stakes', 'accountability', 'review'];
    const currentIndex = steps.indexOf(step);
    if (currentIndex < steps.length - 1) {
      setStep(steps[currentIndex + 1]);
    }
  };

  const goBack = () => {
    const steps: Step[] = ['direction', 'habit_loop', 'environment', 'stakes', 'accountability', 'review'];
    const currentIndex = steps.indexOf(step);
    if (currentIndex > 0) {
      setStep(steps[currentIndex - 1]);
    }
  };

  const getStepNumber = () => {
    const steps: Step[] = ['direction', 'habit_loop', 'environment', 'stakes', 'accountability', 'review'];
    return steps.indexOf(step) + 1;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Repeat className="h-5 w-5 text-primary" />
            Create Habit-Based Goal
          </DialogTitle>
          <DialogDescription>
            Step {getStepNumber()} of 6 — Using Charles Duhigg's Habit Loop framework
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-6">
          {/* Step 1: Direction */}
          {step === 'direction' && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold">What would you like to do?</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Choose your approach to habit change
                </p>
              </div>
              
              <div className="grid gap-3">
                {directionOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.type}
                      onClick={() => setDirection(option.type)}
                      className={cn(
                        "flex items-start gap-4 p-4 rounded-lg border text-left transition-all",
                        direction === option.type
                          ? "border-primary bg-primary/10"
                          : "hover:border-primary/50 hover:bg-accent/50"
                      )}
                    >
                      <div className={cn(
                        "rounded-lg p-2.5",
                        direction === option.type ? "bg-primary text-primary-foreground" : "bg-muted"
                      )}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-medium">{option.title}</h4>
                        <p className="text-sm text-muted-foreground">{option.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="bg-muted/50 rounded-lg p-4 mt-4">
                <div className="flex items-start gap-2">
                  <Lightbulb className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    <strong>Pro tip:</strong> Replacing a habit is often more effective than just stopping one. 
                    The brain craves the reward, so giving it a healthier alternative works better.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Habit Loop */}
          {step === 'habit_loop' && (
            <div className="space-y-6">
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold">Define Your Habit Loop</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Every habit has a Cue → Routine → Reward
                </p>
              </div>

              {/* Cue */}
              <div className="space-y-2">
                <Label className="text-base font-medium">The Cue (Trigger)</Label>
                <p className="text-sm text-muted-foreground">
                  What triggers this behavior? Common cues: time, location, emotion, preceding action, people
                </p>
                <div className="flex flex-wrap gap-2 mb-2">
                  {cueCategories.map((cat) => (
                    <Badge key={cat} variant="secondary" className="cursor-pointer hover:bg-primary/20">
                      {cat}
                    </Badge>
                  ))}
                </div>
                <Textarea
                  placeholder="e.g., When I feel stressed at 3pm..."
                  value={cue}
                  onChange={(e) => setCue(e.target.value)}
                />
              </div>

              {/* Current Routine (for stop/replace) */}
              {(direction === 'stop' || direction === 'replace') && (
                <div className="space-y-2">
                  <Label className="text-base font-medium">Current Routine (Bad Habit)</Label>
                  <p className="text-sm text-muted-foreground">
                    What behavior do you currently do?
                  </p>
                  <Textarea
                    placeholder="e.g., I scroll through social media for 30 minutes..."
                    value={currentRoutine}
                    onChange={(e) => setCurrentRoutine(e.target.value)}
                  />
                </div>
              )}

              {/* New Routine (for start/replace) */}
              {(direction === 'start' || direction === 'replace') && (
                <div className="space-y-2">
                  <Label className="text-base font-medium">New Routine (Good Habit)</Label>
                  <p className="text-sm text-muted-foreground">
                    What will you do instead?
                  </p>
                  <Textarea
                    placeholder="e.g., I will take a 10-minute walk outside..."
                    value={newRoutine}
                    onChange={(e) => setNewRoutine(e.target.value)}
                  />
                </div>
              )}

              {/* Reward */}
              <div className="space-y-2">
                <Label className="text-base font-medium">The Reward</Label>
                <p className="text-sm text-muted-foreground">
                  What does this behavior give you? (Be honest—even bad habits have rewards)
                </p>
                <Textarea
                  placeholder="e.g., A sense of relaxation, distraction from stress, social connection..."
                  value={reward}
                  onChange={(e) => setReward(e.target.value)}
                />
              </div>

              {/* Craving (optional) */}
              <div className="space-y-2">
                <Label className="text-base font-medium">The Underlying Craving <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <p className="text-sm text-muted-foreground">
                  What are you really seeking? Often it's not the thing itself.
                </p>
                <Input
                  placeholder="e.g., Connection, relief, stimulation, comfort..."
                  value={craving}
                  onChange={(e) => setCraving(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Step 3: Environment Design */}
          {step === 'environment' && (
            <div className="space-y-6">
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold">Design Your Environment</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Make the good habit easy and the bad habit hard
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-base font-medium">Environment Changes</Label>
                <p className="text-sm text-muted-foreground">
                  How will you modify your surroundings to support this change?
                </p>
                <Textarea
                  placeholder="e.g., I'll put my phone in another room, keep running shoes by the door, remove snacks from my desk..."
                  value={environmentChange}
                  onChange={(e) => setEnvironmentChange(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-base font-medium">Implementation Intention</Label>
                <p className="text-sm text-muted-foreground">
                  Complete this sentence: "When [CUE], I will [ROUTINE]"
                </p>
                <Input
                  placeholder="When I feel stressed at 3pm, I will take a 10-minute walk"
                  value={implementationIntention}
                  onChange={(e) => setImplementationIntention(e.target.value)}
                />
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <Lightbulb className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    <strong>Research shows:</strong> People who write specific implementation intentions 
                    are 2-3x more likely to follow through than those who don't.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Stakes */}
          {step === 'stakes' && (
            <div className="space-y-6">
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold">What's at Stake?</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Connect this habit to your bigger vision
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-base font-medium">Goal Title</Label>
                <Input
                  placeholder="e.g., Replace afternoon scrolling with walking"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-base font-medium">Success Vision</Label>
                <p className="text-sm text-muted-foreground">
                  What would your life be like if you succeeded with this habit change?
                </p>
                <Textarea
                  placeholder="e.g., I'd have more energy, feel less anxious, be more present with my family..."
                  value={successVision}
                  onChange={(e) => setSuccessVision(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-base font-medium">What's at Risk?</Label>
                <p className="text-sm text-muted-foreground">
                  What happens if you don't make this change?
                </p>
                <Textarea
                  placeholder="e.g., I'll continue wasting hours, feel more disconnected..."
                  value={riskStatement}
                  onChange={(e) => setRiskStatement(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-amber-500" />
                    <Label className="font-medium">Keystone Habit</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    This habit will create positive ripple effects in other areas
                  </p>
                </div>
                <Switch
                  checked={isKeystoneHabit}
                  onCheckedChange={setIsKeystoneHabit}
                />
              </div>
            </div>
          )}

          {/* Step 5: Accountability */}
          {step === 'accountability' && (
            <div className="space-y-6">
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold">Accountability Partner</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Who will help you stay on track?
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-base font-medium flex items-center gap-2">
                  <Link2 className="h-4 w-4" />
                  Partner Email <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <p className="text-sm text-muted-foreground">
                  In a future update, your partner will be able to view your streak and support you.
                </p>
                <Input
                  type="email"
                  placeholder="partner@example.com"
                  value={partnerEmail}
                  onChange={(e) => setPartnerEmail(e.target.value)}
                />
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <Lightbulb className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    <strong>Social accountability works:</strong> Having someone who checks in on your progress 
                    significantly increases your chances of sticking with a new habit.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 6: Review */}
          {step === 'review' && (
            <div className="space-y-6">
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold">Review Your Habit Goal</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Let's make sure everything looks right
                </p>
              </div>

              <div className="space-y-4">
                <div className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-lg">{title || 'Untitled Goal'}</h4>
                    <Badge variant={direction === 'start' ? 'default' : direction === 'stop' ? 'destructive' : 'secondary'}>
                      {direction?.toUpperCase()}
                    </Badge>
                  </div>
                  
                  {isKeystoneHabit && (
                    <Badge variant="outline" className="gap-1">
                      <Star className="h-3 w-3 text-amber-500" />
                      Keystone Habit
                    </Badge>
                  )}
                </div>

                <div className="grid gap-3 text-sm">
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="font-medium text-primary">Cue</p>
                    <p className="text-muted-foreground">{cue || '—'}</p>
                  </div>

                  {currentRoutine && (
                    <div className="rounded-lg bg-destructive/10 p-3">
                      <p className="font-medium text-destructive">Current Routine</p>
                      <p className="text-muted-foreground">{currentRoutine}</p>
                    </div>
                  )}

                  {newRoutine && (
                    <div className="rounded-lg bg-green-500/10 p-3">
                      <p className="font-medium text-green-600">New Routine</p>
                      <p className="text-muted-foreground">{newRoutine}</p>
                    </div>
                  )}

                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="font-medium text-primary">Reward</p>
                    <p className="text-muted-foreground">{reward || '—'}</p>
                  </div>

                  {implementationIntention && (
                    <div className="rounded-lg border border-primary/30 p-3">
                      <p className="font-medium text-primary">When this happens...</p>
                      <p className="text-muted-foreground italic">"{implementationIntention}"</p>
                    </div>
                  )}

                  {partnerEmail && (
                    <div className="rounded-lg bg-muted/50 p-3">
                      <p className="font-medium">Accountability Partner</p>
                      <p className="text-muted-foreground">{partnerEmail}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between pt-4 border-t">
          {step !== 'direction' ? (
            <Button variant="outline" onClick={goBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          ) : (
            <Button variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
          )}

          {step === 'review' ? (
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Habit Goal'}
            </Button>
          ) : (
            <Button onClick={goNext} disabled={!canProceed()}>
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}