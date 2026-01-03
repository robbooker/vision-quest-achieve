import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowLeft, Repeat, Lightbulb, Target, Brain, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
                Habit-Based Goals: The Science of Behavior Change
              </h1>
              <p className="text-xl text-muted-foreground">
                How to use Charles Duhigg's Habit Loop to transform your daily behaviors
              </p>
            </div>

            {/* Content placeholder */}
            <div className="space-y-8">
              <section>
                <h2 className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" />
                  Why Habits Matter
                </h2>
                <p className="text-muted-foreground">
                  [Placeholder: Content about how 40-45% of daily behaviors are habits, and why understanding 
                  the neurological basis of habits is key to changing them. Reference Duhigg's research on 
                  how the brain "chunks" behaviors to save energy.]
                </p>
              </section>

              <section>
                <h2 className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  The Habit Loop: Cue → Routine → Reward
                </h2>
                <p className="text-muted-foreground">
                  [Placeholder: Detailed explanation of the three-part habit loop. Include examples like:
                  - The afternoon cookie habit
                  - Morning coffee routine
                  - Stress-eating patterns]
                </p>
                
                <div className="bg-muted/50 rounded-lg p-6 my-6">
                  <h3 className="font-semibold mb-2">The Cue Categories</h3>
                  <ul className="text-muted-foreground">
                    <li><strong>Time:</strong> It's 3pm, time for a break</li>
                    <li><strong>Location:</strong> Walking past the breakroom</li>
                    <li><strong>Emotion:</strong> Feeling stressed or bored</li>
                    <li><strong>Preceding Action:</strong> Just finished a meeting</li>
                    <li><strong>People:</strong> When you're around certain colleagues</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-primary" />
                  The Golden Rule of Habit Change
                </h2>
                <blockquote className="border-l-4 border-primary pl-4 italic">
                  "You cannot extinguish a bad habit, you can only change it. Keep the old cue and 
                  the old reward, but insert a new routine."
                </blockquote>
                <p className="text-muted-foreground">
                  [Placeholder: Explain why replacement is more effective than elimination. Include the 
                  alcoholism research from the book and how AA works through habit substitution.]
                </p>
              </section>

              <section>
                <h2>Keystone Habits: Small Changes, Big Ripples</h2>
                <p className="text-muted-foreground">
                  [Placeholder: Explain keystone habits with examples:
                  - Exercise → better eating → improved productivity
                  - Making your bed → sense of accomplishment → better decisions
                  - Family dinners → improved grades in children]
                </p>
              </section>

              <section>
                <h2>Willpower is a Muscle</h2>
                <p className="text-muted-foreground">
                  [Placeholder: Discuss decision fatigue and how habits conserve willpower. Reference the 
                  Baumeister studies on ego depletion and how turning difficult behaviors into habits 
                  frees up mental energy for other challenges.]
                </p>
              </section>

              <section>
                <h2 className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  The Power of Social Accountability
                </h2>
                <p className="text-muted-foreground">
                  [Placeholder: Discuss how social habits and accountability partners increase success rates. 
                  Reference the Montgomery Bus Boycott example and how movements succeed through 
                  "habits of friendship."]
                </p>
              </section>

              <section className="bg-primary/5 rounded-lg p-6">
                <h2 className="mt-0">How Groovy Planning Uses This</h2>
                <p className="text-muted-foreground">
                  Our Habit-Based Goal type guides you through:
                </p>
                <ol className="text-muted-foreground">
                  <li><strong>Direction:</strong> Choose to start, stop, or replace a habit</li>
                  <li><strong>The Loop:</strong> Identify your cue, routine, and reward</li>
                  <li><strong>Environment:</strong> Design your surroundings to support change</li>
                  <li><strong>Stakes:</strong> Connect to your bigger vision</li>
                  <li><strong>Accountability:</strong> Set up partner visibility</li>
                </ol>
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
                Based on the research and framework from <em>The Power of Habit</em> by Charles Duhigg.
              </p>
            </div>
          </article>
        </main>
      </div>
    </>
  );
}