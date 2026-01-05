import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface SubscriptionState {
  isSubscribed: boolean;
  isTrialing: boolean;
  isCanceled: boolean;
  isAdminGranted: boolean;
  status: string | null;
  trialEnd: Date | null;
  subscriptionEnd: Date | null;
  daysLeftInTrial: number | null;
  cancelAtPeriodEnd: boolean;
  isLoading: boolean;
}

export function useSubscription() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [state, setState] = useState<SubscriptionState>({
    isSubscribed: false,
    isTrialing: false,
    isCanceled: false,
    isAdminGranted: false,
    status: null,
    trialEnd: null,
    subscriptionEnd: null,
    daysLeftInTrial: null,
    cancelAtPeriodEnd: false,
    isLoading: true,
  });

  const checkSubscription = useCallback(async () => {
    if (!user) {
      setState(prev => ({ ...prev, isLoading: false, isSubscribed: false }));
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) throw error;

      const trialEnd = data.trialEnd ? new Date(data.trialEnd) : null;
      const subscriptionEnd = data.subscriptionEnd ? new Date(data.subscriptionEnd) : null;
      
      let daysLeftInTrial: number | null = null;
      if (trialEnd && data.status === 'trialing') {
        const now = new Date();
        const diff = trialEnd.getTime() - now.getTime();
        daysLeftInTrial = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
      }

      setState({
        isSubscribed: data.subscribed,
        isTrialing: data.status === 'trialing',
        isCanceled: !!data.canceledAt || data.cancelAtPeriodEnd,
        isAdminGranted: data.isAdminGranted || false,
        status: data.status,
        trialEnd,
        subscriptionEnd,
        daysLeftInTrial,
        cancelAtPeriodEnd: data.cancelAtPeriodEnd || false,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error checking subscription:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [user]);

  // Check on mount and when user changes
  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    if (!user) return;
    
    const interval = setInterval(checkSubscription, 60000);
    return () => clearInterval(interval);
  }, [user, checkSubscription]);

  const startTrial = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout');
      
      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error starting trial:', error);
      toast({
        title: 'Error',
        description: 'Failed to start checkout. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const cancelSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('cancel-subscription');
      
      if (error) throw error;
      
      toast({
        title: 'Subscription Canceled',
        description: `You'll have access until ${new Date(data.accessUntil).toLocaleDateString()}`,
      });
      
      // Refresh state
      await checkSubscription();
    } catch (error) {
      console.error('Error canceling subscription:', error);
      toast({
        title: 'Error',
        description: 'Failed to cancel subscription. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const openCustomerPortal = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      
      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast({
        title: 'Error',
        description: 'Failed to open subscription management. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return {
    ...state,
    checkSubscription,
    startTrial,
    cancelSubscription,
    openCustomerPortal,
  };
}
