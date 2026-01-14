import { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminTabs } from '@/components/admin/AdminTabs';
import { UserFilters } from '@/components/admin/UserFilters';
import { UserTable, UserProfile, SortField, SortOrder } from '@/components/admin/UserTable';
import { UserPagination } from '@/components/admin/UserPagination';
import { BulkActionsBar } from '@/components/admin/BulkActionsBar';
import { UserStatsCards } from '@/components/admin/UserStatsCards';
import { addMonths, addYears } from 'date-fns';

export default function AdminUsers() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  // Filters
  const [search, setSearch] = useState('');
  const [subscriptionFilter, setSubscriptionFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');

  // Sorting
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const fetchUsers = async () => {
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      const { data: adminRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');

      if (rolesError) throw rolesError;

      const { data: subscriptions } = await supabase
        .from('subscriptions')
        .select('user_id, status, subscription_end');

      const adminUserIds = new Set(adminRoles?.map(r => r.user_id) || []);
      const subMap = new Map(subscriptions?.map(s => [s.user_id, s]) || []);

      const usersWithRoles = (profiles || []).map(profile => {
        const sub = subMap.get(profile.user_id);
        return {
          id: profile.id,
          user_id: profile.user_id,
          email: profile.email,
          display_name: profile.display_name,
          created_at: profile.created_at,
          consent_email: profile.consent_email,
          consent_sms: profile.consent_sms,
          isAdmin: adminUserIds.has(profile.user_id),
          subscription_status: sub?.status || null,
          subscription_end: sub?.subscription_end || null,
        };
      });

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch users',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filtered and sorted users
  const processedUsers = useMemo(() => {
    let result = [...users];

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(
        u =>
          u.email?.toLowerCase().includes(searchLower) ||
          u.display_name?.toLowerCase().includes(searchLower)
      );
    }

    // Apply subscription filter
    if (subscriptionFilter !== 'all') {
      if (subscriptionFilter === 'none') {
        result = result.filter(u => !u.subscription_status);
      } else {
        result = result.filter(u => u.subscription_status === subscriptionFilter);
      }
    }

    // Apply role filter
    if (roleFilter !== 'all') {
      if (roleFilter === 'admin') {
        result = result.filter(u => u.isAdmin);
      } else {
        result = result.filter(u => !u.isAdmin);
      }
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'email':
          comparison = (a.email || '').localeCompare(b.email || '');
          break;
        case 'created_at':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'subscription_status':
          const statusOrder = ['active', 'trialing', 'admin_granted', 'canceled', null];
          comparison = statusOrder.indexOf(a.subscription_status) - statusOrder.indexOf(b.subscription_status);
          break;
        case 'role':
          comparison = (b.isAdmin ? 1 : 0) - (a.isAdmin ? 1 : 0);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [users, search, subscriptionFilter, roleFilter, sortField, sortOrder]);

  // Paginated users
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedUsers.slice(start, start + pageSize);
  }, [processedUsers, currentPage, pageSize]);

  const totalPages = Math.max(1, Math.ceil(processedUsers.length / pageSize));

  // Stats
  const stats = useMemo(() => ({
    total: users.length,
    active: users.filter(u => u.subscription_status === 'active').length,
    trial: users.filter(u => u.subscription_status === 'trialing').length,
    granted: users.filter(u => u.subscription_status === 'admin_granted').length,
    admins: users.filter(u => u.isAdmin).length,
  }), [users]);

  // Handlers
  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleToggleSelect = (userId: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedIds(newSelected);
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.size === paginatedUsers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedUsers.map(u => u.user_id)));
    }
  };

  const handleClearFilters = () => {
    setSearch('');
    setSubscriptionFilter('all');
    setRoleFilter('all');
    setCurrentPage(1);
  };

  const hasFilters = search !== '' || subscriptionFilter !== 'all' || roleFilter !== 'all';

  const handleToggleAdmin = async (userId: string, email: string | null, currentlyAdmin: boolean) => {
    try {
      if (currentlyAdmin) {
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', 'admin');
        if (error) throw error;
        toast({ title: 'Admin role removed', description: `${email || 'User'} is no longer an admin` });
      } else {
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: 'admin' });
        if (error) throw error;
        toast({ title: 'Admin role added', description: `${email || 'User'} is now an admin` });
      }
      fetchUsers();
    } catch (error) {
      console.error('Error toggling admin role:', error);
      toast({ title: 'Error', description: 'Failed to update admin role', variant: 'destructive' });
    }
  };

  const handleDeleteUser = async (userId: string, email: string | null) => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-delete-user', {
        body: { userId },
      });
      
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      
      toast({ title: 'User deleted', description: `${email || 'User'} has been removed` });
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Failed to delete user', variant: 'destructive' });
    }
  };

  // Bulk actions
  const handleBulkGrantAccess = async (duration: string) => {
    setIsProcessing(true);
    let successCount = 0;
    let errorCount = 0;
    try {
      const now = new Date();
      let endDate: Date;
      switch (duration) {
        case '1month': endDate = addMonths(now, 1); break;
        case '6months': endDate = addMonths(now, 6); break;
        default: endDate = addYears(now, 1); break;
      }

      for (const userId of selectedIds) {
        const { error } = await supabase.from('subscriptions').upsert({
          user_id: userId,
          status: 'admin_granted',
          subscription_end: endDate.toISOString(),
          granted_by_admin: true,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
        
        if (error) {
          console.error(`Error granting access to ${userId}:`, error);
          errorCount++;
        } else {
          successCount++;
        }
      }

      if (errorCount > 0) {
        toast({ 
          title: 'Partial success', 
          description: `Granted access to ${successCount} user(s), ${errorCount} failed`, 
          variant: 'destructive' 
        });
      } else {
        toast({ title: 'Access granted', description: `Granted access to ${successCount} user(s)` });
      }
      setSelectedIds(new Set());
      fetchUsers();
    } catch (error) {
      console.error('Error granting access:', error);
      toast({ title: 'Error', description: 'Failed to grant access', variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkRevokeAccess = async () => {
    setIsProcessing(true);
    try {
      for (const userId of selectedIds) {
        await supabase.from('subscriptions').delete().eq('user_id', userId);
      }
      toast({ title: 'Access revoked', description: `Revoked access from ${selectedIds.size} user(s)` });
      setSelectedIds(new Set());
      fetchUsers();
    } catch (error) {
      console.error('Error revoking access:', error);
      toast({ title: 'Error', description: 'Failed to revoke access', variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkMakeAdmin = async () => {
    setIsProcessing(true);
    try {
      for (const userId of selectedIds) {
        await supabase.from('user_roles').upsert({ user_id: userId, role: 'admin' }, { onConflict: 'user_id,role' });
      }
      toast({ title: 'Admin role granted', description: `Made ${selectedIds.size} user(s) admin` });
      setSelectedIds(new Set());
      fetchUsers();
    } catch (error) {
      console.error('Error making admins:', error);
      toast({ title: 'Error', description: 'Failed to grant admin role', variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkRemoveAdmin = async () => {
    setIsProcessing(true);
    try {
      for (const userId of selectedIds) {
        await supabase.from('user_roles').delete().eq('user_id', userId).eq('role', 'admin');
      }
      toast({ title: 'Admin role removed', description: `Removed admin from ${selectedIds.size} user(s)` });
      setSelectedIds(new Set());
      fetchUsers();
    } catch (error) {
      console.error('Error removing admins:', error);
      toast({ title: 'Error', description: 'Failed to remove admin role', variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkDelete = async () => {
    setIsProcessing(true);
    try {
      for (const userId of selectedIds) {
        await supabase.from('profiles').delete().eq('user_id', userId);
      }
      toast({ title: 'Users deleted', description: `Deleted ${selectedIds.size} user(s)` });
      setSelectedIds(new Set());
      fetchUsers();
    } catch (error) {
      console.error('Error deleting users:', error);
      toast({ title: 'Error', description: 'Failed to delete users', variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>User Management | Admin</title>
      </Helmet>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage users, subscriptions, and system settings</p>
          </div>

          <AdminTabs />

          <UserStatsCards
            totalUsers={stats.total}
            activeSubscribers={stats.active}
            trialing={stats.trial}
            adminGranted={stats.granted}
            admins={stats.admins}
          />

          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>View, filter, and manage all registered users</CardDescription>
            </CardHeader>
            <CardContent>
              <UserFilters
                search={search}
                onSearchChange={(v) => { setSearch(v); setCurrentPage(1); }}
                subscriptionFilter={subscriptionFilter}
                onSubscriptionFilterChange={(v) => { setSubscriptionFilter(v); setCurrentPage(1); }}
                roleFilter={roleFilter}
                onRoleFilterChange={(v) => { setRoleFilter(v); setCurrentPage(1); }}
                onClearFilters={handleClearFilters}
                hasFilters={hasFilters}
              />

              <UserTable
                users={paginatedUsers}
                selectedIds={selectedIds}
                onToggleSelect={handleToggleSelect}
                onToggleSelectAll={handleToggleSelectAll}
                sortField={sortField}
                sortOrder={sortOrder}
                onSort={handleSort}
                onToggleAdmin={handleToggleAdmin}
                onDeleteUser={handleDeleteUser}
                loading={loading}
              />

              <UserPagination
                currentPage={currentPage}
                totalPages={totalPages}
                pageSize={pageSize}
                totalItems={processedUsers.length}
                onPageChange={setCurrentPage}
                onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
              />
            </CardContent>
          </Card>

          <BulkActionsBar
            selectedCount={selectedIds.size}
            onClearSelection={() => setSelectedIds(new Set())}
            onBulkGrantAccess={handleBulkGrantAccess}
            onBulkRevokeAccess={handleBulkRevokeAccess}
            onBulkMakeAdmin={handleBulkMakeAdmin}
            onBulkRemoveAdmin={handleBulkRemoveAdmin}
            onBulkDelete={handleBulkDelete}
            isProcessing={isProcessing}
          />
        </div>
      </DashboardLayout>
    </>
  );
}
