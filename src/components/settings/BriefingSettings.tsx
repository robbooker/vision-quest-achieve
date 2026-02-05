import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sunrise, ArrowRight } from 'lucide-react';

export function BriefingSettings() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sunrise className="h-5 w-5 text-amber-500" />
          Morning Briefing
        </CardTitle>
        <CardDescription>
          Wake up to a personalized AI podcast covering your calendar, weather, and custom news topics.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Configure your morning briefing schedule, news categories, voice selection, and delivery preferences on the dedicated Morning Briefing page.
          </p>
          <Button asChild className="w-fit">
            <Link to="/morning-briefing">
              Configure Morning Briefing
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
