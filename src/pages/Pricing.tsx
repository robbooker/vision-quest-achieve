import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Footer } from '@/components/layout/Footer';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  Target,
  Calendar,
  Timer,
  Eye,
  BookOpen,
  BarChart3,
  Sparkles,
  Check,
  Zap,
  Clock,
  Brain,
  Heart,
  Users,
  Image,
  TrendingUp,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import gpLogo from '@/assets/gp-logo.png';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const features = [
  {
    icon: Target,
    title: 'Goal Planning',
    description: 'AI-powered goal creation with science-backed frameworks',
    items: [
      '6-week focused planning cycles',
      'AI Goal Coach interviews',
      '3 goal types: Standard, Time-Mastery, Habit',
      'Weekly milestone planning',
      'Backwards planning with auto-generation',
    ],
  },
  {
    icon: Calendar,
    title: 'Daily Execution',
    description: 'Turn plans into action with the Today page',
    items: [
      'Daily habit tracking with streaks',
      'Quick task management (Personal/Business/Shared)',
      'Google Calendar integration',
      'Time blocking for scheduled work',
      'Daily scoring for self-awareness',
    ],
  },
  {
    icon: Timer,
    title: 'Focused Work',
    description: 'Deep work sessions with Pomodoro-style timer',
    items: [
      'Customizable focus sessions (15-60 min)',
      'Ambient sounds: Rain, Cafe, Wind, Lo-fi',
      'Link sessions to goals for tracking',
      'Break timer between sessions',
      'Focus history and reflection notes',
    ],
  },
  {
    icon: Eye,
    title: 'Vision & Big Picture',
    description: 'Define your north star and long-term aspirations',
    items: [
      'The Big 10: 5 opportunities + 5 challenges',
      '3-year vision statement',
      'Long-term (5-10 year) vision',
      'Core values clarification',
      'Vision-connected goal tracking',
    ],
  },
  {
    icon: BookOpen,
    title: 'Daily Journal',
    description: 'AI-powered journaling with generated artwork',
    items: [
      'Automatic daily entry creation',
      'AI-generated artwork for each entry',
      'Chat interface for reflection',
      'Upload personal photos',
      'Track completed habits and tasks',
    ],
  },
  {
    icon: BarChart3,
    title: 'Analytics & Reports',
    description: 'Track your progress with visual insights',
    items: [
      'Weekly execution score trends',
      'Habit chain calendar visualization',
      'Focus session statistics',
      'Planned vs. actual hours comparison',
      'Sitewide community stats',
    ],
  },
];

const faqs = [
  {
    question: 'What happens during the 7-day trial?',
    answer: 'You get full access to all features for 7 days. No restrictions, no limitations. Try everything and see if Groovy Planning works for you.',
  },
  {
    question: 'How do I cancel my subscription?',
    answer: 'You can cancel anytime from the Settings page or directly from the trial banner. Your access continues until the end of your current billing period.',
  },
  {
    question: 'What happens if I cancel?',
    answer: 'If you cancel during the trial, you won\'t be charged. If you cancel after subscribing, you keep access until the end of your billing period.',
  },
  {
    question: 'Can I get a refund?',
    answer: 'Yes! If you\'re not satisfied within the first 30 days after your trial ends, contact us for a full refund.',
  },
  {
    question: 'Is my data secure?',
    answer: 'Absolutely. We use enterprise-grade encryption and never share your data with third parties. Your goals and journal entries are private.',
  },
];

export default function Pricing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleStartTrial = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout');
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: 'Error',
        description: 'Failed to start checkout. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container flex items-center justify-between py-4">
          <Link to="/" className="flex items-center gap-2">
            <img src={gpLogo} alt="Groovy Planning" className="h-10 w-auto" />
          </Link>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            {user ? (
              <Button variant="outline" asChild>
                <Link to="/today">Go to App</Link>
              </Button>
            ) : (
              <Button variant="outline" asChild>
                <Link to="/auth">Sign In</Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 md:py-24 bg-primary/5">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <Badge variant="secondary" className="mb-4">
              <Sparkles className="h-3 w-3 mr-1" />
              Science-backed productivity
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
              Transform Your Goals Into Reality
            </h1>
            <p className="text-xl text-muted-foreground">
              The planning system that turns your aspirations into actionable daily steps.
              50 years of psychology research, packaged into one beautiful app.
            </p>
          </div>

          {/* Pricing Card */}
          <Card className="max-w-md mx-auto mt-12 border-2 border-primary/20">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-3xl">$99/year</CardTitle>
              <CardDescription className="text-base">
                That's less than $2/week for transformational planning
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary" />
                  <span>7-day free trial</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary" />
                  <span>Cancel anytime</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary" />
                  <span>30-day money-back guarantee</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary" />
                  <span>All features included</span>
                </li>
              </ul>
              <Button 
                className="w-full" 
                size="lg" 
                onClick={handleStartTrial}
                disabled={isLoading}
              >
                {isLoading ? 'Loading...' : 'Start Your Free Trial'}
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                No credit card required to start exploring
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Everything You Need to Achieve More
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Six integrated systems that work together to help you plan, execute, and reflect on your goals.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <Card key={feature.title} className="h-full">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <feature.icon className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </div>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {feature.items.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 7-Day Reset Section */}
      <section className="py-16 bg-primary/5">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <Badge variant="outline" className="mb-4">
              <RefreshCw className="h-3 w-3 mr-1" />
              Bonus Feature
            </Badge>
            <h2 className="text-3xl font-bold text-foreground">
              The 7-Day Reset Protocol
            </h2>
            <p className="text-muted-foreground">
              When life gets chaotic, reset with our structured 8-rule system.
              Stabilize your routines, rebuild your habits, and get back on track.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Badge variant="secondary">Wake</Badge>
              <Badge variant="secondary">Fuel</Badge>
              <Badge variant="secondary">Move</Badge>
              <Badge variant="secondary">Work</Badge>
              <Badge variant="secondary">Read</Badge>
              <Badge variant="secondary">Input</Badge>
              <Badge variant="secondary">Reset</Badge>
              <Badge variant="secondary">Sleep</Badge>
            </div>
            <Button variant="outline" asChild>
              <Link to="/blog/reset">Learn About the Reset →</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Science Section */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <Badge variant="secondary" className="mb-4">
              <Brain className="h-3 w-3 mr-1" />
              Research-backed
            </Badge>
            <h2 className="text-3xl font-bold text-foreground">
              Built on 50 Years of Psychology Research
            </h2>
            <p className="text-muted-foreground">
              Groovy Planning incorporates proven frameworks from behavioral science:
              Locke & Latham's Goal-Setting Theory, WOOP (Wish, Outcome, Obstacle, Plan),
              and Charles Duhigg's Habit Loop research.
            </p>
            <Button variant="outline" asChild>
              <Link to="/blog">Read the Science →</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-primary/5">
        <div className="container">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-foreground text-center mb-8">
              Frequently Asked Questions
            </h2>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-3xl font-bold text-foreground">
              Ready to Stop Planning and Start Achieving?
            </h2>
            <p className="text-xl text-muted-foreground">
              Join Groovy Planning today. $99/year after your 7-day free trial.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" onClick={handleStartTrial} disabled={isLoading}>
                {isLoading ? 'Loading...' : 'Start Free Trial'}
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/blog">Learn More</Link>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Make some plans. Future You will thank you.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
