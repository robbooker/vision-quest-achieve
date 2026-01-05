import { useState } from 'react';
import { X, Clock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSubscription } from '@/hooks/useSubscription';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { format } from 'date-fns';

export function TrialBanner() {
  const { isTrialing, isCanceled, daysLeftInTrial, trialEnd, subscriptionEnd, cancelSubscription, startTrial } = useSubscription();
  const [isCanceling, setIsCanceling] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  // Show banner for users in trial who haven't canceled
  if (isTrialing && !isCanceled) {
    return (
      <div className="bg-primary/10 border-b border-primary/20 px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-primary" />
            <span>
              <strong>{daysLeftInTrial} day{daysLeftInTrial !== 1 ? 's' : ''}</strong> left in your free trial
            </span>
          </div>
          <div className="flex items-center gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-xs">
                  Cancel anytime
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancel your trial?</AlertDialogTitle>
                  <AlertDialogDescription>
                    You'll still have access until {trialEnd ? format(trialEnd, 'MMMM d, yyyy') : 'the end of your trial'}.
                    You won't be charged.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep Trial</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={async () => {
                      setIsCanceling(true);
                      await cancelSubscription();
                      setIsCanceling(false);
                    }}
                    disabled={isCanceling}
                  >
                    {isCanceling ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Canceling...
                      </>
                    ) : (
                      'Cancel Trial'
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setDismissed(true)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show banner for users who canceled but still have access
  if (isCanceled && (trialEnd || subscriptionEnd)) {
    const endDate = trialEnd || subscriptionEnd;
    const isStillActive = endDate && endDate > new Date();
    
    if (isStillActive) {
      return (
        <div className="bg-muted border-b border-border px-4 py-2">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="text-sm">
              Your access ends on <strong>{format(endDate, 'MMMM d, yyyy')}</strong>. Enjoy until then!
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={startTrial}>
                Resubscribe
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setDismissed(true)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      );
    }
  }

  return null;
}
