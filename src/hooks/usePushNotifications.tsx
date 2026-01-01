import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface PushNotificationState {
  isSupported: boolean;
  isPWA: boolean;
  permission: NotificationPermission | 'unsupported';
  isSubscribed: boolean;
  isLoading: boolean;
}

export function usePushNotifications() {
  const { user } = useAuth();
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    isPWA: false,
    permission: 'unsupported',
    isSubscribed: false,
    isLoading: true,
  });

  // Check if running as PWA
  const checkIsPWA = useCallback(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIOSStandalone = (navigator as any).standalone === true;
    return isStandalone || isIOSStandalone;
  }, []);

  // Check if push notifications are supported
  const checkSupport = useCallback(() => {
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  }, []);

  // Check subscription status
  const checkSubscription = useCallback(async () => {
    if (!user) return false;
    
    try {
      const { data } = await supabase
        .from('push_subscriptions')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);
      
      return (data?.length ?? 0) > 0;
    } catch {
      return false;
    }
  }, [user]);

  // Initialize state
  useEffect(() => {
    const init = async () => {
      const isSupported = checkSupport();
      const isPWA = checkIsPWA();
      const permission = isSupported ? Notification.permission : 'unsupported';
      const isSubscribed = await checkSubscription();

      setState({
        isSupported,
        isPWA,
        permission,
        isSubscribed,
        isLoading: false,
      });
    };

    init();
  }, [checkSupport, checkIsPWA, checkSubscription]);

  // Request permission and subscribe
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported || !user) return false;

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      // Request notification permission
      const permission = await Notification.requestPermission();
      
      if (permission !== 'granted') {
        setState(prev => ({ ...prev, permission, isLoading: false }));
        return false;
      }

      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      // Get VAPID public key from environment
      const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      
      if (!vapidPublicKey) {
        console.error('VAPID public key not configured');
        setState(prev => ({ ...prev, isLoading: false }));
        return false;
      }

      // Convert VAPID key to Uint8Array
      const urlBase64ToUint8Array = (base64String: string) => {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
          outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
      };

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      // Send subscription to server
      const { error } = await supabase.functions.invoke('push-subscribe', {
        body: { subscription: subscription.toJSON() },
      });

      if (error) {
        console.error('Failed to save subscription:', error);
        setState(prev => ({ ...prev, isLoading: false }));
        return false;
      }

      setState(prev => ({
        ...prev,
        permission: 'granted',
        isSubscribed: true,
        isLoading: false,
      }));

      return true;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      setState(prev => ({ ...prev, isLoading: false }));
      return false;
    }
  }, [state.isSupported, user]);

  // Unsubscribe
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      // Unsubscribe from push manager
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await subscription.unsubscribe();
        }
      }

      // Remove from server
      const { error } = await supabase.functions.invoke('push-unsubscribe', {
        body: {},
      });

      if (error) {
        console.error('Failed to remove subscription:', error);
      }

      setState(prev => ({
        ...prev,
        isSubscribed: false,
        isLoading: false,
      }));

      return true;
    } catch (error) {
      console.error('Error unsubscribing:', error);
      setState(prev => ({ ...prev, isLoading: false }));
      return false;
    }
  }, [user]);

  // Send test notification
  const sendTestNotification = useCallback(async () => {
    if (!user) return;

    try {
      await supabase.functions.invoke('send-push-notification', {
        body: {
          user_id: user.id,
          title: 'Test Notification',
          body: 'Push notifications are working!',
          url: '/settings',
        },
      });
    } catch (error) {
      console.error('Error sending test notification:', error);
    }
  }, [user]);

  return {
    ...state,
    subscribe,
    unsubscribe,
    sendTestNotification,
  };
}
