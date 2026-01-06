import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ArrowUpDown, ArrowUp, ArrowDown, Trash2, ShieldCheck, ShieldX, Crown, Clock, Gift } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';

export interface UserProfile {
  id: string;
  user_id: string;
  email: string | null;
  display_name: string | null;
  created_at: string;
  isAdmin?: boolean;
  consent_email?: boolean;
  consent_sms?: boolean;
  subscription_status?: string | null;
  subscription_end?: string | null;
}

export type SortField = 'email' | 'created_at' | 'subscription_status' | 'role';
export type SortOrder = 'asc' | 'desc';

interface UserTableProps {
  users: UserProfile[];
  selectedIds: Set<string>;
  onToggleSelect: (userId: string) => void;
  onToggleSelectAll: () => void;
  sortField: SortField;
  sortOrder: SortOrder;
  onSort: (field: SortField) => void;
  onToggleAdmin: (userId: string, email: string | null, isAdmin: boolean) => void;
  onDeleteUser: (userId: string, email: string | null) => void;
  loading: boolean;
}

const getSubscriptionBadge = (status: string | null, endDate: string | null) => {
  if (!status) {
    return <Badge variant="outline">None</Badge>;
  }
  
  const isExpired = endDate && new Date(endDate) < new Date();
  const daysUntilExpiry = endDate ? differenceInDays(new Date(endDate), new Date()) : null;
  const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry > 0 && daysUntilExpiry <= 7;
  
  if (isExpired) {
    return <Badge variant="outline">Expired</Badge>;
  }
  
  const badgeClass = isExpiringSoon ? 'border-amber-500 text-amber-600' : '';
  
  switch (status) {
    case 'active':
      return <Badge className={cn('gap-1', badgeClass)}><Crown className="h-3 w-3" />Active</Badge>;
    case 'trialing':
      return <Badge variant="secondary" className={cn('gap-1', badgeClass)}><Clock className="h-3 w-3" />Trial</Badge>;
    case 'admin_granted':
      return <Badge variant="secondary" className={cn('gap-1', badgeClass)}><Gift className="h-3 w-3" />Free</Badge>;
    case 'canceled':
      return <Badge variant="outline">Canceled</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const SortHeader = ({ 
  field, 
  currentField, 
  currentOrder, 
  onSort, 
  children 
}: { 
  field: SortField; 
  currentField: SortField; 
  currentOrder: SortOrder; 
  onSort: (field: SortField) => void; 
  children: React.ReactNode;
}) => {
  const isActive = field === currentField;
  return (
    <Button 
      variant="ghost" 
      size="sm" 
      className="-ml-3 h-8 data-[state=active]:text-foreground"
      onClick={() => onSort(field)}
    >
      {children}
      {isActive ? (
        currentOrder === 'asc' ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />
      ) : (
        <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />
      )}
    </Button>
  );
};

export function UserTable({
  users,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  sortField,
  sortOrder,
  onSort,
  onToggleAdmin,
  onDeleteUser,
  loading,
}: UserTableProps) {
  const allSelected = users.length > 0 && selectedIds.size === users.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < users.length;

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No users found matching your filters.
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={allSelected}
                onCheckedChange={onToggleSelectAll}
                aria-label="Select all"
                className={someSelected ? 'data-[state=checked]:bg-primary/50' : ''}
              />
            </TableHead>
            <TableHead>
              <SortHeader field="email" currentField={sortField} currentOrder={sortOrder} onSort={onSort}>
                Email
              </SortHeader>
            </TableHead>
            <TableHead>Display Name</TableHead>
            <TableHead>
              <SortHeader field="subscription_status" currentField={sortField} currentOrder={sortOrder} onSort={onSort}>
                Subscription
              </SortHeader>
            </TableHead>
            <TableHead>
              <SortHeader field="role" currentField={sortField} currentOrder={sortOrder} onSort={onSort}>
                Role
              </SortHeader>
            </TableHead>
            <TableHead>
              <SortHeader field="created_at" currentField={sortField} currentOrder={sortOrder} onSort={onSort}>
                Joined
              </SortHeader>
            </TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => {
            const isNew = differenceInDays(new Date(), new Date(user.created_at)) <= 1;
            return (
              <TableRow key={user.id} className={selectedIds.has(user.user_id) ? 'bg-muted/50' : ''}>
                <TableCell>
                  <Checkbox
                    checked={selectedIds.has(user.user_id)}
                    onCheckedChange={() => onToggleSelect(user.user_id)}
                    aria-label={`Select ${user.email}`}
                  />
                </TableCell>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {user.email || 'N/A'}
                    {isNew && <Badge variant="secondary" className="text-xs">New</Badge>}
                  </div>
                </TableCell>
                <TableCell>{user.display_name || '—'}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getSubscriptionBadge(user.subscription_status, user.subscription_end)}
                    {user.subscription_end && user.subscription_status && (
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(user.subscription_end), 'MMM d')}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {user.isAdmin ? (
                    <Badge variant="default">Admin</Badge>
                  ) : (
                    <Badge variant="secondary">User</Badge>
                  )}
                </TableCell>
                <TableCell>{format(new Date(user.created_at), 'MMM d, yyyy')}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    {user.isAdmin ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onToggleAdmin(user.user_id, user.email, true)}
                      >
                        <ShieldX className="h-4 w-4 mr-1" />
                        Remove Admin
                      </Button>
                    ) : (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <ShieldCheck className="h-4 w-4 mr-1" />
                            Make Admin
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>⚠️ Grant Admin Access?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will give {user.email || 'this user'} full administrative privileges including access to all user data and system settings.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => onToggleAdmin(user.user_id, user.email, false)}
                              className="bg-amber-600 text-white hover:bg-amber-700"
                            >
                              Yes, Make Admin
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="icon" className="h-8 w-8">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete User</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete {user.email || 'this user'}? This will remove their profile data.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => onDeleteUser(user.user_id, user.email)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
