import { useState } from 'react';
import { format } from 'date-fns';
import { Sparkles, Edit2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrentMonthIntention } from '@/hooks/useMonthlyIntention';
import { SetIntentionDialog } from './SetIntentionDialog';

export const MonthlyIntentionWidget = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data: intention, isLoading } = useCurrentMonthIntention();

  const currentMonth = format(new Date(), 'MMMM');

  if (isLoading) {
    return (
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="py-3 px-4">
          <Skeleton className="h-8 w-32" />
        </CardContent>
      </Card>
    );
  }

  if (!intention) {
    return (
      <>
        <Card 
          className="border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-transparent cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => setDialogOpen(true)}
        >
          <CardContent className="py-3 px-4 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm text-muted-foreground">
              Set your word for {currentMonth}
            </span>
          </CardContent>
        </Card>
        <SetIntentionDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      </>
    );
  }

  return (
    <>
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent group">
        <CardContent className="py-3 px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="h-4 w-4 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">{currentMonth}'s Word</p>
              <p className="text-lg font-bold tracking-wide uppercase text-primary">
                {intention.word}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => setDialogOpen(true)}
          >
            <Edit2 className="h-3 w-3" />
          </Button>
        </CardContent>
      </Card>
      <SetIntentionDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen} 
        existingIntention={intention}
      />
    </>
  );
};
