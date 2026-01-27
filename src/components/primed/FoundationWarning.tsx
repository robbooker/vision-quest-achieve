import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertTriangle } from 'lucide-react';

interface FoundationWarningProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProceed: () => void;
  pillarName: string;
}

export function FoundationWarning({ open, onOpenChange, onProceed, pillarName }: FoundationWarningProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Foundation First
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              You're about to set a goal in <strong>{pillarName}</strong>, but your foundation pillars 
              (Physical, Mental, Relations) aren't all at Level 1 yet.
            </p>
            <p>
              Research shows that without a solid foundation, progress in advanced areas is harder to sustain.
              Consider addressing your foundation first, or proceed if you understand the tradeoffs.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Go Back</AlertDialogCancel>
          <AlertDialogAction onClick={onProceed}>
            Proceed Anyway
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
