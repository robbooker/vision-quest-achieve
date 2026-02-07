import { ReactNode, useEffect, useState, useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);
  
  // Ref to track if we've already handled the just-completed flag (survives re-renders)
  const hasHandledFlagRef = useRef(false);

  useEffect(() => {
    async function checkOnboarding() {
      if (!user) {
        setCheckingOnboarding(false);
        return;
      }

      // Check if user just completed onboarding (skip DB check to avoid race condition)
      const justCompleted = sessionStorage.getItem("just-completed-onboarding");
      if (justCompleted === "true") {
        // Mark as handled to prevent re-processing on re-renders (React Strict Mode)
        if (!hasHandledFlagRef.current) {
          hasHandledFlagRef.current = true;
          setOnboardingCompleted(true);
          setCheckingOnboarding(false);
          
          // Remove flag after a delay to survive React Strict Mode double-invoke
          setTimeout(() => {
            sessionStorage.removeItem("just-completed-onboarding");
          }, 1000);
        }
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

  if (loading || checkingOnboarding) {
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

  // All users now have free access - no paywall needed
  return <>{children}</>;
}
