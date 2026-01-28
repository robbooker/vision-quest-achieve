import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useOuraMetrics } from '@/hooks/useOuraMetrics';
import { ManualSleepEntryDialog } from './ManualSleepEntryDialog';
import { 
  Zap, 
  RefreshCw, 
  Moon, 
  Heart, 
  Activity,
  AlertTriangle,
  Crown,
  Info,
  Settings,
  Pencil,
  Plus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function PerformanceAuditCard() {
  const navigate = useNavigate();
  const [manualSleepOpen, setManualSleepOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<typeof todayMetrics>(null);
  
  const {
    todayMetrics,
    isLoading,
    isOuraConnected,
    isManualMode,
    syncMetrics,
    formatSleepDuration,
    getReadinessTier,
    getResilienceColor,
    getRhrStatus,
  } = useOuraMetrics();

  const handleEditClick = () => {
    setEditEntry(todayMetrics);
    setManualSleepOpen(true);
  };

  const handleNewEntryClick = () => {
    setEditEntry(null);
    setManualSleepOpen(true);
  };

  const handleDialogClose = (open: boolean) => {
    setManualSleepOpen(open);
    if (!open) {
      setEditEntry(null);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            Performance Audit
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  // No connection and no manual mode - show setup prompt
  if (!isOuraConnected && !isManualMode) {
    return (
      <Card className="border-dashed">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            Performance Audit
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-6 text-center">
          <Activity className="h-8 w-8 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground mb-3">
            Connect Oura Ring or log sleep manually to track your biometric performance
          </p>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/settings')}
            >
              <Settings className="h-4 w-4 mr-2" />
              Connect Oura
            </Button>
            <Button 
              variant="default" 
              size="sm"
              onClick={handleNewEntryClick}
            >
              <Plus className="h-4 w-4 mr-2" />
              Log Sleep
            </Button>
          </div>
          <ManualSleepEntryDialog 
            open={manualSleepOpen} 
            onOpenChange={handleDialogClose}
            existingEntry={editEntry}
          />
        </CardContent>
      </Card>
    );
  }

  const metrics = todayMetrics;
  const readiness = getReadinessTier(metrics?.readiness_score ?? null);
  const rhrStatus = getRhrStatus(metrics?.resting_heart_rate ?? null, metrics?.rhr_baseline_14d ?? null);
  const resilienceColor = getResilienceColor(metrics?.resilience_level ?? null);

  // No data yet - show options for both Oura sync and manual entry
  if (!metrics) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              Performance Audit
            </CardTitle>
            {isOuraConnected && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => syncMetrics.mutate()}
                disabled={syncMetrics.isPending}
              >
                <RefreshCw className={`h-4 w-4 ${syncMetrics.isPending ? 'animate-spin' : ''}`} />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-6 text-center">
          <Moon className="h-8 w-8 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground mb-3">
            No sleep data for today yet
          </p>
          <div className="flex gap-2">
            {isOuraConnected && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => syncMetrics.mutate()}
                disabled={syncMetrics.isPending}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${syncMetrics.isPending ? 'animate-spin' : ''}`} />
                {syncMetrics.isPending ? 'Syncing...' : 'Sync Oura'}
              </Button>
            )}
            <Button 
              variant="default" 
              size="sm"
              onClick={handleNewEntryClick}
            >
              <Plus className="h-4 w-4 mr-2" />
              Log Manually
            </Button>
          </div>
          <ManualSleepEntryDialog 
            open={manualSleepOpen} 
            onOpenChange={handleDialogClose}
            existingEntry={editEntry}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              Performance Audit
            </CardTitle>
            {isOuraConnected && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => syncMetrics.mutate()}
                disabled={syncMetrics.isPending}
              >
                <RefreshCw className={`h-4 w-4 ${syncMetrics.isPending ? 'animate-spin' : ''}`} />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Three metric cards */}
          <div className="grid grid-cols-3 gap-3">
            {/* Readiness */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex flex-col items-center p-3 rounded-lg bg-muted/50 cursor-help">
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">Readiness</span>
                  <div className="flex items-center gap-1 mt-1">
                    {readiness.icon === '👑' && <Crown className="h-4 w-4 text-yellow-500" />}
                    <span className={`text-2xl font-bold ${readiness.color}`}>
                      {metrics?.readiness_score ?? '--'}
                    </span>
                  </div>
                  <Badge variant="outline" className={`mt-1 text-xs ${readiness.color}`}>
                    {readiness.tier}
                  </Badge>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                <p className="text-sm">
                  <strong>Readiness Score:</strong> Your overall capacity for performance today, 
                  based on sleep, recovery, and activity. 85+ means high cognitive bandwidth for complex work.
                </p>
              </TooltipContent>
            </Tooltip>

            {/* Resilience */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex flex-col items-center p-3 rounded-lg bg-muted/50 cursor-help">
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">Resilience</span>
                  <span className={`text-lg font-bold mt-1 capitalize ${resilienceColor}`}>
                    {metrics?.resilience_level ?? '--'}
                  </span>
                  <Badge variant="outline" className={`mt-1 text-xs ${resilienceColor}`}>
                    {metrics?.resilience_level ? 
                      (['exceptional', 'strong'].includes(metrics.resilience_level) ? 'High' :
                       ['solid', 'adequate'].includes(metrics.resilience_level) ? 'Good' : 'Low')
                      : '--'}
                  </Badge>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                <p className="text-sm">
                  <strong>Resilience Level:</strong> Your long-term recovery buffer. "Limited" means 
                  conservation mode is needed—avoid entering new high-stress positions.
                </p>
              </TooltipContent>
            </Tooltip>

            {/* RHR */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex flex-col items-center p-3 rounded-lg bg-muted/50 cursor-help">
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">RHR</span>
                  <div className="flex items-center gap-1 mt-1">
                    <Heart className={`h-4 w-4 ${rhrStatus.color}`} />
                    <span className={`text-2xl font-bold ${rhrStatus.color}`}>
                      {metrics?.resting_heart_rate ?? '--'}
                    </span>
                  </div>
                  <Badge variant="outline" className={`mt-1 text-xs ${rhrStatus.color}`}>
                    {rhrStatus.diff > 0 ? `+${rhrStatus.diff} bpm` : rhrStatus.status}
                  </Badge>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                <p className="text-sm">
                  <strong>Resting Heart Rate:</strong> Indicates cardiovascular recovery. Elevated RHR 
                  (+3 bpm above your baseline) suggests systemic stress, impairing focus and emotional regulation.
                </p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Sleep summary with Edit button */}
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30">
            <Moon className="h-4 w-4 text-indigo-400 flex-shrink-0" />
            <span className="text-sm flex-1">
              Last Night: <strong>{formatSleepDuration(metrics?.total_sleep_seconds ?? null)}</strong>
              {metrics?.sleep_score && (
                <> • Score: <strong>{metrics.sleep_score}</strong></>
              )}
              {metrics?.hrv_balance && (
                <> • HRV: <strong className={metrics.hrv_balance < 70 ? 'text-yellow-500' : ''}>{metrics.hrv_balance}</strong></>
              )}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2"
              onClick={handleEditClick}
            >
              <Pencil className="h-3 w-3 mr-1" />
              Edit
            </Button>
            <Badge variant="secondary" className="text-xs">
              {metrics?.source === 'oura' ? 'Oura' : 'Manual'}
            </Badge>
          </div>

          {/* Stress Alerts */}
          {metrics?.critical_deficit_alert && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/30 animate-pulse">
              <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-600 dark:text-red-400">
                  Critical Recovery Deficit
                </p>
                <p className="text-sm text-muted-foreground">
                  Both HRV strain and elevated RHR detected. High Trading Risk - stick to passive monitoring.
                </p>
              </div>
            </div>
          )}

          {!metrics?.critical_deficit_alert && metrics?.hrv_strain_alert && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
              <Info className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-yellow-600 dark:text-yellow-400">
                  Nervous System Strain
                </p>
                <p className="text-sm text-muted-foreground">
                  HRV below threshold. Emotional regulation may be lowered.
                </p>
              </div>
            </div>
          )}

          {!metrics?.critical_deficit_alert && !metrics?.hrv_strain_alert && metrics?.rhr_spike_alert && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
              <Heart className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-yellow-600 dark:text-yellow-400">
                  Elevated RHR
                </p>
                <p className="text-sm text-muted-foreground">
                  +{rhrStatus.diff} bpm above baseline. Systemic stress detected.
                </p>
              </div>
            </div>
          )}

          {/* Always show manual entry button for adding new entries */}
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
            onClick={handleNewEntryClick}
          >
            <Plus className="h-4 w-4 mr-2" />
            Log Sleep Manually
          </Button>
          
          <ManualSleepEntryDialog 
            open={manualSleepOpen} 
            onOpenChange={handleDialogClose}
            existingEntry={editEntry}
          />
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
