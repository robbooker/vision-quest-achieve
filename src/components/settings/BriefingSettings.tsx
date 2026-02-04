import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sunrise, Clock, Phone, MessageSquare, Copy, Check, RefreshCw, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';

interface BriefingPreferences {
  id: string;
  user_id: string;
  enabled: boolean;
  default_wake_time: string;
  default_topics: string[];
  timezone: string;
  evening_reminder_time: string;
  preferred_channel: 'call' | 'sms' | 'both';
  voice_id: string;
  include_calendar: boolean;
  include_email_summary: boolean;
  include_weather: boolean;
  weekend_enabled: boolean;
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
  const [newTopic, setNewTopic] = useState('');
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['briefing-preferences'] });
      toast.success('Test briefing generated! Check your history.');
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

  const addTopic = () => {
    if (!newTopic.trim()) return;
    const currentTopics = preferences?.default_topics || [];
    if (currentTopics.includes(newTopic.trim())) {
      toast.error('Topic already exists');
      return;
    }
    updateMutation.mutate({ default_topics: [...currentTopics, newTopic.trim()] });
    setNewTopic('');
  };

  const removeTopic = (topic: string) => {
    const currentTopics = preferences?.default_topics || [];
    updateMutation.mutate({ default_topics: currentTopics.filter(t => t !== topic) });
  };

  const copyApiKey = () => {
    if (profile?.api_key) {
      navigator.clipboard.writeText(profile.api_key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('API key copied');
    }
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
              Wake up to a personalized AI podcast covering your calendar, priorities, and requested news topics.
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

          {/* Default Topics */}
          <div className="space-y-2">
            <Label>Default Topics</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {(preferences?.default_topics || []).map(topic => (
                <Badge key={topic} variant="secondary" className="flex items-center gap-1">
                  {topic}
                  <button onClick={() => removeTopic(topic)} className="hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Add a topic (e.g., 'SMCI earnings')"
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addTopic()}
              />
              <Button variant="outline" onClick={addTopic}>Add</Button>
            </div>
          </div>

          {/* Include Options */}
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

          {/* Test Generation */}
          <div className="border-t pt-4">
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
          </div>
        </CardContent>
      )}
    </Card>
  );
}
