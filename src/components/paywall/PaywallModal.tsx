import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Target, Calendar, BarChart3, BookOpen, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import gpLogo from '@/assets/gp-logo.png';

const features = [
  { icon: Target, label: '12-week goal planning' },
  { icon: Calendar, label: 'Weekly scheduling & reviews' },
  { icon: BarChart3, label: 'Progress tracking & analytics' },
  { icon: BookOpen, label: 'AI-powered journaling' },
];

export function PaywallModal() {
  const [isLoading, setIsLoading] = useState(false);

  const handleStartTrial = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout');
      
      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error starting checkout:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm">
      <Card className="mx-4 max-w-md w-full border-primary/20 shadow-xl">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <img src={gpLogo} alt="GroovyPlanning" className="h-16 w-auto" />
          </div>
          <CardTitle className="text-2xl">Start Your Free Trial</CardTitle>
          <CardDescription className="text-base">
            Get 7 days free, then just $99/year
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <ul className="space-y-3">
            {features.map((feature, i) => (
              <li key={i} className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <feature.icon className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm">{feature.label}</span>
              </li>
            ))}
          </ul>

          <div className="space-y-3">
            <Button 
              onClick={handleStartTrial} 
              disabled={isLoading}
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                'Start 7-Day Free Trial'
              )}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Cancel anytime during your trial. No charge if you cancel before it ends.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
