import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  Loader2, Send, MapPin, Cloud, Calendar, Trophy, TrendingUp, 
  Briefcase, Vote, BookOpen, Tv, Music, Gamepad2, FlaskConical, 
  HeartPulse, Target, Sparkles, Newspaper
} from 'lucide-react';
import { 
  useBriefingLabPreferences, 
  useUpdateBriefingLabPreferences, 
  useGenerateLabBriefing,
  useSendBriefingSms 
} from '@/hooks/useBriefingLab';
import type { BriefingLabPreferences } from '@/hooks/useBriefingLab';

interface CategoryConfig {
  key: keyof BriefingLabPreferences;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  topicsKey?: keyof BriefingLabPreferences;
  topicsPlaceholder?: string;
}

const CATEGORIES: CategoryConfig[] = [
  { key: 'include_sports', label: 'Sports', icon: Trophy, topicsKey: 'sports_teams', topicsPlaceholder: 'Heat, Yankees, Giants...' },
  { key: 'include_tech', label: 'Tech / AI', icon: Sparkles, topicsKey: 'tech_topics', topicsPlaceholder: 'vibe coding, Claude, AI agents...' },
  { key: 'include_business', label: 'Business', icon: Briefcase, topicsKey: 'business_topics', topicsPlaceholder: 'Tesla, fintech, startups...' },
  { key: 'include_trading', label: 'Trading / Markets', icon: TrendingUp },
  { key: 'include_politics', label: 'Politics', icon: Vote, topicsKey: 'politics_topics', topicsPlaceholder: 'economic policy, tech regulation...' },
  { key: 'include_books', label: 'Books', icon: BookOpen, topicsKey: 'books_topics', topicsPlaceholder: 'sci-fi, business books...' },
  { key: 'include_film_tv', label: 'Film & TV', icon: Tv },
  { key: 'include_music', label: 'Music', icon: Music, topicsKey: 'music_topics', topicsPlaceholder: 'electronic, jazz...' },
  { key: 'include_gaming', label: 'Gaming', icon: Gamepad2, topicsKey: 'gaming_topics', topicsPlaceholder: 'PlayStation, indie games...' },
  { key: 'include_science', label: 'Science', icon: FlaskConical, topicsKey: 'science_topics', topicsPlaceholder: 'space, climate...' },
  { key: 'include_health', label: 'Health & Fitness', icon: HeartPulse, topicsKey: 'health_topics', topicsPlaceholder: 'nutrition, longevity...' },
  { key: 'include_short_scout', label: 'Short Scout', icon: TrendingUp },
  { key: 'include_weather', label: 'Weather', icon: Cloud },
  { key: 'include_calendar', label: 'Calendar', icon: Calendar },
  { key: 'include_intention', label: 'Word of Month', icon: Target },
];

export default function MorningBriefingLab() {
  const { data: prefs, isLoading: prefsLoading } = useBriefingLabPreferences();
  const updatePrefs = useUpdateBriefingLabPreferences();
  const generateBriefing = useGenerateLabBriefing();
  const sendSms = useSendBriefingSms();

  const [localPrefs, setLocalPrefs] = useState<Partial<BriefingLabPreferences>>({});
  const [zipCode, setZipCode] = useState('');
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
    }
  }, [prefs]);

  const handleToggle = (key: keyof BriefingLabPreferences) => {
    setLocalPrefs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleTopicChange = (key: keyof BriefingLabPreferences, value: string) => {
    setLocalPrefs(prev => ({ ...prev, [key]: value }));
  };

  const handleSavePrefs = async () => {
    await updatePrefs.mutateAsync(localPrefs);
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

  const handleUseCurrentLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocalPrefs(prev => ({
            ...prev,
            location_lat: pos.coords.latitude,
            location_lng: pos.coords.longitude,
            location_name: 'Current Location'
          }));
        },
        (err) => console.error('Geolocation error:', err)
      );
    }
  };

  const handleGenerate = async () => {
    // Save prefs first
    await handleSavePrefs();
    
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
            <h1 className="text-2xl font-bold">Morning Briefing Lab</h1>
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

        {/* Categories Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Newspaper className="h-5 w-5" />
              What would you like in your briefing?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isChecked = !!localPrefs[cat.key];
                
                return (
                  <div 
                    key={cat.key}
                    className={`border rounded-lg p-4 space-y-3 transition-colors ${
                      isChecked ? 'border-primary bg-primary/5' : 'border-border'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id={cat.key}
                        checked={isChecked}
                        onCheckedChange={() => handleToggle(cat.key)}
                      />
                      <Label 
                        htmlFor={cat.key} 
                        className="flex items-center gap-2 cursor-pointer font-medium"
                      >
                        <Icon className="h-4 w-4" />
                        {cat.label}
                      </Label>
                    </div>
                    
                    {cat.topicsKey && isChecked && (
                      <Input
                        placeholder={cat.topicsPlaceholder}
                        value={(localPrefs[cat.topicsKey] as string) || ''}
                        onChange={(e) => handleTopicChange(cat.topicsKey!, e.target.value)}
                        className="text-sm"
                      />
                    )}

                    {cat.key === 'include_short_scout' && isChecked && (
                      <p className="text-xs text-muted-foreground">
                        Shows top searched & most traded stocks on Short Scout
                      </p>
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
