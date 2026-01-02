import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  UserPlus, 
  Check, 
  X, 
  Mail, 
  Clock, 
  Trash2,
  Loader2
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { useFriendships } from '@/hooks/useFriendships';
import { useToast } from '@/hooks/use-toast';

export function FriendManagement() {
  const { 
    friends, 
    pendingReceived, 
    pendingSent, 
    isLoading,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    removeFriend 
  } = useFriendships();
  const { toast } = useToast();
  
  const [email, setEmail] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [removeId, setRemoveId] = useState<string | null>(null);

  const handleSendRequest = async () => {
    if (!email.trim()) return;
    
    try {
      await sendFriendRequest.mutateAsync(email.trim());
      setEmail('');
      toast({ title: 'Friend request sent!' });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to send request';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
  };

  const handleAccept = async (id: string) => {
    try {
      await acceptFriendRequest.mutateAsync(id);
      toast({ title: 'Friend request accepted!' });
    } catch {
      toast({ title: 'Error', description: 'Failed to accept request', variant: 'destructive' });
    }
  };

  const handleDecline = async (id: string) => {
    try {
      await declineFriendRequest.mutateAsync(id);
      toast({ title: 'Request declined' });
    } catch {
      toast({ title: 'Error', description: 'Failed to decline request', variant: 'destructive' });
    }
  };

  const handleRemove = async () => {
    if (!removeId) return;
    
    try {
      await removeFriend.mutateAsync(removeId);
      setRemoveId(null);
      toast({ title: 'Friend removed' });
    } catch {
      toast({ title: 'Error', description: 'Failed to remove friend', variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Users className="h-4 w-4" />
            Friends ({friends.length})
            {pendingReceived.length > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {pendingReceived.length}
              </Badge>
            )}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Friends
            </DialogTitle>
            <DialogDescription>
              Manage your friends and share tasks with them.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Add friend form */}
            <div className="flex gap-2">
              <Input
                placeholder="Enter friend's email..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSendRequest();
                }}
                type="email"
              />
              <Button 
                onClick={handleSendRequest} 
                disabled={!email.trim() || sendFriendRequest.isPending}
              >
                {sendFriendRequest.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Pending received requests */}
            {pendingReceived.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Pending Requests
                </h4>
                <div className="space-y-2">
                  {pendingReceived.map((friendship) => (
                    <div 
                      key={friendship.id} 
                      className="flex items-center justify-between p-2 bg-muted/50 rounded-md"
                    >
                      <span className="text-sm truncate flex-1">
                        {friendship.friend_name || friendship.friend_email || 'Unknown'}
                      </span>
                      <div className="flex gap-1">
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-100"
                          onClick={() => handleAccept(friendship.id)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleDecline(friendship.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pending sent requests */}
            {pendingSent.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  Sent Requests
                </h4>
                <div className="space-y-2">
                  {pendingSent.map((friendship) => (
                    <div 
                      key={friendship.id} 
                      className="flex items-center justify-between p-2 bg-muted/30 rounded-md"
                    >
                      <span className="text-sm text-muted-foreground truncate flex-1">
                        {friendship.friend_name || friendship.friend_email || 'Unknown'}
                      </span>
                      <Badge variant="outline" className="text-xs">Pending</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Friends list */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Your Friends</h4>
              {friends.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No friends yet. Add someone by their email!
                </p>
              ) : (
                <div className="space-y-2">
                  {friends.map((friend) => (
                    <div 
                      key={friend.id} 
                      className="flex items-center justify-between p-2 bg-muted/50 rounded-md"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {friend.display_name || friend.email || 'Unknown'}
                        </p>
                        {friend.display_name && friend.email && (
                          <p className="text-xs text-muted-foreground truncate">
                            {friend.email}
                          </p>
                        )}
                      </div>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8 text-destructive shrink-0"
                        onClick={() => setRemoveId(friend.friendship_id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Remove friend confirmation */}
      <AlertDialog open={!!removeId} onOpenChange={(open) => !open && setRemoveId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Friend?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove them from your friends list. You'll no longer be able to share tasks with each other.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemove} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
