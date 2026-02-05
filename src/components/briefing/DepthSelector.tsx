import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import type { DepthLevel } from '@/hooks/useBriefingLab';

interface DepthSelectorProps {
  value: DepthLevel;
  onChange: (value: DepthLevel) => void;
}

export function DepthSelector({ value, onChange }: DepthSelectorProps) {
  return (
    <RadioGroup
      value={value}
      onValueChange={(v) => onChange(v as DepthLevel)}
      className="flex gap-1"
    >
      <div className="flex items-center">
        <RadioGroupItem value="off" id="off" className="sr-only peer" />
        <Label
          htmlFor="off"
          className="px-2 py-1 text-xs rounded-l-md border border-r-0 cursor-pointer transition-colors peer-data-[state=checked]:bg-muted peer-data-[state=checked]:border-primary text-muted-foreground peer-data-[state=checked]:text-foreground"
        >
          Off
        </Label>
      </div>
      <div className="flex items-center">
        <RadioGroupItem value="brief" id="brief" className="sr-only peer" />
        <Label
          htmlFor="brief"
          className="px-2 py-1 text-xs border cursor-pointer transition-colors peer-data-[state=checked]:bg-primary/10 peer-data-[state=checked]:border-primary text-muted-foreground peer-data-[state=checked]:text-foreground"
        >
          Brief
        </Label>
      </div>
      <div className="flex items-center">
        <RadioGroupItem value="full" id="full" className="sr-only peer" />
        <Label
          htmlFor="full"
          className="px-2 py-1 text-xs rounded-r-md border border-l-0 cursor-pointer transition-colors peer-data-[state=checked]:bg-primary/20 peer-data-[state=checked]:border-primary text-muted-foreground peer-data-[state=checked]:text-foreground"
        >
          Full
        </Label>
      </div>
    </RadioGroup>
  );
}
