import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PILLARS, PILLAR_ORDER, FOUNDATION_PILLARS, ADVANCED_PILLARS, isFoundationComplete, PillarKey } from '@/data/primedBehaviors';
import { SPIRITUAL_PILLAR, AllPillarKey } from '@/data/allPillars';
import { useCurrentAssessment } from '@/hooks/usePrimedAssessment';
import { AlertTriangle } from 'lucide-react';

interface PillarSelectorProps {
  value: AllPillarKey | PillarKey | null;
  onChange: (pillar: AllPillarKey) => void;
  label?: string;
  required?: boolean;
  includeSpiritual?: boolean;
}

export function PillarSelector({ value, onChange, label = 'Life Pillar', required = false, includeSpiritual = true }: PillarSelectorProps) {
  const { assessment, isLoading } = useCurrentAssessment();

  const foundationComplete = assessment ? isFoundationComplete({
    physical_level: assessment.physical_level,
    relations_level: assessment.relations_level,
    mental_level: assessment.mental_level,
  }) : false;

  const showFoundationWarning = value && ADVANCED_PILLARS.includes(value as PillarKey) && !foundationComplete;

  return (
    <div className="space-y-2">
      <Label htmlFor="pillar-select">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      
      <Select value={value ?? undefined} onValueChange={(v) => onChange(v as AllPillarKey)}>
        <SelectTrigger id="pillar-select">
          <SelectValue placeholder="Select a pillar..." />
        </SelectTrigger>
        <SelectContent>
          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
            Foundation Pillars
          </div>
          {FOUNDATION_PILLARS.map(pillar => (
            <SelectItem key={pillar} value={pillar}>
              <div className="flex items-center gap-2">
                <span 
                  className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground"
                  style={{ backgroundColor: PILLARS[pillar].color }}
                >
                  {PILLARS[pillar].letter}
                </span>
                <span>{PILLARS[pillar].name}</span>
                {assessment && (
                  <span className="text-xs text-muted-foreground ml-auto">
                    Lv {assessment[`${pillar}_level` as keyof typeof assessment]}
                  </span>
                )}
              </div>
            </SelectItem>
          ))}
          
          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground mt-2">
            Advanced Pillars
          </div>
          {ADVANCED_PILLARS.map(pillar => (
            <SelectItem key={pillar} value={pillar}>
              <div className="flex items-center gap-2">
                <span 
                  className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground"
                  style={{ backgroundColor: PILLARS[pillar].color }}
                >
                  {PILLARS[pillar].letter}
                </span>
                <span>{PILLARS[pillar].name}</span>
                {assessment && (
                  <span className="text-xs text-muted-foreground ml-auto">
                    Lv {assessment[`${pillar}_level` as keyof typeof assessment]}
                  </span>
                )}
              </div>
            </SelectItem>
          ))}
          
          {includeSpiritual && (
            <>
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground mt-2">
                Spiritual
              </div>
              <SelectItem value="spiritual">
                <div className="flex items-center gap-2">
                  <span 
                    className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground"
                    style={{ backgroundColor: SPIRITUAL_PILLAR.color }}
                  >
                    {SPIRITUAL_PILLAR.letter}
                  </span>
                  <span>{SPIRITUAL_PILLAR.label}</span>
                </div>
              </SelectItem>
            </>
          )}
        </SelectContent>
      </Select>

      {showFoundationWarning && (
        <Alert className="border-amber-500/50 bg-amber-500/10 py-2">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <AlertDescription className="text-xs text-amber-600 dark:text-amber-300 ml-2">
            Your foundation pillars (Physical, Mental, Relations) aren't all at Level 1+ yet. 
            Consider focusing there first, but you can still proceed.
          </AlertDescription>
        </Alert>
      )}

      {!assessment && !isLoading && (
        <p className="text-xs text-muted-foreground">
          Complete your P.R.I.M.E.D. assessment to see your current levels.
        </p>
      )}
    </div>
  );
}
