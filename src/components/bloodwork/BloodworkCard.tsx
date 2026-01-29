import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Droplets, ChevronRight, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { format } from "date-fns";
import { useBloodwork, Biomarker } from "@/hooks/useBloodwork";
import { BloodworkUploadDialog } from "./BloodworkUploadDialog";

interface BloodworkCardProps {
  onViewDetails?: () => void;
}

export function BloodworkCard({ onViewDetails }: BloodworkCardProps) {
  const { latestReport, isLoading, reports } = useBloodwork();

  // Key biomarkers to highlight
  const keyBiomarkerNames = [
    'Total Cholesterol',
    'Glucose',
    'Hemoglobin A1c',
    'Vitamin D',
    'TSH',
    'HDL Cholesterol',
    'LDL Cholesterol',
  ];

  const getKeyBiomarkers = (biomarkers: Biomarker[]) => {
    return biomarkers
      .filter(b => keyBiomarkerNames.some(name => 
        b.name.toLowerCase().includes(name.toLowerCase())
      ))
      .slice(0, 4);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'high': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'low': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'high': return <TrendingUp className="h-3 w-3" />;
      case 'low': return <TrendingDown className="h-3 w-3" />;
      default: return <Minus className="h-3 w-3" />;
    }
  };

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-5 w-32 bg-muted rounded" />
        </CardHeader>
        <CardContent>
          <div className="h-20 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  if (!latestReport || latestReport.biomarkers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Droplets className="h-4 w-4 text-red-500" />
            Bloodwork
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Upload your lab results to track biomarkers and get AI-powered health insights.
          </p>
          <BloodworkUploadDialog />
        </CardContent>
      </Card>
    );
  }

  const keyBiomarkers = getKeyBiomarkers(latestReport.biomarkers);
  const totalBiomarkers = latestReport.biomarkers.length;
  const outOfRange = latestReport.biomarkers.filter(b => b.status === 'high' || b.status === 'low').length;

  return (
    <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={onViewDetails}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Droplets className="h-4 w-4 text-red-500" />
            Bloodwork
          </CardTitle>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
        <p className="text-xs text-muted-foreground">
          {latestReport.lab_name || 'Lab Report'} · {format(new Date(latestReport.report_date), 'MMM d, yyyy')}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Summary badges */}
        <div className="flex gap-2">
          <Badge variant="secondary" className="text-xs">
            {totalBiomarkers} markers
          </Badge>
          {outOfRange > 0 && (
            <Badge variant="outline" className="text-xs border-yellow-500/50 text-yellow-500">
              {outOfRange} out of range
            </Badge>
          )}
          {reports && reports.length > 1 && (
            <Badge variant="outline" className="text-xs">
              {reports.length} reports
            </Badge>
          )}
        </div>

        {/* Key biomarkers */}
        <div className="grid grid-cols-2 gap-2">
          {keyBiomarkers.map((biomarker) => (
            <div
              key={biomarker.name}
              className="flex items-center justify-between p-2 rounded-md bg-muted/50"
            >
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground truncate">
                  {biomarker.name.replace(/,.*$/, '')}
                </p>
                <p className="text-sm font-medium">
                  {biomarker.value} <span className="text-xs text-muted-foreground">{biomarker.unit}</span>
                </p>
              </div>
              <Badge variant="outline" className={`ml-2 ${getStatusColor(biomarker.status)}`}>
                {getStatusIcon(biomarker.status)}
              </Badge>
            </div>
          ))}
        </div>

        {/* View details button */}
        <Button variant="ghost" size="sm" className="w-full" onClick={(e) => {
          e.stopPropagation();
          onViewDetails?.();
        }}>
          View All Biomarkers
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </CardContent>
    </Card>
  );
}
