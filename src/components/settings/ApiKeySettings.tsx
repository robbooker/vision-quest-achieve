import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Key, Copy, Trash2, Plus, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

export function ApiKeySettings() {
  const queryClient = useQueryClient();
  const [label, setLabel] = useState('');
  const [newKey, setNewKey] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);

  const { data: keys = [], isLoading } = useQuery({
    queryKey: ['api-keys'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('api_keys')
        .select('id, key_prefix, label, created_at, last_used_at, revoked')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const generateMutation = useMutation({
    mutationFn: async (label: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-api-key`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ label: label || undefined }),
        }
      );
      if (!res.ok) throw new Error('Failed to generate key');
      return res.json();
    },
    onSuccess: (data) => {
      setNewKey(data.key);
      setShowKey(true);
      setLabel('');
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      toast.success('API key generated! Copy it now — it won\'t be shown again.');
    },
    onError: () => toast.error('Failed to generate API key'),
  });

  const revokeMutation = useMutation({
    mutationFn: async (keyId: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-api-key?id=${keyId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
        }
      );
      if (!res.ok) throw new Error('Failed to revoke key');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      toast.success('API key revoked');
    },
    onError: () => toast.error('Failed to revoke key'),
  });

  const copyKey = () => {
    if (newKey) {
      navigator.clipboard.writeText(newKey);
      toast.success('API key copied to clipboard');
    }
  };

  const activeKeys = keys.filter((k: any) => !k.revoked);
  const revokedKeys = keys.filter((k: any) => k.revoked);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5 text-primary" />
          API Keys
        </CardTitle>
        <CardDescription>
          Generate permanent API keys so external apps can access your data without expiring tokens.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* New key display */}
        {newKey && (
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <AlertTriangle className="h-4 w-4" />
              Save this key now — it won't be shown again!
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded bg-muted px-3 py-2 text-xs font-mono break-all">
                {showKey ? newKey : '•'.repeat(40)}
              </code>
              <Button variant="ghost" size="icon" onClick={() => setShowKey(!showKey)}>
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={copyKey}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <Button variant="outline" size="sm" onClick={() => setNewKey(null)}>
              I've saved my key
            </Button>
          </div>
        )}

        {/* Generate new key */}
        <div className="flex gap-2">
          <Input
            placeholder="Label (e.g. My Health App)"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="max-w-xs"
          />
          <Button
            onClick={() => generateMutation.mutate(label)}
            disabled={generateMutation.isPending}
            size="sm"
            className="gap-1"
          >
            <Plus className="h-4 w-4" />
            Generate Key
          </Button>
        </div>

        {/* Active keys */}
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : activeKeys.length === 0 && revokedKeys.length === 0 ? (
          <p className="text-sm text-muted-foreground">No API keys yet.</p>
        ) : (
          <div className="space-y-2">
            {activeKeys.map((key: any) => (
              <div key={key.id} className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <code className="text-xs font-mono text-muted-foreground">{key.key_prefix}</code>
                    {key.label && <Badge variant="secondary" className="text-xs">{key.label}</Badge>}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Created {format(new Date(key.created_at), 'MMM d, yyyy')}
                    {key.last_used_at && ` · Last used ${format(new Date(key.last_used_at), 'MMM d, yyyy')}`}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => revokeMutation.mutate(key.id)}
                  disabled={revokeMutation.isPending}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {revokedKeys.map((key: any) => (
              <div key={key.id} className="flex items-center justify-between rounded-lg border border-dashed p-3 opacity-50">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <code className="text-xs font-mono text-muted-foreground">{key.key_prefix}</code>
                    {key.label && <Badge variant="outline" className="text-xs">{key.label}</Badge>}
                    <Badge variant="destructive" className="text-xs">Revoked</Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Usage instructions */}
        <details className="text-sm">
          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
            How to use your API key
          </summary>
          <div className="mt-2 rounded-lg bg-muted p-3 space-y-3">
            <div>
              <p className="text-muted-foreground text-xs font-medium mb-1">Base endpoint:</p>
              <code className="block text-xs font-mono break-all">
                {import.meta.env.VITE_SUPABASE_URL}/functions/v1/export-data?resource=RESOURCE_NAME
              </code>
            </div>
            <div>
              <p className="text-muted-foreground text-xs font-medium mb-1">Headers:</p>
              <code className="block text-xs font-mono">
                Authorization: Bearer gp_your_key_here
              </code>
              <code className="block text-xs font-mono">
                apikey: {import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}
              </code>
            </div>
            <div>
              <p className="text-muted-foreground text-xs font-medium mb-1">Optional query params:</p>
              <code className="block text-xs font-mono">?from=2025-01-01&to=2025-12-31&format=csv</code>
            </div>
            <div>
              <p className="text-muted-foreground text-xs font-medium mb-1">Available resources:</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {[
                  'blood_pressure', 'weight', 'sleep', 'nutrition', 'focus_sessions',
                  'tasks', 'journal', 'goals', 'habits', 'books', 'bird_sightings',
                  'bloodwork', 'trading', 'calendar', 'trips'
                ].map(r => (
                  <Badge key={r} variant="outline" className="text-xs font-mono">{r}</Badge>
                ))}
              </div>
            </div>
            <div className="border-t pt-2 mt-2">
              <p className="text-muted-foreground text-xs font-medium mb-1">Example:</p>
              <code className="block text-xs font-mono break-all text-muted-foreground">
                GET ...export-data?resource=sleep&from=2025-01-01&format=csv
              </code>
            </div>
            <p className="text-xs text-muted-foreground italic">
              The legacy <code className="font-mono">export-blood-pressure</code> endpoint still works too.
            </p>
          </div>
        </details>
      </CardContent>
    </Card>
  );
}
