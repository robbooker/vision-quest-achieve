// All taggable pillars including PRIMED + Spiritual
// Spiritual is separate from PRIMED assessments but can be used for tagging across the app

export type AllPillarKey = 
  | 'physical' 
  | 'relations' 
  | 'income' 
  | 'mental' 
  | 'excellence' 
  | 'direction' 
  | 'spiritual';

export interface AllPillar {
  value: AllPillarKey;
  label: string;
  letter: string;
  color: string;
  colorClass: string;
}

export const ALL_PILLARS: AllPillar[] = [
  { value: 'physical', label: 'Physical', letter: 'P', color: 'hsl(var(--chart-1))', colorClass: 'bg-red-500/20 text-red-700 dark:text-red-400' },
  { value: 'relations', label: 'Relations', letter: 'R', color: 'hsl(var(--chart-2))', colorClass: 'bg-pink-500/20 text-pink-700 dark:text-pink-400' },
  { value: 'income', label: 'Income', letter: 'I', color: 'hsl(var(--chart-3))', colorClass: 'bg-green-500/20 text-green-700 dark:text-green-400' },
  { value: 'mental', label: 'Mental', letter: 'M', color: 'hsl(var(--chart-4))', colorClass: 'bg-blue-500/20 text-blue-700 dark:text-blue-400' },
  { value: 'excellence', label: 'Excellence', letter: 'E', color: 'hsl(var(--chart-5))', colorClass: 'bg-orange-500/20 text-orange-700 dark:text-orange-400' },
  { value: 'direction', label: 'Direction', letter: 'D', color: 'hsl(var(--primary))', colorClass: 'bg-purple-500/20 text-purple-700 dark:text-purple-400' },
  { value: 'spiritual', label: 'Spiritual', letter: 'S', color: 'hsl(280 70% 50%)', colorClass: 'bg-violet-500/20 text-violet-700 dark:text-violet-400' },
];

export const SPIRITUAL_PILLAR: AllPillar = ALL_PILLARS.find(p => p.value === 'spiritual')!;

export function getPillarByValue(value: string): AllPillar | undefined {
  return ALL_PILLARS.find(p => p.value === value);
}

export function getPillarLabel(value: string): string {
  return getPillarByValue(value)?.label ?? value;
}

export function getPillarLetter(value: string): string {
  return getPillarByValue(value)?.letter ?? value.charAt(0).toUpperCase();
}

export function getPillarColor(value: string): string {
  return getPillarByValue(value)?.color ?? 'hsl(var(--muted))';
}

export function getPillarColorClass(value: string): string {
  return getPillarByValue(value)?.colorClass ?? 'bg-muted text-muted-foreground';
}
