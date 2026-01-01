import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useVision } from '@/hooks/useVision';
import { toast } from 'sonner';
import { Sparkles, Target, Compass, Heart, Loader2 } from 'lucide-react';

export default function Vision() {
  const { vision, isLoading, upsertVision } = useVision();
  const [vision3Year, setVision3Year] = useState('');
  const [visionLongTerm, setVisionLongTerm] = useState('');
  const [coreValues, setCoreValues] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (vision) {
      setVision3Year(vision.vision_3_year || '');
      setVisionLongTerm(vision.vision_long_term || '');
      setCoreValues(vision.core_values || '');
    }
  }, [vision]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await upsertVision.mutateAsync({
        vision_3_year: vision3Year || undefined,
        vision_long_term: visionLongTerm || undefined,
        core_values: coreValues || undefined,
      });
      toast.success('Vision saved');
    } catch (error) {
      toast.error('Failed to save vision');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            Your Vision
          </h1>
          <p className="text-muted-foreground">
            Define your long-term aspirations. Your 12-week goals should be stepping stones toward this bigger picture.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="h-5 w-5 text-primary" />
              3-Year Vision
            </CardTitle>
            <CardDescription>
              Where do you want to be in 3 years? What will your life look like? 
              Be specific about career, relationships, health, and personal growth.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={vision3Year}
              onChange={(e) => setVision3Year(e.target.value)}
              placeholder="In 3 years, I will have..."
              rows={5}
              className="resize-none"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Compass className="h-5 w-5 text-primary" />
              Long-Term Vision (5-10 Years)
            </CardTitle>
            <CardDescription>
              Dream bigger. What's your ultimate destination? What legacy do you want to create?
              This is your North Star that guides every decision.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={visionLongTerm}
              onChange={(e) => setVisionLongTerm(e.target.value)}
              placeholder="My long-term vision is to..."
              rows={5}
              className="resize-none"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Heart className="h-5 w-5 text-primary" />
              Core Values
            </CardTitle>
            <CardDescription>
              What principles guide your decisions? What do you stand for?
              When your goals conflict, your values help you choose.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={coreValues}
              onChange={(e) => setCoreValues(e.target.value)}
              placeholder="My core values are: integrity, growth, family..."
              rows={4}
              className="resize-none"
            />
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Vision
          </Button>
        </div>

        <Card className="bg-muted/50 border-dashed">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground italic">
              "Vision is the starting point of goal achievement. Your 12-week goals are simply 
              the tactical stepping stones to get you there. Without a clear vision, you're just 
              busy—not productive." — Brian Moran, The 12 Week Year
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
