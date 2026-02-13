import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { CalendarSettings } from '@/components/settings/CalendarSettings';
import { NotificationSettings } from '@/components/settings/NotificationSettings';
import { DisplaySettings } from '@/components/settings/DisplaySettings';
import { ProfileSettings } from '@/components/settings/ProfileSettings';
import { HardQuestions } from '@/components/settings/HardQuestions';
import { JournalSettings } from '@/components/settings/JournalSettings';
import { VoiceCallHistory } from '@/components/settings/VoiceCallHistory';
import { OuraSettings } from '@/components/settings/OuraSettings';
import { BriefingSettings } from '@/components/settings/BriefingSettings';
import { ApiKeySettings } from '@/components/settings/ApiKeySettings';
import { SubscriptionSettings } from '@/components/subscription/SubscriptionSettings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, ChevronRight, PenLine, RotateCcw } from 'lucide-react';
import { useSiteTour } from '@/hooks/useSiteTour';
import { AppVersion } from '@/components/layout/AppVersion';

export default function Settings() {
  const { startTour } = useSiteTour();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Settings</h1>
            <p className="text-muted-foreground">
              Manage your calendar integration, notifications, and preferences.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2"
              onClick={startTour}
              data-tour="restart-tour"
            >
              <RotateCcw className="h-4 w-4" />
              Restart Tour
            </Button>
            <Button asChild variant="outline" size="sm" className="gap-2" data-tour="affirmations">
              <Link to="/affirmations">
                <PenLine className="h-4 w-4" />
                Affirmations
              </Link>
            </Button>
          </div>
        </div>

        <div data-tour="settings-subscription">
          <SubscriptionSettings />
        </div>

        <div data-tour="settings-profile">
          <ProfileSettings />
        </div>

        <div data-tour="settings-briefing">
          <BriefingSettings />
        </div>

        <div data-tour="settings-vision">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Vision & Values
              </CardTitle>
              <CardDescription>
                Define your long-term aspirations. Your 12-week goals should connect to this bigger picture.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline">
                <Link to="/vision" className="flex items-center gap-2">
                  Edit Your Vision
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <div data-tour="settings-hard-questions">
          <HardQuestions />
        </div>

        <div data-tour="settings-display">
          <DisplaySettings />
        </div>
        
        <div data-tour="settings-notifications">
          <NotificationSettings />
        </div>
        
        <div data-tour="settings-calendar">
          <CalendarSettings />
        </div>

        <div data-tour="settings-oura">
          <OuraSettings />
        </div>

        <div data-tour="settings-journal">
          <JournalSettings />
        </div>

        <div data-tour="settings-voice-calls">
          <VoiceCallHistory />
        </div>

        <div data-tour="settings-api-keys">
          <ApiKeySettings />
        </div>

        <div className="pt-4 border-t flex justify-center">
          <AppVersion />
        </div>
      </div>
    </DashboardLayout>
  );
}
