import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { User, Check, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export function ProfileSettings() {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [originalName, setOriginalName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('user_id', user.id)
        .single();
      
      if (error) {
        console.error('Error fetching profile:', error);
      } else if (data) {
        setDisplayName(data.display_name || '');
        setOriginalName(data.display_name || '');
      }
      setIsLoading(false);
    }

    fetchProfile();
  }, [user]);

  const handleSave = async () => {
    if (!user || displayName === originalName) return;
    
    setIsSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ display_name: displayName.trim() })
      .eq('user_id', user.id);
    
    if (error) {
      toast.error('Failed to update name');
      console.error('Error updating profile:', error);
    } else {
      setOriginalName(displayName.trim());
      toast.success('Name updated');
    }
    setIsSaving(false);
  };

  const hasChanges = displayName !== originalName;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          Profile
        </CardTitle>
        <CardDescription>
          Your display name and account information.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="displayName">Display Name</Label>
          {isLoading ? (
            <div className="h-10 bg-muted animate-pulse rounded-md" />
          ) : (
            <div className="flex gap-2">
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                className="max-w-xs"
              />
              {hasChanges && (
                <Button onClick={handleSave} disabled={isSaving} size="icon">
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          <Label>Email</Label>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
        </div>
      </CardContent>
    </Card>
  );
}
