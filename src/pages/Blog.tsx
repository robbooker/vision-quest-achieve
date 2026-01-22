import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowLeft, Clock, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import intentionActionGapImg from '@/assets/blog/intention-action-gap.jpeg';
import woopBrainImg from '@/assets/blog/woop-brain.jpeg';
import lockeLathamImg from '@/assets/blog/locke-latham.jpeg';

const Blog = () => {
  return (
    <>
      <Helmet>
        <title>The Broken Architecture of Your Ambitions | Groovy Planning</title>
        <meta name="description" content="We treat goal setting as a wish list. Science treats it as an engineering problem. From the industrial psychology of the 1960s to modern behavioral neuroscience, here is the definitive blueprint for bridging the gap between knowing what you want and actually getting it." />
        <meta property="og:title" content="The Broken Architecture of Your Ambitions: How 50 Years of Psychology Solved the Goal-Setting Crisis" />
        <meta property="og:description" content="From the industrial psychology of the 1960s to modern behavioral neuroscience, here is the definitive blueprint for goal achievement." />
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
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              January 2, 2026
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              15 min read
            </span>
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-4">
            The Broken Architecture of Your Ambitions: How 50 Years of Psychology Solved the Goal-Setting Crisis
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed">
            We treat goal setting as a wish list. Science treats it as an engineering problem. From the industrial psychology of the 1960s to modern behavioral neuroscience, here is the definitive blueprint for bridging the gap between knowing what you want and actually getting it.
          </p>

          <Separator className="my-8" />

          {/* Content */}
          <div className="prose prose-lg dark:prose-invert max-w-none space-y-6 [&>p]:mb-0">
            <p className="text-lg leading-relaxed text-foreground/90">
              It is the oldest cliché in self-improvement: <em>The road to hell is paved with good intentions.</em>
            </p>

            <p className="text-foreground/90">
              We all know the feeling. It's January 15th, and the gym is already starting to empty out. It's the unfinished novel sitting in a Google Doc untouched since October. It's the quarterly business objective that looks great on a slide deck but never translates into daily action.
            </p>

            <p className="text-foreground/90">
              We suffer from a collective delusion that wanting something badly enough is 90% of the battle. We believe that if the "why" is strong enough, the "how" will take care of itself.
            </p>

            <p className="text-foreground/90">
              Psychology tells us this is tragically incorrect. Wanting is easy. Execution is excruciatingly difficult because the human brain is designed for efficiency, comfort, and the path of least resistance—none of which align with ambitious goal achievement.
            </p>

            <p className="text-xl font-semibold text-foreground my-6">
              The problem isn't your willpower. The problem is your architecture.
            </p>

            <p className="text-foreground/90">
              Most of us are operating with a folk understanding of goal setting that is decades out of date. Fortunately, over the last half-century, a specific lineage of academic research has painstakingly mapped the mechanics of human ambition. It started in industrial labs in the 1960s and evolved into the modern neuroscience of habit formation.
            </p>

            <p className="text-foreground/90">
              If we want to stop abandoning our goals, we need to stop treating them as magic spells and start treating them as psychological protocols.
            </p>

            <p className="text-foreground/90">
              Here is the story of that research, and how it dictates the way we should plan our lives today.
            </p>

            <Separator className="my-10" />

            {/* Part I */}
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mt-12 mb-6">
              Part I: The Foundation (The "What")
            </h2>

            <p className="text-foreground/90">
              If you have ever been subjected to a corporate performance review, you have felt the distant echoes of Edwin Locke and Gary Latham.
            </p>

            <p className="text-foreground/90">
              In the mid-20th century, the prevailing wisdom about motivation was murky. It was largely behavioral—carrot and stick—or deeply psychoanalytic. Nobody had really quantified what happens in the human brain when you give it a target.
            </p>

            <p className="text-foreground/90">
              Enter Edwin Locke. In the 1960s, he began publishing research that challenged the ultimate "soft" management advice of the era: "Just do your best."
            </p>

            <figure className="my-8">
              <img 
                src={lockeLathamImg} 
                alt="Industrial psychology setting with goal: 100 units per hour - specific, hard" 
                className="w-full rounded-lg shadow-lg"
              />
              <figcaption className="text-sm text-muted-foreground mt-2 text-center">
                The origins of goal-setting theory in 1960s industrial psychology
              </figcaption>
            </figure>

            <p className="text-foreground/90">
              Locke's research, later formalized with Gary Latham in their seminal 1990 work, <em>A Theory of Goal Setting & Task Performance</em>, proved something that seems obvious now but was revolutionary at the time:
            </p>

            <p className="text-xl font-semibold text-primary my-6">
              "Do your best" doesn't work.
            </p>

            <p className="text-foreground/90">
              Their extensive studies (involving tens of thousands of participants across dozens of industries) showed that people told to "do their best" consistently underperformed compared to people given specific, difficult targets.
            </p>

            <p className="text-foreground/90">
              Locke and Latham established the bedrock theory that a goal serves as a regulatory mechanism. It is a psychological anchor that directs attention, mobilizes energy, and encourages persistence.
            </p>

            <h3 className="text-xl font-bold text-foreground mt-10 mb-4">
              The Core Mechanisms
            </h3>

            <p className="text-foreground/90">
              If you want to know why the "SMART" goal framework exists (Specific, Measurable, Achievable, Relevant, Time-bound), it is a watered-down derivative of Locke and Latham's findings. They identified the non-negotiable ingredients necessary for a goal to actually stimulate high performance:
            </p>

            <div className="bg-muted/50 rounded-lg p-6 my-6 space-y-4">
              <div>
                <h4 className="font-bold text-foreground">1. Clarity (Specificity works; vagueness fails)</h4>
                <p className="text-foreground/90 mt-1">
                  A goal to "get in shape" contains zero actionable information. It is cognitive noise. A goal to "reduce body fat percentage to 15% by July 1st" is a coordinate. The brain cannot optimize for vague inputs.
                </p>
              </div>
              
              <div>
                <h4 className="font-bold text-foreground">2. Challenge (The difficulty sweet spot)</h4>
                <p className="text-foreground/90 mt-1">
                  This is their most crucial finding. Performance has a linear relationship with difficulty. The harder the goal, the higher the performance—right up until the point it becomes impossible, at which point performance crashes. A goal must be in the "Goldilocks zone": hard enough to require intense focus to achieve, but perceived as attainable with effort.
                </p>
              </div>
              
              <div>
                <h4 className="font-bold text-foreground">3. Commitment (The "Why" matters)</h4>
                <p className="text-foreground/90 mt-1">
                  You cannot simply assign a difficult goal to someone (or yourself) and expect magic. If the individual doesn't care about the outcome, the mechanics of goal theory collapse.
                </p>
              </div>
              
              <div>
                <h4 className="font-bold text-foreground">4. Feedback (The navigation loop)</h4>
                <p className="text-foreground/90 mt-1">
                  Imagine trying to drive from New York to Los Angeles with a map, but a blacked-out windshield. You know the destination, but you cannot see where you are currently located relative to it. Locke and Latham found that people need to know precisely how they are progressing during the pursuit, not just at the end.
                </p>
              </div>
            </div>

            <h3 className="text-xl font-bold text-foreground mt-10 mb-4">
              The Limitation of the Foundation
            </h3>

            <p className="text-foreground/90">
              Locke and Latham gave us the "What." They proved that high, hard, specific goals are necessary for peak human performance.
            </p>

            <p className="text-foreground/90">
              But if you look at your own life, you know this isn't the whole story. You have almost certainly set high, hard, specific goals that you really cared about—and still failed to achieve them.
            </p>

            <p className="text-foreground/90">
              You knew what to do. You just didn't do it.
            </p>

            <p className="text-foreground/90">
              This is where the industrial psychology of the 1990s hit a wall. It could describe the destination perfectly, but it couldn't explain why the car kept breaking down in the driveway.
            </p>

            <Separator className="my-10" />

            {/* Part II */}
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mt-12 mb-6">
              Part II: The Missing Link (The Intention-Action Gap)
            </h2>

            <p className="text-foreground/90">
              Psychologists have a name for that chasm between your New Year's resolution and your behavior on February 1st: <strong>The Intention-Action Gap</strong>.
            </p>

            <p className="text-xl font-semibold text-foreground my-6">
              It is the graveyard of ambition.
            </p>

            <figure className="my-8">
              <img 
                src={intentionActionGapImg} 
                alt="Woman on couch with running gear, dreaming of running - the intention-action gap visualized" 
                className="w-full rounded-lg shadow-lg"
              />
              <figcaption className="text-sm text-muted-foreground mt-2 text-center">
                The Intention-Action Gap: knowing what to do, but not doing it
              </figcaption>
            </figure>

            <p className="text-foreground/90">
              The mistake Locke and Latham—and the entire subsequent self-help industry—made was assuming that humans are rational actors. They assumed that if you give a human a clear target and sufficient motivation, they will logically deduce the necessary steps and execute them.
            </p>

            <p className="text-foreground/90">
              But humans are not rational actors. We are <strong>cognitive misers</strong>.
            </p>

            <p className="text-foreground/90">
              Our brains burn roughly 20% of our body's metabolic energy. To conserve that energy, the brain loves habits and hates conscious decision-making.
            </p>

            <p className="text-foreground/90">
              Every time you have to decide whether to go to the gym, what to write for the first paragraph of your book, or how to handle a difficult client email, you are burning "executive function" fuel.
            </p>

            <p className="text-foreground/90">
              When you set a massive goal like "Write a novel in six months," you have defined the outcome, but you have left yourself facing thousands of tiny, energy-draining decisions every single day. Eventually, your executive function runs dry. The moment you get tired, stressed, or distracted, your brain defaults to the path of least resistance (Netflix).
            </p>

            <p className="text-lg font-semibold text-primary my-6">
              We didn't need better goals. We needed a way to automate the behavior required to reach them.
            </p>

            <Separator className="my-10" />

            {/* Part III */}
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mt-12 mb-6">
              Part III: The Execution Layer (Gollwitzer & Oettingen)
            </h2>

            <p className="text-foreground/90">
              How do you program a human brain to act against its own short-term interests in service of a long-term goal?
            </p>

            <p className="text-foreground/90">
              Around the turn of the millennium, two German researchers—Peter Gollwitzer and <Link to="/blog/woop" className="text-primary underline underline-offset-4 hover:text-primary/80">Gabriele Oettingen</Link> (a married couple working at NYU and the University of Hamburg)—provided the answers that closed the loop on Locke and Latham's work.
            </p>

            <p className="text-foreground/90">
              They shifted the focus from the content of the goal to the <strong>context of the action</strong>.
            </p>

            <h3 className="text-xl font-bold text-foreground mt-10 mb-4">
              Peter Gollwitzer: Pre-Deciding the Future
            </h3>

            <p className="text-foreground/90">
              Gollwitzer realized that relying on sheer willpower to bridge the Intention-Action Gap was a losing strategy. He proposed a concept called <strong>Implementation Intentions</strong>.
            </p>

            <p className="text-foreground/90">
              A normal goal (a "goal intention") looks like this: "I intend to achieve X."
            </p>

            <p className="text-foreground/90">
              An implementation intention looks like this: <strong>"If situation Y arises, then I will perform behavior Z."</strong>
            </p>

            <p className="text-foreground/90">
              It is a simple "If-Then" algorithm for human behavior.
            </p>

            <div className="bg-muted/50 rounded-lg p-6 my-6">
              <p className="text-foreground/90">
                <strong>Goal Intention:</strong> "I want to eat healthier." (Vague, relies on willpower at the moment of hunger).
              </p>
              <p className="text-foreground/90 mt-3">
                <strong>Implementation Intention:</strong> "If it is Tuesday night and I am too tired to cook, then I will order the grilled chicken salad from the place on the corner."
              </p>
            </div>

            <p className="text-foreground/90">
              Gollwitzer's research showed something incredible. By creating these "If-Then" plans before you are in the heat of the moment, you effectively offload the decision-making to the environment.
            </p>

            <p className="text-foreground/90">
              When Tuesday night arrives and you are exhausted, you don't have to think. The situational cue ("Tuesday night + tired") automatically triggers the pre-loaded response ("order salad"). You have turned a conscious, difficult choice into a reflex.
            </p>

            <h3 className="text-xl font-bold text-foreground mt-10 mb-4">
              Gabriele Oettingen: The Danger of Positive Thinking
            </h3>

            <p className="text-foreground/90">
              While Gollwitzer was tackling the "how," Gabriele Oettingen was attacking the "why."
            </p>

            <p className="text-foreground/90">
              For decades, the self-help movement has been dominated by the Cult of Positivity. Visualize success. Dream big. Believe it and you can achieve it.
            </p>

            <p className="text-foreground/90">
              Oettingen's research dropped a bomb on this philosophy. She found that <strong>pure positive visualization</strong> ("indulging," as she calls it) is actually counter-productive to achieving goals.
            </p>

            <p className="text-foreground/90">
              When you spend all your time fantasizing about the wonderful outcome—crossing the marathon finish line, holding your published book—your brain gets a hit of dopamine. It tricks your subconscious into feeling like you've already achieved the goal. The result? Your blood pressure drops, your energy decreases, and you become <em>less</em> likely to take action.
            </p>

            <p className="text-foreground/90">
              However, she also found that dwelling purely on the negatives was paralyzing.
            </p>

            <p className="text-foreground/90">
              The solution she discovered is <strong>Mental Contrasting</strong>.
            </p>

            <p className="text-foreground/90">
              Mental Contrasting requires you to first vividly imagine the desired positive future, and then immediately, starkly contrast it with the present-day reality and the internal obstacles standing in your way.
            </p>

            <p className="text-foreground/90">
              By holding both the dream and the difficulty in your mind simultaneously, you create cognitive tension. You realize the gap between where you are and where you want to be is real, and that positive vibes won't bridge it. This tension mobilizes energy.
            </p>

            <h3 className="text-xl font-bold text-foreground mt-10 mb-4">
              WOOP: The Grand Synthesis
            </h3>

            <p className="text-foreground/90">
              Oettingen and Gollwitzer combined their insights—Mental Contrasting plus Implementation Intentions—into a practical framework called <strong>WOOP</strong>.
            </p>

            <p className="text-foreground/90">
              It is the scientific antidote to "SMART" goals.
            </p>

            <figure className="my-8">
              <img 
                src={woopBrainImg} 
                alt="Brain diagram showing WOOP process: Wish, Obstacle, If-Then Action, Outcome" 
                className="w-full rounded-lg shadow-lg"
              />
              <figcaption className="text-sm text-muted-foreground mt-2 text-center">
                The WOOP framework: programming your brain for goal achievement
              </figcaption>
            </figure>

            <div className="bg-primary/10 border border-primary/20 rounded-lg p-6 my-6 space-y-3">
              <p className="text-foreground/90">
                <strong className="text-primary">W - Wish:</strong> What is the specific, challenging goal? (Locke & Latham).
              </p>
              <p className="text-foreground/90">
                <strong className="text-primary">O - Outcome:</strong> Vividly imagine the best result. Feel it. (Oettingen's positive visualization).
              </p>
              <p className="text-foreground/90">
                <strong className="text-primary">O - Obstacle:</strong> Switch gears. What is the internal thing in you that will stop you? (Oettingen's reality check).
              </p>
              <p className="text-foreground/90">
                <strong className="text-primary">P - Plan:</strong> Create an If-Then implementation intention to overcome that specific obstacle. (Gollwitzer's automation).
              </p>
            </div>

            <p className="text-lg italic text-muted-foreground my-6 text-center">
              If [my specific internal obstacle] occurs, then I will [perform my pre-decided action].
            </p>

            <p className="text-foreground/90">
              WOOP changes goal setting from a passive hope into an active defense strategy against your own likely future failure.
            </p>

            <Separator className="my-10" />

            {/* The Modern Synthesis */}
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mt-12 mb-6">
              The Modern Synthesis: Engineering Momentum
            </h2>

            <p className="text-foreground/90">
              So, where does this 50-year journey leave us?
            </p>

            <p className="text-foreground/90">
              It means that if you are still setting goals by writing down a resolution on New Year's Eve and hoping for the best, you are using unreliable technology.
            </p>

            <p className="text-foreground/90">
              A successful goal pursuit system in the modern era requires synthesizing all three waves of this research.
            </p>

            <div className="bg-muted/50 rounded-lg p-6 my-6 space-y-4">
              <div>
                <h4 className="font-bold text-foreground">1. You need Locke & Latham for the target.</h4>
                <p className="text-foreground/90 mt-1">
                  You must have a specific, high-challenge objective to orient your efforts. You need to know exactly what success looks like.
                </p>
              </div>
              
              <div>
                <h4 className="font-bold text-foreground">2. You need Oettingen for the energy.</h4>
                <p className="text-foreground/90 mt-1">
                  You cannot just "think positive." You must identify the positive outcome and ruthlessly confront the internal obstacles that will trip you up.
                </p>
              </div>
              
              <div>
                <h4 className="font-bold text-foreground">3. You need Gollwitzer for the execution.</h4>
                <p className="text-foreground/90 mt-1">
                  You cannot rely on willpower. You must pre-decide your actions using "If-Then" algorithms that automate your response to adversity.
                </p>
              </div>
            </div>

            <h3 className="text-xl font-bold text-foreground mt-10 mb-4">
              The Missing Container: Time
            </h3>

            <p className="text-foreground/90">
              There is one final element that the academic literature often overlooks, but practitioners know is vital: <strong>Time frames</strong>.
            </p>

            <p className="text-foreground/90">
              A high, hard goal set over a year is too distant; urgency dies. A goal set over a week is too short; meaningful work can't happen.
            </p>

            <p className="text-foreground/90">
              Modern methodologies (like agile development or Basecamp's "Shape Up") are finding that cycles of roughly <strong>six weeks</strong> are the "Goldilocks" zone for human ambition. Six weeks is long enough to build something significant, but short enough that the deadline provides helpful pressure from day one.
            </p>

            <p className="text-foreground/90">
              When you combine a tight, six-week container with the psychological architecture provided by Locke, Oettingen, and Gollwitzer, you stop having "wishes" and start having a reliable system for progress.
            </p>

            <p className="text-xl font-semibold text-primary my-8 text-center">
              We are past the era of "manifesting" our dreams. It's time to engineer them.
            </p>

            <Separator className="my-10" />

            {/* CTA */}
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-8 my-10 text-center">
              <h3 className="text-2xl font-bold text-foreground mb-3">
                Ready to engineer your goals?
              </h3>
              <p className="text-muted-foreground mb-6">
                Groovy Planning is built on these exact principles: 6-week sprints, specific targets, obstacle planning, and daily execution tracking.
              </p>
              <Link to="/auth">
                <Button size="lg" className="font-semibold">
                  Start Your First 6-Week Sprint
                </Button>
              </Link>
            </div>
          </div>
        </article>

        {/* Footer */}
        <footer className="border-t border-border/40 py-8 mt-12">
          <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} Groovy Planning. All rights reserved.</p>
            <div className="flex justify-center gap-4 mt-2">
              <Link to="/privacy" className="hover:text-foreground transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms" className="hover:text-foreground transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default Blog;

