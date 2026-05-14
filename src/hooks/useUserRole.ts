import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export function useUserRole() {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    async function checkAdminRole() {
      if (authLoading) {
        setLoading(true);
        return;
      }

      if (!user) {
        if (isActive) {
          setIsAdmin(false);
          setLoading(false);
        }
        return;
      }

      setLoading(true);

      try {
        const { data, error } = await supabase
          .rpc('has_role', { _user_id: user.id, _role: 'admin' });

        if (!isActive) return;

        if (error) {
          console.error('Error checking admin role:', error);
          setIsAdmin(false);
        } else {
          setIsAdmin(data === true);
        }
      } catch (err) {
        console.error('Error checking admin role:', err);
        if (isActive) setIsAdmin(false);
      } finally {
        if (isActive) setLoading(false);
      }
    }

    checkAdminRole();

    return () => {
      isActive = false;
    };
  }, [user, authLoading]);

  return { isAdmin, loading };
}
