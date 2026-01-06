import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Gift, ShieldCheck, ShieldX, Trash2, X, Loader2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useState } from 'react';

interface BulkActionsBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBulkGrantAccess: (duration: string) => Promise<void>;
  onBulkRevokeAccess: () => Promise<void>;
  onBulkMakeAdmin: () => Promise<void>;
  onBulkRemoveAdmin: () => Promise<void>;
  onBulkDelete: () => Promise<void>;
  isProcessing: boolean;
}

export function BulkActionsBar({
  selectedCount,
  onClearSelection,
  onBulkGrantAccess,
  onBulkRevokeAccess,
  onBulkMakeAdmin,
  onBulkRemoveAdmin,
  onBulkDelete,
  isProcessing,
}: BulkActionsBarProps) {
  const [grantDuration, setGrantDuration] = useState('1year');

  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-card border border-border rounded-lg shadow-lg p-4 flex items-center gap-4">
      <span className="text-sm font-medium">
        {selectedCount} user{selectedCount !== 1 ? 's' : ''} selected
      </span>
      
      <div className="h-6 w-px bg-border" />
      
      {/* Subscription Actions */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground font-medium">Subscription:</span>
        <Select value={grantDuration} onValueChange={setGrantDuration} disabled={isProcessing}>
          <SelectTrigger className="w-[110px] h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1month">1 Month</SelectItem>
            <SelectItem value="6months">6 Months</SelectItem>
            <SelectItem value="1year">1 Year</SelectItem>
          </SelectContent>
        </Select>
        <Button 
          size="sm" 
          variant="outline" 
          onClick={() => onBulkGrantAccess(grantDuration)}
          disabled={isProcessing}
        >
          {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Gift className="h-4 w-4 mr-1" />}
          Grant Access
        </Button>
        <Button 
          size="sm" 
          variant="outline" 
          onClick={onBulkRevokeAccess}
          disabled={isProcessing}
        >
          Revoke Access
        </Button>
      </div>
      
      <div className="h-6 w-px bg-border" />
      
      {/* Admin Actions - Requires Confirmation */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground font-medium">Admin Role:</span>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button 
              size="sm" 
              variant="outline"
              className="border-amber-500/50 text-amber-600 hover:bg-amber-500/10"
              disabled={isProcessing}
            >
              <ShieldCheck className="h-4 w-4 mr-1" />
              Make Admin
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>⚠️ Make {selectedCount} User{selectedCount !== 1 ? 's' : ''} Admin?</AlertDialogTitle>
              <AlertDialogDescription>
                This will grant full administrative privileges to the selected users. 
                Admins can access sensitive user data and modify system settings.
                <br /><br />
                <strong>Are you absolutely sure?</strong>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={onBulkMakeAdmin}
                className="bg-amber-600 text-white hover:bg-amber-700"
              >
                Yes, Make Admin
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        
        <Button 
          size="sm" 
          variant="outline" 
          onClick={onBulkRemoveAdmin}
          disabled={isProcessing}
        >
          <ShieldX className="h-4 w-4 mr-1" />
          Remove Admin
        </Button>
      </div>
      
      <div className="h-6 w-px bg-border" />
      
      {/* Delete Action */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button size="sm" variant="destructive" disabled={isProcessing}>
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedCount} User{selectedCount !== 1 ? 's' : ''}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove their profile data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={onBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <Button size="icon" variant="ghost" onClick={onClearSelection} className="h-8 w-8">
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
