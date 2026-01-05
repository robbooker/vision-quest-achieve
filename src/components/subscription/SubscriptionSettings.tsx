import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { CreditCard, Loader2, Crown, Gift, Clock } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { format } from 'date-fns';

export function SubscriptionSettings() {
  const {
    isSubscribed,
    isTrialing,
    isCanceled,
    isAdminGranted,
    status,
    trialEnd,
    subscriptionEnd,
    daysLeftInTrial,
    cancelSubscription,
    openCustomerPortal,
    startTrial,
    isLoading,
  } = useSubscription();
  
  const [isCanceling, setIsCanceling] = useState(false);
  const [isOpeningPortal, setIsOpeningPortal] = useState(false);

  const handleCancel = async () => {
    setIsCanceling(true);
    await cancelSubscription();
    setIsCanceling(false);
  };

  const handleOpenPortal = async () => {
    setIsOpeningPortal(true);
    await openCustomerPortal();
    setIsOpeningPortal(false);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Subscription
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // Not subscribed
  if (!isSubscribed) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Subscription
          </CardTitle>
          <CardDescription>
            Start your free trial to unlock all features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">GroovyPlanning Pro</p>
                <p className="text-sm text-muted-foreground">7-day free trial, then $99/year</p>
              </div>
              <Button onClick={startTrial}>Start Free Trial</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Admin granted access
  if (isAdminGranted) {
    return (
      <Card className="border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary" />
              Subscription
            </CardTitle>
            <Badge variant="secondary" className="gap-1">
              <Gift className="h-3 w-3" />
              Complimentary
            </Badge>
          </div>
          <CardDescription>
            You have complimentary access to GroovyPlanning
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Status</span>
              <span className="font-medium text-primary">Active</span>
            </div>
            {subscriptionEnd && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Access Until</span>
                <span>{format(subscriptionEnd, 'MMMM d, yyyy')}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Trialing
  if (isTrialing) {
    return (
      <Card className="border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Subscription
            </CardTitle>
            <Badge className="gap-1">
              <Clock className="h-3 w-3" />
              {daysLeftInTrial} day{daysLeftInTrial !== 1 ? 's' : ''} left
            </Badge>
          </div>
          <CardDescription>
            {isCanceled 
              ? 'Your trial has been canceled but you still have access' 
              : 'You\'re currently on a free trial'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Status</span>
              <span className="font-medium">{isCanceled ? 'Canceled' : 'Free Trial'}</span>
            </div>
            {trialEnd && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Trial Ends</span>
                <span>{format(trialEnd, 'MMMM d, yyyy')}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">After Trial</span>
              <span>{isCanceled ? 'No charge' : '$99/year'}</span>
            </div>
          </div>
          
          <div className="flex gap-2">
            {!isCanceled && (
              <>
                <Button variant="outline" onClick={handleOpenPortal} disabled={isOpeningPortal}>
                  {isOpeningPortal ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Manage Payment'
                  )}
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">Cancel Trial</Button>
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
                      <AlertDialogAction onClick={handleCancel} disabled={isCanceling}>
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
              </>
            )}
            {isCanceled && (
              <Button onClick={startTrial}>Resubscribe</Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Active subscription
  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-primary" />
            Subscription
          </CardTitle>
          <Badge variant="default" className="gap-1">
            <Crown className="h-3 w-3" />
            Pro
          </Badge>
        </div>
        <CardDescription>
          {isCanceled 
            ? 'Your subscription has been canceled but you still have access' 
            : 'You have full access to GroovyPlanning'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Status</span>
            <span className="font-medium text-primary">{isCanceled ? 'Canceled' : 'Active'}</span>
          </div>
          {subscriptionEnd && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {isCanceled ? 'Access Until' : 'Next Billing'}
              </span>
              <span>{format(subscriptionEnd, 'MMMM d, yyyy')}</span>
            </div>
          )}
          {!isCanceled && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Plan</span>
              <span>$99/year</span>
            </div>
          )}
        </div>
        
        <div className="flex gap-2">
          {isCanceled ? (
            <Button onClick={startTrial}>Resubscribe</Button>
          ) : (
            <Button variant="outline" onClick={handleOpenPortal} disabled={isOpeningPortal}>
              {isOpeningPortal ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Manage Subscription'
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
