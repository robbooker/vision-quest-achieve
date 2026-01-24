import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Trophy, AlertTriangle, Sparkles, Quote, ArrowRight, Target } from 'lucide-react';
import { format } from 'date-fns';
import type { MonthlyRecap } from '@/hooks/useMonthlyRecap';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  Cell 
} from 'recharts';

interface RecapPreviewProps {
  recap: MonthlyRecap;
}

export function RecapPreview({ recap }: RecapPreviewProps) {
  const monthLabel = format(new Date(recap.month), 'MMMM yyyy');
  const content = recap.content;
  const stats = recap.stats;
  const chartsData = recap.charts_data;

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Hero Section */}
      <div className="text-center space-y-4 py-8">
        <Badge variant="outline" className="mb-2">
          {monthLabel}
        </Badge>
        <h1 className="text-3xl md:text-4xl font-bold">
          {recap.headline || `${monthLabel}: Your Month in Review`}
        </h1>
        {recap.subheadline && (
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {recap.subheadline}
          </p>
        )}
      </div>

      {/* Opening Reflection */}
      {content.opening_reflection && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-lg leading-relaxed whitespace-pre-wrap">
              {content.opening_reflection}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <QuickStat label="Journal Entries" value={stats.totalJournalEntries} />
        <QuickStat label="Habit Rate" value={`${stats.habitCompletionRate}%`} />
        <QuickStat label="Focus Time" value={`${Math.round(stats.totalFocusMinutes / 60)}h`} />
        <QuickStat label="Tasks Done" value={stats.tasksCompleted} />
      </div>

      {/* Goal Progress Chart */}
      {chartsData?.goalProgress && chartsData.goalProgress.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Goal Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartsData.goalProgress.slice(0, 6)}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <XAxis type="number" />
                  <YAxis 
                    type="category" 
                    dataKey="title" 
                    width={150}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip />
                  <Bar dataKey="progress" radius={[0, 4, 4, 0]}>
                    {chartsData.goalProgress.slice(0, 6).map((entry: any, index: number) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={`hsl(var(--primary) / ${0.4 + (index * 0.1)})`}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Goal Insights */}
            {content.goal_insights && content.goal_insights.length > 0 && (
              <div className="mt-6 space-y-3">
                {content.goal_insights.map((insight, i) => (
                  <div key={i} className="p-3 rounded-lg bg-muted/50">
                    <p className="font-medium text-sm">{insight.goal_title}</p>
                    <p className="text-sm text-muted-foreground mt-1">{insight.insight}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Habit Insights */}
      {content.habit_insights && (
        <Card>
          <CardHeader>
            <CardTitle>Habit Patterns</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">
              {content.habit_insights}
            </p>
            {stats.longestStreak > 0 && (
              <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10">
                <span className="text-sm font-medium">
                  Longest Streak: {stats.longestStreak} days 🔥
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Highlights Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Biggest Win */}
        {content.biggest_win && (
          <Card className="border-green-500/20 bg-green-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
                <Trophy className="h-5 w-5" />
                Biggest Win
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <h3 className="font-semibold">{content.biggest_win.title}</h3>
              <p className="text-sm text-muted-foreground">
                {content.biggest_win.why_it_mattered}
              </p>
              <Separator />
              <p className="text-sm leading-relaxed">
                {content.biggest_win.narrative}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Hardest Struggle */}
        {content.hardest_struggle && (
          <Card className="border-orange-500/20 bg-orange-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
                <AlertTriangle className="h-5 w-5" />
                Hardest Struggle
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <h3 className="font-semibold">{content.hardest_struggle.title}</h3>
              <p className="text-sm text-muted-foreground">
                Lesson: {content.hardest_struggle.lesson_learned}
              </p>
              <Separator />
              <p className="text-sm leading-relaxed">
                {content.hardest_struggle.narrative}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Unexpected Delight */}
      {content.unexpected_delight && (
        <Card className="border-purple-500/20 bg-purple-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-400">
              <Sparkles className="h-5 w-5" />
              Unexpected Delight
            </CardTitle>
          </CardHeader>
          <CardContent>
            <h3 className="font-semibold mb-2">{content.unexpected_delight.title}</h3>
            <p className="text-sm leading-relaxed">
              {content.unexpected_delight.narrative}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Pull Quotes */}
      {content.pull_quotes && content.pull_quotes.length > 0 && (
        <div className="space-y-4">
          {content.pull_quotes.map((quote, i) => (
            <blockquote 
              key={i} 
              className="relative pl-6 py-4 border-l-4 border-primary bg-muted/30 rounded-r-lg"
            >
              <Quote className="absolute left-2 top-2 h-4 w-4 text-primary/50" />
              <p className="text-lg italic">"{quote}"</p>
            </blockquote>
          ))}
        </div>
      )}

      {/* Photo Gallery */}
      {recap.photos && recap.photos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Memories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {recap.photos.slice(0, 9).map((photo, i) => (
                <div key={i} className="aspect-square rounded-lg overflow-hidden bg-muted">
                  <img 
                    src={photo.url} 
                    alt={photo.caption || `Memory ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Looking Ahead */}
      {content.looking_ahead && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowRight className="h-5 w-5" />
              Looking Ahead
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {content.looking_ahead}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Footer */}
      <div className="text-center py-8 text-sm text-muted-foreground">
        <p>Generated on {format(new Date(recap.created_at), 'MMMM d, yyyy')}</p>
      </div>
    </div>
  );
}

function QuickStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="text-center p-4 rounded-lg border bg-card">
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
