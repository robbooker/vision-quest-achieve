import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { Type, RotateCcw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useSiteTour } from '@/hooks/useSiteTour';

type TextSize = 'small' | 'medium' | 'large';

const TEXT_SIZE_CLASSES: Record<TextSize, string> = {
  small: 'text-sm',
  medium: 'text-base',
  large: 'text-lg',
};

export function DisplaySettings() {
  const { user } = useAuth();
  const { startTour } = useSiteTour();
  const [textSize, setTextSize] = useState<TextSize>('medium');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchPreferences = async () => {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('text_size')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!error && data?.text_size) {
        setTextSize(data.text_size as TextSize);
        applyTextSize(data.text_size as TextSize);
      }
      setLoading(false);
    };

    fetchPreferences();
  }, [user]);

  const applyTextSize = (size: TextSize) => {
    const root = document.documentElement;
    root.classList.remove('text-size-small', 'text-size-medium', 'text-size-large');
    root.classList.add(`text-size-${size}`);
    localStorage.setItem('textSize', size);
  };

  const handleTextSizeChange = async (size: TextSize) => {
    if (!user) return;

    setTextSize(size);
    applyTextSize(size);

    // Upsert preference
    const { error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: user.id,
        text_size: size,
      }, { onConflict: 'user_id' });

    if (error) {
      console.error('Failed to save text size:', error);
      toast.error('Failed to save preference');
    } else {
      toast.success('Text size updated');
    }
  };

  const handleRestartTour = () => {
    // Clear the tour completed flag
    localStorage.removeItem('groovy-planning-tour-completed');
    toast.success('Tour reset! Navigate to any page to start the tour.');
    // Start tour immediately if on a supported page
    setTimeout(() => startTour(), 500);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Type className="h-5 w-5" />
          Display
        </CardTitle>
        <CardDescription>
          Customize how content appears in the app.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <Label>Text Size</Label>
          <RadioGroup
            value={textSize}
            onValueChange={(value) => handleTextSizeChange(value as TextSize)}
            className="flex gap-4"
            disabled={loading}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="small" id="text-small" />
              <Label htmlFor="text-small" className="text-sm cursor-pointer">
                Small
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="medium" id="text-medium" />
              <Label htmlFor="text-medium" className="text-base cursor-pointer">
                Medium
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="large" id="text-large" />
              <Label htmlFor="text-large" className="text-lg cursor-pointer">
                Large
              </Label>
            </div>
          </RadioGroup>
          <p className={`text-muted-foreground ${TEXT_SIZE_CLASSES[textSize]}`}>
            Preview: This is how your text will appear.
          </p>
        </div>

        <div className="border-t pt-4 space-y-3">
          <Label>Toasty's Site Tour</Label>
          <p className="text-sm text-muted-foreground">
            Want to see Toasty's guided tour of the app again?
          </p>
          <Button variant="outline" onClick={handleRestartTour} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Restart Site Tour
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
