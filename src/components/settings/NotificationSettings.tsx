import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Bell, BellOff, Smartphone, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface NotificationPreferences {
  start_of_block: boolean;
  weekly_review: boolean;
  behind_plan: boolean;
}

export function NotificationSettings() {
  const { user } = useAuth();
  const {
    isSupported,
    isPWA,
    permission,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe,
    sendTestNotification,
  } = usePushNotifications();

  const [preferences, setPreferences] = useState<NotificationPreferences>({
    start_of_block: true,
    weekly_review: true,
    behind_plan: true,
  });
  const [prefsLoading, setPrefsLoading] = useState(true);
  const [testingSending, setTestingSending] = useState(false);

  // Load preferences
  useEffect(() => {
    if (!user) return;

    const loadPreferences = async () => {
      const { data } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setPreferences({
          start_of_block: data.start_of_block ?? true,
          weekly_review: data.weekly_review ?? true,
          behind_plan: data.behind_plan ?? true,
        });
      }
      setPrefsLoading(false);
    };

    loadPreferences();
  }, [user]);

  // Update preference
  const updatePreference = async (key: keyof NotificationPreferences, value: boolean) => {
    if (!user) return;

    setPreferences(prev => ({ ...prev, [key]: value }));

    const { error } = await supabase
      .from('notification_preferences')
      .upsert({
        user_id: user.id,
        [key]: value,
      }, {
        onConflict: 'user_id',
      });

    if (error) {
      toast.error('Failed to save preference');
      setPreferences(prev => ({ ...prev, [key]: !value }));
    }
  };

  // Handle enable notifications
  const handleEnableNotifications = async () => {
    const success = await subscribe();
    if (success) {
      toast.success('Notifications enabled!');
    } else if (permission === 'denied') {
      toast.error('Notifications blocked. Please enable them in your browser settings.');
    } else {
      toast.error('Failed to enable notifications');
    }
  };

  // Handle disable notifications
  const handleDisableNotifications = async () => {
    const success = await unsubscribe();
    if (success) {
      toast.success('Notifications disabled');
    }
  };

  // Handle test notification
  const handleTestNotification = async () => {
    setTestingSending(true);
    await sendTestNotification();
    toast.success('Test notification sent!');
    setTestingSending(false);
  };

  // Not supported message
  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5" />
            Push Notifications
          </CardTitle>
          <CardDescription>
            Push notifications are not supported in this browser.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Push Notifications
        </CardTitle>
        <CardDescription>
          Get reminded when tasks start and when it's time for your weekly review.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* PWA Install Notice */}
        {!isPWA && (
          <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 border border-border">
            <Smartphone className="h-5 w-5 mt-0.5 text-muted-foreground" />
            <div className="space-y-1">
              <p className="text-sm font-medium">Install the app for best experience</p>
              <p className="text-sm text-muted-foreground">
                Add Groovy Planning to your home screen for reliable push notifications.
                On iOS, this is required for notifications to work.
              </p>
            </div>
          </div>
        )}

        {/* Permission Status */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border">
          <div className="flex items-center gap-3">
            {permission === 'granted' && isSubscribed ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : permission === 'denied' ? (
              <AlertTriangle className="h-5 w-5 text-destructive" />
            ) : (
              <Bell className="h-5 w-5 text-muted-foreground" />
            )}
            <div>
              <p className="text-sm font-medium">
                {permission === 'granted' && isSubscribed
                  ? 'Notifications enabled'
                  : permission === 'denied'
                  ? 'Notifications blocked'
                  : 'Notifications not enabled'}
              </p>
              {permission === 'denied' && (
                <p className="text-xs text-muted-foreground">
                  Enable notifications in your browser settings
                </p>
              )}
            </div>
          </div>
          <Button
            variant={isSubscribed ? 'outline' : 'default'}
            size="sm"
            onClick={isSubscribed ? handleDisableNotifications : handleEnableNotifications}
            disabled={isLoading || permission === 'denied'}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isSubscribed ? (
              'Disable'
            ) : (
              'Enable'
            )}
          </Button>
        </div>

        {/* Notification Types */}
        {isSubscribed && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="start_of_block">Start-of-block reminders</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when a scheduled task block is about to start
                </p>
              </div>
              <Switch
                id="start_of_block"
                checked={preferences.start_of_block}
                onCheckedChange={(checked) => updatePreference('start_of_block', checked)}
                disabled={prefsLoading}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="weekly_review">Weekly review reminders</Label>
                <p className="text-sm text-muted-foreground">
                  Reminder on Friday to complete your weekly review
                </p>
              </div>
              <Switch
                id="weekly_review"
                checked={preferences.weekly_review}
                onCheckedChange={(checked) => updatePreference('weekly_review', checked)}
                disabled={prefsLoading}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="behind_plan">Behind-plan alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Alert when you have unscheduled tasks for the current week
                </p>
              </div>
              <Switch
                id="behind_plan"
                checked={preferences.behind_plan}
                onCheckedChange={(checked) => updatePreference('behind_plan', checked)}
                disabled={prefsLoading}
              />
            </div>

            {/* Test Button */}
            <div className="pt-4 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={handleTestNotification}
                disabled={testingSending}
              >
                {testingSending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Test Notification'
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
