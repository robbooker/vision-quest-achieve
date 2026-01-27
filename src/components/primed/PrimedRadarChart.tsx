import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { PILLARS, PillarKey, PILLAR_ORDER } from '@/data/primedBehaviors';
import { PrimedAssessment } from '@/hooks/usePrimedAssessment';

interface PrimedRadarChartProps {
  assessment: PrimedAssessment | null;
  className?: string;
}

export function PrimedRadarChart({ assessment, className }: PrimedRadarChartProps) {
  const data = PILLAR_ORDER.map(pillar => {
    const level = assessment ? assessment[`${pillar}_level` as keyof PrimedAssessment] as number : 0;
    return {
      pillar: PILLARS[pillar].name,
      level,
      fullMark: 3,
    };
  });

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} cx="50%" cy="50%" outerRadius="80%">
          <PolarGrid 
            stroke="hsl(var(--border))" 
            strokeOpacity={0.5}
          />
          <PolarAngleAxis 
            dataKey="pillar" 
            tick={{ 
              fill: 'hsl(var(--foreground))', 
              fontSize: 12,
              fontWeight: 500,
            }}
          />
          <PolarRadiusAxis 
            angle={90} 
            domain={[0, 3]} 
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
            tickCount={4}
          />
          <Radar
            name="Level"
            dataKey="level"
            stroke="hsl(var(--primary))"
            fill="hsl(var(--primary))"
            fillOpacity={0.3}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
