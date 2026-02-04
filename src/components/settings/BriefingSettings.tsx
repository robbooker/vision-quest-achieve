import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Sunrise, Clock, Phone, MessageSquare, Copy, Check, RefreshCw, Loader2, MapPin, FileText, Send } from 'lucide-react';
import { toast } from 'sonner';

interface BriefingPreferences {
  id: string;
  user_id: string;
  enabled: boolean;
  default_wake_time: string;
  default_topics: string[];
  default_topic_instructions: string | null;
  timezone: string;
  evening_reminder_time: string;
  preferred_channel: 'call' | 'sms' | 'both';
  voice_id: string;
  include_calendar: boolean;
  include_email_summary: boolean;
  include_weather: boolean;
  weekend_enabled: boolean;
  location_lat: number | null;
  location_lng: number | null;
  location_name: string | null;
  sms_delivery_enabled: boolean;
}

interface TestBriefing {
  id: string;
  status: string;
  podcast_url: string | null;
  script: string | null;
  duration_seconds: number | null;
}

const VOICE_OPTIONS = [
  { id: 'JBFqnCBsd6RMkjVDRZzb', name: 'George (Default)' },
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah' },
  { id: 'nPczCjzI2devNBz1zQrb', name: 'Brian' },
  { id: 'onwK4e9ZLuTAKqWW03F9', name: 'Daniel' },
  { id: 'pFZP5JQG7iQjIQuC4Bku', name: 'Lily' },
];

const TIMEZONE_OPTIONS = [
  { value: 'America/New_York', label: 'Eastern (ET)' },
  { value: 'America/Chicago', label: 'Central (CT)' },
  { value: 'America/Denver', label: 'Mountain (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific (PT)' },
  { value: 'America/Phoenix', label: 'Arizona (MST)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii (HST)' },
];

export function BriefingSettings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [topicInstructions, setTopicInstructions] = useState('');
  const [testBriefing, setTestBriefing] = useState<TestBriefing | null>(null);

  const { data: preferences, isLoading } = useQuery({
    queryKey: ['briefing-preferences', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('briefing_preferences')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data as BriefingPreferences | null;
    },
    enabled: !!user?.id,
  });

  // Sync local state with fetched preferences
  useEffect(() => {
    if (preferences?.default_topic_instructions !== undefined) {
      setTopicInstructions(preferences.default_topic_instructions || '');
    }
  }, [preferences?.default_topic_instructions]);

  const { data: profile } = useQuery({
    queryKey: ['profile-api-key', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('api_key')
        .eq('user_id', user?.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch today's briefing for test playback
  const { data: todayBriefing, refetch: refetchTodayBriefing } = useQuery({
    queryKey: ['today-briefing', user?.id],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('morning_briefings')
        .select('id, status, podcast_url, script, duration_seconds')
        .eq('user_id', user?.id)
        .eq('wake_date', today)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data as TestBriefing | null;
    },
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (todayBriefing) {
      setTestBriefing(todayBriefing);
    }
  }, [todayBriefing]);

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<BriefingPreferences>) => {
      if (preferences?.id) {
        const { error } = await supabase
          .from('briefing_preferences')
          .update(updates)
          .eq('id', preferences.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('briefing_preferences')
          .insert({ user_id: user?.id, ...updates });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['briefing-preferences'] });
      toast.success('Preferences saved');
    },
    onError: (error) => {
      toast.error('Failed to save: ' + (error as Error).message);
    },
  });

  const generateApiKeyMutation = useMutation({
    mutationFn: async () => {
      const newKey = crypto.randomUUID();
      const { error } = await supabase
        .from('profiles')
        .update({ api_key: newKey })
        .eq('user_id', user?.id);
      if (error) throw error;
      return newKey;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile-api-key'] });
      toast.success('API key generated');
    },
  });

  const generateTestBriefingMutation = useMutation({
    mutationFn: async () => {
      setIsGenerating(true);
      setTestBriefing(null);
      
      // First, create a briefing record for today
      const today = new Date().toISOString().split('T')[0];
      
      const { data: briefing, error: createError } = await supabase
        .from('morning_briefings')
        .upsert({
          user_id: user?.id,
          wake_date: today,
          wake_time: preferences?.default_wake_time || '07:00',
          topics: preferences?.default_topics || [],
          status: 'scheduled'
        }, { onConflict: 'user_id,wake_date' })
        .select()
        .single();
      
      if (createError) throw createError;
      
      // Trigger generation
      const { error: genError } = await supabase.functions.invoke('briefing-generate', {
        body: { briefing_id: briefing.id }
      });
      
      if (genError) throw genError;
      
      return briefing.id;
    },
    onSuccess: async () => {
      // Wait a moment then refetch
      await new Promise(r => setTimeout(r, 1000));
      await refetchTodayBriefing();
      toast.success('Test briefing generated!');
      setIsGenerating(false);
    },
    onError: (error) => {
      toast.error('Generation failed: ' + (error as Error).message);
      setIsGenerating(false);
    },
  });

  const handleToggle = (field: keyof BriefingPreferences, value: boolean) => {
    updateMutation.mutate({ [field]: value });
  };

  const handleChange = (field: keyof BriefingPreferences, value: string) => {
    updateMutation.mutate({ [field]: value });
  };

  const handleTopicInstructionsBlur = () => {
    if (topicInstructions !== (preferences?.default_topic_instructions || '')) {
      updateMutation.mutate({ default_topic_instructions: topicInstructions || null });
    }
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        // Try to get location name via reverse geocoding
        let locationName = 'Your location';
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          if (response.ok) {
            const data = await response.json();
            const city = data.address?.city || data.address?.town || data.address?.village || data.address?.municipality;
            const state = data.address?.state;
            if (city && state) {
              locationName = `${city}, ${state}`;
            } else if (city) {
              locationName = city;
            }
          }
        } catch (e) {
          console.error('Geocoding error:', e);
        }

        updateMutation.mutate({
          location_lat: latitude,
          location_lng: longitude,
          location_name: locationName
        });
        setIsLocating(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast.error('Could not get your location. Please check your browser permissions.');
        setIsLocating(false);
      },
      { enableHighAccuracy: false, timeout: 10000 }
    );
  };

  const copyApiKey = () => {
    if (profile?.api_key) {
      navigator.clipboard.writeText(profile.api_key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('API key copied');
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sunrise className="h-5 w-5 text-amber-500" />
            Morning Briefing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sunrise className="h-5 w-5 text-amber-500" />
              Morning Briefing
            </CardTitle>
            <CardDescription>
              Wake up to a personalized AI podcast covering your calendar, weather, and custom news topics.{' '}
              <a 
                href="/blog/morning-briefing" 
                className="text-primary hover:underline"
              >
                Setup guide →
              </a>
            </CardDescription>
          </div>
          <Switch
            checked={preferences?.enabled ?? false}
            onCheckedChange={(checked) => handleToggle('enabled', checked)}
          />
        </div>
      </CardHeader>
      
      {(preferences?.enabled ?? false) && (
        <CardContent className="space-y-6">
          {/* Timing */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Default Wake Time
              </Label>
              <Input
                type="time"
                value={preferences?.default_wake_time || '07:00'}
                onChange={(e) => handleChange('default_wake_time', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Evening Reminder Time</Label>
              <Input
                type="time"
                value={preferences?.evening_reminder_time || '19:00'}
                onChange={(e) => handleChange('evening_reminder_time', e.target.value)}
              />
            </div>
          </div>

          {/* Timezone */}
          <div className="space-y-2">
            <Label>Timezone</Label>
            <Select
              value={preferences?.timezone || 'America/Chicago'}
              onValueChange={(value) => handleChange('timezone', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONE_OPTIONS.map(tz => (
                  <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Weather Location */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Weather Location
            </Label>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleGetLocation}
                disabled={isLocating}
              >
                {isLocating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <MapPin className="h-4 w-4 mr-2" />
                )}
                Use Current Location
              </Button>
              {preferences?.location_name && (
                <span className="text-sm text-muted-foreground">
                  📍 {preferences.location_name}
                </span>
              )}
              {!preferences?.location_name && (
                <span className="text-sm text-muted-foreground">
                  No location set (defaults to Chicago)
                </span>
              )}
            </div>
          </div>

          {/* Reminder Method */}
          <div className="space-y-2">
            <Label>Reminder Method</Label>
            <div className="flex gap-2">
              {(['sms', 'call', 'both'] as const).map(channel => (
                <Button
                  key={channel}
                  variant={preferences?.preferred_channel === channel ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleChange('preferred_channel', channel)}
                  className="flex items-center gap-1"
                >
                  {channel === 'sms' && <MessageSquare className="h-4 w-4" />}
                  {channel === 'call' && <Phone className="h-4 w-4" />}
                  {channel === 'both' && <>📱</>}
                  {channel.charAt(0).toUpperCase() + channel.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          {/* Weekend Setting */}
          <div className="flex items-center justify-between">
            <div>
              <Label>Weekend Briefings</Label>
              <p className="text-sm text-muted-foreground">Send reminders on Saturday and Sunday</p>
            </div>
            <Switch
              checked={preferences?.weekend_enabled ?? false}
              onCheckedChange={(checked) => handleToggle('weekend_enabled', checked)}
            />
          </div>

          {/* Default Topic Instructions (Paragraph) */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Default Topics & Instructions
            </Label>
            <Textarea
              placeholder="Describe what topics you care about and how you want them covered. For example: 'Cover any SMCI earnings news, FDA approvals in biotech, and tariff developments with China. If there's big market news, lead with that.'"
              value={topicInstructions}
              onChange={(e) => setTopicInstructions(e.target.value)}
              onBlur={handleTopicInstructionsBlur}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Write a paragraph describing what news topics matter to you and any preferences for how they're covered.
            </p>
          </div>

          {/* Include Options */}
          {/* Include in Briefing */}
          <div className="space-y-3">
            <Label>Include in Briefing</Label>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">📅 Calendar events</span>
                <Switch
                  checked={preferences?.include_calendar ?? true}
                  onCheckedChange={(checked) => handleToggle('include_calendar', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">🌤️ Weather</span>
                <Switch
                  checked={preferences?.include_weather ?? true}
                  onCheckedChange={(checked) => handleToggle('include_weather', checked)}
                />
              </div>
            </div>
          </div>

          {/* SMS Delivery Option */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              SMS Delivery
            </Label>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm">Send me an SMS when my briefing is ready</span>
                <p className="text-xs text-muted-foreground">
                  Delivers a link to your podcast via text message
                </p>
              </div>
              <Switch
                checked={preferences?.sms_delivery_enabled ?? false}
                onCheckedChange={(checked) => handleToggle('sms_delivery_enabled', checked)}
              />
            </div>
          </div>

          {/* Voice Selection */}
          <div className="space-y-2">
            <Label>Voice</Label>
            <Select
              value={preferences?.voice_id || 'JBFqnCBsd6RMkjVDRZzb'}
              onValueChange={(value) => handleChange('voice_id', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VOICE_OPTIONS.map(voice => (
                  <SelectItem key={voice.id} value={voice.id}>{voice.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Test Generation with Audio Player */}
          <div className="border-t pt-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Test Your Briefing</Label>
                <p className="text-sm text-muted-foreground">Generate a test episode to preview</p>
              </div>
            </div>
            
            <Button
              variant="outline"
              onClick={() => generateTestBriefingMutation.mutate()}
              disabled={isGenerating}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating Test Briefing...
                </>
              ) : (
                <>
                  <Sunrise className="h-4 w-4 mr-2" />
                  Generate Test Briefing
                </>
              )}
            </Button>

            {/* Audio Player and Script */}
            {testBriefing?.status === 'ready' && testBriefing.podcast_url && (
              <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Briefing ready</span>
                  {testBriefing.duration_seconds && (
                    <span>• {formatDuration(testBriefing.duration_seconds)}</span>
                  )}
                </div>
                <audio 
                  src={testBriefing.podcast_url} 
                  controls 
                  className="w-full"
                />
                
                {testBriefing.script && (
                  <Accordion type="single" collapsible>
                    <AccordionItem value="script" className="border-none">
                      <AccordionTrigger className="text-sm py-2">
                        View Script
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="text-sm text-muted-foreground whitespace-pre-wrap bg-background p-3 rounded-md max-h-60 overflow-y-auto">
                          {testBriefing.script}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                )}
              </div>
            )}

            {testBriefing?.status === 'failed' && (
              <div className="p-4 bg-destructive/10 text-destructive rounded-lg text-sm">
                Generation failed. Please try again.
              </div>
            )}

            {testBriefing?.status === 'generating' && (
              <div className="p-4 bg-muted/50 rounded-lg flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </div>
            )}
          </div>

          {/* iOS Shortcut API Key */}
          <div className="space-y-2 border-t pt-4">
            <Label>iOS Shortcut API Key</Label>
            <p className="text-sm text-muted-foreground mb-2">
              Use this key in your iOS Shortcut to authenticate wake-check requests.
            </p>
            <div className="flex gap-2">
              <Input
                type="password"
                value={profile?.api_key || ''}
                readOnly
                placeholder="No API key generated"
              />
              {profile?.api_key ? (
                <Button variant="outline" size="icon" onClick={copyApiKey}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              ) : null}
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => generateApiKeyMutation.mutate()}
                disabled={generateApiKeyMutation.isPending}
              >
                <RefreshCw className={`h-4 w-4 ${generateApiKeyMutation.isPending ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
