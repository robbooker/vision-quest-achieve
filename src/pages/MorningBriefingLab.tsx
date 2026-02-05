import { useState, useEffect, useRef, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
  Loader2, Send, MapPin, Cloud, Calendar, Trophy, TrendingUp, 
  Briefcase, Vote, BookOpen, Tv, Music, Gamepad2, FlaskConical, 
  HeartPulse, Target, Sparkles, Newspaper, Mic, Check, Clock
} from 'lucide-react';
import { 
  useBriefingLabPreferences, 
  useUpdateBriefingLabPreferences, 
  useGenerateLabBriefing,
  useSendBriefingSms 
} from '@/hooks/useBriefingLab';
import type { BriefingLabPreferences, DepthLevel } from '@/hooks/useBriefingLab';

// Voice options with descriptions
const VOICE_OPTIONS = [
  { id: 'nPczCjzI2devNBz1zQrb', name: 'Brian', description: 'British male, warm and conversational with a slightly sardonic wit' },
  { id: 'JBFqnCBsd6RMkjVDRZzb', name: 'George', description: 'British male, deep and authoritative news anchor style' },
  { id: 'TX3LPaxmHKxFdv7VOQHJ', name: 'Liam', description: 'American male, friendly and energetic morning host vibe' },
  { id: 'onwK4e9ZLuTAKqWW03F9', name: 'Daniel', description: 'British male, calm and measured documentary narrator' },
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah', description: 'American female, warm and professional news presenter' },
  { id: 'FGY2WhTYpPnrIDTdsKH5', name: 'Laura', description: 'American female, bright and upbeat morning show host' },
  { id: 'XrExE9yKIg1WjnnlVkGX', name: 'Matilda', description: 'British female, sophisticated and articulate' },
  { id: 'pFZP5JQG7iQjIQuC4Bku', name: 'Lily', description: 'British female, soft and soothing with clear diction' },
];

interface DepthCategoryConfig {
  depthKey: keyof BriefingLabPreferences;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  topicsKey?: keyof BriefingLabPreferences;
  topicsPlaceholder?: string;
  description: { brief: string; full: string };
}

const DEPTH_CATEGORIES: DepthCategoryConfig[] = [
  { depthKey: 'sports_depth', label: 'Sports', icon: Trophy, topicsKey: 'sports_teams', topicsPlaceholder: 'Heat, Yankees, Giants...', description: { brief: 'Quick scores', full: 'Scores + headlines' } },
  { depthKey: 'tech_depth', label: 'Tech / AI', icon: Sparkles, topicsKey: 'tech_topics', topicsPlaceholder: 'vibe coding, Claude, AI agents...', description: { brief: 'Top headline', full: 'Deep dive' } },
  { depthKey: 'business_depth', label: 'Business', icon: Briefcase, topicsKey: 'business_topics', topicsPlaceholder: 'Tesla, fintech, startups...', description: { brief: 'Key movers', full: 'Analysis' } },
  { depthKey: 'trading_depth', label: 'Trading / Markets', icon: TrendingUp, description: { brief: 'Quick indices', full: 'Full rundown' } },
  { depthKey: 'politics_depth', label: 'Politics', icon: Vote, topicsKey: 'politics_topics', topicsPlaceholder: 'economic policy, tech regulation...', description: { brief: 'Headlines only', full: 'Context included' } },
  { depthKey: 'books_depth', label: 'Books', icon: BookOpen, topicsKey: 'books_topics', topicsPlaceholder: 'sci-fi, business books...', description: { brief: 'New releases', full: 'Reviews included' } },
  { depthKey: 'film_tv_depth', label: 'Film & TV', icon: Tv, description: { brief: 'What\'s new', full: 'Reviews + streaming' } },
  { depthKey: 'music_depth', label: 'Music', icon: Music, topicsKey: 'music_topics', topicsPlaceholder: 'electronic, jazz...', description: { brief: 'New releases', full: 'Industry news' } },
  { depthKey: 'gaming_depth', label: 'Gaming', icon: Gamepad2, topicsKey: 'gaming_topics', topicsPlaceholder: 'PlayStation, indie games...', description: { brief: 'Release news', full: 'Reviews + updates' } },
  { depthKey: 'science_depth', label: 'Science', icon: FlaskConical, topicsKey: 'science_topics', topicsPlaceholder: 'space, climate...', description: { brief: 'Discovery headlines', full: 'Explained' } },
  { depthKey: 'health_depth', label: 'Health & Fitness', icon: HeartPulse, topicsKey: 'health_topics', topicsPlaceholder: 'nutrition, longevity...', description: { brief: 'Tips', full: 'Research + advice' } },
];

interface ToggleCategoryConfig {
  key: keyof BriefingLabPreferences;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const TOGGLE_CATEGORIES: ToggleCategoryConfig[] = [
  { key: 'include_short_scout', label: 'Short Scout', icon: TrendingUp, description: 'Top searched & most traded stocks' },
  { key: 'include_weather', label: 'Weather', icon: Cloud, description: 'Local forecast' },
  { key: 'include_calendar', label: 'Calendar', icon: Calendar, description: 'Today\'s events' },
  { key: 'include_intention', label: 'Word of Month', icon: Target, description: 'Monthly intention reflection' },
];

export default function MorningBriefingLab() {
  const { data: prefs, isLoading: prefsLoading } = useBriefingLabPreferences();
  const updatePrefs = useUpdateBriefingLabPreferences();
  const generateBriefing = useGenerateLabBriefing();
  const sendSms = useSendBriefingSms();

  const [localPrefs, setLocalPrefs] = useState<Partial<BriefingLabPreferences>>({});
  const [zipCode, setZipCode] = useState('');
  const [showSaved, setShowSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initialLoadRef = useRef(true);
  const [generatedBriefing, setGeneratedBriefing] = useState<{
    podcast_url: string;
    script: string;
    duration_seconds: number;
    sources_succeeded: string[];
    sources_failed: string[];
  } | null>(null);

  // Initialize local prefs from server
  useEffect(() => {
    if (prefs) {
      setLocalPrefs(prefs);
      initialLoadRef.current = false;
    }
  }, [prefs]);

  // Debounced auto-save
  const savePrefs = useCallback(async (prefsToSave: Partial<BriefingLabPreferences>) => {
    setIsSaving(true);
    try {
      await updatePrefs.mutateAsync(prefsToSave);
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 2000);
    } catch (e) {
      console.error('Auto-save error:', e);
    } finally {
      setIsSaving(false);
    }
  }, [updatePrefs]);

  useEffect(() => {
    // Skip auto-save on initial load
    if (initialLoadRef.current || !prefs) return;
    
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new debounced save (1.5 second delay)
    saveTimeoutRef.current = setTimeout(() => {
      savePrefs(localPrefs);
    }, 1500);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [localPrefs, prefs, savePrefs]);

  const handleToggle = (key: keyof BriefingLabPreferences) => {
    setLocalPrefs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleTopicChange = (key: keyof BriefingLabPreferences, value: string) => {
    setLocalPrefs(prev => ({ ...prev, [key]: value }));
  };

  const handleSetLocation = async () => {
    if (!zipCode || zipCode.length !== 5) return;
    
    try {
      // Use OpenDataSoft API for zip code lookup
      const response = await fetch(
        `https://public.opendatasoft.com/api/records/1.0/search/?dataset=us-zip-code-latitude-and-longitude&q=${zipCode}&rows=1`
      );
      const data = await response.json();
      
      if (data.records?.[0]?.fields) {
        const { latitude, longitude, city, state } = data.records[0].fields;
        setLocalPrefs(prev => ({
          ...prev,
          location_lat: latitude,
          location_lng: longitude,
          location_name: `${city}, ${state}`
        }));
      }
    } catch (e) {
      console.error('Zip lookup error:', e);
    }
  };

  const handleUseCurrentLocation = async () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          
          // Reverse geocode to get location name
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
            );
            const data = await response.json();
            const city = data.address?.city || data.address?.town || data.address?.village || 'Unknown';
            const state = data.address?.state || '';
            const locationName = state ? `${city}, ${state}` : city;
            
            setLocalPrefs(prev => ({
              ...prev,
              location_lat: latitude,
              location_lng: longitude,
              location_name: `${locationName} (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`
            }));
          } catch (e) {
            // Fallback if reverse geocode fails
            setLocalPrefs(prev => ({
              ...prev,
              location_lat: latitude,
              location_lng: longitude,
              location_name: `Coordinates: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
            }));
          }
        },
        (err) => console.error('Geolocation error:', err)
      );
    }
  };

  const handleGenerate = async () => {
    // Cancel any pending auto-save and save immediately
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    await savePrefs(localPrefs);
    
    // Generate briefing
    const result = await generateBriefing.mutateAsync();
    setGeneratedBriefing(result);
  };

  const handleSendSms = async () => {
    if (generatedBriefing?.podcast_url) {
      await sendSms.mutateAsync(generatedBriefing.podcast_url);
    }
  };

  if (prefsLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6 p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">Morning Briefing Lab</h1>
              {/* Auto-save indicator */}
              <div className={`flex items-center gap-1 text-sm transition-opacity duration-300 ${showSaved ? 'opacity-100' : 'opacity-0'}`}>
                <Check className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">Saved</span>
              </div>
              {isSaving && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Saving...</span>
                </div>
              )}
            </div>
            <p className="text-muted-foreground">Experimental briefing generator with enhanced news scraping</p>
          </div>
          <Button 
            onClick={handleGenerate} 
            disabled={generateBriefing.isPending}
            size="lg"
          >
            {generateBriefing.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              'Generate Briefing'
            )}
          </Button>
        </div>

        {/* Location Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Location
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter zip code"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                maxLength={5}
                className="w-32"
              />
              <Button variant="outline" onClick={handleSetLocation}>Set</Button>
              <span className="text-muted-foreground px-2">or</span>
              <Button variant="outline" onClick={handleUseCurrentLocation}>
                Use Current Location
              </Button>
            </div>
            {localPrefs.location_name && (
              <p className="text-sm text-muted-foreground">
                Currently: <span className="font-medium text-foreground">{localPrefs.location_name}</span>
              </p>
            )}
          </CardContent>
        </Card>

        {/* Voice Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mic className="h-5 w-5" />
              Voice
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select
              value={localPrefs.voice_id || 'nPczCjzI2devNBz1zQrb'}
              onValueChange={(value) => setLocalPrefs(prev => ({ ...prev, voice_id: value }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a voice" />
              </SelectTrigger>
              <SelectContent>
                {VOICE_OPTIONS.map((voice) => (
                  <SelectItem key={voice.id} value={voice.id}>
                    <span className="font-medium">{voice.name}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {localPrefs.voice_id && (
              <p className="text-sm text-muted-foreground">
                {VOICE_OPTIONS.find(v => v.id === localPrefs.voice_id)?.description || 
                 VOICE_OPTIONS.find(v => v.id === 'nPczCjzI2devNBz1zQrb')?.description}
              </p>
            )}
            {!localPrefs.voice_id && (
              <p className="text-sm text-muted-foreground">
                {VOICE_OPTIONS[0].description}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Duration Control */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Max Duration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Slider
                value={[localPrefs.max_duration_minutes || 5]}
                onValueChange={([value]) => setLocalPrefs(prev => ({ ...prev, max_duration_minutes: value }))}
                min={2}
                max={10}
                step={1}
                className="flex-1"
              />
              <span className="text-lg font-medium w-16 text-right">{localPrefs.max_duration_minutes || 5} min</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Target length for your briefing. Actual duration may vary slightly.
            </p>
          </CardContent>
        </Card>

        {/* News Categories with Depth */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Newspaper className="h-5 w-5" />
              News Categories
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Choose depth: <span className="font-medium">Off</span> = skip, <span className="font-medium">Brief</span> = quick mention, <span className="font-medium">Full</span> = deep dive
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {DEPTH_CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const depth = (localPrefs[cat.depthKey] as DepthLevel) || 'off';
                const isActive = depth !== 'off';
                
                return (
                  <div 
                    key={cat.depthKey}
                    className={`border rounded-lg p-4 space-y-3 transition-colors ${
                      isActive ? 'border-primary bg-primary/5' : 'border-border'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <span className="font-medium">{cat.label}</span>
                      </div>
                      <RadioGroup
                        value={depth}
                        onValueChange={(v) => setLocalPrefs(prev => ({ ...prev, [cat.depthKey]: v as DepthLevel }))}
                        className="flex gap-0"
                      >
                        {(['off', 'brief', 'full'] as DepthLevel[]).map((level, idx) => (
                          <div key={level} className="flex items-center">
                            <RadioGroupItem value={level} id={`${cat.depthKey}-${level}`} className="sr-only peer" />
                            <Label
                              htmlFor={`${cat.depthKey}-${level}`}
                              className={`px-2 py-1 text-xs border cursor-pointer transition-colors
                                ${idx === 0 ? 'rounded-l-md border-r-0' : ''}
                                ${idx === 2 ? 'rounded-r-md border-l-0' : ''}
                                ${depth === level 
                                  ? level === 'off' 
                                    ? 'bg-muted text-foreground border-border' 
                                    : level === 'brief'
                                      ? 'bg-primary/10 text-foreground border-primary'
                                      : 'bg-primary/20 text-foreground border-primary font-medium'
                                  : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                              {level.charAt(0).toUpperCase() + level.slice(1)}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                    
                    {isActive && (
                      <p className="text-xs text-muted-foreground">
                        {cat.description[depth as 'brief' | 'full']}
                      </p>
                    )}
                    
                    {cat.topicsKey && isActive && (
                      <Input
                        placeholder={cat.topicsPlaceholder}
                        value={(localPrefs[cat.topicsKey] as string) || ''}
                        onChange={(e) => handleTopicChange(cat.topicsKey!, e.target.value)}
                        className="text-sm"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Extras (Toggle Categories) */}
        <Card>
          <CardHeader>
            <CardTitle>Extras</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {TOGGLE_CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isChecked = !!localPrefs[cat.key];
                
                return (
                  <div 
                    key={cat.key}
                    className={`border rounded-lg p-3 space-y-2 transition-colors cursor-pointer ${
                      isChecked ? 'border-primary bg-primary/5' : 'border-border'
                    }`}
                    onClick={() => handleToggle(cat.key)}
                  >
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={cat.key}
                        checked={isChecked}
                        onCheckedChange={() => handleToggle(cat.key)}
                      />
                      <Label 
                        htmlFor={cat.key} 
                        className="flex items-center gap-2 cursor-pointer font-medium text-sm"
                      >
                        <Icon className="h-4 w-4" />
                        {cat.label}
                      </Label>
                    </div>
                    {isChecked && (
                      <p className="text-xs text-muted-foreground">{cat.description}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Custom Topics */}
        <Card>
          <CardHeader>
            <CardTitle>Anything else you'd like to know about?</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="I want to know about upcoming SpaceX launches and any news about the new ChatGPT features..."
              value={localPrefs.custom_topics || ''}
              onChange={(e) => handleTopicChange('custom_topics', e.target.value)}
              rows={3}
            />
          </CardContent>
        </Card>

        {/* Generated Briefing */}
        {generatedBriefing && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Your Briefing</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleSendSms} disabled={sendSms.isPending}>
                    {sendSms.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    <span className="ml-2">Send SMS</span>
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Audio Player */}
              <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                <audio 
                  controls 
                  src={generatedBriefing.podcast_url} 
                  className="w-full"
                />
              </div>
              
              <div className="flex gap-4 text-sm text-muted-foreground">
                <span>Duration: {Math.floor((generatedBriefing.duration_seconds || 0) / 60)}:{String((generatedBriefing.duration_seconds || 0) % 60).padStart(2, '0')}</span>
                <span>Sources: {generatedBriefing.sources_succeeded.length} succeeded, {generatedBriefing.sources_failed.length} failed</span>
              </div>

              {/* Transcript */}
              <Accordion type="single" collapsible>
                <AccordionItem value="transcript">
                  <AccordionTrigger>View Transcript</AccordionTrigger>
                  <AccordionContent>
                    <div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap">
                      {generatedBriefing.script}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              {/* Source Debug */}
              {generatedBriefing.sources_failed.length > 0 && (
                <div className="text-xs text-destructive">
                  Failed sources: {generatedBriefing.sources_failed.join(', ')}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
