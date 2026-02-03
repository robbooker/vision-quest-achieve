import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { useHealthMeasurements } from '@/hooks/useHealthMeasurements';
import { Scale, Heart, TrendingDown, TrendingUp, Minus, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export function HealthMetricsWidget() {
  const { 
    todayWeight, 
    todayBP,
    todaySystolic,
    todayDiastolic,
    weightChange, 
    logWeight, 
    logBloodPressure,
    isLoading 
  } = useHealthMeasurements(30);

  const [weightValue, setWeightValue] = useState('');
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [bpNotes, setBpNotes] = useState('');
  const [weightOpen, setWeightOpen] = useState(false);
  const [bpOpen, setBpOpen] = useState(false);

  const handleLogWeight = () => {
    const value = parseFloat(weightValue);
    if (!value || value < 50 || value > 500) return;
    
    logWeight.mutate({ value, unit: 'lbs' });
    setWeightValue('');
    setWeightOpen(false);
  };

  const handleLogBP = () => {
    const sys = parseInt(systolic);
    const dia = parseInt(diastolic);
    if (!sys || !dia || sys < 70 || sys > 250 || dia < 40 || dia > 150) return;
    
    logBloodPressure.mutate({ 
      systolic: sys, 
      diastolic: dia, 
      notes: bpNotes || undefined 
    });
    setSystolic('');
    setDiastolic('');
    setBpNotes('');
    setBpOpen(false);
  };

  const getBPStatus = (sys: number | null, dia: number | null) => {
    if (!sys || !dia) return null;
    if (sys < 120 && dia < 80) return { label: 'Normal', color: 'text-primary' };
    if (sys < 130 && dia < 80) return { label: 'Elevated', color: 'text-muted-foreground' };
    if (sys < 140 || dia < 90) return { label: 'High Stage 1', color: 'text-destructive' };
    return { label: 'High Stage 2', color: 'text-destructive' };
  };

  const bpStatus = getBPStatus(todaySystolic, todayDiastolic);

  return (
    <div className="flex items-center gap-2">
      {/* Weight Logger */}
      <Popover open={weightOpen} onOpenChange={setWeightOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className={cn(
              "h-8 gap-1.5 text-xs",
              todayWeight ? "text-primary" : "text-muted-foreground"
            )}
          >
            <Scale className="h-3.5 w-3.5" />
            {todayWeight ? (
              <span className="flex items-center gap-1">
                {todayWeight.primary_value}
                {weightChange !== null && (
                  weightChange > 0 ? (
                    <TrendingUp className="h-3 w-3 text-destructive" />
                  ) : weightChange < 0 ? (
                    <TrendingDown className="h-3 w-3 text-primary" />
                  ) : (
                    <Minus className="h-3 w-3" />
                  )
                )}
                <Check className="h-3 w-3 text-primary" />
              </span>
            ) : (
              <span>Weight</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-3" align="start">
          <div className="space-y-2">
            <p className="text-xs font-medium">Log Weight (lbs)</p>
            <Input
              type="number"
              placeholder="e.g. 175"
              value={weightValue}
              onChange={(e) => setWeightValue(e.target.value)}
              className="h-8 text-sm"
              onKeyDown={(e) => e.key === 'Enter' && handleLogWeight()}
            />
            <Button 
              size="sm" 
              className="w-full h-7 text-xs"
              onClick={handleLogWeight}
              disabled={logWeight.isPending}
            >
              {logWeight.isPending ? 'Saving...' : 'Log'}
            </Button>
            {todayWeight && (
              <p className="text-[10px] text-muted-foreground text-center">
                Logged today at {format(new Date(todayWeight.measured_at), 'h:mm a')}
              </p>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Blood Pressure Logger */}
      <Popover open={bpOpen} onOpenChange={setBpOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className={cn(
              "h-8 gap-1.5 text-xs",
              todayBP ? "text-primary" : "text-muted-foreground"
            )}
          >
            <Heart className="h-3.5 w-3.5" />
            {todaySystolic && todayDiastolic ? (
              <span className={cn("flex items-center gap-1", bpStatus?.color)}>
                {todaySystolic}/{todayDiastolic}
                <Check className="h-3 w-3 text-primary" />
              </span>
            ) : (
              <span>BP</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-3" align="start">
          <div className="space-y-2">
            <p className="text-xs font-medium">Log Blood Pressure</p>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  type="number"
                  placeholder="Sys"
                  value={systolic}
                  onChange={(e) => setSystolic(e.target.value)}
                  className="h-8 text-sm"
                />
                <p className="text-[10px] text-muted-foreground mt-0.5">Systolic</p>
              </div>
              <div className="flex-1">
                <Input
                  type="number"
                  placeholder="Dia"
                  value={diastolic}
                  onChange={(e) => setDiastolic(e.target.value)}
                  className="h-8 text-sm"
                />
                <p className="text-[10px] text-muted-foreground mt-0.5">Diastolic</p>
              </div>
            </div>
            <Textarea
              placeholder="What were you doing before? (resting, exercise, stressed...)"
              value={bpNotes}
              onChange={(e) => setBpNotes(e.target.value)}
              className="h-16 text-xs resize-none"
            />
            <Button 
              size="sm" 
              className="w-full h-7 text-xs"
              onClick={handleLogBP}
              disabled={logBloodPressure.isPending}
            >
              {logBloodPressure.isPending ? 'Saving...' : 'Log BP'}
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
