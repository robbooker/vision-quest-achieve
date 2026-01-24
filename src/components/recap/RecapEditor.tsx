import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { 
  Save, 
  Globe, 
  Lock, 
  Link as LinkIcon,
  Loader2,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { 
  useUpdateRecap, 
  useRegenerateSection,
  type MonthlyRecap, 
  type RecapContent,
  type RecapTone,
  type RegeneratableSectionKey
} from '@/hooks/useMonthlyRecap';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface RecapEditorProps {
  recap: MonthlyRecap;
  onSave?: () => void;
}

const toneLabels: Record<RecapTone, string> = {
  reflective: 'Reflective',
  balanced: 'Balanced',
  witty: 'Witty',
  brutally_honest: 'Brutally Honest',
};

const toneDescriptions: Record<RecapTone, string> = {
  reflective: 'Thoughtful and introspective',
  balanced: 'Celebrates wins, notes growth areas',
  witty: 'Playful with gentle humor',
  brutally_honest: 'Direct and unsparing',
};

// Map slider value (0-3) to tone
const sliderToTone: RecapTone[] = ['reflective', 'balanced', 'witty', 'brutally_honest'];

export function RecapEditor({ recap, onSave }: RecapEditorProps) {
  const [headline, setHeadline] = useState(recap.headline || '');
  const [subheadline, setSubheadline] = useState(recap.subheadline || '');
  const [content, setContent] = useState<RecapContent>(recap.content);
  const [status, setStatus] = useState<'draft' | 'published'>(recap.status);
  const [privacy, setPrivacy] = useState<'private' | 'unlisted' | 'public'>(recap.privacy);
  const [slug, setSlug] = useState(recap.slug || '');
  const [toneIndex, setToneIndex] = useState(() => {
    const idx = sliderToTone.indexOf(recap.tone as RecapTone);
    return idx >= 0 ? idx : 1; // Default to balanced
  });
  const [regeneratingSection, setRegeneratingSection] = useState<string | null>(null);
  
  const { mutate: updateRecap, isPending } = useUpdateRecap();
  const { mutateAsync: regenerateSection } = useRegenerateSection();

  const currentTone = sliderToTone[toneIndex];

  const handleSave = () => {
    updateRecap(
      {
        recapId: recap.id,
        updates: {
          headline,
          subheadline,
          content,
          status,
          privacy,
          slug: slug || null,
        },
      },
      {
        onSuccess: () => {
          toast.success('Recap saved successfully');
          onSave?.();
        },
        onError: (error) => {
          toast.error('Failed to save recap');
          console.error(error);
        },
      }
    );
  };

  const handlePublish = () => {
    updateRecap(
      {
        recapId: recap.id,
        updates: {
          headline,
          subheadline,
          content,
          status: 'published',
          privacy,
          slug: slug || null,
        },
      },
      {
        onSuccess: () => {
          toast.success('Recap published!');
          setStatus('published');
          onSave?.();
        },
        onError: (error) => {
          toast.error('Failed to publish recap');
          console.error(error);
        },
      }
    );
  };

  const handleRegenerate = useCallback(async (section: RegeneratableSectionKey) => {
    setRegeneratingSection(section);
    
    try {
      const result = await regenerateSection({
        recapId: recap.id,
        section,
        tone: currentTone,
        context: {
          stats: recap.stats,
        },
      });
      
      if (result.success && result.content !== undefined) {
        setContent(prev => ({
          ...prev,
          [section]: result.content,
        }));
        toast.success(`${section.replace('_', ' ')} regenerated!`);
      }
    } catch (error) {
      toast.error('Failed to regenerate section');
      console.error(error);
    } finally {
      setRegeneratingSection(null);
    }
  }, [recap.id, recap.stats, currentTone, regenerateSection]);

  const updateContentSection = (key: keyof RecapContent, value: any) => {
    setContent(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const monthLabel = format(new Date(recap.month), 'MMMM yyyy');

  // Regenerate button component
  const RegenerateButton = ({ section }: { section: RegeneratableSectionKey }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => handleRegenerate(section)}
      disabled={regeneratingSection === section}
      className="gap-1.5 text-xs"
    >
      {regeneratingSection === section ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <RefreshCw className="h-3 w-3" />
      )}
      Regenerate
    </Button>
  );

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header & Tone Control */}
      <Card>
        <CardHeader>
          <CardTitle>Edit Recap: {monthLabel}</CardTitle>
          <CardDescription>
            Customize your monthly review before publishing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Tone Slider */}
          <div className="space-y-4 p-4 rounded-lg bg-muted/30 border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <Label className="text-base font-medium">Writing Tone</Label>
              </div>
              <span className="text-sm font-medium text-primary">
                {toneLabels[currentTone]}
              </span>
            </div>
            
            <Slider
              value={[toneIndex]}
              onValueChange={([value]) => setToneIndex(value)}
              min={0}
              max={3}
              step={1}
              className="w-full"
            />
            
            <div className="flex justify-between text-xs text-muted-foreground">
              {sliderToTone.map((tone, i) => (
                <span 
                  key={tone}
                  className={cn(
                    "cursor-pointer hover:text-foreground transition-colors",
                    i === toneIndex && "text-primary font-medium"
                  )}
                  onClick={() => setToneIndex(i)}
                >
                  {toneLabels[tone]}
                </span>
              ))}
            </div>
            
            <p className="text-xs text-muted-foreground text-center">
              {toneDescriptions[currentTone]}
            </p>
          </div>

          {/* Hero Content */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="headline">Headline</Label>
              <Input
                id="headline"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="Your compelling headline..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subheadline">Subheadline</Label>
              <Input
                id="subheadline"
                value={subheadline}
                onChange={(e) => setSubheadline(e.target.value)}
                placeholder="Key metric or insight..."
              />
            </div>
          </div>

          <Separator />

          {/* Publishing Options */}
          <div className="space-y-4">
            <h3 className="font-medium">Publishing</h3>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Privacy</Label>
                <p className="text-sm text-muted-foreground">
                  Who can see this recap
                </p>
              </div>
              <Select value={privacy} onValueChange={(v) => setPrivacy(v as any)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      Private
                    </div>
                  </SelectItem>
                  <SelectItem value="unlisted">
                    <div className="flex items-center gap-2">
                      <LinkIcon className="h-4 w-4" />
                      Unlisted
                    </div>
                  </SelectItem>
                  <SelectItem value="public">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Public
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(privacy === 'unlisted' || privacy === 'public') && (
              <div className="space-y-2">
                <Label htmlFor="slug">Custom URL Slug (optional)</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">/recaps/</span>
                  <Input
                    id="slug"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                    placeholder={format(new Date(recap.month), 'yyyy-MM')}
                    className="flex-1"
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Opening Reflection */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Opening Reflection</CardTitle>
          <RegenerateButton section="opening_reflection" />
        </CardHeader>
        <CardContent>
          <Textarea
            value={content.opening_reflection}
            onChange={(e) => updateContentSection('opening_reflection', e.target.value)}
            rows={8}
            placeholder="Your month overview..."
            className={cn(regeneratingSection === 'opening_reflection' && "opacity-50")}
          />
        </CardContent>
      </Card>

      {/* Habit Insights */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Habit Insights</CardTitle>
          <RegenerateButton section="habit_insights" />
        </CardHeader>
        <CardContent>
          <Textarea
            value={content.habit_insights}
            onChange={(e) => updateContentSection('habit_insights', e.target.value)}
            rows={4}
            placeholder="Patterns and observations..."
            className={cn(regeneratingSection === 'habit_insights' && "opacity-50")}
          />
        </CardContent>
      </Card>

      {/* Biggest Win */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Biggest Win</CardTitle>
          <RegenerateButton section="biggest_win" />
        </CardHeader>
        <CardContent className={cn("space-y-4", regeneratingSection === 'biggest_win' && "opacity-50")}>
          {content.biggest_win ? (
            <>
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={content.biggest_win.title}
                  onChange={(e) => updateContentSection('biggest_win', {
                    ...content.biggest_win,
                    title: e.target.value,
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label>Why It Mattered</Label>
                <Input
                  value={content.biggest_win.why_it_mattered}
                  onChange={(e) => updateContentSection('biggest_win', {
                    ...content.biggest_win,
                    why_it_mattered: e.target.value,
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label>Narrative</Label>
                <Textarea
                  value={content.biggest_win.narrative}
                  onChange={(e) => updateContentSection('biggest_win', {
                    ...content.biggest_win,
                    narrative: e.target.value,
                  })}
                  rows={4}
                />
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground mb-2">No biggest win content yet</p>
              <Button variant="outline" size="sm" onClick={() => handleRegenerate('biggest_win')}>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hardest Struggle */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Hardest Struggle</CardTitle>
          <RegenerateButton section="hardest_struggle" />
        </CardHeader>
        <CardContent className={cn("space-y-4", regeneratingSection === 'hardest_struggle' && "opacity-50")}>
          {content.hardest_struggle ? (
            <>
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={content.hardest_struggle.title}
                  onChange={(e) => updateContentSection('hardest_struggle', {
                    ...content.hardest_struggle,
                    title: e.target.value,
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label>Lesson Learned</Label>
                <Input
                  value={content.hardest_struggle.lesson_learned}
                  onChange={(e) => updateContentSection('hardest_struggle', {
                    ...content.hardest_struggle,
                    lesson_learned: e.target.value,
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label>Narrative</Label>
                <Textarea
                  value={content.hardest_struggle.narrative}
                  onChange={(e) => updateContentSection('hardest_struggle', {
                    ...content.hardest_struggle,
                    narrative: e.target.value,
                  })}
                  rows={4}
                />
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground mb-2">No struggle content yet</p>
              <Button variant="outline" size="sm" onClick={() => handleRegenerate('hardest_struggle')}>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Unexpected Delight */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Unexpected Delight</CardTitle>
          <RegenerateButton section="unexpected_delight" />
        </CardHeader>
        <CardContent className={cn("space-y-4", regeneratingSection === 'unexpected_delight' && "opacity-50")}>
          {content.unexpected_delight ? (
            <>
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={content.unexpected_delight.title}
                  onChange={(e) => updateContentSection('unexpected_delight', {
                    ...content.unexpected_delight,
                    title: e.target.value,
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label>Narrative</Label>
                <Textarea
                  value={content.unexpected_delight.narrative}
                  onChange={(e) => updateContentSection('unexpected_delight', {
                    ...content.unexpected_delight,
                    narrative: e.target.value,
                  })}
                  rows={3}
                />
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground mb-2">No delight content yet</p>
              <Button variant="outline" size="sm" onClick={() => handleRegenerate('unexpected_delight')}>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Looking Ahead */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Looking Ahead</CardTitle>
          <RegenerateButton section="looking_ahead" />
        </CardHeader>
        <CardContent>
          <Textarea
            value={content.looking_ahead}
            onChange={(e) => updateContentSection('looking_ahead', e.target.value)}
            rows={6}
            placeholder="What you're carrying into next month..."
            className={cn(regeneratingSection === 'looking_ahead' && "opacity-50")}
          />
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-end sticky bottom-4 bg-background/80 backdrop-blur-sm p-4 rounded-lg border">
        <Button
          variant="outline"
          onClick={handleSave}
          disabled={isPending || regeneratingSection !== null}
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Draft
        </Button>
        <Button
          onClick={handlePublish}
          disabled={isPending || regeneratingSection !== null}
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Globe className="h-4 w-4 mr-2" />
          )}
          {status === 'published' ? 'Update & Publish' : 'Publish'}
        </Button>
      </div>
    </div>
  );
}
