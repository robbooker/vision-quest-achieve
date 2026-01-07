import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowLeft, Brain, Clock, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import woopBrainImg from '@/assets/blog/woop-brain.jpeg';

export default function WoopBlog() {
  return (
    <>
      <Helmet>
        <title>WOOP: The Science of Mental Contrasting | Groovy Planning</title>
        <meta name="description" content="Discover Dr. Gabriele Oettingen's research-backed WOOP method: Wish, Outcome, Obstacle, Plan. Learn why positive thinking alone fails and how mental contrasting drives real behavior change." />
        <meta property="og:title" content="WOOP: Why Positive Thinking Fails and What Actually Works" />
        <meta property="og:description" content="The science of mental contrasting and implementation intentions from 20+ years of research." />
        <meta property="og:type" content="article" />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Link to="/blog">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Blog
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
              January 7, 2026
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              12 min read
            </span>
          </div>

          {/* Hero */}
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-6">
              <Brain className="h-8 w-8" />
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-4">
              WOOP: Why Positive Thinking Fails and What Actually Works
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
              Dr. Gabriele Oettingen spent 20 years proving the self-help industry wrong. Here's the science of mental contrasting and why your fantasies might be sabotaging your goals.
            </p>
          </div>

          <Separator className="my-8" />

          {/* Content */}
          <div className="prose prose-lg dark:prose-invert max-w-none space-y-6 [&>p]:mb-0">
            <p className="text-lg leading-relaxed text-foreground/90">
              "Just visualize your success and it will come to you."
            </p>

            <p className="text-foreground/90">
              This mantra has dominated self-help culture for decades. From <em>The Secret</em> to motivational speakers to well-meaning parents, we've been told that positive thinking is the key to achievement. Dream big, believe hard enough, and the universe will conspire in your favor.
            </p>

            <p className="text-xl font-semibold text-foreground my-6">
              There's just one problem: the science says it's wrong.
            </p>

            <p className="text-foreground/90">
              Dr. Gabriele Oettingen, a professor of psychology at New York University and the University of Hamburg, has spent over two decades studying the psychology of future thinking. Her findings represent one of the most significant—and counterintuitive—discoveries in modern motivation science.
            </p>

            <figure className="my-8">
              <img 
                src={woopBrainImg} 
                alt="Brain visualization showing the contrast between fantasy and reality" 
                className="w-full rounded-lg shadow-lg"
              />
              <figcaption className="text-sm text-muted-foreground mt-2 text-center">
                Mental contrasting activates different brain regions than pure positive fantasy
              </figcaption>
            </figure>

            <Separator className="my-10" />

            {/* Part I */}
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mt-12 mb-6">
              The Fantasy Trap
            </h2>

            <p className="text-foreground/90">
              In a series of experiments beginning in the 1990s, Oettingen asked participants to fantasize about their goals—losing weight, acing an exam, finding a romantic partner, recovering from surgery.
            </p>

            <p className="text-foreground/90">
              What she found shocked the research community:
            </p>

            <div className="bg-muted/50 rounded-lg p-6 my-6">
              <p className="text-lg font-semibold text-primary mb-3">
                The more positively people fantasized about their future, the less likely they were to achieve it.
              </p>
              <p className="text-foreground/90">
                Students who dreamed vividly about acing their exams got lower grades. Dieters who fantasized about their ideal bodies lost fewer pounds. Patients who imagined swift recoveries actually took longer to heal.
              </p>
            </div>

            <p className="text-foreground/90">
              Why? Because pure positive fantasy does something insidious to the brain: it provides a "mental attainment" of the goal <em>before any actual work has been done</em>.
            </p>

            <p className="text-foreground/90">
              When you vividly imagine yourself thin, successful, or recovered, your brain releases some of the same reward chemicals it would release if you'd actually achieved the goal. Your blood pressure drops. Your energy decreases. Your motivation evaporates.
            </p>

            <p className="text-xl font-semibold text-foreground my-6">
              You've fooled yourself into feeling the satisfaction of success without earning it.
            </p>

            <Separator className="my-10" />

            {/* Part II */}
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mt-12 mb-6">
              Mental Contrasting: The Missing Step
            </h2>

            <p className="text-foreground/90">
              But Oettingen didn't stop at debunking positive thinking. She asked a more important question: <em>What actually works?</em>
            </p>

            <p className="text-foreground/90">
              Her answer: <strong>Mental Contrasting</strong>.
            </p>

            <p className="text-foreground/90">
              Instead of just fantasizing about the positive outcome, effective goal-setters also identify and visualize the <em>internal obstacles</em> standing in their way. They oscillate between the dream and the reality.
            </p>

            <div className="bg-muted/50 rounded-lg p-6 my-6 space-y-4">
              <div>
                <h4 className="font-bold text-foreground">Step 1: Envision the Best Outcome</h4>
                <p className="text-foreground/90 mt-1">
                  What would achieving this goal look and feel like? What's the best possible result?
                </p>
              </div>
              
              <div>
                <h4 className="font-bold text-foreground">Step 2: Identify the Internal Obstacle</h4>
                <p className="text-foreground/90 mt-1">
                  What inside you is most likely to get in the way? Not external circumstances—what belief, emotion, or habit within <em>you</em> will sabotage this?
                </p>
              </div>
            </div>

            <p className="text-foreground/90">
              This contrast—moving from the idealized future to the problematic present—creates what Oettingen calls a "necessity to act." It activates the brain's planning centers rather than its reward centers. It generates energy rather than draining it.
            </p>

            <p className="text-foreground/90">
              In study after study, participants who practiced mental contrasting significantly outperformed both pure optimists and pure pessimists. They showed:
            </p>

            <ul className="space-y-2 my-6 text-foreground/90">
              <li>• Higher levels of goal commitment</li>
              <li>• More immediate action-taking</li>
              <li>• Greater persistence in the face of difficulty</li>
              <li>• Better ability to distinguish achievable goals from fantasy</li>
            </ul>

            <Separator className="my-10" />

            {/* Part III */}
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mt-12 mb-6">
              Implementation Intentions: The Execution Layer
            </h2>

            <p className="text-foreground/90">
              Oettingen's work intersects powerfully with that of her husband, Peter Gollwitzer, who developed the concept of <strong>Implementation Intentions</strong>.
            </p>

            <p className="text-foreground/90">
              While mental contrasting addresses the motivation problem, implementation intentions solve the execution problem. They take the form of simple "If-Then" statements:
            </p>

            <div className="bg-muted/50 rounded-lg p-6 my-6">
              <p className="text-lg font-semibold text-primary">
                "If [obstacle situation occurs], then I will [specific action]."
              </p>
            </div>

            <p className="text-foreground/90">
              For example:
            </p>

            <ul className="space-y-3 my-6 text-foreground/90">
              <li>• "If I feel the urge to check my phone during deep work, then I will take three deep breaths and refocus on the task."</li>
              <li>• "If I'm too tired to go to the gym after work, then I will do a 10-minute yoga video at home instead."</li>
              <li>• "If I start to feel anxious about the presentation, then I will remind myself of the three past presentations that went well."</li>
            </ul>

            <p className="text-foreground/90">
              The magic of implementation intentions is that they pre-decide your response to obstacles. When the obstacle actually arises, you don't have to engage in effortful decision-making. The response is already programmed.
            </p>

            <p className="text-foreground/90">
              Gollwitzer's research shows that implementation intentions roughly double the success rate for most goals.
            </p>

            <Separator className="my-10" />

            {/* Part IV */}
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mt-12 mb-6">
              WOOP: The Complete Framework
            </h2>

            <p className="text-foreground/90">
              Oettingen combined her mental contrasting research with Gollwitzer's implementation intentions into a single, memorable framework she calls <strong>WOOP</strong>:
            </p>

            <div className="bg-muted/50 rounded-lg p-6 my-6 space-y-4">
              <div>
                <h4 className="font-bold text-primary text-lg">W — Wish</h4>
                <p className="text-foreground/90 mt-1">
                  What is your most important wish or goal? Make it challenging but achievable. Be specific.
                </p>
              </div>
              
              <div>
                <h4 className="font-bold text-primary text-lg">O — Outcome</h4>
                <p className="text-foreground/90 mt-1">
                  What would be the best, most wonderful outcome of fulfilling your wish? Imagine it vividly. How would it feel?
                </p>
              </div>
              
              <div>
                <h4 className="font-bold text-primary text-lg">O — Obstacle</h4>
                <p className="text-foreground/90 mt-1">
                  What is the main internal obstacle preventing you from achieving your wish? This must be something within you—a thought, belief, emotion, or habit.
                </p>
              </div>
              
              <div>
                <h4 className="font-bold text-primary text-lg">P — Plan</h4>
                <p className="text-foreground/90 mt-1">
                  Create an If-Then plan: "If [obstacle], then I will [effective action to overcome it]."
                </p>
              </div>
            </div>

            <p className="text-foreground/90">
              The WOOP process takes only 5-15 minutes but has been validated in dozens of studies. It works for:
            </p>

            <ul className="space-y-2 my-6 text-foreground/90">
              <li>• Students improving grades</li>
              <li>• Patients managing chronic pain</li>
              <li>• Professionals increasing productivity</li>
              <li>• Individuals developing healthier habits</li>
              <li>• Leaders achieving strategic objectives</li>
            </ul>

            <Separator className="my-10" />

            {/* Part V */}
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mt-12 mb-6">
              The Neuroscience Behind WOOP
            </h2>

            <p className="text-foreground/90">
              Recent fMRI studies have revealed what happens in the brain during mental contrasting versus pure positive fantasy:
            </p>

            <div className="bg-muted/50 rounded-lg p-6 my-6 space-y-4">
              <div>
                <h4 className="font-bold text-foreground">Pure Positive Fantasy</h4>
                <p className="text-foreground/90 mt-1">
                  Activates the reward centers of the brain prematurely. Creates a "false finish line" that reduces motivation and energy mobilization.
                </p>
              </div>
              
              <div>
                <h4 className="font-bold text-foreground">Mental Contrasting (WOOP)</h4>
                <p className="text-foreground/90 mt-1">
                  Activates the prefrontal cortex (planning and executive function) and creates strong associative links between obstacles and planned responses. The brain literally prepares for action.
                </p>
              </div>
            </div>

            <p className="text-foreground/90">
              The contrast between future and present creates cognitive tension that the brain wants to resolve through action. By identifying the specific obstacle and plan, you create an "implementation mindset" that persists over time.
            </p>

            <Separator className="my-10" />

            {/* Part VI */}
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mt-12 mb-6">
              When WOOP Tells You to Let Go
            </h2>

            <p className="text-foreground/90">
              One of the most elegant aspects of WOOP is what Oettingen calls <em>intelligent goal disengagement</em>.
            </p>

            <p className="text-foreground/90">
              Sometimes, when you go through the WOOP process, you realize that the obstacle is truly insurmountable—or that the wish isn't as important as you thought. Mental contrasting helps you recognize when a goal is not feasible and makes it easier to let it go.
            </p>

            <p className="text-foreground/90">
              This is healthy. Pure positive thinkers often cling to impossible goals, wasting precious time and energy. WOOP practitioners develop what researchers call "goal adjustment capacity"—the wisdom to pursue achievable goals with vigor and release unachievable ones with grace.
            </p>

            <Separator className="my-10" />

            {/* Sources */}
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mt-12 mb-6">
              Sources and Further Reading
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-foreground">Primary Source</h3>
                <p className="text-muted-foreground italic">
                  Oettingen, G. (2014). Rethinking Positive Thinking: Inside the New Science of Motivation. Current/Penguin.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-foreground">Key Research Papers</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="italic">
                    Oettingen, G., & Gollwitzer, P. M. (2010). "Strategies of setting and implementing goals: Mental contrasting and implementation intentions." In J. E. Maddux & J. P. Tangney (Eds.), Social psychological foundations of clinical psychology.
                  </li>
                  <li className="italic">
                    Gollwitzer, P. M. (1999). "Implementation intentions: Strong effects of simple plans." American Psychologist, 54(7), 493-503.
                  </li>
                  <li className="italic">
                    Oettingen, G. (2012). "Future thought and behaviour change." European Review of Social Psychology, 23(1), 1-63.
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-foreground">The Fantasy Research</h3>
                <p className="text-foreground/90">
                  Oettingen's studies on the negative effects of positive fantasy:
                </p>
                <p className="text-muted-foreground italic">
                  Oettingen, G., & Mayer, D. (2002). "The motivating function of thinking about the future: Expectations versus fantasies." Journal of Personality and Social Psychology, 83(5), 1198-1212.
                </p>
              </div>
            </div>

            <Separator className="my-10" />

            {/* CTA Section */}
            <section className="bg-primary/5 rounded-lg p-6 mt-12">
              <h2 className="mt-0 text-xl font-bold text-foreground">Ready to Try WOOP?</h2>
              <p className="text-muted-foreground">
                Our WOOP Goal type guides you through Oettingen's 4-step process with a conversational AI coach—from clarifying your wish to crafting your If-Then implementation plan.
              </p>
              <div className="mt-6">
                <Link to="/dashboard">
                  <Button>
                    Create Your First WOOP Goal
                  </Button>
                </Link>
              </div>
            </section>
          </div>

          {/* Footer note */}
          <div className="border-t mt-12 pt-8 text-center text-sm text-muted-foreground">
            <p>
              Based on the research of Dr. Gabriele Oettingen and Dr. Peter Gollwitzer at NYU and the University of Hamburg.
            </p>
          </div>
        </article>
      </div>
    </>
  );
}
