import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useTodayNutrition, useNutritionSettings, calculateTotals } from '@/hooks/useNutrition';
import { MealEntryDialog } from './MealEntryDialog';
import { NutritionSettingsDialog } from './NutritionSettingsDialog';
import { 
  Flame, 
  Plus, 
  Settings, 
  Utensils,
  Beef,
  Wheat,
  Droplet,
  Edit2,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';

interface DailyFuelCardProps {
  activeCalories?: number; // From Oura
}

export function DailyFuelCard({ activeCalories = 0 }: DailyFuelCardProps) {
  const { data: entries = [], isLoading } = useTodayNutrition();
  const { data: settings } = useNutritionSettings();
  const [mealDialogOpen, setMealDialogOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [editingMeal, setEditingMeal] = useState<string | null>(null);

  const totals = calculateTotals(entries);
  const goals = {
    calories: settings?.daily_calorie_goal ?? 2000,
    protein: settings?.protein_goal_g ?? 150,
    carbs: settings?.carbs_goal_g ?? 200,
    fats: settings?.fats_goal_g ?? 65,
  };

  const netEnergy = totals.calories - activeCalories;

  const getNetEnergyDisplay = () => {
    if (netEnergy > 0) {
      return { icon: TrendingUp, text: `+${netEnergy}`, color: 'text-amber-500' };
    } else if (netEnergy < 0) {
      return { icon: TrendingDown, text: `${netEnergy}`, color: 'text-blue-500' };
    }
    return { icon: Minus, text: '0', color: 'text-muted-foreground' };
  };

  const netDisplay = getNetEnergyDisplay();
  const NetIcon = netDisplay.icon;

  const handleEditMeal = (mealId: string) => {
    setEditingMeal(mealId);
    setMealDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setMealDialogOpen(false);
    setEditingMeal(null);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-500" />
              Daily Fuel
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setSettingsDialogOpen(true)}
              >
                <Settings className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2"
                onClick={() => setMealDialogOpen(true)}
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Log
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Calorie Summary */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Calories</span>
              <span className="font-medium">
                {totals.calories} / {goals.calories} kcal
              </span>
            </div>
            <Progress 
              value={Math.min((totals.calories / goals.calories) * 100, 100)} 
              className="h-2"
            />
          </div>

          {/* Macro Summary */}
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-2 rounded-lg bg-muted/50">
              <Beef className="h-3.5 w-3.5 mx-auto mb-1 text-red-500" />
              <div className="text-xs text-muted-foreground">Protein</div>
              <div className="text-sm font-medium">
                {Math.round(totals.protein_g)}g
              </div>
              <div className="text-[10px] text-muted-foreground">
                / {goals.protein}g
              </div>
            </div>
            <div className="text-center p-2 rounded-lg bg-muted/50">
              <Wheat className="h-3.5 w-3.5 mx-auto mb-1 text-amber-500" />
              <div className="text-xs text-muted-foreground">Carbs</div>
              <div className="text-sm font-medium">
                {Math.round(totals.carbs_g)}g
              </div>
              <div className="text-[10px] text-muted-foreground">
                / {goals.carbs}g
              </div>
            </div>
            <div className="text-center p-2 rounded-lg bg-muted/50">
              <Droplet className="h-3.5 w-3.5 mx-auto mb-1 text-blue-500" />
              <div className="text-xs text-muted-foreground">Fats</div>
              <div className="text-sm font-medium">
                {Math.round(totals.fats_g)}g
              </div>
              <div className="text-[10px] text-muted-foreground">
                / {goals.fats}g
              </div>
            </div>
          </div>

          {/* Net Energy (if Oura data available) */}
          {activeCalories > 0 && (
            <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-border/50">
              <div className="flex items-center gap-2">
                <NetIcon className={`h-4 w-4 ${netDisplay.color}`} />
                <span className="text-sm text-muted-foreground">Net Energy</span>
              </div>
              <div className="text-right">
                <span className={`font-medium ${netDisplay.color}`}>
                  {netDisplay.text} kcal
                </span>
                <div className="text-[10px] text-muted-foreground">
                  {totals.calories} eaten − {activeCalories} burned
                </div>
              </div>
            </div>
          )}

          {/* Meal List */}
          {entries.length > 0 ? (
            <div className="space-y-2">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Today's Meals
              </div>
              {entries.map((meal) => (
                <div
                  key={meal.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-card border border-border/50 hover:bg-muted/50 transition-colors group"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Utensils className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm truncate">{meal.meal_description}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge variant="secondary" className="text-xs">
                      {meal.calories || 0} kcal
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {Math.round(meal.protein_g || 0)}g P
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleEditMeal(meal.id)}
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-sm text-muted-foreground">
              <Utensils className="h-8 w-8 mx-auto mb-2 opacity-50" />
              No meals logged yet today
            </div>
          )}
        </CardContent>
      </Card>

      <MealEntryDialog 
        open={mealDialogOpen} 
        onOpenChange={handleCloseDialog}
        editingMealId={editingMeal}
      />
      
      <NutritionSettingsDialog
        open={settingsDialogOpen}
        onOpenChange={setSettingsDialogOpen}
      />
    </>
  );
}
