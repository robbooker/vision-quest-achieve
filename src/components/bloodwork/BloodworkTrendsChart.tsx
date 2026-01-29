import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceArea } from "recharts";
import { format } from "date-fns";
import { BloodworkReport, Biomarker } from "@/hooks/useBloodwork";

interface BloodworkTrendsChartProps {
  reports: BloodworkReport[];
}

export function BloodworkTrendsChart({ reports }: BloodworkTrendsChartProps) {
  // Get all unique biomarker names that appear in multiple reports
  const trackableBiomarkers = useMemo(() => {
    const biomarkerCounts: Record<string, number> = {};
    
    reports.forEach(report => {
      report.biomarkers.forEach(b => {
        if (typeof b.value === 'number') {
          biomarkerCounts[b.name] = (biomarkerCounts[b.name] || 0) + 1;
        }
      });
    });

    return Object.entries(biomarkerCounts)
      .filter(([, count]) => count >= 2)
      .map(([name]) => name)
      .sort();
  }, [reports]);

  const [selectedBiomarker, setSelectedBiomarker] = useState<string>(
    trackableBiomarkers[0] || ''
  );

  // Build chart data for the selected biomarker
  const chartData = useMemo(() => {
    if (!selectedBiomarker) return { data: [], referenceRange: null };

    const data: Array<{
      date: string;
      formattedDate: string;
      value: number;
    }> = [];

    let referenceRange: { low: number; high: number } | null = null;

    // Sort reports by date (oldest first for chart)
    const sortedReports = [...reports].sort(
      (a, b) => new Date(a.report_date).getTime() - new Date(b.report_date).getTime()
    );

    sortedReports.forEach(report => {
      const biomarker = report.biomarkers.find(b => b.name === selectedBiomarker);
      if (biomarker && typeof biomarker.value === 'number') {
        data.push({
          date: report.report_date,
          formattedDate: format(new Date(report.report_date), 'MMM yyyy'),
          value: biomarker.value,
        });

        // Capture reference range from the most recent report
        if (biomarker.reference_low !== null && biomarker.reference_high !== null) {
          referenceRange = {
            low: biomarker.reference_low,
            high: biomarker.reference_high,
          };
        }
      }
    });

    return { data, referenceRange };
  }, [reports, selectedBiomarker]);

  // Get unit for the selected biomarker
  const unit = useMemo(() => {
    for (const report of reports) {
      const biomarker = report.biomarkers.find(b => b.name === selectedBiomarker);
      if (biomarker) return biomarker.unit;
    }
    return '';
  }, [reports, selectedBiomarker]);

  if (trackableBiomarkers.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Biomarker Trends</CardTitle>
          <Select value={selectedBiomarker} onValueChange={setSelectedBiomarker}>
            <SelectTrigger className="w-[180px] h-8">
              <SelectValue placeholder="Select biomarker" />
            </SelectTrigger>
            <SelectContent>
              {trackableBiomarkers.map(name => (
                <SelectItem key={name} value={name}>
                  {name.length > 25 ? name.substring(0, 25) + '...' : name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {chartData.data.length >= 2 ? (
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData.data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="formattedDate"
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                  domain={['auto', 'auto']}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-popover border rounded-md p-2 shadow-md">
                          <p className="text-sm font-medium">
                            {payload[0].payload.formattedDate}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {payload[0].value} {unit}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                
                {/* Reference range shaded area */}
                {chartData.referenceRange && (
                  <ReferenceArea
                    y1={chartData.referenceRange.low}
                    y2={chartData.referenceRange.high}
                    fill="hsl(var(--primary))"
                    fillOpacity={0.1}
                  />
                )}
                
                {/* Reference lines */}
                {chartData.referenceRange && (
                  <>
                    <ReferenceLine
                      y={chartData.referenceRange.low}
                      stroke="hsl(var(--muted-foreground))"
                      strokeDasharray="3 3"
                    />
                    <ReferenceLine
                      y={chartData.referenceRange.high}
                      stroke="hsl(var(--muted-foreground))"
                      strokeDasharray="3 3"
                    />
                  </>
                )}
                
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">
            Need at least 2 reports to show trends
          </p>
        )}
        
        {chartData.referenceRange && (
          <p className="text-xs text-muted-foreground text-center mt-2">
            Shaded area shows normal range ({chartData.referenceRange.low} - {chartData.referenceRange.high} {unit})
          </p>
        )}
      </CardContent>
    </Card>
  );
}
