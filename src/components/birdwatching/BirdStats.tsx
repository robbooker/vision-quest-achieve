import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart3, Bird, Eye, Trophy, Calendar, TrendingUp } from 'lucide-react';
import { useBirdwatching } from '@/hooks/useBirdwatching';

export function BirdStats() {
  const { stats, sightings, lifeList } = useBirdwatching();

  // Calculate streak (consecutive days with sightings)
  const calculateStreak = () => {
    if (sightings.length === 0) return 0;
    
    const sortedDates = [...new Set(sightings.map(s => s.sighting_date))].sort().reverse();
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < sortedDates.length; i++) {
      const sightingDate = new Date(sortedDates[i]);
      sightingDate.setHours(0, 0, 0, 0);
      
      const expectedDate = new Date(today);
      expectedDate.setDate(today.getDate() - i);
      
      if (sightingDate.getTime() === expectedDate.getTime()) {
        streak++;
      } else if (i === 0 && sightingDate.getTime() === expectedDate.getTime() - 86400000) {
        // Yesterday is okay for first check
        expectedDate.setDate(expectedDate.getDate() - 1);
        if (sightingDate.getTime() === expectedDate.getTime()) {
          streak++;
        }
      } else {
        break;
      }
    }
    
    return streak;
  };

  const streak = calculateStreak();

  // Recent additions (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentSpecies = lifeList.filter(bird => {
    const firstSeenDate = new Date(bird.firstSeen);
    return firstSeenDate >= thirtyDaysAgo;
  }).length;

  const statCards = [
    {
      icon: Bird,
      label: 'Total Species',
      value: stats.totalSpecies,
      description: 'Unique species on your life list',
      color: 'text-primary',
    },
    {
      icon: Eye,
      label: 'Total Sightings',
      value: stats.totalSightings,
      description: 'All-time observation count',
      color: 'text-blue-500',
    },
    {
      icon: Trophy,
      label: 'Most Seen',
      value: stats.mostFrequentBird?.species || 'N/A',
      description: stats.mostFrequentBird ? `${stats.mostFrequentBird.count} sightings` : 'Log your first sighting!',
      color: 'text-amber-500',
      isText: true,
    },
    {
      icon: TrendingUp,
      label: 'Current Streak',
      value: streak,
      description: 'Consecutive days birding',
      suffix: streak === 1 ? ' day' : ' days',
      color: 'text-green-500',
    },
    {
      icon: Calendar,
      label: 'This Month',
      value: stats.thisMonth,
      description: 'Sightings this month',
      color: 'text-purple-500',
    },
    {
      icon: Calendar,
      label: 'This Year',
      value: stats.thisYear,
      description: 'Sightings this year',
      color: 'text-orange-500',
    },
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Your Birding Stats
          </CardTitle>
          <CardDescription>
            Track your birdwatching progress and achievements
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {statCards.map((stat, idx) => (
          <Card key={idx}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-muted ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className={`text-2xl font-bold ${stat.isText ? 'text-base' : ''}`}>
                    {stat.value}{stat.suffix || ''}
                  </p>
                  <p className="text-xs text-muted-foreground">{stat.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Additions */}
      {recentSpecies > 0 && (
        <Card className="bg-green-500/10 border-green-500/30">
          <CardContent className="py-4 text-center">
            <p className="text-green-700 dark:text-green-400 font-medium">
              🎉 You've added {recentSpecies} new species in the last 30 days!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
