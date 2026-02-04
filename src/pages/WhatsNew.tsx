import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowLeft, Clock, Calendar, Sparkles, Bird, Brain, Droplets, MessageSquare, Mic, Scale, Heart, Activity, DollarSign, FileText, TrendingUp, Utensils, Radio, Newspaper } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
const WhatsNew = () => {
  return (
    <>
      <Helmet>
        <title>What's New | Groovy Planning</title>
        <meta name="description" content="The latest features and improvements to Groovy Planning. See what we've been building to help you achieve more." />
        <meta property="og:title" content="What's New at Groovy Planning" />
        <meta property="og:description" content="The latest features and improvements to help you achieve more." />
        <meta property="og:type" content="article" />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </header>

        {/* Article */}
        <article className="container mx-auto px-4 py-12 max-w-3xl">
          {/* Meta */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
            <Badge variant="secondary" className="gap-1">
              <Sparkles className="h-3 w-3" />
              Product Update
            </Badge>
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              February 4, 2026
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              6 min read
            </span>
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-4">
            What's New: February Updates
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed">
            A comprehensive rundown of everything we've shipped, fixed, and improved since launch. This page gets updated continuously—bookmark it.
          </p>

          <Separator className="my-8" />

          {/* Content */}
          <div className="prose prose-lg dark:prose-invert max-w-none space-y-6 [&>p]:mb-0">
            
            <p className="text-lg leading-relaxed text-foreground/90">
              We ship fast. Sometimes too fast to announce each thing individually. This is the running changelog—everything notable that's gone live, organized by date. Newest stuff at the top.
            </p>

            <Separator className="my-10" />

            {/* February 4, 2026 */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                February 4, 2026
              </h2>

              <div className="space-y-6 ml-7">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 p-2 rounded-lg bg-primary/10">
                    <Radio className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">AI Morning Briefing</h3>
                    <p className="text-foreground/90 text-sm mt-1">
                      Wake up to a personalized 3-minute audio podcast. Your briefing includes weather, today's calendar, sports scores, and news topics you care about—synthesized by AI and delivered as audio. Once ready, your briefing appears on the Today page for easy playback. <Link to="/blog/morning-briefing" className="text-primary hover:underline">Read the setup guide →</Link>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 p-2 rounded-lg bg-primary/10">
                    <Newspaper className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">Dual-Source News: Tavily + ESPN</h3>
                    <p className="text-foreground/90 text-sm mt-1">
                      Morning Briefing now uses specialized sources for accuracy. Tavily powers general/financial news with real-time search, while ESPN provides verified sports scores from last night's games. No more stale data or AI hallucinations about player rosters.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 p-2 rounded-lg bg-primary/10">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">Briefing Calendar Token Refresh</h3>
                    <p className="text-foreground/90 text-sm mt-1">
                      Fixed an issue where expired Google Calendar tokens weren't being refreshed during briefing generation. Your calendar events will now always appear in your morning audio.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Separator className="my-8" />

            {/* January 31, 2026 */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                January 31, 2026
              </h2>

              <div className="space-y-6 ml-7">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 p-2 rounded-lg bg-primary/10">
                    <Scale className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">Daily Weight & Blood Pressure Tracking</h3>
                    <p className="text-foreground/90 text-sm mt-1">
                      New compact widget on the Today page for logging weight and blood pressure. BP entries support notes (e.g., "after coffee") for context. Trends visible on the Physical page with 14-day charts.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 p-2 rounded-lg bg-primary/10">
                    <Utensils className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">Calories Burned vs Consumed</h3>
                    <p className="text-foreground/90 text-sm mt-1">
                      The Physical page nutrition section now shows a 7-day chart comparing calories consumed (from nutrition logs) to active calories burned (from Oura). Net balance displayed with color coding.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 p-2 rounded-lg bg-primary/10">
                    <DollarSign className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">Trading P&L Widget Upgrade</h3>
                    <p className="text-foreground/90 text-sm mt-1">
                      The Today page P&L widget now shows the last 5 days with a mini sparkline chart, sync button, and weekly total. Removed the edit button since the full Trading Journal is linked below.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 p-2 rounded-lg bg-primary/10">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">Month in Review Guide</h3>
                    <p className="text-foreground/90 text-sm mt-1">
                      New blog post explaining how to generate and use the monthly audit feature. <Link to="/blog/month-in-review" className="text-primary hover:underline">Read the guide →</Link>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Separator className="my-8" />

            {/* January 30, 2026 */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                January 30, 2026
              </h2>

              <div className="space-y-6 ml-7">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 p-2 rounded-lg bg-destructive/10">
                    <Activity className="h-5 w-5 text-destructive" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">Sleep Duration Bug Fix</h3>
                    <p className="text-foreground/90 text-sm mt-1">
                      Fixed a bug where manual sleep entries showed incorrect duration (e.g., 5h 33m instead of 7h 27m). The issue was caused by timezone parsing when creating bedtime/wake time dates.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 p-2 rounded-lg bg-primary/10">
                    <Utensils className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">Food Frequency Cleanup</h3>
                    <p className="text-foreground/90 text-sm mt-1">
                      The "Common Foods" list on the Physical page no longer includes measurement words like "glass," "ounce," "scoop," or "bottle." Only actual food items now.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Separator className="my-8" />

            {/* January 29, 2026 */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                January 29, 2026
              </h2>

              <div className="space-y-6 ml-7">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 p-2 rounded-lg bg-primary/10">
                    <Brain className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">AI Journal Commentary</h3>
                    <p className="text-foreground/90 text-sm mt-1">
                      Daily AI insights rewritten with personality. Now uses a dry, observational style inspired by Matt Levine. Pulls from biometrics, nutrition, tasks, habits, and journal entries.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 p-2 rounded-lg bg-blue-500/10">
                    <Droplets className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">Hydration in Ounces</h3>
                    <p className="text-foreground/90 text-sm mt-1">
                      Switched from milliliters to ounces. Default goal is 100 oz/day. Quick-add buttons for 8oz, 16oz, and 24oz. Meals section now collapsible.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 p-2 rounded-lg bg-amber-500/10">
                    <Bird className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">Birdwatching: Log Another Sighting</h3>
                    <p className="text-foreground/90 text-sm mt-1">
                      Species detail pages now have a "Log Another Sighting" button that pre-fills the species name.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 p-2 rounded-lg bg-green-500/10">
                    <Mic className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">Universal Voice Recorder</h3>
                    <p className="text-foreground/90 text-sm mt-1">
                      Multi-purpose recorder on Today page. Pick Journal, Nutrition, Bird Sighting, or Quick Task—then just talk. AI handles the parsing.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 p-2 rounded-lg bg-primary/10">
                    <MessageSquare className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">Text Toasty</h3>
                    <p className="text-foreground/90 text-sm mt-1">
                      SMS-based AI assistant. Text (989) 266-5371 to chat with Toasty, log tasks, check goals, or get a daily briefing—no app required.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Separator className="my-8" />

            {/* January 28, 2026 */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                January 28, 2026
              </h2>

              <div className="space-y-6 ml-7">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 p-2 rounded-lg bg-primary/10">
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">Trading Journal Dashboard</h3>
                    <p className="text-foreground/90 text-sm mt-1">
                      Full trading P&L tracking with Recharts visualizations, paginated history table, and Short Scout integration for automatic syncing.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 p-2 rounded-lg bg-primary/10">
                    <Heart className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">Physical Pillar Deep Dive</h3>
                    <p className="text-foreground/90 text-sm mt-1">
                      Expanded Physical page with sections for Sleep, Heart Rate, Movement, Nutrition, and Bloodwork. Real data from Oura integration with historical charts.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Separator className="my-10" />

            {/* Closing */}
            <p className="text-lg text-foreground/90">
              That's the running list. We update this page as we ship, so check back or keep an eye on the announcement bar for the latest.
            </p>

            <div className="mt-10 p-6 bg-muted/50 rounded-lg text-center">
              <p className="text-muted-foreground mb-4">Have ideas for what we should build next?</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button asChild variant="outline">
                  <Link to="/feedback">Send Feedback</Link>
                </Button>
                <Button asChild>
                  <a href="sms:+19892665371">Text Toasty</a>
                </Button>
              </div>
            </div>

          </div>
        </article>
      </div>
    </>
  );
};

export default WhatsNew;
