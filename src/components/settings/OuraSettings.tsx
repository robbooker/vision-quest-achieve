import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useOuraMetrics } from '@/hooks/useOuraMetrics';
import { 
  Activity, 
  RefreshCw, 
  ExternalLink, 
  Check, 
  X,
  Moon,
  Eye,
  EyeOff,
  Copy,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export function OuraSettings() {
  const {
    isOuraConnected,
    isManualMode,
    ouraProfile,
    syncMetrics,
    connectOura,
    disconnectOura,
    toggleManualMode,
  } = useOuraMetrics();

  const [tokenInput, setTokenInput] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showSavedToken, setShowSavedToken] = useState(false);

  const handleCopyToken = async () => {
    if (!ouraProfile?.oura_access_token) return;
    try {
      await navigator.clipboard.writeText(ouraProfile.oura_access_token);
      toast.success('Oura token copied to clipboard');
    } catch {
      toast.error('Failed to copy token');
    }
  };

  const handleConnect = async () => {
    if (!tokenInput.trim()) return;
    setIsConnecting(true);
    try {
      await connectOura.mutateAsync(tokenInput.trim());
      setTokenInput('');
      // Trigger initial sync after connecting
      syncMetrics.mutate();
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (confirm('Are you sure you want to disconnect your Oura Ring?')) {
      await disconnectOura.mutateAsync();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Sleep & Biometrics
        </CardTitle>
        <CardDescription>
          Connect your Oura Ring for automatic sleep and readiness tracking, or log sleep manually.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Oura Ring Connection */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${isOuraConnected ? 'bg-green-500/10' : 'bg-muted'}`}>
                <Activity className={`h-5 w-5 ${isOuraConnected ? 'text-green-500' : 'text-muted-foreground'}`} />
              </div>
              <div>
                <p className="font-medium">Oura Ring</p>
                {isOuraConnected ? (
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="bg-green-500 text-xs">
                      <Check className="h-3 w-3 mr-1" />
                      Connected
                    </Badge>
                    {ouraProfile?.oura_connected_at && (
                      <span className="text-xs text-muted-foreground">
                        since {format(new Date(ouraProfile.oura_connected_at), 'MMM d, yyyy')}
                      </span>
                    )}
                  </div>
                ) : (
                  <Badge variant="secondary" className="text-xs">Not Connected</Badge>
                )}
              </div>
            </div>
            {isOuraConnected && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => syncMetrics.mutate()}
                  disabled={syncMetrics.isPending}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${syncMetrics.isPending ? 'animate-spin' : ''}`} />
                  Sync Now
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDisconnect}
                  className="text-destructive hover:text-destructive"
                >
                  <X className="h-4 w-4 mr-1" />
                  Disconnect
                </Button>
              </div>
            )}
          </div>

          {!isOuraConnected && (
            <div className="space-y-3 p-4 rounded-lg bg-muted/50">
              <div className="space-y-2">
                <Label htmlFor="oura-token">Personal Access Token</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="oura-token"
                      type={showToken ? 'text' : 'password'}
                      placeholder="Paste your Oura token here..."
                      value={tokenInput}
                      onChange={(e) => setTokenInput(e.target.value)}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowToken(!showToken)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <Button
                    onClick={handleConnect}
                    disabled={!tokenInput.trim() || isConnecting}
                  >
                    {isConnecting ? 'Connecting...' : 'Connect'}
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Get your Personal Access Token from the{' '}
                <a
                  href="https://cloud.ouraring.com/personal-access-tokens"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-1"
                >
                  Oura Developer Portal
                  <ExternalLink className="h-3 w-3" />
                </a>
              </p>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">or</span>
          </div>
        </div>

        {/* Manual Sleep Entry Toggle */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${isManualMode ? 'bg-indigo-500/10' : 'bg-muted'}`}>
              <Moon className={`h-5 w-5 ${isManualMode ? 'text-indigo-400' : 'text-muted-foreground'}`} />
            </div>
            <div>
              <p className="font-medium">Manual Sleep Logging</p>
              <p className="text-sm text-muted-foreground">
                Log your bedtime and wake time manually each morning
              </p>
            </div>
          </div>
          <Switch
            checked={isManualMode}
            onCheckedChange={(checked) => toggleManualMode.mutate(checked)}
            disabled={toggleManualMode.isPending}
          />
        </div>

        {/* Info about what data is tracked */}
        <div className="text-sm text-muted-foreground space-y-2 p-4 rounded-lg border border-dashed">
          <p className="font-medium text-foreground">What gets tracked:</p>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Oura:</strong> Sleep score, duration, readiness, resilience, HRV, and resting heart rate</li>
            <li><strong>Manual:</strong> Sleep duration and quality rating (no biometric data)</li>
          </ul>
          <p className="mt-3">
            This data feeds into your AI Daily Insight and P.R.I.M.E.D. Physical pillar analysis.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
