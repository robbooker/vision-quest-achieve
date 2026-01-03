import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowLeft, Repeat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import basalGangliaImage from '@/assets/blog/basal-ganglia.png';

export default function HabitGoalsBlog() {
  return (
    <>
      <Helmet>
        <title>Habit-Based Goals: The Science of Behavior Change | Groovy Planning</title>
        <meta name="description" content="Learn how to use Charles Duhigg's Habit Loop framework to start, stop, or replace habits effectively. Build lasting behavior change with cue-routine-reward." />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b bg-card">
          <div className="container mx-auto px-4 py-4 flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-12 max-w-3xl">
          <article className="prose prose-neutral dark:prose-invert max-w-none">
            {/* Hero */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-6">
                <Repeat className="h-8 w-8" />
              </div>
              <h1 className="text-4xl font-bold mb-4">
                The Power of Habit: Why We Do What We Do
              </h1>
              <p className="text-xl text-muted-foreground">
                Understanding Charles Duhigg's framework for behavior change
              </p>
            </div>

            {/* Content */}
            <div className="space-y-8">
              <p className="text-lg leading-relaxed">
                Charles Duhigg's central thesis in <em>The Power of Habit</em> is that habits aren't destiny, but they are incredibly efficient—mostly because your brain is inherently lazy. To save energy, the brain converts a sequence of actions into an automatic routine (a process called "chunking"), which is great for backing a car out of a driveway, but less great when it results in you eating a sleeve of Thin Mints at 11:00 PM without realizing it.
              </p>

              <p className="text-lg leading-relaxed">
                Here is the breakdown of his framework for how these patterns actually function.
              </p>

              {/* Section 1 */}
              <section className="space-y-4">
                <h2 className="text-2xl font-bold mt-8">1. The Habit Loop</h2>
                
                <p>
                  Duhigg argues that every habit is a three-part neurological loop. Understanding this loop is the prerequisite for changing it.
                </p>

                <ul className="space-y-4 list-none pl-0">
                  <li>
                    <strong className="text-primary">The Cue:</strong> A trigger that tells your brain to go into automatic mode and which habit to use. (Example: Feeling bored at your desk.)
                  </li>
                  <li>
                    <strong className="text-primary">The Routine:</strong> The physical, mental, or emotional behavior that follows the cue. (Example: Walking to the breakroom for a snack.)
                  </li>
                  <li>
                    <strong className="text-primary">The Reward:</strong> The "payoff" that helps your brain figure out if this particular loop is worth remembering. (Example: The sugar hit or, more likely, the social interaction in the breakroom.)
                  </li>
                </ul>
              </section>

              {/* Section 2 */}
              <section className="space-y-4">
                <h2 className="text-2xl font-bold mt-8">2. The Golden Rule of Habit Change</h2>
                
                <p>
                  Duhigg's most practical takeaway is that you cannot actually "extinguish" a bad habit; you can only replace it. To change a habit, you must keep the old Cue and the old Reward, but insert a new Routine.
                </p>

                <blockquote className="border-l-4 border-primary pl-6 py-2 my-6 bg-muted/30 rounded-r-lg">
                  <p className="italic font-medium">
                    The Formula: If you use the same cue and provide the same reward, you can shift the routine and change the habit.
                  </p>
                </blockquote>

                <p>
                  For example, if your "routine" is drinking a beer to relax (reward) after a stressful day (cue), you might find that drinking a flavored seltzer or going for a ten-minute walk provides a similar sense of "reset" or "reward," thereby satisfy the craving without the alcohol.
                </p>
              </section>

              {/* Section 3 */}
              <section className="space-y-4">
                <h2 className="text-2xl font-bold mt-8">3. Keystone Habits</h2>
                
                <p>
                  Duhigg introduces the concept of Keystone Habits—certain behaviors that, once changed, tend to ripple through the rest of your life. They aren't necessarily "better" habits in isolation, but they create a "small win" culture that shifts your self-image.
                </p>

                <ul className="space-y-4 list-none pl-0">
                  <li>
                    <strong className="text-primary">Exercise:</strong> People who start exercising often start eating better, becoming more productive at work, and even using their credit cards less.
                  </li>
                  <li>
                    <strong className="text-primary">Making the Bed:</strong> This is often cited as a keystone habit linked to better productivity and a greater sense of well-being. It's not that a made bed makes you a CEO; it's that it establishes a pattern of "small wins" that makes you feel like someone who has their life together.
                  </li>
                </ul>
              </section>

              {/* Section 4 */}
              <section className="space-y-4">
                <h2 className="text-2xl font-bold mt-8">4. Willpower as a Muscle</h2>
                
                <p>
                  One of the more academic points Duhigg makes is that willpower isn't a skill—it's a muscle. Like a muscle, it gets tired as the day goes on (decision fatigue).
                </p>

                <p>
                  However, he notes that willpower can be "strengthened" through habit. If you turn a difficult behavior (like going to the gym) into a habit, it stops requiring willpower, which leaves you with more "fuel" in the tank to deal with other stressors later in the day.
                </p>
              </section>

              {/* Section 5 */}
              <section className="space-y-4">
                <h2 className="text-2xl font-bold mt-8">5. Organizational & Social Habits</h2>
                
                <p>
                  The book also scales these ideas up to companies and societies:
                </p>

                <ul className="space-y-4 list-none pl-0">
                  <li>
                    <strong className="text-primary">Alcoa:</strong> When Paul O'Neill took over the struggling aluminum company Alcoa, he focused almost exclusively on a single habit: worker safety. This keystone habit forced the company to communicate better and identify inefficiencies, eventually making it one of the most profitable companies in the Dow Jones.
                  </li>
                  <li>
                    <strong className="text-primary">Social Movements:</strong> He argues that movements (like the Montgomery Bus Boycott) succeed not just because of a single leader, but because they leverage the "habits of friendship" and social pressure within a community to create momentum.
                  </li>
                </ul>
              </section>

              {/* Sources Section */}
              <section className="space-y-6 mt-12 pt-8 border-t">
                <h2 className="text-2xl font-bold">Sources and More</h2>
                
                <p>
                  It is a bit of a rabbit hole, isn't it? Duhigg didn't just invent these concepts out of thin air; he spent years synthesized hundreds of academic studies and interviews. If you're looking to vet his work or dive deeper into the footnotes, here is the primary "paper trail" he used to build the book.
                </p>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold">1. The Primary Source</h3>
                    <p>The foundational text is, of course:</p>
                    <p className="text-muted-foreground italic">
                      Duhigg, C. (2012). The Power of Habit: Why We Do What We Do in Life and Business. Random House.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold">2. The Neurological Foundation (The Basal Ganglia)</h3>
                    <p>
                      Duhigg relies heavily on research from MIT's Department of Brain and Cognitive Sciences.
                    </p>
                    <p>
                      <strong>Key Researchers:</strong> Ann Graybiel and her team.
                    </p>
                    <p>
                      <strong>The Study:</strong> They spent years monitoring the brain activity of rats running through T-shaped mazes. They discovered that as a behavior becomes habitual, the brain's activity decreases. The mental processing moves from the prefrontal cortex (the "executive" part of the brain) to the basal ganglia (the primitive core).
                    </p>
                    
                    <figure className="my-8">
                      <img 
                        src={basalGangliaImage} 
                        alt="Diagram of the basal ganglia in the human brain, showing its location relative to the cerebral cortex, thalamus, amygdala, pons, and cerebellum"
                        className="rounded-lg w-full max-w-lg mx-auto"
                      />
                      <figcaption className="text-center text-sm text-muted-foreground mt-2">
                        Source: Graybiel, A. M. (2008). "Habit, Ritual, and the Evaluative Brain." Annual Review of Neuroscience.
                      </figcaption>
                    </figure>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold">3. Willpower as a Finite Resource</h3>
                    <p>
                      The idea that willpower is a "muscle" that can be exhausted comes from the social psychology of ego depletion.
                    </p>
                    <p>
                      <strong>Key Researchers:</strong> Roy Baumeister and Mark Muraven.
                    </p>
                    <p>
                      <strong>The Study:</strong> One famous experiment involved students in a room that smelled like freshly baked cookies. Some were allowed to eat the cookies; others were forced to eat radishes. Later, the radish-eaters gave up much faster on a difficult geometry puzzle because they had already "spent" their willpower resisting the cookies.
                    </p>
                    <p className="text-muted-foreground italic">
                      Source: Muraven, M., & Baumeister, R. F. (2000). "Self-regulation and depletion of limited resources: Does self-control resemble a muscle?" Psychological Bulletin.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold">4. Keystone Habits and Alcoa</h3>
                    <p>
                      For the organizational side of things, Duhigg used business history and direct interviews.
                    </p>
                    <p>
                      <strong>The Subject:</strong> Paul O'Neill's tenure at Alcoa (Aluminum Company of America) starting in 1987.
                    </p>
                    <p>
                      <strong>The Source:</strong> Duhigg analyzed Alcoa's annual reports and conducted extensive interviews with O'Neill and other executives to document how a focus on safety transformed the company's bottom line.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold">5. Marketing and Consumer Habits</h3>
                    <p>
                      Duhigg explores how companies "predict" our habits, specifically citing:
                    </p>
                    <ul className="space-y-2">
                      <li>
                        <strong>Claude Hopkins:</strong> The man who made Pepsodent (and tooth-brushing) a global habit in the early 20th Century by identifying the "film" on teeth as a cue.
                      </li>
                      <li>
                        <strong>P&G (Febreze):</strong> Duhigg documents the internal struggle at Procter & Gamble to market Febreze, which originally failed because they didn't understand the "Reward" part of the habit loop.
                      </li>
                    </ul>
                    <p className="text-muted-foreground italic">
                      Source: Hopkins, C. C. (1923). My Life in Advertising. (A classic text in the marketing world).
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold">6. Social Habits and the Montgomery Bus Boycott</h3>
                    <p>
                      To explain how habits move from individuals to societies, he looks at the work of Mark Granovetter.
                    </p>
                    <p>
                      <strong>The Concept:</strong> "The Strength of Weak Ties." This explains how movements spread beyond a close-knit group of friends into a broader community.
                    </p>
                    <p className="text-muted-foreground italic">
                      Source: Granovetter, M. S. (1973). "The Strength of Weak Ties." American Journal of Sociology.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold">7. The Science of Cravings</h3>
                    <p>
                      The research on how "Reward" triggers dopamine was largely influenced by Wolfram Schultz, a professor of neuroscience at Cambridge.
                    </p>
                    <p>
                      <strong>The Study:</strong> He showed that once a habit is formed, the brain starts producing dopamine (the "pleasure" chemical) when it sees the cue, rather than when it actually receives the reward. This is the biological definition of a craving.
                    </p>
                    <p className="text-muted-foreground italic">
                      Source: Schultz, W. (1997). "A Neural Substrate of Prediction and Reward." Science.
                    </p>
                  </div>
                </div>
              </section>

              {/* CTA Section */}
              <section className="bg-primary/5 rounded-lg p-6 mt-12">
                <h2 className="mt-0 text-xl font-bold">Ready to Apply This?</h2>
                <p className="text-muted-foreground">
                  Our Habit-Based Goal type guides you through Duhigg's framework step by step—from identifying your cue to designing your environment for success.
                </p>
                <div className="mt-6">
                  <Link to="/dashboard">
                    <Button>
                      Create Your First Habit Goal
                    </Button>
                  </Link>
                </div>
              </section>
            </div>

            {/* Footer note */}
            <div className="border-t mt-12 pt-8 text-center text-sm text-muted-foreground">
              <p>
                Based on the research and framework from <em>The Power of Habit</em> by Charles Duhigg (2012).
              </p>
            </div>
          </article>
        </main>
      </div>
    </>
  );
}
