import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3 } from 'lucide-react';
import { useBirdwatching } from '@/hooks/useBirdwatching';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function SeasonalTimeline() {
  const { seasonalData, lifeList } = useBirdwatching();

  if (lifeList.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold mb-2">No Seasonal Data Yet</h3>
          <p className="text-sm text-muted-foreground">
            Log sightings throughout the year to see migration and seasonal patterns!
          </p>
        </CardContent>
      </Card>
    );
  }

  // Sort by most active species first
  const sortedData = [...seasonalData].sort((a, b) => {
    const aTotal = a.months.reduce((sum, m) => sum + m, 0);
    const bTotal = b.months.reduce((sum, m) => sum + m, 0);
    return bTotal - aTotal;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Seasonal Timeline
        </CardTitle>
        <CardDescription>
          See when each species has been spotted throughout the year
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr>
                <th className="text-left py-2 px-2 font-medium text-sm">Species</th>
                {MONTHS.map(month => (
                  <th key={month} className="text-center py-2 px-1 font-medium text-xs text-muted-foreground">
                    {month}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedData.map(({ species, months }) => (
                <tr key={species} className="border-t">
                  <td className="py-2 px-2 font-medium text-sm">{species}</td>
                  {months.map((count, monthIdx) => (
                    <td key={monthIdx} className="text-center py-2 px-1">
                      {count > 0 ? (
                        <div
                          className="w-6 h-6 mx-auto rounded-full flex items-center justify-center text-xs font-medium"
                          style={{
                            backgroundColor: `hsl(var(--primary) / ${Math.min(0.2 + count * 0.15, 1)})`,
                            color: count >= 3 ? 'white' : 'inherit',
                          }}
                        >
                          {count}
                        </div>
                      ) : (
                        <div className="w-6 h-6 mx-auto rounded-full bg-muted/30" />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="mt-4 pt-4 border-t flex items-center justify-center gap-4 text-sm text-muted-foreground">
          <span>Intensity:</span>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-muted/30" />
            <span>None</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: 'hsl(var(--primary) / 0.35)' }} />
            <span>Few</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: 'hsl(var(--primary) / 0.65)' }} />
            <span>Many</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
