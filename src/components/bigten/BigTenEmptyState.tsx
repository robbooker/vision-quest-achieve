import { Rocket, Mountain } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BigTenCategory } from '@/hooks/useBigTen';

interface BigTenEmptyStateProps {
  onAddProject: (category: BigTenCategory) => void;
}

export function BigTenEmptyState({ onAddProject }: BigTenEmptyStateProps) {
  return (
    <Card className="p-8 text-center space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Welcome to Your Big 10</h2>
        <p className="text-muted-foreground max-w-lg mx-auto">
          The most successful people focus on what matters most. Identify the <strong>5 biggest opportunities</strong> in your life right now, and the <strong>5 biggest challenges</strong> you need to overcome.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto pt-4">
        <div className="space-y-3 p-6 rounded-lg bg-primary/5 border border-primary/20">
          <div className="flex items-center justify-center gap-2 text-primary">
            <Rocket className="h-6 w-6" />
            <h3 className="font-semibold text-lg">Opportunities</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            What could transform your life if you pursue it?
          </p>
          <Button 
            onClick={() => onAddProject('opportunity')}
            variant="default"
            className="w-full"
          >
            Add Your First Opportunity
          </Button>
        </div>

        <div className="space-y-3 p-6 rounded-lg bg-orange-500/5 border border-orange-500/20">
          <div className="flex items-center justify-center gap-2 text-orange-600 dark:text-orange-400">
            <Mountain className="h-6 w-6" />
            <h3 className="font-semibold text-lg">Challenges</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            What obstacles are blocking your progress?
          </p>
          <Button 
            onClick={() => onAddProject('challenge')}
            variant="outline"
            className="w-full border-orange-500/30 hover:bg-orange-500/10"
          >
            Add Your First Challenge
          </Button>
        </div>
      </div>
    </Card>
  );
}
