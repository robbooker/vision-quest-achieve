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
  Smartphone, Copy, ExternalLink, TestTube, CheckCircle, XCircle
} from 'lucide-react';
import { 
  useBriefingLabPreferences, 
  useUpdateBriefingLabPreferences, 
  useGenerateLabBriefing,
  useSendBriefingSms,
  useBriefingLabEpisodes
} from '@/hooks/useBriefingLab';
import type { BriefingLabPreferences, DepthLevel, BriefingLabEpisode } from '@/hooks/useBriefingLab';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { MorningBriefingPlayer } from '@/components/dashboard/MorningBriefingPlayer';

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

// SchedulingPreferences is now part of BriefingLabPreferences - no separate interface needed

export default function MorningBriefingLab() {
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const queryClient = useQueryClient();
  const { data: prefs, isLoading: prefsLoading } = useBriefingLabPreferences();
  const { data: labEpisodes } = useBriefingLabEpisodes(5);
  const updatePrefs = useUpdateBriefingLabPreferences();
  const generateBriefing = useGenerateLabBriefing();
  const sendSms = useSendBriefingSms();
  
  // Get the latest ready briefing from the NEW system (briefing_lab_episodes)
  const latestBriefing = labEpisodes?.find(ep => ep.status === 'ready' && ep.podcast_url);

  const [localPrefs, setLocalPrefs] = useState<Partial<BriefingLabPreferences>>({});
  const [zipCode, setZipCode] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const initialLoadRef = useRef(true);
  const [generatedBriefing, setGeneratedBriefing] = useState<{
    podcast_url: string;
    script: string;
    duration_seconds: number;
    sources_succeeded: string[];
    sources_failed: string[];
  } | null>(null);

  // Short Scout API testing state
  const [shortScoutTestResult, setShortScoutTestResult] = useState<{
    secrets_configured: boolean;
    short_scout_url?: string;
    tickers: { success: boolean; data: unknown; error?: string };
    engagement: { success: boolean; data: unknown; error?: string };
    trends: { success: boolean; data: unknown; error?: string };
    tested_at?: string;
    error?: string;
  } | null>(null);
  const [isTestingShortScout, setIsTestingShortScout] = useState(false);

  // Fetch API key for admin iOS shortcut section
  useEffect(() => {
    if (isAdmin && user?.id) {
      supabase
        .from('profiles')
        .select('api_key')
        .eq('user_id', user.id)
        .single()
        .then(({ data }) => {
          setApiKey(data?.api_key || null);
        });
    }
  }, [isAdmin, user?.id]);
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

  // Initialize local prefs from server - handles both existing prefs and new users
  useEffect(() => {
    // Only run initialization once when prefsLoading completes
    if (prefsLoading) return;
    
    if (prefs) {
      setLocalPrefs(prefs);
    }
    // Mark initial load complete whether or not prefs exist
    // This allows new users to save their first preferences
    initialLoadRef.current = false;
  }, [prefs, prefsLoading]);

  // Auto-save preferences with debounce
  useEffect(() => {
    if (!hasUnsavedChanges || initialLoadRef.current) return;
    
    const timeout = setTimeout(async () => {
      try {
        console.log('[MorningBriefingLab] Auto-saving preferences...');
        await updatePrefs.mutateAsync(localPrefs);
        setHasUnsavedChanges(false);
      } catch (error) {
        console.error('[MorningBriefingLab] Auto-save failed:', error);
      }
    }, 1500); // 1.5 second debounce
    
    return () => clearTimeout(timeout);
  }, [hasUnsavedChanges, localPrefs]);

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
      // Use Nominatim OpenStreetMap API for geocoding US zip codes
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?postalcode=${zipCode}&country=US&format=json&limit=1`,
        {
          headers: {
            'User-Agent': 'GPMorningBriefing/1.0'
          }
        }
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        const result = data[0];
        const latitude = parseFloat(result.lat);
        const longitude = parseFloat(result.lon);
        
        // Extract city/state from display_name (format: "78701, Austin, Travis County, Texas, United States")
        const parts = result.display_name.split(', ');
        let locationName = result.display_name;
        
        // Try to build a clean "City, State" format
        if (parts.length >= 4) {
          // Skip zip code and county, get city and state
          const city = parts[1] || parts[0];
          const state = parts[parts.length - 2]; // State is usually second to last
          locationName = `${city}, ${state}`;
        }
        
        // Update local state
        const newPrefs = {
          ...localPrefs,
          location_lat: latitude,
          location_lng: longitude,
          location_name: locationName
        };
        setLocalPrefs(newPrefs);
        
        // IMMEDIATELY save to briefing_lab_preferences (the correct table)
        console.log('[MorningBriefingLab] Saving location to briefing_lab_preferences:', { latitude, longitude, locationName });
        await updatePrefs.mutateAsync({
          location_lat: latitude,
          location_lng: longitude,
          location_name: locationName
        });
        setHasUnsavedChanges(false);
        toast.success(`Location set to ${locationName}`);
      } else {
        toast.error('Could not find location for this zip code');
      }
    } catch (e) {
      console.error('Zip lookup error:', e);
      toast.error('Failed to lookup zip code');
    }
  };

  const handleUseCurrentLocation = async () => {
    if ('geolocation' in navigator) {
      toast.info('Getting your location...');
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
            
            // Update local state
            const newPrefs = {
              ...localPrefs,
              location_lat: latitude,
              location_lng: longitude,
              location_name: locationName
            };
            setLocalPrefs(newPrefs);
            
            // IMMEDIATELY save to briefing_lab_preferences (the correct table)
            console.log('[MorningBriefingLab] Saving geolocation to briefing_lab_preferences:', { latitude, longitude, locationName });
            await updatePrefs.mutateAsync({
              location_lat: latitude,
              location_lng: longitude,
              location_name: locationName
            });
            setHasUnsavedChanges(false);
            toast.success(`Location set to ${locationName}`, {
              description: `Coordinates: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
            });
          } catch (e) {
            const fallbackName = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
            
            // Update local state
            const newPrefs = {
              ...localPrefs,
              location_lat: latitude,
              location_lng: longitude,
              location_name: fallbackName
            };
            setLocalPrefs(newPrefs);
            
            // IMMEDIATELY save to briefing_lab_preferences
            console.log('[MorningBriefingLab] Saving fallback geolocation to briefing_lab_preferences:', { latitude, longitude, fallbackName });
            await updatePrefs.mutateAsync({
              location_lat: latitude,
              location_lng: longitude,
              location_name: fallbackName
            });
            
            setHasUnsavedChanges(false);
            toast.success(`Location set`, {
              description: `Coordinates: ${fallbackName}`
            });
          }
        },
        (err) => {
          console.error('Geolocation error:', err);
          toast.error('Could not get location', {
            description: err.message || 'Please check your browser permissions'
          });
        }
      );
    } else {
      toast.error('Geolocation not supported by your browser');
    }
  };

  const handleSchedulingChange = async (field: keyof BriefingLabPreferences, value: any) => {
    // Update local state
    setLocalPrefs(prev => ({ ...prev, [field]: value }));
    
    // Immediately save to database
    try {
      console.log('[MorningBriefingLab] Saving scheduling change:', { field, value });
      await updatePrefs.mutateAsync({ [field]: value });
    } catch (error) {
      console.error('[MorningBriefingLab] Failed to save scheduling change:', error);
    }
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

  const handleTestShortScout = async () => {
    setIsTestingShortScout(true);
    setShortScoutTestResult(null);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('Not authenticated');
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/test-short-scout`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const result = await response.json();
      setShortScoutTestResult(result);
      
      if (result.tickers?.success && result.engagement?.success && result.trends?.success) {
        toast.success('Short Scout API test passed!');
      } else if (result.secrets_configured === false) {
        toast.error('Short Scout secrets not configured');
      } else {
        toast.warning('Some Short Scout endpoints failed');
      }
    } catch (error) {
      console.error('Short Scout test error:', error);
      toast.error('Failed to test Short Scout API');
    } finally {
      setIsTestingShortScout(false);
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
                checked={localPrefs?.enabled ?? false}
                onCheckedChange={(checked) => handleSchedulingChange('enabled', checked)}
              />
            </div>
          </CardHeader>
        </Card>

        {/* Latest Briefing - only show if no freshly generated briefing */}
        {!generatedBriefing && latestBriefing && latestBriefing.podcast_url && (
          <Card className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-200/30 dark:border-amber-500/30">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Play className="h-4 w-4" />
                  Latest Briefing
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {latestBriefing.generated_at 
                      ? format(new Date(latestBriefing.generated_at), 'MMM d, yyyy')
                      : format(new Date(latestBriefing.created_at), 'MMM d, yyyy')
                    }
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
                  value={localPrefs?.default_wake_time || '07:00'}
                  onChange={(e) => handleSchedulingChange('default_wake_time', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Evening Reminder Time</Label>
                <Input
                  type="time"
                  value={localPrefs?.evening_reminder_time || '19:00'}
                  onChange={(e) => handleSchedulingChange('evening_reminder_time', e.target.value)}
                />
              </div>
            </div>

            {/* Timezone */}
            <div className="space-y-2">
              <Label>Timezone</Label>
              <Select
                value={localPrefs?.timezone || 'America/Chicago'}
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
                    variant={localPrefs?.preferred_channel === channel ? 'default' : 'outline'}
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
                checked={localPrefs?.weekend_enabled ?? false}
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
                  checked={localPrefs?.sms_delivery_enabled ?? false}
                  onCheckedChange={(checked) => {
                    if (checked && !userProfile?.phone_us) {
                      toast.error('Please add your US phone number in Profile Settings first');
                      return;
                    }
                    handleSchedulingChange('sms_delivery_enabled', checked);
                  }}
                />
              </div>
              
              {localPrefs?.sms_delivery_enabled && !userProfile?.phone_us && (
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
            {localPrefs.location_name ? (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
                <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">{localPrefs.location_name}</p>
                  {localPrefs.location_lat && localPrefs.location_lng && (
                    <p className="text-xs text-muted-foreground">
                      {localPrefs.location_lat.toFixed(4)}, {localPrefs.location_lng.toFixed(4)}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">No location set</p>
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

        {/* Today's Briefing Player - persists even if user navigates away */}
        <MorningBriefingPlayer />

        {/* Admin: Short Scout API Testing */}
        {isAdmin && (
          <Card className="border-dashed border-2 border-muted-foreground/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TestTube className="h-4 w-4" />
                Short Scout API Test
                <Badge variant="outline" className="ml-2 text-xs">Admin</Badge>
              </CardTitle>
              <CardDescription>
                Test the Short Scout API endpoints to verify connectivity and response format.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={handleTestShortScout}
                disabled={isTestingShortScout}
                variant="outline"
              >
                {isTestingShortScout ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Testing...
                  </>
                ) : (
                  <>
                    <TestTube className="h-4 w-4 mr-2" />
                    Test Short Scout API
                  </>
                )}
              </Button>

              {shortScoutTestResult && (
                <div className="space-y-4">
                  {/* Status Overview */}
                  <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1">
                      {shortScoutTestResult.secrets_configured ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-destructive" />
                      )}
                      Secrets: {shortScoutTestResult.secrets_configured ? 'Configured' : 'Missing'}
                    </span>
                    {shortScoutTestResult.tested_at && (
                      <span className="text-muted-foreground">
                        Tested: {format(new Date(shortScoutTestResult.tested_at), 'h:mm:ss a')}
                      </span>
                    )}
                  </div>

                  {/* Individual Section Results */}
                  <div className="grid gap-3">
                    {/* Tickers */}
                    <div className="p-3 bg-muted rounded-lg space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        {shortScoutTestResult.tickers.success ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-destructive" />
                        )}
                        Tickers Section
                      </div>
                      {shortScoutTestResult.tickers.success ? (
                        <pre className="text-xs bg-background p-2 rounded overflow-x-auto max-h-32">
                          {JSON.stringify(shortScoutTestResult.tickers.data, null, 2)}
                        </pre>
                      ) : (
                        <p className="text-xs text-destructive">{shortScoutTestResult.tickers.error}</p>
                      )}
                    </div>

                    {/* Engagement */}
                    <div className="p-3 bg-muted rounded-lg space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        {shortScoutTestResult.engagement.success ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-destructive" />
                        )}
                        Engagement Section
                      </div>
                      {shortScoutTestResult.engagement.success ? (
                        <pre className="text-xs bg-background p-2 rounded overflow-x-auto max-h-32">
                          {JSON.stringify(shortScoutTestResult.engagement.data, null, 2)}
                        </pre>
                      ) : (
                        <p className="text-xs text-destructive">{shortScoutTestResult.engagement.error}</p>
                      )}
                    </div>

                    {/* Trends */}
                    <div className="p-3 bg-muted rounded-lg space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        {shortScoutTestResult.trends.success ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-destructive" />
                        )}
                        Trends Section
                      </div>
                      {shortScoutTestResult.trends.success ? (
                        <pre className="text-xs bg-background p-2 rounded overflow-x-auto max-h-32">
                          {JSON.stringify(shortScoutTestResult.trends.data, null, 2)}
                        </pre>
                      ) : (
                        <p className="text-xs text-destructive">{shortScoutTestResult.trends.error}</p>
                      )}
                    </div>
                  </div>

                  {/* Copy Raw JSON Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(shortScoutTestResult, null, 2));
                      toast.success('Copied raw JSON to clipboard');
                    }}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Raw JSON
                  </Button>
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

              {/* Your API Key */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Your API Key</Label>
                <p className="text-xs text-muted-foreground">
                  Copy this key into your iOS Shortcut as the Bearer token. This is a permanent key (not a session token).
                </p>
                {apiKey ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <code className="flex-1 bg-muted px-3 py-2 rounded-md text-xs font-mono break-all">
                        {showApiKey ? apiKey : '••••••••••••••••••••••••••••••••'}
                      </code>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setShowApiKey(!showApiKey)}
                        title={showApiKey ? 'Hide key' : 'Show key'}
                      >
                        {showApiKey ? <Check className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          navigator.clipboard.writeText(apiKey);
                          toast.success('API key copied to clipboard');
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      ⚠️ Keep this key private. It grants access to your briefings.
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">No API key found. Contact admin to generate one.</p>
                )}
              </div>

              {/* Authorization Header Format */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Authorization Header</Label>
                <code className="block bg-muted px-3 py-2 rounded-md text-xs font-mono">
                  Authorization: Bearer [your_token_above]
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
