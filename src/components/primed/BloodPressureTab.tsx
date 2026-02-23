import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Heart, TrendingUp, TrendingDown, AlertTriangle, Download, Search, ChevronLeft, ChevronRight, Trash2, BarChart3, Clock, Activity,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer,
  BarChart, Bar, ScatterChart, Scatter, Cell, Legend, Area, ComposedChart,
} from 'recharts';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useBPResearch, classifyBP, categoryColor, TimeRange } from '@/hooks/useBPResearch';
import { useAuth } from '@/hooks/useAuth';

const TIME_RANGES: { value: TimeRange; label: string }[] = [
  { value: '7d', label: '7D' },
  { value: '30d', label: '30D' },
  { value: '90d', label: '90D' },
  { value: '6mo', label: '6M' },
  { value: '1yr', label: '1Y' },
  { value: 'all', label: 'All' },
];

const ZONE_COLORS = {
  normal: 'hsl(142, 71%, 45%)',
  elevated: 'hsl(48, 96%, 53%)',
  stage1: 'hsl(25, 95%, 53%)',
  stage2: 'hsl(0, 84%, 60%)',
};

export function BloodPressureTab() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const {
    isLoading, computed, timeRange, setTimeRange,
    showMovingAvg, setShowMovingAvg,
    searchQuery, setSearchQuery,
    logPage, setLogPage, logData,
  } = useBPResearch();

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    const { error } = await supabase.from('health_measurements').delete().eq('id', id);
    if (error) { toast.error('Failed to delete'); }
    else {
      toast.success('Reading deleted');
      queryClient.invalidateQueries({ queryKey: ['bp-research'] });
      queryClient.invalidateQueries({ queryKey: ['health-measurements'] });
    }
    setDeletingId(null);
  };

  const handleExport = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error('Not authenticated'); return; }
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/export-blood-pressure`,
        { headers: { Authorization: `Bearer ${session.access_token}`, apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY } }
      );
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `blood-pressure-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      a.click(); URL.revokeObjectURL(url);
      toast.success('CSV downloaded');
    } catch { toast.error('Export failed'); }
  };

  if (isLoading) {
    return <div className="space-y-4"><Skeleton className="h-32" /><Skeleton className="h-64" /><Skeleton className="h-48" /></div>;
  }

  if (!computed || computed.totalCount === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Heart className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
          <p className="text-lg font-medium">No blood pressure readings yet</p>
          <p className="text-sm text-muted-foreground mt-1">Log your first reading from the Dashboard tab.</p>
        </CardContent>
      </Card>
    );
  }

  const { latest, avg7, avg30, avg90, allTimeHigh, allTimeLow, totalCount, trendData, movingAvgData, distData, periodStats, scatterData, weeklyData, monthlyData, spikes, spikeThreshold } = computed;
  const latestCat = classifyBP(latest.systolic, latest.diastolic);

  return (
    <div className="space-y-6">
      {/* 1. Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Latest</p>
            <p className="text-2xl font-bold">{latest.systolic}/{latest.diastolic}</p>
            <Badge className={`mt-1 text-xs ${categoryColor(latestCat)}`}>{latestCat}</Badge>
            <p className="text-xs text-muted-foreground mt-1">{format(new Date(latest.measured_at), 'M/d h:mm a')}</p>
          </CardContent>
        </Card>
        {[
          { label: '7-Day Avg', data: avg7 },
          { label: '30-Day Avg', data: avg30 },
          { label: '90-Day Avg', data: avg90 },
        ].map(({ label, data }) => (
          <Card key={label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">{label}</p>
              <p className="text-2xl font-bold">{data ? `${data.sys}/${data.dia}` : '—'}</p>
            </CardContent>
          </Card>
        ))}
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><TrendingUp className="h-3 w-3" /> All-Time High</p>
            <p className="text-2xl font-bold text-destructive">{allTimeHigh.systolic}/{allTimeHigh.diastolic}</p>
            <p className="text-xs text-muted-foreground">{format(new Date(allTimeHigh.measured_at), 'M/d/yy')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><TrendingDown className="h-3 w-3" /> All-Time Low</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{allTimeLow.systolic}/{allTimeLow.diastolic}</p>
            <p className="text-xs text-muted-foreground">{format(new Date(allTimeLow.measured_at), 'M/d/yy')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Total count + Export */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{totalCount} total readings</p>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />Export CSV
        </Button>
      </div>

      {/* 2. Trend Chart */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4" /> Blood Pressure Trends
            </CardTitle>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm">
                <Switch checked={showMovingAvg} onCheckedChange={setShowMovingAvg} />
                <span className="text-muted-foreground">Moving Avg</span>
              </div>
              <div className="flex gap-1">
                {TIME_RANGES.map(r => (
                  <Button key={r.value} variant={timeRange === r.value ? 'default' : 'ghost'} size="sm" className="h-7 px-2 text-xs"
                    onClick={() => setTimeRange(r.value)}>{r.label}</Button>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={trendData.map((d, i) => ({ ...d, ...(showMovingAvg ? movingAvgData[i] : {}) }))}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis domain={[50, 180]} tick={{ fontSize: 11 }} />
              <Tooltip content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload;
                return (
                  <div className="bg-popover border rounded-lg p-3 shadow-lg text-sm">
                    <p className="font-medium">{d.fullDate || d.date}</p>
                    <p>Systolic: <span className="font-bold">{d.systolic}</span></p>
                    <p>Diastolic: <span className="font-bold">{d.diastolic}</span></p>
                    {d.sysMA && <p className="text-muted-foreground">MA: {d.sysMA}/{d.diaMA}</p>}
                  </div>
                );
              }} />
              <ReferenceLine y={120} stroke={ZONE_COLORS.normal} strokeDasharray="5 5" label={{ value: '120', position: 'right', fontSize: 10 }} />
              <ReferenceLine y={80} stroke={ZONE_COLORS.normal} strokeDasharray="5 5" label={{ value: '80', position: 'right', fontSize: 10 }} />
              <ReferenceLine y={140} stroke={ZONE_COLORS.stage2} strokeDasharray="5 5" label={{ value: '140', position: 'right', fontSize: 10 }} />
              <ReferenceLine y={90} stroke={ZONE_COLORS.stage1} strokeDasharray="5 5" label={{ value: '90', position: 'right', fontSize: 10 }} />
              <Line type="monotone" dataKey="systolic" stroke="hsl(0, 84%, 60%)" strokeWidth={2} dot={{ r: 3 }} name="Systolic" />
              <Line type="monotone" dataKey="diastolic" stroke="hsl(217, 91%, 60%)" strokeWidth={2} dot={{ r: 3 }} name="Diastolic" />
              {showMovingAvg && (
                <>
                  <Line type="monotone" dataKey="sysMA" stroke="hsl(0, 84%, 60%)" strokeWidth={1} strokeDasharray="4 4" dot={false} name="Sys MA" />
                  <Line type="monotone" dataKey="diaMA" stroke="hsl(217, 91%, 60%)" strokeWidth={1} strokeDasharray="4 4" dot={false} name="Dia MA" />
                </>
              )}
              <Legend />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 3. Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" /> Category Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={distData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="bg-popover border rounded-lg p-2 shadow-lg text-sm">
                      <p className="font-medium">{d.name}</p>
                      <p>{d.count} readings ({d.pct}%)</p>
                    </div>
                  );
                }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {distData.map((entry, i) => (
                    <Cell key={i} fill={
                      entry.name === 'Normal' ? ZONE_COLORS.normal :
                      entry.name === 'Elevated' ? ZONE_COLORS.elevated :
                      entry.name === 'Stage 1' ? ZONE_COLORS.stage1 : ZONE_COLORS.stage2
                    } />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex gap-3 mt-2 justify-center flex-wrap">
              {distData.map(d => (
                <span key={d.name} className="text-xs text-muted-foreground">{d.name}: {d.pct}%</span>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 4. Time of Day */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" /> Time-of-Day Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis type="number" dataKey="hour" domain={[5, 23]} tick={{ fontSize: 11 }}
                  tickFormatter={h => `${h > 12 ? h - 12 : h}${h >= 12 ? 'p' : 'a'}`} />
                <YAxis domain={[50, 180]} tick={{ fontSize: 11 }} />
                <Tooltip content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="bg-popover border rounded-lg p-2 shadow-lg text-sm">
                      <p className="font-medium">{d.date}</p>
                      <p>Sys: {d.systolic} / Dia: {d.diastolic}</p>
                    </div>
                  );
                }} />
                <ReferenceLine y={120} stroke={ZONE_COLORS.normal} strokeDasharray="3 3" />
                <Scatter data={scatterData} fill="hsl(0, 84%, 60%)" name="Systolic">
                  {scatterData.map((_, i) => <Cell key={i} fill="hsl(0, 84%, 60%)" />)}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-3 gap-2 mt-3">
              {periodStats.map(p => (
                <div key={p.period} className="text-center p-2 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">{p.period}</p>
                  <p className="font-bold text-sm">{p.avgSys && p.avgDia ? `${p.avgSys}/${p.avgDia}` : '—'}</p>
                  <p className="text-xs text-muted-foreground">{p.count} readings</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 5. Weekly/Monthly Averages */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Weekly & Monthly Averages</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Weekly Averages</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={weeklyData.slice(-12)}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="week" tick={{ fontSize: 10 }} />
                  <YAxis domain={[50, 160]} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="avgSys" fill="hsl(0, 84%, 60%)" name="Avg Systolic" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="avgDia" fill="hsl(217, 91%, 60%)" name="Avg Diastolic" radius={[2, 2, 0, 0]} />
                  <Legend />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">Monthly Averages</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={monthlyData.slice(-12)}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                  <YAxis domain={[50, 160]} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="avgSys" fill="hsl(0, 84%, 60%)" name="Avg Systolic" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="avgDia" fill="hsl(217, 91%, 60%)" name="Avg Diastolic" radius={[2, 2, 0, 0]} />
                  <Legend />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 6. Spike Detector */}
      {spikes.length > 0 && (
        <Card className="border-destructive/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" /> Spike Detector
              <Badge variant="destructive" className="text-xs">{spikes.length} spike{spikes.length > 1 ? 's' : ''}</Badge>
            </CardTitle>
            <p className="text-xs text-muted-foreground">Readings above {spikeThreshold} mmHg systolic (&gt;1.5 SD from your mean)</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {spikes.slice(0, 10).map(s => (
                <div key={s.id} className="flex items-center justify-between p-2 rounded-lg bg-destructive/5">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-destructive">{s.systolic}/{s.diastolic}</span>
                    <span className="text-sm text-muted-foreground">{format(new Date(s.measured_at), 'MMM d, yyyy h:mm a')}</span>
                  </div>
                  {s.notes && <span className="text-xs text-muted-foreground truncate max-w-[200px]">{s.notes}</span>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 7. Full Reading Log */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-base">All Readings</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search notes or dates..." value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setLogPage(0); }}
                className="pl-9 h-9" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Systolic</TableHead>
                  <TableHead>Diastolic</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logData.items.map(r => {
                  const cat = classifyBP(r.systolic, r.diastolic);
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="text-sm">{format(new Date(r.measured_at), 'MMM d, yyyy h:mm a')}</TableCell>
                      <TableCell className="font-medium">{r.systolic}</TableCell>
                      <TableCell className="font-medium">{r.diastolic}</TableCell>
                      <TableCell><Badge className={`text-xs ${categoryColor(cat)}`}>{cat}</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{r.notes || '—'}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-7 w-7" disabled={deletingId === r.id}
                          onClick={() => handleDelete(r.id)}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {logData.items.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No readings match your search.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {logData.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Page {logPage + 1} of {logData.totalPages} ({logData.totalCount} readings)
              </p>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" disabled={logPage === 0} onClick={() => setLogPage(p => p - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" disabled={logPage >= logData.totalPages - 1} onClick={() => setLogPage(p => p + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
