import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, Send, MapPin, Cloud, Calendar, Trophy, TrendingUp, 
  Briefcase, Vote, BookOpen, Tv, Music, Gamepad2, FlaskConical, 
  HeartPulse, Target, Sparkles, Newspaper, Mic, Check, Clock,
  MessageSquare, Phone, Sunrise, AlertTriangle, Play, FileText,
  Smartphone, Copy, ExternalLink
} from 'lucide-react';
import { 
  useBriefingLabPreferences, 
  useUpdateBriefingLabPreferences, 
  useGenerateLabBriefing,
  useSendBriefingSms 
} from '@/hooks/useBriefingLab';
import { useBriefingHistory } from '@/hooks/useBriefings';
import type { BriefingLabPreferences, DepthLevel } from '@/hooks/useBriefingLab';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { toast } from 'sonner';
import { format } from 'date-fns';

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

const TIMEZONE_OPTIONS = [
  { value: 'America/New_York', label: 'Eastern (ET)' },
  { value: 'America/Chicago', label: 'Central (CT)' },
  { value: 'America/Denver', label: 'Mountain (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific (PT)' },
  { value: 'America/Phoenix', label: 'Arizona (MST)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii (HST)' },
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

interface SchedulingPreferences {
  enabled: boolean;
  default_wake_time: string;
  evening_reminder_time: string;
  timezone: string;
  preferred_channel: 'sms' | 'call' | 'both';
  weekend_enabled: boolean;
  sms_delivery_enabled: boolean;
}

export default function MorningBriefingLab() {
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const queryClient = useQueryClient();
  const { data: prefs, isLoading: prefsLoading } = useBriefingLabPreferences();
  const { data: briefingHistory } = useBriefingHistory(5);
  const updatePrefs = useUpdateBriefingLabPreferences();
  const generateBriefing = useGenerateLabBriefing();
  const sendSms = useSendBriefingSms();
  
  // Get the latest briefing
  const latestBriefing = briefingHistory?.briefings?.[0];

  const [localPrefs, setLocalPrefs] = useState<Partial<BriefingLabPreferences>>({});
  const [zipCode, setZipCode] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const initialLoadRef = useRef(true);
  const [generatedBriefing, setGeneratedBriefing] = useState<{
    podcast_url: string;
    script: string;
    duration_seconds: number;
    sources_succeeded: string[];
    sources_failed: string[];
  } | null>(null);

  // Fetch scheduling preferences from briefing_preferences table
  const { data: schedulingPrefs } = useQuery({
    queryKey: ['briefing-preferences', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('briefing_preferences')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data as SchedulingPreferences | null;
    },
    enabled: !!user?.id,
  });

  // Fetch user's phone number for SMS validation
  const { data: userProfile } = useQuery({
    queryKey: ['profile-phone', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('phone_us')
        .eq('user_id', user?.id)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Mutation for scheduling preferences
  const updateSchedulingMutation = useMutation({
    mutationFn: async (updates: Partial<SchedulingPreferences>) => {
      const { data: existing } = await supabase
        .from('briefing_preferences')
        .select('id')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('briefing_preferences')
          .update(updates)
          .eq('user_id', user?.id);
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

  // Initialize local prefs from server
  useEffect(() => {
    if (prefs) {
      setLocalPrefs(prefs);
      initialLoadRef.current = false;
    }
  }, [prefs]);

  const handleToggle = (key: keyof BriefingLabPreferences) => {
    setLocalPrefs(prev => ({ ...prev, [key]: !prev[key] }));
    if (!initialLoadRef.current) setHasUnsavedChanges(true);
  };

  const handleTopicChange = (key: keyof BriefingLabPreferences, value: string) => {
    setLocalPrefs(prev => ({ ...prev, [key]: value }));
    if (!initialLoadRef.current) setHasUnsavedChanges(true);
  };

  const handleSavePrefs = async () => {
    setIsSaving(true);
    try {
      await updatePrefs.mutateAsync(localPrefs);
      setHasUnsavedChanges(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSetLocation = async () => {
    if (!zipCode || zipCode.length !== 5) return;
    
    try {
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
        // Also update briefing_preferences for weather in automation
        updateSchedulingMutation.mutate({
          location_lat: latitude,
          location_lng: longitude,
          location_name: `${city}, ${state}`
        } as any);
        if (!initialLoadRef.current) setHasUnsavedChanges(true);
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
            // Also update briefing_preferences
            updateSchedulingMutation.mutate({
              location_lat: latitude,
              location_lng: longitude,
              location_name: locationName
            } as any);
            if (!initialLoadRef.current) setHasUnsavedChanges(true);
          } catch (e) {
            setLocalPrefs(prev => ({
              ...prev,
              location_lat: latitude,
              location_lng: longitude,
              location_name: `Coordinates: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
            }));
            if (!initialLoadRef.current) setHasUnsavedChanges(true);
          }
        },
        (err) => console.error('Geolocation error:', err)
      );
    }
  };

  const handleSchedulingChange = (field: keyof SchedulingPreferences, value: any) => {
    updateSchedulingMutation.mutate({ [field]: value });
  };

  const handleGenerate = async () => {
    if (hasUnsavedChanges) {
      await handleSavePrefs();
    }
    
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
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Sunrise className="h-5 w-5 text-amber-500" />
                  Morning Briefing
                </CardTitle>
                <CardDescription>
                  Wake up to a personalized AI podcast covering your calendar, weather, and custom news topics. 
                  Your briefing will appear on the Today page when ready.{' '}
                  <Link to="/blog/morning-briefing" className="text-primary hover:underline">
                    Setup guide →
                  </Link>
                </CardDescription>
              </div>
              <Switch
                checked={schedulingPrefs?.enabled ?? false}
                onCheckedChange={(checked) => handleSchedulingChange('enabled', checked)}
              />
            </div>
          </CardHeader>
        </Card>

        {/* Latest Briefing */}
        {latestBriefing && latestBriefing.status === 'ready' && latestBriefing.podcast_url && (
          <Card className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/30">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Play className="h-4 w-4" />
                  Latest Briefing
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {format(new Date(latestBriefing.wake_date), 'MMM d, yyyy')}
                  </Badge>
                  {latestBriefing.duration_seconds && (
                    <span className="text-xs text-muted-foreground">
                      {Math.floor(latestBriefing.duration_seconds / 60)}:{String(latestBriefing.duration_seconds % 60).padStart(2, '0')}
                    </span>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <audio 
                controls 
                src={latestBriefing.podcast_url} 
                className="w-full"
              />
              
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => sendSms.mutateAsync(latestBriefing.podcast_url!)}
                  disabled={sendSms.isPending || !userProfile?.phone_us}
                >
                  {sendSms.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  <span className="ml-2">Send SMS</span>
                </Button>
                {!userProfile?.phone_us && (
                  <span className="text-xs text-muted-foreground">
                    Add phone in <Link to="/settings" className="text-primary hover:underline">Settings</Link>
                  </span>
                )}
              </div>

              {latestBriefing.script && (
                <Accordion type="single" collapsible>
                  <AccordionItem value="transcript" className="border-none">
                    <AccordionTrigger className="py-1 text-sm">
                      <span className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        View Transcript
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="text-sm text-muted-foreground whitespace-pre-wrap bg-background/50 p-3 rounded-md max-h-60 overflow-y-auto">
                        {latestBriefing.script}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              )}
            </CardContent>
          </Card>
        )}

        {/* Scheduling Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Schedule & Delivery
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Wake Time & Evening Reminder */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Default Wake Time
                </Label>
                <Input
                  type="time"
                  value={schedulingPrefs?.default_wake_time || '07:00'}
                  onChange={(e) => handleSchedulingChange('default_wake_time', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Evening Reminder Time</Label>
                <Input
                  type="time"
                  value={schedulingPrefs?.evening_reminder_time || '19:00'}
                  onChange={(e) => handleSchedulingChange('evening_reminder_time', e.target.value)}
                />
              </div>
            </div>

            {/* Timezone */}
            <div className="space-y-2">
              <Label>Timezone</Label>
              <Select
                value={schedulingPrefs?.timezone || 'America/Chicago'}
                onValueChange={(value) => handleSchedulingChange('timezone', value)}
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

            {/* Reminder Method */}
            <div className="space-y-2">
              <Label>Reminder Method</Label>
              <div className="flex gap-2">
                {(['sms', 'call', 'both'] as const).map(channel => (
                  <Button
                    key={channel}
                    variant={schedulingPrefs?.preferred_channel === channel ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleSchedulingChange('preferred_channel', channel)}
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

            {/* Weekend Briefings */}
            <div className="flex items-center justify-between">
              <div>
                <Label>Weekend Briefings</Label>
                <p className="text-sm text-muted-foreground">Send reminders on Saturday and Sunday</p>
              </div>
              <Switch
                checked={schedulingPrefs?.weekend_enabled ?? false}
                onCheckedChange={(checked) => handleSchedulingChange('weekend_enabled', checked)}
              />
            </div>

            {/* SMS Delivery */}
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
                  checked={schedulingPrefs?.sms_delivery_enabled ?? false}
                  onCheckedChange={(checked) => {
                    if (checked && !userProfile?.phone_us) {
                      toast.error('Please add your US phone number in Profile Settings first');
                      return;
                    }
                    handleSchedulingChange('sms_delivery_enabled', checked);
                  }}
                />
              </div>
              
              {schedulingPrefs?.sms_delivery_enabled && !userProfile?.phone_us && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-amber-600 dark:text-amber-400">
                      No phone number on file
                    </p>
                    <p className="text-muted-foreground">
                      Add your US phone number in{' '}
                      <Link to="/settings" className="text-primary hover:underline">Settings → Profile</Link>
                      {' '}to receive SMS delivery.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Location Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Weather Location
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {localPrefs.location_name && (
              <p className="text-sm text-muted-foreground">
                📍 {localPrefs.location_name}
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter 5-digit zip code"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  maxLength={5}
                  className="w-40"
                />
                <Button variant="outline" onClick={handleSetLocation}>Set</Button>
              </div>
              <span className="text-muted-foreground self-center">or</span>
              <Button variant="outline" onClick={handleUseCurrentLocation}>
                <MapPin className="h-4 w-4 mr-2" />
                Use Current Location
              </Button>
            </div>
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
              onValueChange={(value) => {
                setLocalPrefs(prev => ({ ...prev, voice_id: value }));
                if (!initialLoadRef.current) setHasUnsavedChanges(true);
              }}
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
            <p className="text-sm text-muted-foreground">
              {VOICE_OPTIONS.find(v => v.id === (localPrefs.voice_id || 'nPczCjzI2devNBz1zQrb'))?.description}
            </p>
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
                onValueChange={([value]) => {
                  setLocalPrefs(prev => ({ ...prev, max_duration_minutes: value }));
                  if (!initialLoadRef.current) setHasUnsavedChanges(true);
                }}
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
                        onValueChange={(v) => {
                          setLocalPrefs(prev => ({ ...prev, [cat.depthKey]: v as DepthLevel }));
                          if (!initialLoadRef.current) setHasUnsavedChanges(true);
                        }}
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

        {/* Actions */}
        <div className="flex items-center justify-end gap-2">
          <Button 
            variant="outline"
            onClick={handleSavePrefs} 
            disabled={isSaving || !hasUnsavedChanges}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : hasUnsavedChanges ? (
              'Save Preferences'
            ) : (
              <>
                <Check className="h-4 w-4 mr-1" />
                Saved
              </>
            )}
          </Button>
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

              {generatedBriefing.sources_failed.length > 0 && (
                <div className="text-xs text-destructive">
                  Failed sources: {generatedBriefing.sources_failed.join(', ')}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Admin: iOS Shortcut Integration */}
        {isAdmin && (
          <Card className="border-dashed border-2 border-muted-foreground/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Smartphone className="h-4 w-4" />
                iOS Shortcut Integration
                <Badge variant="outline" className="ml-2 text-xs">Admin</Badge>
              </CardTitle>
              <CardDescription>
                Use these endpoints to trigger and retrieve your morning briefing from iOS Shortcuts.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Wake Check Endpoint */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Briefing Wake Check Endpoint</Label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-muted px-3 py-2 rounded-md text-xs font-mono break-all">
                    https://gogzkyjylruuziseprfw.supabase.co/functions/v1/briefing-wake-check
                  </code>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      navigator.clipboard.writeText('https://gogzkyjylruuziseprfw.supabase.co/functions/v1/briefing-wake-check');
                      toast.success('Copied to clipboard');
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  POST with <code className="bg-muted px-1 rounded">{"{ \"wake_time\": \"07:00\" }"}</code> and Authorization header
                </p>
              </div>

              {/* Response Format */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Response Format</Label>
                <pre className="bg-muted p-3 rounded-md text-xs font-mono overflow-x-auto">
{`{
  "status": "ready" | "generating" | "scheduled",
  "podcast_url": "https://...",
  "briefing_id": "uuid",
  "message": "..."
}`}
                </pre>
              </div>

              {/* Authorization */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Authorization</Label>
                <p className="text-xs text-muted-foreground">
                  Include your Supabase access token in the Authorization header:
                </p>
                <code className="block bg-muted px-3 py-2 rounded-md text-xs font-mono">
                  Authorization: Bearer YOUR_ACCESS_TOKEN
                </code>
              </div>

              {/* iOS Shortcut Tips */}
              <div className="space-y-2 pt-2 border-t border-border">
                <Label className="text-sm font-medium">iOS Shortcut Flow</Label>
                <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Call the wake-check endpoint at your wake time</li>
                  <li>If status is "ready", use podcast_url to play audio</li>
                  <li>If status is "generating", wait and retry in 30-60 seconds</li>
                  <li>If status is "scheduled", the briefing will be generated shortly</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
