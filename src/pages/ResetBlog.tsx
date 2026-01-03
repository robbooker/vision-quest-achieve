import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowLeft, Clock, Calendar, RotateCcw, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';

const ResetBlog = () => {
  return (
    <>
      <Helmet>
        <title>The 7-Day Reset: A System Stabilization Protocol | Groovy Planning</title>
        <meta name="description" content="The 7-Day Reset is a high-discipline protocol for recalibrating your operating system. 8 rules. 7 days. No negotiation. Learn the science behind system stabilization." />
        <meta property="og:title" content="The 7-Day Reset: A System Stabilization Protocol" />
        <meta property="og:description" content="8 rules. 7 days. No negotiation. A framework for breaking destructive cycles and establishing a new baseline." />
        <meta property="og:type" content="article" />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Link to="/reset">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Reset
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
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              January 3, 2026
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              8 min read
            </span>
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-4 flex items-center gap-3">
            <RotateCcw className="h-10 w-10 text-primary" />
            The 7-Day Reset
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed">
            A system stabilization protocol for pure reliability. 8 rules. 7 days. No negotiation.
          </p>

          <Separator className="my-8" />

          {/* Content */}
          <div className="prose prose-lg dark:prose-invert max-w-none space-y-6 [&>p]:mb-0">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mt-12 mb-6">
              The Philosophy
            </h2>

            <p className="text-foreground/90">
              Long-term goal pursuit is a marathon. But marathons require a functioning machine. When that machine starts to degrade—sleep erodes, inputs get sloppy, routines dissolve—the marathon becomes a death march.
            </p>

            <p className="text-foreground/90">
              The 7-Day Reset is not about goals. It's about the operating system that makes goals possible.
            </p>

            <p className="text-xl font-semibold text-primary my-6">
              This is a reset, not a sprint. The objective is pure reliability, not heroic output.
            </p>

            <p className="text-foreground/90">
              Think of it as a system reboot. When your computer starts glitching, you don't try to power through. You shut it down, clear the cache, and restart from a clean state. The 7-Day Reset does the same for your biological and psychological systems.
            </p>

            <Separator className="my-10" />

            <h2 className="text-2xl md:text-3xl font-bold text-foreground mt-12 mb-6">
              The 8 Rules
            </h2>

            <p className="text-foreground/90">
              Each rule targets a fundamental pillar of human performance. There are no bonus points for exceeding the minimum. The only measure is: Did you hit all 8? Binary. Pass or fail.
            </p>

            <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 my-6">
              <p className="text-foreground/90 font-medium">
                <strong>How It Works:</strong> When you initiate your Reset, a compact checklist banner will appear at the top of your Today page. Each day, you simply check off the rules you've completed. Your 7-day progress is visualized in real-time, and your performance is automatically tracked in your Reports.
              </p>
            </div>

            <div className="space-y-6 my-8">
              <Card className="border-primary/20">
                <CardContent className="pt-6">
                  <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                    <span className="text-primary font-mono">01.</span> WAKE
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">Metric: ±15 minutes of target time</p>
                  <p className="text-foreground/90 mt-3">
                    Your circadian rhythm is the master clock. <strong>You decide what time to wake up every day.</strong> Check this one as done if your feet hit the floor before that time and you do not go back to bed. Afternoon naps of less than an hour are perfectly acceptable and don't break this rule.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-primary/20">
                <CardContent className="pt-6">
                  <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                    <span className="text-primary font-mono">02.</span> MOVE
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">Metric: 30 minutes intentional movement</p>
                  <p className="text-foreground/90 mt-3">
                    Not exercise for aesthetics. Movement for neurochemistry. A 30-minute walk, a workout, yoga—anything that elevates heart rate and moves the body through space. This can be split (e.g., two 15-minute sessions) as long as the total is met. This is non-negotiable for mood regulation and cognitive function.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-primary/20">
                <CardContent className="pt-6">
                  <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                    <span className="text-primary font-mono">03.</span> WORK
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">Metric: 45 minutes focused, distraction-free work</p>
                  <p className="text-foreground/90 mt-3">
                    One block of deep work. No phone, no notifications, no context switching. This isn't about productivity volume—it's about proving to yourself that you can still concentrate. If you can hit 45 minutes once, you can rebuild from there.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-primary/20">
                <CardContent className="pt-6">
                  <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                    <span className="text-primary font-mono">04.</span> READ
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">Metric: 10 pages of a book</p>
                  <p className="text-foreground/90 mt-3">
                    Not articles. Not Twitter threads. A physical or e-book with sustained narrative or argument. Audiobooks count—the goal is long-form content, not the medium. Ten pages (or equivalent) forces your brain to engage with extended ideas—a muscle that atrophies quickly in the age of infinite scroll.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-primary/20">
                <CardContent className="pt-6">
                  <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                    <span className="text-primary font-mono">05.</span> INPUT
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">Metric: No junk media consumption</p>
                  <p className="text-foreground/90 mt-3">
                    Junk input creates junk output. For 7 days, ruthlessly curate what enters your mind. No doomscrolling, rage-bait, or empty calories for the brain. Acceptable: documentaries, quality podcasts, educational content. Not acceptable: mindless scrolling, outrage content, algorithm-fed feeds. If it doesn't teach, inspire, or genuinely entertain, it's out.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-primary/20">
                <CardContent className="pt-6">
                  <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                    <span className="text-primary font-mono">06.</span> SLEEP
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">Metric: In bed by target bedtime</p>
                  <p className="text-foreground/90 mt-3">
                    Sleep is the force multiplier. <strong>You choose your target bedtime</strong>—pick a time that allows for adequate rest and honor it. The goal isn't a specific number of hours; it's the discipline of a consistent wind-down. <strong>Weekends are not different.</strong> Your circadian rhythm doesn't know it's Saturday. Seven days means seven days.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-primary/20">
                <CardContent className="pt-6">
                  <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                    <span className="text-primary font-mono">07.</span> FUEL
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">Metric: 3 real meals with adequate protein</p>
                  <p className="text-foreground/90 mt-3">
                    Erratic eating creates erratic energy. Three meals. Actual food (not just snacks). Protein at each. You're not optimizing macros—you're establishing a rhythm that supports stable blood sugar and consistent energy.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-primary/20">
                <CardContent className="pt-6">
                  <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                    <span className="text-primary font-mono">08.</span> RESET
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">Metric: 0 sugar / 0 alcohol</p>
                  <p className="text-foreground/90 mt-3">
                    This is the hard line. For 7 days, eliminate the two most common destabilizers: added sugar and alcohol. Both disrupt sleep, both create energy volatility, both feed compulsive patterns. Seven days of clarity to prove you don't need them.
                  </p>
                </CardContent>
              </Card>
            </div>

            <Separator className="my-10" />

            <h2 className="text-2xl md:text-3xl font-bold text-foreground mt-12 mb-6">
              The 7-Day Arc
            </h2>

            <p className="text-foreground/90">
              The Reset isn't random. Each day represents a distinct phase of system recalibration:
            </p>

            <div className="bg-muted/50 rounded-lg p-6 my-6 space-y-4">
              <div className="flex items-start gap-3">
                <span className="font-mono font-bold text-primary">Day 1:</span>
                <div>
                  <span className="font-semibold">Friction</span>
                  <p className="text-sm text-muted-foreground">The hardest day. Old patterns fight back. Just survive it.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="font-mono font-bold text-primary">Day 2:</span>
                <div>
                  <span className="font-semibold">Order</span>
                  <p className="text-sm text-muted-foreground">Systems start to form. The structure becomes visible.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="font-mono font-bold text-primary">Day 3:</span>
                <div>
                  <span className="font-semibold">Rhythm</span>
                  <p className="text-sm text-muted-foreground">The body adapts. Rules feel less like friction.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="font-mono font-bold text-primary">Day 4:</span>
                <div>
                  <span className="font-semibold">Clarity</span>
                  <p className="text-sm text-muted-foreground">Mental fog lifts. Decision-making improves.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="font-mono font-bold text-primary">Day 5:</span>
                <div>
                  <span className="font-semibold">Momentum</span>
                  <p className="text-sm text-muted-foreground">Energy compounds. You start to feel the payoff.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="font-mono font-bold text-primary">Day 6:</span>
                <div>
                  <span className="font-semibold">Flow</span>
                  <p className="text-sm text-muted-foreground">Automation kicks in. Rules become reflexes.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="font-mono font-bold text-primary">Day 7:</span>
                <div>
                  <span className="font-semibold">Integration</span>
                  <p className="text-sm text-muted-foreground">The new baseline. Your operating system is recalibrated.</p>
                </div>
              </div>
            </div>

            <Separator className="my-10" />

            <h2 className="text-2xl md:text-3xl font-bold text-foreground mt-12 mb-6">
              The Scoring System
            </h2>

            <p className="text-foreground/90">
              There is no partial credit. Each day, you either hit 8/8 or you didn't. The score system uses a simple traffic light:
            </p>

            <div className="flex items-center gap-6 my-6">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-sm bg-[hsl(160,88%,63%)]" />
                <span className="text-sm font-medium">8/8 — Green</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-sm bg-[hsl(34,100%,58%)]" />
                <span className="text-sm font-medium">6-7 — Amber</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-sm bg-[hsl(0,84%,60%)]" />
                <span className="text-sm font-medium">&lt;6 — Red</span>
              </div>
            </div>

            <p className="text-foreground/90">
              The goal is 7 consecutive green days. If you break the chain, you simply start again. No shame. No drama. Just reset the reset.
            </p>

            <Separator className="my-10" />

            <h2 className="text-2xl md:text-3xl font-bold text-foreground mt-12 mb-6">
              When to Use the Reset
            </h2>

            <p className="text-foreground/90">
              The 7-Day Reset isn't for every week. It's a tool for specific moments:
            </p>

            <ul className="list-none space-y-3 my-6">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <span>After a period of chaos (travel, illness, life disruption)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <span>When you've noticed habits slipping for 2+ weeks</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <span>Before starting a new major project or cycle</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <span>When mental clarity feels degraded</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <span>Quarterly, as preventive maintenance</span>
              </li>
            </ul>

            <Separator className="my-10" />

            <div className="bg-primary/5 border border-primary/20 rounded-lg p-8 my-10 text-center">
              <h3 className="text-xl font-bold text-foreground mb-3">Ready to Reset?</h3>
              <p className="text-muted-foreground mb-6">
                Initiate your 7-Day Reset and recalibrate your operating system.
              </p>
              <Link to="/reset">
                <Button size="lg" className="gap-2">
                  <RotateCcw className="h-5 w-5" />
                  Start Your Reset
                </Button>
              </Link>
            </div>
          </div>
        </article>

        {/* Footer */}
        <footer className="border-t border-border/40 py-8">
          <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
            <Link to="/blog" className="hover:text-foreground transition-colors">
              ← Read more articles
            </Link>
          </div>
        </footer>
      </div>
    </>
  );
};

export default ResetBlog;
