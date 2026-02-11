import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useBloodwork } from '@/hooks/useBloodwork';
import { BloodworkUploadDialog } from '@/components/bloodwork/BloodworkUploadDialog';
import { BloodworkDetailSheet } from '@/components/bloodwork/BloodworkDetailSheet';
import { BloodworkTrendsChart } from '@/components/bloodwork/BloodworkTrendsChart';
import { format, parseISO } from 'date-fns';
import { FileText, TrendingUp, ChevronRight, AlertCircle, RefreshCw, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';

export function PhysicalBloodworkSection() {
  const { reports, isLoading, reanalyzeReport, isReanalyzing } = useBloodwork();
  const [detailOpen, setDetailOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-16" />
        <Skeleton className="h-24" />
      </div>
    );
  }

  const latestReport = reports?.[0];
  const keyBiomarkers = latestReport?.biomarkers?.slice(0, 4) || [];

  return (
    <div className="space-y-4">
      {/* Upload Button - uses trigger pattern */}
      <BloodworkUploadDialog />

      {reports && reports.length > 0 ? (
        <>
          {/* Latest Report Summary */}
          <div 
            className="bg-muted/50 rounded-lg p-4 cursor-pointer hover:bg-muted/70 transition-colors"
            onClick={() => setDetailOpen(true)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <div>
                  <p className="font-medium text-sm">
                    {latestReport.lab_name || 'Lab Report'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(parseISO(latestReport.report_date), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>

            {/* Key Biomarkers or Analysis Needed */}
            {keyBiomarkers.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {keyBiomarkers.map((marker: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground truncate">{marker.name}</span>
                    <Badge 
                      variant={marker.status === 'normal' ? 'outline' : marker.status === 'high' ? 'destructive' : 'secondary'}
                      className="text-[10px]"
                    >
                      {marker.value} {marker.unit}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-yellow-600 dark:text-yellow-500">
                <AlertCircle className="h-3 w-3" />
                <span>Needs analysis - tap to view</span>
              </div>
            )}
          </div>

          {/* AI Insights Preview */}
          {latestReport?.ai_insights && (
            <div className="bg-muted/30 rounded-lg p-3 border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium">AI Insights</span>
              </div>
              <div className="text-xs text-muted-foreground line-clamp-3 prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{latestReport.ai_insights.split('\n').slice(0, 2).join('\n')}</ReactMarkdown>
              </div>
              <Button 
                variant="link" 
                size="sm" 
                className="h-auto p-0 mt-1"
                onClick={() => setDetailOpen(true)}
              >
                Read full analysis →
              </Button>
            </div>
          )}

          {/* Re-analyze button for reports without analysis */}
          {latestReport && !latestReport.ai_insights && (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={(e) => {
                e.stopPropagation();
                console.log('Triggering reanalyze for report:', latestReport.id, latestReport.report_date);
                reanalyzeReport(latestReport.id);
              }}
              disabled={isReanalyzing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isReanalyzing ? 'animate-spin' : ''}`} />
              {isReanalyzing ? 'Analyzing (may take 30s)...' : 'Analyze with AI'}
            </Button>
          )}

          {/* Trends - inline card if multiple reports */}
          {reports.length >= 2 && (
            <BloodworkTrendsChart reports={reports} />
          )}

          {/* View All Reports Button */}
          <Button 
            variant="ghost" 
            size="sm"
            className="w-full justify-between"
            onClick={() => setDetailOpen(true)}
          >
            <span className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              View All Reports
            </span>
            <Badge variant="secondary">{reports.length} report{reports.length !== 1 ? 's' : ''}</Badge>
          </Button>
        </>
      ) : (
        <div className="text-center py-4 text-muted-foreground">
          <p className="text-sm">No bloodwork reports yet.</p>
          <p className="text-xs mt-1">Upload a lab PDF to get started.</p>
        </div>
      )}

      {/* Detail Sheet */}
      <BloodworkDetailSheet 
        open={detailOpen} 
        onOpenChange={setDetailOpen} 
      />
    </div>
  );
}
