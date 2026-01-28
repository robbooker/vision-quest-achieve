import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNutritionSettings } from '@/hooks/useNutrition';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface NutritionSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NutritionSettingsDialog({ open, onOpenChange }: NutritionSettingsDialogProps) {
  const { toast } = useToast();
  const { data: settings, updateSettings } = useNutritionSettings();
  
  const [calories, setCalories] = useState('2000');
  const [protein, setProtein] = useState('150');
  const [carbs, setCarbs] = useState('200');
  const [fats, setFats] = useState('65');

  useEffect(() => {
    if (settings) {
      setCalories(settings.daily_calorie_goal?.toString() || '2000');
      setProtein(settings.protein_goal_g?.toString() || '150');
      setCarbs(settings.carbs_goal_g?.toString() || '200');
      setFats(settings.fats_goal_g?.toString() || '65');
    }
  }, [settings, open]);

  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync({
        daily_calorie_goal: parseInt(calories) || 2000,
        protein_goal_g: parseInt(protein) || 150,
        carbs_goal_g: parseInt(carbs) || 200,
        fats_goal_g: parseInt(fats) || 65,
      });
      toast({ title: 'Goals updated' });
      onOpenChange(false);
    } catch (error) {
      console.error('Save error:', error);
      toast({ title: 'Failed to save goals', variant: 'destructive' });
    }
  };

  const isSaving = updateSettings.isPending;

  // Calculate macro calories
  const proteinCal = (parseInt(protein) || 0) * 4;
  const carbsCal = (parseInt(carbs) || 0) * 4;
  const fatsCal = (parseInt(fats) || 0) * 9;
  const totalMacroCal = proteinCal + carbsCal + fatsCal;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Daily Nutrition Goals</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="calories">Daily Calories (kcal)</Label>
            <Input
              id="calories"
              type="number"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="protein" className="text-sm">Protein (g)</Label>
              <Input
                id="protein"
                type="number"
                value={protein}
                onChange={(e) => setProtein(e.target.value)}
              />
              <p className="text-[10px] text-muted-foreground">{proteinCal} kcal</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="carbs" className="text-sm">Carbs (g)</Label>
              <Input
                id="carbs"
                type="number"
                value={carbs}
                onChange={(e) => setCarbs(e.target.value)}
              />
              <p className="text-[10px] text-muted-foreground">{carbsCal} kcal</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fats" className="text-sm">Fats (g)</Label>
              <Input
                id="fats"
                type="number"
                value={fats}
                onChange={(e) => setFats(e.target.value)}
              />
              <p className="text-[10px] text-muted-foreground">{fatsCal} kcal</p>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-muted/50 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Macro total:</span>
              <span className="font-medium">{totalMacroCal} kcal</span>
            </div>
            {Math.abs(totalMacroCal - parseInt(calories)) > 100 && (
              <p className="text-xs text-amber-500 mt-1">
                Macro totals differ from calorie goal by {Math.abs(totalMacroCal - parseInt(calories))} kcal
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
