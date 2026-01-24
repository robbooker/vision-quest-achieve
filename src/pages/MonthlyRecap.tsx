import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar, 
  FileText, 
  Target, 
  CheckCircle2, 
  Clock, 
  Camera,
  Sparkles,
  Loader2,
  ChevronRight,
  Edit,
  Eye
} from 'lucide-react';
import { 
  useRecapPreviewStats, 
  useGenerateRecap, 
  useRecap, 
  useRecaps,
  getAvailableMonths,
  type RecapTone 
} from '@/hooks/useMonthlyRecap';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { RecapPreview } from '@/components/recap/RecapPreview';
import { RecapEditor } from '@/components/recap/RecapEditor';

const availableMonths = getAvailableMonths(12);

const toneOptions: Array<{ value: RecapTone; label: string; description: string }> = [
  { value: 'balanced', label: 'Balanced', description: 'Celebrates wins while noting growth areas' },
  { value: 'witty', label: 'Witty', description: 'Playful, self-aware, with gentle humor' },
  { value: 'reflective', label: 'Reflective', description: 'Thoughtful, introspective, meaning-focused' },
  { value: 'brutally_honest', label: 'Brutally Honest', description: 'Direct, unsparing, no sugarcoating' },
];

export default function MonthlyRecap() {
  const [selectedMonth, setSelectedMonth] = useState(availableMonths[0]?.value || '');
  const [selectedTone, setSelectedTone] = useState<RecapTone>('balanced');
  const [activeTab, setActiveTab] = useState<'generate' | 'preview' | 'edit'>('generate');
  
  const { data: previewStats, isLoading: statsLoading } = useRecapPreviewStats(selectedMonth);
  const { data: existingRecap, isLoading: recapLoading } = useRecap(selectedMonth);
  const { data: allRecaps } = useRecaps();
  const { mutate: generateRecap, isPending: isGenerating, progress, resetProgress } = useGenerateRecap();

  const handleGenerate = () => {
    resetProgress();
    generateRecap(
      { month: selectedMonth, tone: selectedTone },
      {
        onSuccess: () => {
          setActiveTab('preview');
        },
      }
    );
  };

  const handleViewRecap = (month: string) => {
    setSelectedMonth(month);
    setActiveTab('preview');
  };

  return (
    <DashboardLayout>
      <div className="container max-w-6xl mx-auto p-4 md:p-6 space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl md:text-3xl font-bold">Monthly Recap</h1>
          <p className="text-muted-foreground">
            Transform your month's data into a compelling narrative
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="generate">Generate</TabsTrigger>
            <TabsTrigger value="preview" disabled={!existingRecap}>Preview</TabsTrigger>
            <TabsTrigger value="edit" disabled={!existingRecap}>Edit</TabsTrigger>
          </TabsList>

          <TabsContent value="generate" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Month Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Select Month
                  </CardTitle>
                  <CardDescription>
                    Choose which month to generate a recap for
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a month" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableMonths.map((month) => (
                        <SelectItem key={month.value} value={month.value}>
                          {month.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {existingRecap && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      Recap already exists for this month
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Tone Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Edit className="h-5 w-5" />
                    Writing Tone
                  </CardTitle>
                  <CardDescription>
                    Choose the voice for your recap
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2">
                    {toneOptions.map((tone) => (
                      <button
                        key={tone.value}
                        onClick={() => setSelectedTone(tone.value)}
                        className={cn(
                          "flex flex-col items-start gap-1 p-3 rounded-lg border text-left transition-colors",
                          selectedTone === tone.value
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <span className="font-medium">{tone.label}</span>
                        <span className="text-xs text-muted-foreground">{tone.description}</span>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Preview Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Data Preview</CardTitle>
                <CardDescription>
                  What we'll use to generate your recap
                </CardDescription>
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {[...Array(6)].map((_, i) => (
                      <Skeleton key={i} className="h-20" />
                    ))}
                  </div>
                ) : previewStats ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <StatCard
                      icon={<FileText className="h-4 w-4" />}
                      label="Journal Entries"
                      value={previewStats.journalEntries}
                    />
                    <StatCard
                      icon={<Target className="h-4 w-4" />}
                      label="Goals Tracked"
                      value={previewStats.goals}
                    />
                    <StatCard
                      icon={<CheckCircle2 className="h-4 w-4" />}
                      label="Habit Logs"
                      value={previewStats.habitLogs}
                    />
                    <StatCard
                      icon={<Clock className="h-4 w-4" />}
                      label="Focus Minutes"
                      value={previewStats.focusMinutes}
                    />
                    <StatCard
                      icon={<CheckCircle2 className="h-4 w-4" />}
                      label="Tasks Done"
                      value={previewStats.tasksCompleted}
                    />
                    <StatCard
                      icon={<Camera className="h-4 w-4" />}
                      label="Photos"
                      value={previewStats.photos}
                    />
                  </div>
                ) : (
                  <p className="text-muted-foreground">Select a month to see available data</p>
                )}

                {previewStats && !previewStats.hasEnoughData && (
                  <div className="mt-4 p-3 rounded-lg bg-muted">
                    <p className="text-sm text-muted-foreground">
                      Limited data for this month. Your recap will focus on what you did track.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Generation Progress or Button */}
            {isGenerating ? (
              <Card>
                <CardContent className="py-8">
                  <div className="space-y-4">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span className="font-medium">Generating your recap...</span>
                    </div>
                    <div className="space-y-2">
                      {progress.map((step, i) => (
                        <div
                          key={i}
                          className={cn(
                            "flex items-center gap-2 text-sm",
                            i === progress.length - 1 ? "text-foreground" : "text-muted-foreground"
                          )}
                        >
                          {i === progress.length - 1 && !step.includes('ready') ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-3 w-3 text-green-500" />
                          )}
                          {step}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="flex justify-center">
                <Button
                  size="lg"
                  onClick={handleGenerate}
                  className="gap-2"
                  disabled={!selectedMonth}
                >
                  <Sparkles className="h-4 w-4" />
                  {existingRecap ? 'Regenerate My Month in Review' : 'Generate My Month in Review'}
                </Button>
              </div>
            )}

            {/* Previous Recaps */}
            {allRecaps && allRecaps.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Previous Recaps</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {allRecaps.slice(0, 6).map((recap) => (
                      <button
                        key={recap.id}
                        onClick={() => handleViewRecap(format(new Date(recap.month), 'yyyy-MM'))}
                        className="w-full flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="font-medium">
                              {format(new Date(recap.month), 'MMMM yyyy')}
                            </p>
                            {recap.headline && (
                              <p className="text-sm text-muted-foreground line-clamp-1">
                                {recap.headline}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={recap.status === 'published' ? 'default' : 'secondary'}>
                            {recap.status}
                          </Badge>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="preview">
            {existingRecap && <RecapPreview recap={existingRecap} />}
          </TabsContent>

          <TabsContent value="edit">
            {existingRecap && (
              <RecapEditor 
                recap={existingRecap} 
                onSave={() => setActiveTab('preview')} 
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

function StatCard({ 
  icon, 
  label, 
  value 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: number;
}) {
  return (
    <div className="flex flex-col items-center p-4 rounded-lg border bg-card">
      <div className="text-muted-foreground mb-2">{icon}</div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground text-center">{label}</div>
    </div>
  );
}
