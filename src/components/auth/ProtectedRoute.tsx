import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { supabase } from '@/integrations/supabase/client';
import { PaywallModal } from '@/components/paywall/PaywallModal';
import { TrialBanner } from '@/components/subscription/TrialBanner';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const { isSubscribed, isLoading: subLoading } = useSubscription();
  const location = useLocation();
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkOnboarding() {
      if (!user) {
        setCheckingOnboarding(false);
        return;
      }

      const { data } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('user_id', user.id)
        .single();

      setOnboardingCompleted(data?.onboarding_completed ?? false);
      setCheckingOnboarding(false);
    }

    if (!loading && user) {
      checkOnboarding();
    } else if (!loading) {
      setCheckingOnboarding(false);
    }
  }, [user, loading]);

  if (loading || checkingOnboarding || subLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="nixie-display animate-pulse">LOADING...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Redirect to onboarding if not completed (unless already on onboarding page)
  if (onboardingCompleted === false && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  // Show paywall if not subscribed (but allow onboarding and settings pages)
  const allowWithoutSubscription = ['/onboarding', '/settings'];
  if (!isSubscribed && !allowWithoutSubscription.includes(location.pathname)) {
    return <PaywallModal />;
  }

  return (
    <>
      <TrialBanner />
      {children}
    </>
  );
}
