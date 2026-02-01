import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Share2, 
  Bird, 
  Camera, 
  TrendingUp, 
  TrendingDown,
  Target,
  Clock,
  CheckCircle2,
  FileText,
  Flame,
  ArrowUp,
  ArrowDown,
  User,
  Sparkles,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { useJanuaryAuditData } from '@/hooks/useMonthlyAuditData';
import { useAudit, useGenerateAudit } from '@/hooks/useMonthlyAudit';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useRecap } from '@/hooks/useMonthlyRecap';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
// Stock Ticker Marquee Component
function StockTicker({ data }: { data: { label: string; value: string; change?: number }[] }) {
  return (
    <div className="overflow-hidden border-y border-border bg-muted/30">
      <div className="animate-marquee whitespace-nowrap py-2 flex gap-12">
        {[...data, ...data].map((item, i) => (
          <span key={i} className="inline-flex items-center gap-2 font-mono text-sm">
            <span className="font-semibold text-foreground">{item.label}</span>
            <span className={cn(
              "font-bold",
              item.change && item.change > 0 ? "text-chart-2" : 
              item.change && item.change < 0 ? "text-destructive" : "text-foreground"
            )}>
              {item.value}
            </span>
            {item.change !== undefined && (
              <span className={cn(
                "text-xs",
                item.change > 0 ? "text-chart-2" : "text-destructive"
              )}>
                {item.change > 0 ? '▲' : '▼'} {Math.abs(item.change)}%
              </span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}

// Drop Cap Component for editorial feel
function DropCap({ children }: { children: string }) {
  const firstLetter = children.charAt(0);
  const rest = children.slice(1);
  
  return (
    <p className="text-lg leading-relaxed">
      <span className="float-left text-6xl font-bold leading-none mr-2 mt-1 text-primary font-heading">
        {firstLetter}
      </span>
      {rest}
    </p>
  );
}

// Pull Quote Component
function PullQuote({ children }: { children: string }) {
  return (
    <blockquote className="my-8 pl-6 border-l-4 border-primary italic text-xl text-muted-foreground">
      "{children}"
    </blockquote>
  );
}

// Stat Card for Local News section
function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  subtext,
  accent = false 
}: { 
  icon: React.ElementType; 
  label: string; 
  value: string | number;
  subtext?: string;
  accent?: boolean;
}) {
  return (
    <div className={cn(
      "p-4 border border-border",
      accent && "bg-primary/5 border-primary/20"
    )}>
      <div className="flex items-start justify-between mb-2">
        <Icon className={cn("h-5 w-5", accent ? "text-primary" : "text-muted-foreground")} />
      </div>
      <div className="text-3xl font-bold font-heading tracking-tight">{value}</div>
      <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide">{label}</div>
      {subtext && <div className="text-xs text-muted-foreground mt-1">{subtext}</div>}
    </div>
  );
}

// Generate mock editorial content based on data
function generateEditorial(data: ReturnType<typeof useJanuaryAuditData>['data']) {
  const pnlPositive = data.tradingStats.totalPnL > 0;
  const winRate = data.tradingStats.winRate;
  const focusHours = Math.round(data.focusStats.totalMinutes / 60);
  const birdCount = data.birdLog.speciesSighted.length;
  
  return {
    headline: pnlPositive 
      ? "A Month of Modest Victories and Questionable Bird Identification"
      : "Markets Humbled, But At Least The Birds Were Real",
    subheadline: `${data.tradingStats.tradingDays} trading days. ${focusHours} hours of focused work. ${birdCount} species allegedly identified. One auditor's brutally honest assessment.`,
    opening: pnlPositive
      ? `January was, by most conventional metrics, not a disaster. The trading account finished ${data.tradingStats.totalPnL > 0 ? 'up' : 'down'} $${Math.abs(data.tradingStats.totalPnL).toLocaleString()}, which puts it ahead of roughly 47% of hedge funds that shall remain nameless. The win rate of ${winRate}% suggests either improving edge detection or, more likely, survivorship bias at work. Time will tell.`
      : `January began with the enthusiasm of a new year and the confidence of someone who had clearly forgotten the lessons of the previous twelve months. The account finished down $${Math.abs(data.tradingStats.totalPnL).toLocaleString()}, a number that sounds better when you don't convert it to hourly wages.`,
    pullQuote: winRate > 50 
      ? "More than half the trades were winners. This is called 'beating random chance,' and we're celebrating it."
      : "The market doesn't care about your morning routine. It barely cares about your edge.",
    habitSection: data.habitCompletion.totalLogs > 20
      ? `The habit tracking tells a story of moderate consistency. ${data.habitCompletion.totalLogs} total completions suggests someone who at least pretends to have their life together. The data shows ${data.habitCompletion.topHabits[0]?.name || 'meditation'} led the pack—make of that what you will.`
      : `Habit tracking was, charitably speaking, inconsistent. ${data.habitCompletion.totalLogs} total logs across the month is either "building slowly" or "barely trying," depending on your perspective.`,
    focusSection: focusHours > 30
      ? `Focus sessions totaled ${data.focusStats.totalMinutes} minutes across ${data.focusStats.sessions} sessions. That's ${focusHours} hours of what we're choosing to call "deep work," averaging ${data.focusStats.avgSessionLength} minutes per session. Not Ferriss-level, but not embarrassing either.`
      : `Deep work remained elusive, with only ${focusHours} hours logged. The average session of ${data.focusStats.avgSessionLength} minutes suggests attention spans that would concern a goldfish researcher.`,
    closing: `Looking ahead to February: the same ambitions, the same spreadsheets, the same hope that this month will somehow be different. The market doesn't care about your goals. But maybe that's the point—to keep showing up anyway.`,
  };
}

export default function JanuaryAudit() {
  // Get the most recent completed month (previous month)
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const defaultMonth = format(lastMonth, 'yyyy-MM'); // e.g., '2026-01' if current date is Feb 2026
  
  const { data, isLoading, month, canGenerate } = useJanuaryAuditData(defaultMonth);
  const { data: existingAudit, isLoading: auditLoading } = useAudit(defaultMonth);
  const { data: existingRecap } = useRecap(defaultMonth);
  const { user } = useAuth();
  const generateAudit = useGenerateAudit();
  
  // Fetch profile for display name
  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('profiles')
        .select('display_name, email')
        .eq('user_id', user.id)
        .single();
      return data;
    },
    enabled: !!user,
  });
  
  const displayName = profile?.display_name || profile?.email?.split('@')[0] || user?.email?.split('@')[0] || 'Anonymous';
  
  // Use AI-generated editorial if available, otherwise fall back to template
  const hasAIEditorial = existingAudit?.editorial_content;
  const editorial = hasAIEditorial 
    ? existingAudit.editorial_content 
    : generateEditorial(data);
  
  const handleGenerate = async () => {
    try {
      await generateAudit.mutateAsync(defaultMonth);
      toast.success('AI Editorial generated successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate audit');
    }
  };
  
  // Parse the month for display
  const [yearNum, monthNum] = defaultMonth.split('-').map(Number);
  
  const tickerData = [
    { label: 'P&L', value: `$${data.tradingStats.totalPnL.toLocaleString()}`, change: data.tradingStats.totalPnL > 0 ? 12 : -8 },
    { label: 'WIN%', value: `${data.tradingStats.winRate}%` },
    { label: 'FOCUS', value: `${Math.round(data.focusStats.totalMinutes / 60)}h` },
    { label: 'HABITS', value: `${data.habitCompletion.totalLogs}` },
    { label: 'SPECIES', value: `${data.birdLog.speciesSighted.length}` },
    { label: 'TASKS', value: `${data.tasksCompleted}` },
  ];

  if (isLoading || auditLoading) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto p-4 space-y-6">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-background">
        {/* MASTHEAD */}
        <header className="border-b-4 border-foreground">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-xs uppercase tracking-widest text-muted-foreground font-mono">
                Groovy Planning AI • Monthly Audit Report
              </div>
              <div className="flex items-center gap-2">
                {/* Generate AI Editorial Button */}
                {canGenerate && (
                  <Button 
                    onClick={handleGenerate}
                    disabled={generateAudit.isPending}
                    size="sm" 
                    className="gap-2"
                  >
                    {generateAudit.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : hasAIEditorial ? (
                      <>
                        <RefreshCw className="h-4 w-4" />
                        Regenerate
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Generate AI Editorial
                      </>
                    )}
                  </Button>
                )}
                <Button variant="outline" size="sm" className="gap-2">
                  <Share2 className="h-4 w-4" />
                  Share
                </Button>
              </div>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold font-heading tracking-tighter mb-2">
              The {format(new Date(yearNum, monthNum - 1), 'MMMM')} Audit
            </h1>
            
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1.5 font-semibold text-foreground">
                <User className="h-4 w-4" />
                {displayName}
              </span>
              <span className="text-muted-foreground">{format(new Date(), 'EEEE, MMMM d, yyyy')}</span>
              <span className="text-foreground/70 font-mono font-semibold">Vol. 1, No. 1</span>
            </div>
          </div>
        </header>

        {/* STOCK TICKER */}
        <StockTicker data={tickerData} />

        {/* MAIN CONTENT GRID */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* LEAD EDITORIAL - Left Column */}
            <article className="lg:col-span-7 space-y-6">
              <div className="border-b-2 border-foreground pb-4">
                <div className="text-xs uppercase tracking-widest text-primary font-semibold mb-2">
                  Lead Editorial
                </div>
                <h2 className="text-3xl md:text-4xl font-bold font-heading leading-tight">
                  {editorial.headline}
                </h2>
                <p className="text-lg text-muted-foreground mt-2">
                  {editorial.subheadline}
                </p>
              </div>

              <div className="prose prose-lg max-w-none">
                <DropCap>{editorial.opening}</DropCap>
                
                <PullQuote>{editorial.pullQuote}</PullQuote>
                
                <h3 className="text-xl font-bold font-heading mt-8 mb-4 border-b border-border pb-2">
                  The Habit Report
                </h3>
                <p className="text-muted-foreground leading-relaxed">{editorial.habitSection}</p>
                
                <h3 className="text-xl font-bold font-heading mt-8 mb-4 border-b border-border pb-2">
                  Deep Work Analysis
                </h3>
                <p className="text-muted-foreground leading-relaxed">{editorial.focusSection}</p>
                
                <div className="mt-8 p-6 bg-muted/30 border border-border">
                  <p className="text-muted-foreground italic">{editorial.closing}</p>
                </div>
              </div>

              {/* Journal Snippets */}
              {data.journalHighlights.snippets.length > 0 && (
                <div className="border-t-2 border-foreground pt-6 mt-8">
                  <h3 className="text-sm uppercase tracking-widest text-muted-foreground mb-4 font-mono">
                    From The Journal
                  </h3>
                  {data.journalHighlights.snippets.slice(0, 2).map((snippet, i) => (
                    <p key={i} className="text-sm text-muted-foreground italic border-l-2 border-muted pl-4 mb-4">
                      "{snippet.slice(0, 200)}..."
                    </p>
                  ))}
                </div>
              )}
            </article>

            {/* RIGHT SIDEBAR */}
            <aside className="lg:col-span-5 space-y-8">
              
              {/* BUSINESS SECTION - Trading P&L */}
              <section className="border-2 border-foreground">
                <div className="bg-foreground text-background px-4 py-2">
                  <h3 className="text-sm uppercase tracking-widest font-bold font-mono">
                    Business / Markets
                  </h3>
                </div>
                <div className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-3xl font-bold font-heading">
                        ${Math.abs(data.tradingStats.totalPnL).toLocaleString()}
                      </div>
                      <div className={cn(
                        "text-sm font-semibold",
                        data.tradingStats.totalPnL >= 0 ? "text-chart-2" : "text-destructive"
                      )}>
                        {data.tradingStats.totalPnL >= 0 ? '▲ Profit' : '▼ Loss'} • {data.tradingStats.winRate}% Win Rate
                      </div>
                    </div>
                    {data.tradingStats.totalPnL >= 0 ? (
                      <TrendingUp className="h-8 w-8 text-chart-2" />
                    ) : (
                      <TrendingDown className="h-8 w-8 text-destructive" />
                    )}
                  </div>
                  
                  {/* Cumulative P&L Chart */}
                  {data.tradingStats.dailyData.length > 0 && (
                    <div className="h-32">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data.tradingStats.dailyData}>
                          <defs>
                            <linearGradient id="pnlGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--background))', 
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '4px',
                            }} 
                          />
                          <Area 
                            type="monotone" 
                            dataKey="cumulative" 
                            stroke="hsl(var(--primary))" 
                            fill="url(#pnlGradient)" 
                            strokeWidth={2}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* Daily P&L Bar Chart */}
                  {data.tradingStats.dailyData.length > 0 && (
                    <div className="h-24">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.tradingStats.dailyData}>
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--background))', 
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '4px',
                            }} 
                          />
                          <Bar dataKey="pnl" radius={[2, 2, 0, 0]}>
                            {data.tradingStats.dailyData.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={entry.pnl >= 0 ? 'hsl(var(--chart-2))' : 'hsl(var(--destructive))'} 
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border">
                    <div>
                      <div className="text-xs uppercase tracking-wide text-muted-foreground">Best Day</div>
                      <div className="font-semibold text-chart-2">
                        {data.tradingStats.bestDay ? `+$${data.tradingStats.bestDay.amount.toLocaleString()}` : '—'}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wide text-muted-foreground">Worst Day</div>
                      <div className="font-semibold text-destructive">
                        {data.tradingStats.worstDay ? `-$${Math.abs(data.tradingStats.worstDay.amount).toLocaleString()}` : '—'}
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* SCIENCE & NATURE - Birdwatching */}
              <section className="border-2 border-foreground">
                <div className="bg-primary text-primary-foreground px-4 py-2">
                  <h3 className="text-sm uppercase tracking-widest font-bold font-mono">
                    Science & Nature
                  </h3>
                </div>
                <div className="p-4 space-y-4">
                  {/* Photo of the Month */}
                  <div className="aspect-video bg-muted/50 border border-border flex items-center justify-center">
                    {data.birdLog.photoOfMonth ? (
                      <img 
                        src={data.birdLog.photoOfMonth} 
                        alt="Bird of the month"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center text-muted-foreground">
                        <Camera className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p className="text-xs uppercase tracking-wide">Photo of the Month</p>
                        <p className="text-xs">No photos captured</p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    <Bird className="h-8 w-8 text-primary" />
                    <div>
                      <div className="text-2xl font-bold font-heading">{data.birdLog.totalSightings}</div>
                      <div className="text-sm text-muted-foreground">Sightings logged</div>
                    </div>
                  </div>

                  {data.birdLog.speciesSighted.length > 0 && (
                    <div>
                      <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                        Species Identified ({data.birdLog.speciesSighted.length})
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {data.birdLog.speciesSighted.slice(0, 8).map((species, i) => (
                          <span 
                            key={i}
                            className={cn(
                              "text-xs px-2 py-1 rounded",
                              data.birdLog.newLifeListBirds.includes(species)
                                ? "bg-primary text-primary-foreground font-semibold"
                                : "bg-muted text-muted-foreground"
                            )}
                          >
                            {species}
                            {data.birdLog.newLifeListBirds.includes(species) && ' ★'}
                          </span>
                        ))}
                        {data.birdLog.speciesSighted.length > 8 && (
                          <span className="text-xs px-2 py-1 text-muted-foreground">
                            +{data.birdLog.speciesSighted.length - 8} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {data.birdLog.newLifeListBirds.length > 0 && (
                    <div className="p-3 bg-primary/10 border border-primary/20 rounded">
                      <div className="text-xs uppercase tracking-wide text-primary font-semibold">
                        New Life List Additions
                      </div>
                      <div className="text-sm font-medium mt-1">
                        {data.birdLog.newLifeListBirds.join(', ')}
                      </div>
                    </div>
                  )}
                </div>
              </section>
            </aside>
          </div>

          {/* LOCAL NEWS - Bottom Grid */}
          <section className="mt-12 border-t-4 border-foreground pt-8">
            <h3 className="text-sm uppercase tracking-widest text-muted-foreground mb-6 font-mono">
              Local News / Metrics
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <StatCard
                icon={Clock}
                label="Focus Time"
                value={`${Math.round(data.focusStats.totalMinutes / 60)}h`}
                subtext={`${data.focusStats.sessions} sessions`}
                accent
              />
              <StatCard
                icon={Flame}
                label="Habit Logs"
                value={data.habitCompletion.totalLogs}
                subtext={data.habitCompletion.topHabits[0]?.name || 'Track more'}
              />
              <StatCard
                icon={CheckCircle2}
                label="Tasks Done"
                value={data.tasksCompleted}
              />
              <StatCard
                icon={FileText}
                label="Journal Entries"
                value={data.journalHighlights.entriesCount}
              />
              <StatCard
                icon={Target}
                label="Trading Days"
                value={data.tradingStats.tradingDays}
                subtext={`${data.tradingStats.winRate}% win rate`}
              />
              <StatCard
                icon={Bird}
                label="Species Seen"
                value={data.birdLog.speciesSighted.length}
                subtext={`${data.birdLog.newLifeListBirds.length} new`}
              />
            </div>

            {/* Top Habits */}
            {data.habitCompletion.topHabits.length > 0 && (
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border border-border p-4">
                  <h4 className="text-xs uppercase tracking-widest text-muted-foreground mb-4 font-mono">
                    Top Performing Habits
                  </h4>
                  <div className="space-y-2">
                    {data.habitCompletion.topHabits.map((habit, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-sm">{habit.name}</span>
                        <span className="text-sm font-mono font-semibold">{habit.completions}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* FOOTER */}
          <footer className="mt-12 pt-8 border-t border-border text-center text-xs text-muted-foreground">
            <p className="font-mono">
              Generated by Groovy Planning AI • The January Audit • {format(new Date(), 'yyyy')}
            </p>
            <p className="mt-2 italic">
              "Make some plans. Future You will thank you."
            </p>
          </footer>
        </div>
      </div>
    </DashboardLayout>
  );
}
