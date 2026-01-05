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
  const { isSubscribed, isLoading: subLoading, status } = useSubscription();
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

  // Pages that don't require subscription check to complete
  const bypassSubscriptionLoading = ['/onboarding', '/settings', '/checkout/success'];
  const shouldWaitForSub = !bypassSubscriptionLoading.includes(location.pathname);

  if (loading || checkingOnboarding || (subLoading && shouldWaitForSub)) {
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

  // Show paywall if not subscribed (but allow onboarding, settings, and checkout success pages)
  // Also skip paywall if subscription status is still loading or null (error case)
  const allowWithoutSubscription = ['/onboarding', '/settings', '/checkout/success'];
  if (!isSubscribed && !subLoading && status !== null && !allowWithoutSubscription.includes(location.pathname)) {
    return <PaywallModal />;
  }

  return (
    <>
      <TrialBanner />
      {children}
    </>
  );
}
