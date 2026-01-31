import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowLeft, Clock, Calendar, FileText, BarChart3, Sparkles, Layout, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

const MonthInReviewBlog = () => {
  return (
    <>
      <Helmet>
        <title>How to Do a Month in Review | Groovy Planning</title>
        <meta name="description" content="A step-by-step guide to generating your monthly performance audit. See how your habits, goals, focus time, and biometrics stack up—presented in a beautiful, shareable format." />
        <meta property="og:title" content="How to Do a Month in Review | Groovy Planning" />
        <meta property="og:description" content="Generate a comprehensive audit of your month with AI-powered insights and beautiful analytics." />
        <meta property="og:type" content="article" />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Link to="/auth">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to App
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
              <FileText className="h-3 w-3" />
              Guide
            </Badge>
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              January 31, 2026
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              4 min read
            </span>
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-4">
            How to Do a Month in Review
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed">
            At the start of each month, generate a comprehensive audit of your previous month. AI-powered insights, beautiful visualizations, and a format you'll actually want to share.
          </p>

          <Separator className="my-8" />

          {/* Content */}
          <div className="prose prose-lg dark:prose-invert max-w-none space-y-6 [&>p]:mb-0">
            
            <p className="text-lg leading-relaxed text-foreground/90">
              The weekly review is great for tactical adjustments. But stepping back once a month to see the larger patterns? That's where the real insights live.
            </p>

            <p className="text-foreground/90">
              The Month in Review feature takes everything you've logged—tasks, habits, focus sessions, nutrition, sleep, trading P&L, journal entries—and distills it into a single, comprehensive audit. Think of it as your personal performance magazine.
            </p>

            <Separator className="my-10" />

            {/* What's Inside */}
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mt-12 mb-6">
              What's Inside Your Monthly Audit
            </h2>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 p-3 rounded-xl bg-primary/10">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-2">PRIMED Pillar Analytics</h3>
                  <p className="text-foreground/90">
                    See exactly how you spent your time across all six life pillars—Physical, Relations, Income, Mental, Excellence, and Direction. Charts show focus time, tasks completed, and habit streaks for each pillar.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 p-3 rounded-xl bg-primary/10">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-2">AI Editorial</h3>
                  <p className="text-foreground/90">
                    An AI-generated narrative that reads like a magazine profile of your month. Written in a dry, witty style with real observations about your patterns, contradictions, and wins. It pulls from your daily journal insights to create a cohesive story.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 p-3 rounded-xl bg-primary/10">
                  <Layout className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-2">Broadsheet Design</h3>
                  <p className="text-foreground/90">
                    Inspired by The Verge and Bloomberg, your audit is presented in a bold, newspaper-style layout with a masthead, stat ticker, and multi-column grid. It's designed to feel substantial—because looking back on a month should feel like reading something important.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 p-3 rounded-xl bg-primary/10">
                  <Share2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-2">Shareable Link</h3>
                  <p className="text-foreground/90">
                    Once generated, you can share your audit with a public link. Perfect for accountability partners, coaches, or just showing off a particularly good month. Privacy controls let you keep it private if you prefer.
                  </p>
                </div>
              </div>
            </div>

            <Separator className="my-10" />

            {/* How to Generate */}
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mt-12 mb-6">
              How to Generate Your Audit
            </h2>

            <div className="bg-muted/50 rounded-lg p-6 my-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                  1
                </div>
                <div>
                  <h4 className="font-bold text-foreground">Wait for the Month to End</h4>
                  <p className="text-foreground/90 mt-1">
                    Audits are only available starting the 1st of the following month. You can't generate a January audit until February 1st—we need the full picture.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                  2
                </div>
                <div>
                  <h4 className="font-bold text-foreground">Open Month in Review</h4>
                  <p className="text-foreground/90 mt-1">
                    Click your profile icon in the top-right corner and select <strong>Month in Review</strong> from the dropdown menu.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                  3
                </div>
                <div>
                  <h4 className="font-bold text-foreground">Select the Month</h4>
                  <p className="text-foreground/90 mt-1">
                    Use the month picker to select which month you want to review. Any month you've completed will be available.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                  4
                </div>
                <div>
                  <h4 className="font-bold text-foreground">Generate the Audit</h4>
                  <p className="text-foreground/90 mt-1">
                    Click <strong>Generate Audit</strong>. The system will compile your data, calculate your analytics, and generate the AI editorial. This takes about 15-30 seconds.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                  5
                </div>
                <div>
                  <h4 className="font-bold text-foreground">Review & Share</h4>
                  <p className="text-foreground/90 mt-1">
                    Once generated, you can read through your audit, regenerate specific sections if you want a fresh take, and optionally share it with a public link.
                  </p>
                </div>
              </div>
            </div>

            <Separator className="my-10" />

            {/* Tips */}
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mt-12 mb-6">
              Getting the Most Out of It
            </h2>

            <p className="text-foreground/90">
              The audit is only as good as the data you've logged. Here's what contributes to a richer report:
            </p>

            <ul className="list-disc list-inside space-y-2 text-foreground/90 my-4">
              <li><strong>Daily tasks and habits</strong> — The more consistently you check things off, the clearer your patterns become.</li>
              <li><strong>Focus sessions</strong> — Logged deep work shows up in pillar breakdowns and time allocation charts.</li>
              <li><strong>Journal entries</strong> — The AI uses your daily notes and voice check-ins to find themes for the editorial.</li>
              <li><strong>Nutrition and sleep</strong> — Biometric data gets incorporated into the Physical pillar analysis.</li>
              <li><strong>Trading P&L</strong> — If you track trading, the audit includes performance summaries and correlation analysis.</li>
            </ul>

            <p className="text-foreground/90">
              Even if you've only logged some of these, you'll still get a useful audit. But the more complete your data, the more insightful the analysis.
            </p>

            <Separator className="my-10" />

            {/* CTA */}
            <div className="mt-10 p-6 bg-muted/50 rounded-lg text-center">
              <p className="text-lg font-semibold text-foreground mb-2">Ready to see your month in review?</p>
              <p className="text-muted-foreground mb-4">Generate your first monthly audit and see how you actually spent your time.</p>
              <Button asChild size="lg">
                <Link to="/monthly-audit">Open Month in Review →</Link>
              </Button>
            </div>

          </div>
        </article>
      </div>
    </>
  );
};

export default MonthInReviewBlog;
