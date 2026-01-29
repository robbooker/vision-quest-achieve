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
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useNutritionMutations, NutritionEntry } from '@/hooks/useNutrition';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles, Trash2, Mic } from 'lucide-react';
import { VoiceMealRecorder } from './VoiceMealRecorder';

interface MealEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingMealId?: string | null;
  entryDate?: string;
  entries?: NutritionEntry[];
}

export function MealEntryDialog({ 
  open, 
  onOpenChange, 
  editingMealId,
  entryDate,
  entries = []
}: MealEntryDialogProps) {
  const { toast } = useToast();
  const { logMeal, updateMeal, deleteMeal, parseNutrition } = useNutritionMutations();
  
  const [description, setDescription] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fats, setFats] = useState('');
  const [sugar, setSugar] = useState('');
  const [fiber, setFiber] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parsedItems, setParsedItems] = useState<string[]>([]);
  const [showVoice, setShowVoice] = useState(false);

  const editingMeal = editingMealId 
    ? entries.find(e => e.id === editingMealId) 
    : null;

  // Load existing meal data when editing
  useEffect(() => {
    if (editingMeal) {
      setDescription(editingMeal.meal_description);
      setCalories(editingMeal.calories?.toString() || '');
      setProtein(editingMeal.protein_g?.toString() || '');
      setCarbs(editingMeal.carbs_g?.toString() || '');
      setFats(editingMeal.fats_g?.toString() || '');
      setSugar(editingMeal.sugar_g?.toString() || '');
      setFiber(editingMeal.fiber_g?.toString() || '');
      setParsedItems([]);
    } else {
      resetForm();
    }
  }, [editingMeal, open]);

  const resetForm = () => {
    setDescription('');
    setCalories('');
    setProtein('');
    setCarbs('');
    setFats('');
    setSugar('');
    setFiber('');
    setParsedItems([]);
    setShowVoice(false);
  };

  const handleParseWithAI = async () => {
    if (!description.trim()) {
      toast({ title: 'Enter a meal description first', variant: 'destructive' });
      return;
    }

    setIsParsing(true);
    try {
      const result = await parseNutrition.mutateAsync(description);
      setCalories(result.calories.toString());
      setProtein(result.protein_g.toString());
      setCarbs(result.carbs_g.toString());
      setFats(result.fats_g.toString());
      setSugar(result.sugar_g.toString());
      setFiber(result.fiber_g.toString());
      setParsedItems(result.parsed_items);
      toast({ title: 'Nutrition parsed successfully!' });
    } catch (error) {
      console.error('Parse error:', error);
      toast({ 
        title: 'Failed to parse nutrition', 
        description: 'You can enter values manually',
        variant: 'destructive' 
      });
    } finally {
      setIsParsing(false);
    }
  };

  const handleVoiceTranscript = (transcript: string) => {
    setDescription(transcript);
    setShowVoice(false);
    // Auto-parse after voice input
    setTimeout(() => {
      if (transcript.trim()) {
        handleParseWithAI();
      }
    }, 100);
  };

  const handleSave = async () => {
    if (!description.trim()) {
      toast({ title: 'Enter a meal description', variant: 'destructive' });
      return;
    }

    try {
      if (editingMeal) {
        await updateMeal.mutateAsync({
          id: editingMeal.id,
          meal_description: description,
          calories: calories ? parseInt(calories) : undefined,
          protein_g: protein ? parseFloat(protein) : undefined,
          carbs_g: carbs ? parseFloat(carbs) : undefined,
          fats_g: fats ? parseFloat(fats) : undefined,
          sugar_g: sugar ? parseFloat(sugar) : undefined,
          fiber_g: fiber ? parseFloat(fiber) : undefined,
        });
        toast({ title: 'Meal updated' });
      } else {
        await logMeal.mutateAsync({
          meal_description: description,
          calories: calories ? parseInt(calories) : undefined,
          protein_g: protein ? parseFloat(protein) : undefined,
          carbs_g: carbs ? parseFloat(carbs) : undefined,
          fats_g: fats ? parseFloat(fats) : undefined,
          sugar_g: sugar ? parseFloat(sugar) : undefined,
          fiber_g: fiber ? parseFloat(fiber) : undefined,
          source: parsedItems.length > 0 ? 'audio' : 'manual',
          entry_date: entryDate,
        });
        toast({ title: 'Meal logged' });
      }
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Save error:', error);
      toast({ title: 'Failed to save meal', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!editingMeal) return;

    try {
      await deleteMeal.mutateAsync(editingMeal.id);
      toast({ title: 'Meal deleted' });
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Delete error:', error);
      toast({ title: 'Failed to delete meal', variant: 'destructive' });
    }
  };

  const isSaving = logMeal.isPending || updateMeal.isPending;
  const isDeleting = deleteMeal.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editingMeal ? 'Edit Meal' : 'Log Meal'}
          </DialogTitle>
        </DialogHeader>

        {showVoice ? (
          <VoiceMealRecorder 
            onTranscript={handleVoiceTranscript}
            onCancel={() => setShowVoice(false)}
          />
        ) : (
          <div className="space-y-4">
            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">What did you eat?</Label>
              <div className="flex gap-2">
                <Textarea
                  id="description"
                  placeholder="e.g., 3 scrambled eggs with toast and butter"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="flex-1"
                />
                <div className="flex flex-col gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setShowVoice(true)}
                    className="h-8 w-8"
                  >
                    <Mic className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* AI Parse Button */}
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={handleParseWithAI}
              disabled={isParsing || !description.trim()}
            >
              {isParsing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Auto-calculate nutrition
                </>
              )}
            </Button>

            {/* Parsed Items */}
            {parsedItems.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {parsedItems.map((item, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {item}
                  </Badge>
                ))}
              </div>
            )}

            {/* Macro Inputs */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="calories" className="text-xs">Calories</Label>
                <Input
                  id="calories"
                  type="number"
                  placeholder="0"
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="protein" className="text-xs">Protein (g)</Label>
                <Input
                  id="protein"
                  type="number"
                  step="0.1"
                  placeholder="0"
                  value={protein}
                  onChange={(e) => setProtein(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="carbs" className="text-xs">Carbs (g)</Label>
                <Input
                  id="carbs"
                  type="number"
                  step="0.1"
                  placeholder="0"
                  value={carbs}
                  onChange={(e) => setCarbs(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="fats" className="text-xs">Fats (g)</Label>
                <Input
                  id="fats"
                  type="number"
                  step="0.1"
                  placeholder="0"
                  value={fats}
                  onChange={(e) => setFats(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="sugar" className="text-xs">Sugar (g)</Label>
                <Input
                  id="sugar"
                  type="number"
                  step="0.1"
                  placeholder="0"
                  value={sugar}
                  onChange={(e) => setSugar(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="fiber" className="text-xs">Fiber (g)</Label>
                <Input
                  id="fiber"
                  type="number"
                  step="0.1"
                  placeholder="0"
                  value={fiber}
                  onChange={(e) => setFiber(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {!showVoice && (
          <DialogFooter className="flex-col sm:flex-row gap-2">
            {editingMeal && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
                className="sm:mr-auto"
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            )}
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              {editingMeal ? 'Update' : 'Save'}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
