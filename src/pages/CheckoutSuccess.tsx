import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Target, Calendar, BarChart3, BookOpen, ArrowRight, Sparkles } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import logo from '@/assets/gp-logo.png';

const CheckoutSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { checkSubscription, isSubscribed } = useSubscription();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Refresh subscription status after successful checkout
    const refreshStatus = async () => {
      await checkSubscription();
      setIsChecking(false);
    };
    refreshStatus();
  }, [checkSubscription]);

  const steps = [
    {
      icon: Target,
      title: 'Set Your Vision',
      description: 'Define your long-term goals and core values to guide your planning.',
    },
    {
      icon: Calendar,
      title: 'Create a 12-Week Cycle',
      description: 'Break down your big goals into manageable 12-week sprints.',
    },
    {
      icon: BarChart3,
      title: 'Track Daily Progress',
      description: 'Log your habits, tasks, and focus sessions each day.',
    },
    {
      icon: BookOpen,
      title: 'Reflect & Adjust',
      description: 'Use weekly reviews to celebrate wins and course-correct.',
    },
  ];

  return (
    <>
      <Helmet>
        <title>Welcome to Groovy Planning!</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <Card className="border-2 border-primary/20 shadow-xl">
            <CardHeader className="text-center pb-2">
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <img src={logo} alt="Groovy Planning" className="h-16 w-16" />
                  <div className="absolute -bottom-1 -right-1 bg-primary rounded-full p-1">
                    <CheckCircle2 className="h-5 w-5 text-primary-foreground" />
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-center gap-2 text-primary mb-2">
                <Sparkles className="h-5 w-5" />
                <span className="text-sm font-medium uppercase tracking-wide">Welcome Aboard!</span>
                <Sparkles className="h-5 w-5" />
              </div>
              
              <CardTitle className="text-3xl font-bold">
                Your Trial Has Started!
              </CardTitle>
              <CardDescription className="text-lg mt-2">
                You have 7 days to explore everything Groovy Planning has to offer.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <p className="text-muted-foreground">
                  No charge during your trial. Cancel anytime before it ends.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-lg text-center">Get Started in 4 Simple Steps</h3>
                
                <div className="grid gap-3">
                  {steps.map((step, index) => (
                    <div
                      key={step.title}
                      className="flex items-start gap-4 p-3 rounded-lg bg-card border transition-colors hover:bg-accent/50"
                    >
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <step.icon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-muted-foreground">
                            Step {index + 1}
                          </span>
                        </div>
                        <h4 className="font-medium">{step.title}</h4>
                        <p className="text-sm text-muted-foreground">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-4">
                <Button
                  size="lg"
                  className="w-full text-lg"
                  onClick={() => navigate('/onboarding')}
                >
                  Start Setup
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => navigate('/today')}
                >
                  Skip to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default CheckoutSuccess;
