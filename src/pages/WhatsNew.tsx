import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowLeft, Clock, Calendar, Sparkles, Bird, Brain, Droplets, MessageSquare, Mic } from 'lucide-react';
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
              January 29, 2026
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              3 min read
            </span>
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-4">
            What's New: The Late January Drop
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed">
            We've been busy. Here's everything that shipped this week—from smarter AI insights to better birdwatching (really).
          </p>

          <Separator className="my-8" />

          {/* Content */}
          <div className="prose prose-lg dark:prose-invert max-w-none space-y-6 [&>p]:mb-0">
            
            <p className="text-lg leading-relaxed text-foreground/90">
              Look, we ship fast around here. Sometimes too fast to write blog posts about it. But this week's batch of improvements deserves a proper announcement—because some of this stuff is genuinely useful.
            </p>

            <Separator className="my-10" />

            {/* AI Journal Commentary */}
            <div className="flex items-start gap-4 my-8">
              <div className="flex-shrink-0 p-3 rounded-xl bg-primary/10">
                <Brain className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-foreground mb-3">
                  AI Journal Commentary: Now With Personality
                </h2>
                <p className="text-foreground/90 mb-3">
                  The daily AI insights in your journal have been completely rewritten. Instead of the robotic "you did well in Physical pillar today" analysis, you now get commentary in the style of Matt Levine—Bloomberg's beloved newsletter writer.
                </p>
                <p className="text-foreground/90 mb-3">
                  What does that mean? Dry wit. Parenthetical asides (we love those). Observations about the ironic contradictions in your day. It looks at <em>everything</em>—your biometrics, nutrition, tasks, habits, the stuff you didn't do—and finds the interesting patterns.
                </p>
                <p className="text-muted-foreground text-sm">
                  It's still genuinely helpful. It's just also entertaining now.
                </p>
              </div>
            </div>

            <Separator className="my-8" />

            {/* Hydration Tracking */}
            <div className="flex items-start gap-4 my-8">
              <div className="flex-shrink-0 p-3 rounded-xl bg-blue-500/10">
                <Droplets className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-foreground mb-3">
                  Hydration Tracking: Now in Ounces
                </h2>
                <p className="text-foreground/90 mb-3">
                  We switched the hydration tracker from milliliters to ounces because this is America (and also because nobody knows what 2,957ml looks like). 
                </p>
                <p className="text-foreground/90 mb-3">
                  The default daily goal is now 100 oz. You can manually input any amount, or use the quick-add buttons: +8 oz (a glass), +16 oz (a bottle), +24 oz (you're crushing it).
                </p>
                <p className="text-foreground/90">
                  The meals section is also now collapsible so it doesn't push everything else down the page when you log 14 things.
                </p>
              </div>
            </div>

            <Separator className="my-8" />

            {/* Birdwatching */}
            <div className="flex items-start gap-4 my-8">
              <div className="flex-shrink-0 p-3 rounded-xl bg-amber-500/10">
                <Bird className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-foreground mb-3">
                  Birdwatching: Log Another Sighting
                </h2>
                <p className="text-foreground/90 mb-3">
                  This one's for Rob (and anyone else tracking birds). When you're viewing a species detail page, there's now a "Log Another Sighting" button right in the header.
                </p>
                <p className="text-foreground/90">
                  Click it, and you're back on the Log tab with the species name already filled in. No more retyping "Northern Cardinal" and hoping autocomplete cooperates.
                </p>
              </div>
            </div>

            <Separator className="my-8" />

            {/* Voice Recorder Categories */}
            <div className="flex items-start gap-4 my-8">
              <div className="flex-shrink-0 p-3 rounded-xl bg-green-500/10">
                <Mic className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-foreground mb-3">
                  Universal Voice Recorder
                </h2>
                <p className="text-foreground/90 mb-3">
                  The microphone button on the Today page now opens a multi-purpose recorder. Pick a category—Journal, Nutrition, Bird Sighting, or Quick Task—and just talk.
                </p>
                <p className="text-foreground/90">
                  Nutrition entries get AI-parsed for calories and macros. Bird sightings extract the species name. Journal entries append to today's notes. It's the fastest way to log anything.
                </p>
              </div>
            </div>

            <Separator className="my-8" />

            {/* SMS Toasty */}
            <div className="flex items-start gap-4 my-8">
              <div className="flex-shrink-0 p-3 rounded-xl bg-primary/10">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-foreground mb-3">
                  Text Toasty: Your Pocket Coach
                </h2>
                <p className="text-foreground/90 mb-3">
                  You can now text <strong>(989) 266-5371</strong> and have a full conversation with Toasty, your AI planning assistant. Check in on goals, log tasks, get a daily briefing—all from your phone's native Messages app.
                </p>
                <p className="text-foreground/90">
                  No app required. No login. Just save the number and start texting.
                </p>
              </div>
            </div>

            <Separator className="my-10" />

            {/* Closing */}
            <p className="text-lg text-foreground/90">
              That's the batch. We're already working on the next round of improvements. If you have ideas, hit up the Feedback page or just text Toasty about it (seriously, you can do that now).
            </p>

            <div className="mt-10 p-6 bg-muted/50 rounded-lg text-center">
              <p className="text-muted-foreground mb-4">Questions? Ideas? Complaints?</p>
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