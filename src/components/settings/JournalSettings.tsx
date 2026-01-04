import { useState, useEffect } from 'react';
import { BookOpen, Palette, Sparkles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useJournalSettings } from '@/hooks/useJournalSettings';

const ART_STYLES = [
  { value: 'watercolor', label: 'Watercolor' },
  { value: 'digital-art', label: 'Digital Art' },
  { value: 'minimalist', label: 'Minimalist' },
  { value: 'abstract', label: 'Abstract' },
  { value: 'impressionist', label: 'Impressionist' },
  { value: 'vintage', label: 'Vintage' },
  { value: 'anime', label: 'Anime' },
  { value: 'oil-painting', label: 'Oil Painting' },
  { value: 'pencil-sketch', label: 'Pencil Sketch' },
  { value: 'pop-art', label: 'Pop Art' },
];

export const JournalSettings = () => {
  const { settings, isLoading, upsertSettings } = useJournalSettings();
  
  const [themeInstructions, setThemeInstructions] = useState('');
  const [artStyle, setArtStyle] = useState('watercolor');
  const [colorPalette, setColorPalette] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (settings) {
      setThemeInstructions(settings.theme_instructions || '');
      setArtStyle(settings.art_style || 'watercolor');
      setColorPalette(settings.color_palette || '');
    }
  }, [settings]);

  useEffect(() => {
    if (settings) {
      const changed = 
        themeInstructions !== (settings.theme_instructions || '') ||
        artStyle !== (settings.art_style || 'watercolor') ||
        colorPalette !== (settings.color_palette || '');
      setHasChanges(changed);
    } else {
      setHasChanges(themeInstructions !== '' || artStyle !== 'watercolor' || colorPalette !== '');
    }
  }, [themeInstructions, artStyle, colorPalette, settings]);

  const handleSave = () => {
    upsertSettings.mutate({
      theme_instructions: themeInstructions,
      art_style: artStyle,
      color_palette: colorPalette,
    });
    setHasChanges(false);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Journal Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-20 bg-muted rounded" />
            <div className="h-10 bg-muted rounded" />
            <div className="h-10 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          Journal Settings
        </CardTitle>
        <CardDescription>
          Customize how your daily journal images are generated
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="theme-instructions" className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Theme Instructions
          </Label>
          <Textarea
            id="theme-instructions"
            value={themeInstructions}
            onChange={(e) => setThemeInstructions(e.target.value)}
            placeholder="e.g., Nature scenes with mountains and forests, peaceful and calming vibes, Japanese zen gardens..."
            className="min-h-[80px]"
          />
          <p className="text-xs text-muted-foreground">
            Describe the themes, subjects, or moods you want in your journal images
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="art-style" className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Art Style
          </Label>
          <Select value={artStyle} onValueChange={setArtStyle}>
            <SelectTrigger>
              <SelectValue placeholder="Select an art style" />
            </SelectTrigger>
            <SelectContent>
              {ART_STYLES.map((style) => (
                <SelectItem key={style.value} value={style.value}>
                  {style.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="color-palette">Color Palette</Label>
          <Input
            id="color-palette"
            value={colorPalette}
            onChange={(e) => setColorPalette(e.target.value)}
            placeholder="e.g., warm earth tones, cool blues and greens, vibrant sunset colors..."
          />
          <p className="text-xs text-muted-foreground">
            Describe the colors or mood you prefer in your images
          </p>
        </div>

        <Button 
          onClick={handleSave} 
          disabled={!hasChanges || upsertSettings.isPending}
          className="w-full"
        >
          {upsertSettings.isPending ? 'Saving...' : 'Save Journal Settings'}
        </Button>
      </CardContent>
    </Card>
  );
};
