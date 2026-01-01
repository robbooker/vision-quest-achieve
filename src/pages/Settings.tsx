import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { CalendarSettings } from '@/components/settings/CalendarSettings';
import { NotificationSettings } from '@/components/settings/NotificationSettings';

export default function Settings() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">
            Manage your calendar integration, notifications, and preferences.
          </p>
        </div>

        <NotificationSettings />
        <CalendarSettings />
      </div>
    </DashboardLayout>
  );
}
