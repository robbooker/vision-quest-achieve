import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Trash2, FileText, Calendar, Building2, Sparkles, RefreshCw, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";
import { useBloodwork, Biomarker, BloodworkReport } from "@/hooks/useBloodwork";
import { BloodworkUploadDialog } from "./BloodworkUploadDialog";
import { BloodworkTrendsChart } from "./BloodworkTrendsChart";

interface BloodworkDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  lipid_panel: 'Lipid Panel',
  metabolic: 'Metabolic Panel',
  cbc: 'Complete Blood Count',
  thyroid: 'Thyroid',
  vitamins: 'Vitamins & Minerals',
  liver: 'Liver Function',
  kidney: 'Kidney Function',
  hormones: 'Hormones',
  inflammation: 'Inflammation',
  other: 'Other',
};

const CATEGORY_ORDER = [
  'lipid_panel',
  'metabolic',
  'cbc',
  'thyroid',
  'vitamins',
  'liver',
  'kidney',
  'hormones',
  'inflammation',
  'other',
];

export function BloodworkDetailSheet({ open, onOpenChange }: BloodworkDetailSheetProps) {
  const { reports, latestReport, deleteReport, isDeleting, reanalyzeReport, isReanalyzing } = useBloodwork();

  const groupBiomarkers = (biomarkers: Biomarker[]) => {
    const grouped: Record<string, Biomarker[]> = {};
    
    biomarkers.forEach((biomarker) => {
      const category = biomarker.category || 'other';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(biomarker);
    });

    return CATEGORY_ORDER
      .filter(cat => grouped[cat]?.length > 0)
      .map(cat => ({ category: cat, biomarkers: grouped[cat] }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return 'text-green-500';
      case 'high': return 'text-red-500';
      case 'low': return 'text-yellow-500';
      default: return 'text-muted-foreground';
    }
  };

  const getRangeProgress = (biomarker: Biomarker) => {
    if (!biomarker.reference_low || !biomarker.reference_high || typeof biomarker.value !== 'number') {
      return null;
    }
    
    const range = biomarker.reference_high - biomarker.reference_low;
    const position = ((biomarker.value - biomarker.reference_low) / range) * 100;
    return Math.max(0, Math.min(100, position));
  };

  const handleDelete = (reportId: string) => {
    if (confirm('Are you sure you want to delete this report?')) {
      deleteReport(reportId);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Bloodwork Reports
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-8rem)] mt-4 pr-4">
          <div className="space-y-6">
            {/* Upload button */}
            <BloodworkUploadDialog
              trigger={
                <Button variant="outline" className="w-full">
                  Upload New Report
                </Button>
              }
            />

            {/* Trends Chart */}
            {reports && reports.length > 1 && (
              <BloodworkTrendsChart reports={reports} />
            )}

            {/* Latest Report Details */}
            {latestReport && (
              <>
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Latest Report</CardTitle>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => reanalyzeReport(latestReport.id)}
                          disabled={isReanalyzing}
                          title="Re-analyze with AI"
                        >
                          <RefreshCw className={`h-4 w-4 ${isReanalyzing ? 'animate-spin' : ''}`} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleDelete(latestReport.id)}
                          disabled={isDeleting}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      {latestReport.lab_name && (
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {latestReport.lab_name}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(latestReport.report_date), 'MMM d, yyyy')}
                      </span>
                    </div>
                  </CardHeader>
                </Card>

                {/* Missing Analysis Warning */}
                {latestReport.biomarkers.length === 0 && !latestReport.ai_insights && (
                  <Card className="border-yellow-500/50 bg-yellow-500/5">
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Analysis Pending</p>
                          <p className="text-xs text-muted-foreground">
                            This report hasn't been analyzed yet. Click the refresh button above to analyze it with AI.
                          </p>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => reanalyzeReport(latestReport.id)}
                            disabled={isReanalyzing}
                          >
                            <RefreshCw className={`h-4 w-4 mr-2 ${isReanalyzing ? 'animate-spin' : ''}`} />
                            {isReanalyzing ? 'Analyzing...' : 'Analyze Now'}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* AI Insights */}
                {latestReport.ai_insights && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        AI Health Insights
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown>{latestReport.ai_insights}</ReactMarkdown>
                    </CardContent>
                  </Card>
                )}

                {/* Biomarkers by Category */}
                {groupBiomarkers(latestReport.biomarkers).map(({ category, biomarkers }) => (
                  <Card key={category}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">
                        {CATEGORY_LABELS[category] || category}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {biomarkers.map((biomarker, idx) => {
                        const progress = getRangeProgress(biomarker);
                        
                        return (
                          <div key={idx}>
                            <div className="flex items-center justify-between">
                              <span className="text-sm">{biomarker.name}</span>
                              <div className="flex items-center gap-2">
                                <span className={`font-medium ${getStatusColor(biomarker.status)}`}>
                                  {biomarker.value} {biomarker.unit}
                                </span>
                                <Badge
                                  variant="outline"
                                  className={`text-xs capitalize ${
                                    biomarker.status === 'normal' ? 'border-green-500/50' :
                                    biomarker.status === 'high' ? 'border-red-500/50' :
                                    biomarker.status === 'low' ? 'border-yellow-500/50' : ''
                                  }`}
                                >
                                  {biomarker.status}
                                </Badge>
                              </div>
                            </div>
                            
                            {biomarker.reference_low !== null && biomarker.reference_high !== null && (
                              <div className="mt-1">
                                <div className="relative">
                                  <Progress value={progress ?? 50} className="h-1.5" />
                                  {progress !== null && (
                                    <div
                                      className="absolute top-0 w-1 h-1.5 bg-foreground rounded-full"
                                      style={{ left: `${progress}%`, transform: 'translateX(-50%)' }}
                                    />
                                  )}
                                </div>
                                <div className="flex justify-between text-xs text-muted-foreground mt-0.5">
                                  <span>{biomarker.reference_low}</span>
                                  <span>{biomarker.reference_high}</span>
                                </div>
                              </div>
                            )}
                            
                            {idx < biomarkers.length - 1 && <Separator className="mt-3" />}
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                ))}
              </>
            )}

            {/* Previous Reports */}
            {reports && reports.length > 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Previous Reports</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {reports.slice(1).map((report) => (
                    <div
                      key={report.id}
                      className="flex items-center justify-between p-2 rounded-md bg-muted/50"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {report.lab_name || 'Lab Report'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(report.report_date), 'MMM d, yyyy')} · {report.biomarkers.length} markers
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleDelete(report.id)}
                        disabled={isDeleting}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Empty state */}
            {(!reports || reports.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No bloodwork reports yet.</p>
                <p className="text-sm">Upload your first lab results to get started.</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
