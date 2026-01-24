import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  Save, 
  Globe, 
  Lock, 
  Link as LinkIcon,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { useUpdateRecap, type MonthlyRecap, type RecapContent } from '@/hooks/useMonthlyRecap';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface RecapEditorProps {
  recap: MonthlyRecap;
  onSave?: () => void;
}

export function RecapEditor({ recap, onSave }: RecapEditorProps) {
  const [headline, setHeadline] = useState(recap.headline || '');
  const [subheadline, setSubheadline] = useState(recap.subheadline || '');
  const [content, setContent] = useState<RecapContent>(recap.content);
  const [status, setStatus] = useState<'draft' | 'published'>(recap.status);
  const [privacy, setPrivacy] = useState<'private' | 'unlisted' | 'public'>(recap.privacy);
  const [slug, setSlug] = useState(recap.slug || '');
  
  const { mutate: updateRecap, isPending } = useUpdateRecap();

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

  const updateContentSection = (key: keyof RecapContent, value: any) => {
    setContent(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const monthLabel = format(new Date(recap.month), 'MMMM yyyy');

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header & Publishing */}
      <Card>
        <CardHeader>
          <CardTitle>Edit Recap: {monthLabel}</CardTitle>
          <CardDescription>
            Customize your monthly review before publishing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
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
        <CardHeader>
          <CardTitle>Opening Reflection</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={content.opening_reflection}
            onChange={(e) => updateContentSection('opening_reflection', e.target.value)}
            rows={8}
            placeholder="Your month overview..."
          />
        </CardContent>
      </Card>

      {/* Habit Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Habit Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={content.habit_insights}
            onChange={(e) => updateContentSection('habit_insights', e.target.value)}
            rows={4}
            placeholder="Patterns and observations..."
          />
        </CardContent>
      </Card>

      {/* Biggest Win */}
      {content.biggest_win && (
        <Card>
          <CardHeader>
            <CardTitle>Biggest Win</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
          </CardContent>
        </Card>
      )}

      {/* Hardest Struggle */}
      {content.hardest_struggle && (
        <Card>
          <CardHeader>
            <CardTitle>Hardest Struggle</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
          </CardContent>
        </Card>
      )}

      {/* Looking Ahead */}
      <Card>
        <CardHeader>
          <CardTitle>Looking Ahead</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={content.looking_ahead}
            onChange={(e) => updateContentSection('looking_ahead', e.target.value)}
            rows={6}
            placeholder="What you're carrying into next month..."
          />
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-end sticky bottom-4 bg-background/80 backdrop-blur-sm p-4 rounded-lg border">
        <Button
          variant="outline"
          onClick={handleSave}
          disabled={isPending}
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
          disabled={isPending}
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
