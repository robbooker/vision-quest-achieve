import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Users, Shield, Trash2, ShieldCheck, ShieldX, Mail, Loader2, Send, Megaphone, MessageSquare, Gift, Crown, Clock } from 'lucide-react';
import { format, addMonths, addYears } from 'date-fns';

interface UserProfile {
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

type BroadcastMode = 'email' | 'sms';

export default function Admin() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingTestEmail, setSendingTestEmail] = useState(false);
  const [sendingTestSms, setSendingTestSms] = useState(false);
  const [sendingBroadcast, setSendingBroadcast] = useState(false);
  const [broadcastMode, setBroadcastMode] = useState<BroadcastMode>('email');
  const [broadcastSubject, setBroadcastSubject] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  
  // Grant access state
  const [grantEmail, setGrantEmail] = useState('');
  const [grantDuration, setGrantDuration] = useState('1year');
  const [granting, setGranting] = useState(false);
  
  const { toast } = useToast();

  const fetchUsers = async () => {
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: true });

      if (profilesError) throw profilesError;

      const { data: adminRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');

      if (rolesError) throw rolesError;

      // Fetch subscriptions
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

  const handleDeleteUser = async (userId: string, email: string | null) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: 'User deleted',
        description: `${email || 'User'} has been removed`,
      });

      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete user. Note: You cannot delete users from the auth system via this interface.',
        variant: 'destructive',
      });
    }
  };

  const handleToggleAdmin = async (userId: string, email: string | null, currentlyAdmin: boolean) => {
    try {
      if (currentlyAdmin) {
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', 'admin');

        if (error) throw error;

        toast({
          title: 'Admin role removed',
          description: `${email || 'User'} is no longer an admin`,
        });
      } else {
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: 'admin' });

        if (error) throw error;

        toast({
          title: 'Admin role added',
          description: `${email || 'User'} is now an admin`,
        });
      }

      fetchUsers();
    } catch (error) {
      console.error('Error toggling admin role:', error);
      toast({
        title: 'Error',
        description: 'Failed to update admin role',
        variant: 'destructive',
      });
    }
  };

  const handleGrantAccess = async () => {
    if (!grantEmail.trim()) {
      toast({
        title: 'Missing email',
        description: 'Please enter an email address',
        variant: 'destructive',
      });
      return;
    }

    setGranting(true);
    try {
      // Find user by email
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('email', grantEmail.trim())
        .single();

      if (profileError || !profile) {
        throw new Error('User not found with that email');
      }

      // Calculate end date
      const now = new Date();
      let endDate: Date;
      switch (grantDuration) {
        case '1month':
          endDate = addMonths(now, 1);
          break;
        case '6months':
          endDate = addMonths(now, 6);
          break;
        case '1year':
        default:
          endDate = addYears(now, 1);
          break;
      }

      // Upsert subscription
      const { error: subError } = await supabase
        .from('subscriptions')
        .upsert({
          user_id: profile.user_id,
          status: 'admin_granted',
          subscription_end: endDate.toISOString(),
          granted_by_admin: true,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (subError) throw subError;

      toast({
        title: 'Access granted',
        description: `${grantEmail} now has access until ${format(endDate, 'MMMM d, yyyy')}`,
      });

      setGrantEmail('');
      fetchUsers();
    } catch (error: any) {
      console.error('Error granting access:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to grant access',
        variant: 'destructive',
      });
    } finally {
      setGranting(false);
    }
  };

  const handleTestEmail = async () => {
    setSendingTestEmail(true);
    try {
      const { data, error } = await supabase.functions.invoke('test-email');
      
      if (error) throw error;
      
      if (data?.success) {
        toast({
          title: 'Test email sent!',
          description: 'Check your inbox to verify it arrived.',
        });
      } else {
        throw new Error(data?.error || 'Failed to send test email');
      }
    } catch (error: any) {
      console.error('Test email error:', error);
      toast({
        title: 'Email test failed',
        description: error.message || 'Failed to send test email',
        variant: 'destructive',
      });
    } finally {
      setSendingTestEmail(false);
    }
  };

  const handleTestSms = async () => {
    setSendingTestSms(true);
    try {
      const { data, error } = await supabase.functions.invoke('test-sms');
      
      if (error) throw error;
      
      if (data?.success) {
        toast({
          title: 'Test SMS sent!',
          description: 'Check your phone to verify it arrived.',
        });
      } else {
        throw new Error(data?.error || 'Failed to send test SMS');
      }
    } catch (error: any) {
      console.error('Test SMS error:', error);
      toast({
        title: 'SMS test failed',
        description: error.message || 'Failed to send test SMS',
        variant: 'destructive',
      });
    } finally {
      setSendingTestSms(false);
    }
  };

  const handleSendBroadcast = async () => {
    if (broadcastMode === 'email') {
      if (!broadcastSubject.trim() || !broadcastMessage.trim()) {
        toast({
          title: 'Missing fields',
          description: 'Please enter both subject and message',
          variant: 'destructive',
        });
        return;
      }
    } else {
      if (!broadcastMessage.trim()) {
        toast({
          title: 'Missing message',
          description: 'Please enter a message',
          variant: 'destructive',
        });
        return;
      }
    }

    setSendingBroadcast(true);
    try {
      if (broadcastMode === 'email') {
        const { data, error } = await supabase.functions.invoke('send-broadcast', {
          body: {
            subject: broadcastSubject,
            message: broadcastMessage,
          },
        });
        
        if (error) throw error;
        
        if (data?.success) {
          toast({
            title: 'Broadcast sent!',
            description: `Email sent to ${data.sentCount} user(s)`,
          });
          setBroadcastSubject('');
          setBroadcastMessage('');
        } else {
          throw new Error(data?.error || 'Failed to send broadcast');
        }
      } else {
        const { data, error } = await supabase.functions.invoke('send-sms-broadcast', {
          body: {
            message: broadcastMessage,
          },
        });
        
        if (error) throw error;
        
        if (data?.success) {
          toast({
            title: 'SMS Broadcast sent!',
            description: `SMS sent to ${data.sentCount} user(s)${data.failedCount > 0 ? `, ${data.failedCount} failed` : ''}`,
          });
          setBroadcastMessage('');
        } else {
          throw new Error(data?.error || 'Failed to send SMS broadcast');
        }
      }
    } catch (error: any) {
      console.error('Broadcast error:', error);
      toast({
        title: 'Broadcast failed',
        description: error.message || 'Failed to send broadcast',
        variant: 'destructive',
      });
    } finally {
      setSendingBroadcast(false);
    }
  };

  const getSubscriptionBadge = (status: string | null, endDate: string | null) => {
    if (!status) {
      return <Badge variant="outline">None</Badge>;
    }
    
    const isExpired = endDate && new Date(endDate) < new Date();
    
    if (isExpired) {
      return <Badge variant="outline">Expired</Badge>;
    }
    
    switch (status) {
      case 'active':
        return <Badge className="gap-1"><Crown className="h-3 w-3" />Active</Badge>;
      case 'trialing':
        return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" />Trial</Badge>;
      case 'admin_granted':
        return <Badge variant="secondary" className="gap-1"><Gift className="h-3 w-3" />Free</Badge>;
      case 'canceled':
        return <Badge variant="outline">Canceled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const adminCount = users.filter(u => u.isAdmin).length;
  const emailOptInCount = users.filter(u => u.consent_email).length;
  const smsOptInCount = users.filter(u => u.consent_sms).length;
  const currentRecipientCount = broadcastMode === 'email' ? emailOptInCount : smsOptInCount;

  // Subscription stats
  const activeSubCount = users.filter(u => u.subscription_status === 'active').length;
  const trialCount = users.filter(u => u.subscription_status === 'trialing').length;
  const adminGrantedCount = users.filter(u => u.subscription_status === 'admin_granted').length;

  const canSendBroadcast = broadcastMode === 'email' 
    ? broadcastSubject.trim() && broadcastMessage.trim() && emailOptInCount > 0
    : broadcastMessage.trim() && smsOptInCount > 0;

  return (
    <>
      <Helmet>
        <title>Admin | GoalPilot</title>
      </Helmet>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage users, subscriptions, and system settings</p>
          </div>

          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{users.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Subscribers</CardTitle>
                <Crown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeSubCount}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">In Trial</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{trialCount}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Admin Granted</CardTitle>
                <Gift className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{adminGrantedCount}</div>
              </CardContent>
            </Card>
          </div>

          {/* Grant Free Access */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5" />
                Grant Free Access
              </CardTitle>
              <CardDescription>
                Give a user complimentary access to GroovyPlanning
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  placeholder="user@example.com"
                  value={grantEmail}
                  onChange={(e) => setGrantEmail(e.target.value)}
                  className="flex-1"
                  disabled={granting}
                />
                <Select value={grantDuration} onValueChange={setGrantDuration} disabled={granting}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1month">1 Month</SelectItem>
                    <SelectItem value="6months">6 Months</SelectItem>
                    <SelectItem value="1year">1 Year</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleGrantAccess} disabled={granting || !grantEmail.trim()}>
                  {granting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Granting...
                    </>
                  ) : (
                    <>
                      <Gift className="mr-2 h-4 w-4" />
                      Grant Access
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Test Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Admins</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{adminCount}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Email Test</CardTitle>
                <Mail className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleTestEmail} 
                  disabled={sendingTestEmail}
                  className="gap-2"
                >
                  {sendingTestEmail ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Mail className="h-4 w-4" />
                  )}
                  {sendingTestEmail ? 'Sending...' : 'Send Test'}
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">SMS Test</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleTestSms} 
                  disabled={sendingTestSms}
                  className="gap-2"
                >
                  {sendingTestSms ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <MessageSquare className="h-4 w-4" />
                  )}
                  {sendingTestSms ? 'Sending...' : 'Send Test'}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Broadcast */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Megaphone className="h-5 w-5" />
                Send Broadcast
              </CardTitle>
              <CardDescription>
                Send a message to all users who have opted in
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Mode Toggle */}
              <div className="flex gap-2">
                <Button
                  variant={broadcastMode === 'email' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setBroadcastMode('email')}
                  className="gap-2"
                >
                  <Mail className="h-4 w-4" />
                  Email ({emailOptInCount})
                </Button>
                <Button
                  variant={broadcastMode === 'sms' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setBroadcastMode('sms')}
                  className="gap-2"
                >
                  <MessageSquare className="h-4 w-4" />
                  SMS ({smsOptInCount})
                </Button>
              </div>

              {/* Email Subject (only for email mode) */}
              {broadcastMode === 'email' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Subject</label>
                  <Input
                    placeholder="Enter email subject..."
                    value={broadcastSubject}
                    onChange={(e) => setBroadcastSubject(e.target.value)}
                    disabled={sendingBroadcast}
                  />
                </div>
              )}

              {/* Message */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Message</label>
                  {broadcastMode === 'sms' && (
                    <span className={`text-xs ${broadcastMessage.length > 160 ? 'text-destructive' : 'text-muted-foreground'}`}>
                      {broadcastMessage.length}/160
                    </span>
                  )}
                </div>
                <Textarea
                  placeholder={broadcastMode === 'email' ? 'Enter your message...' : 'Enter SMS message (160 char recommended)...'}
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  rows={broadcastMode === 'email' ? 5 : 3}
                  disabled={sendingBroadcast}
                />
              </div>

              {/* Send Button with Confirmation */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    disabled={sendingBroadcast || !canSendBroadcast}
                    className="gap-2"
                  >
                    {sendingBroadcast ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    {sendingBroadcast 
                      ? 'Sending...' 
                      : `Send ${broadcastMode === 'email' ? 'Email' : 'SMS'} to ${currentRecipientCount} User${currentRecipientCount !== 1 ? 's' : ''}`
                    }
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Send {broadcastMode === 'email' ? 'Email' : 'SMS'} Broadcast?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This will send {broadcastMode === 'email' ? 'an email' : 'an SMS'} to {currentRecipientCount} user{currentRecipientCount !== 1 ? 's' : ''} who have opted in.
                      {broadcastMode === 'sms' && broadcastMessage.length > 160 && (
                        <span className="block mt-2 text-destructive">
                          Warning: Your message exceeds 160 characters and may be split into multiple SMS messages.
                        </span>
                      )}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleSendBroadcast}>
                      Send {broadcastMode === 'email' ? 'Email' : 'SMS'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>

          {/* User Management Table */}
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>View and manage all registered users</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Display Name</TableHead>
                      <TableHead>Subscription</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.email || 'N/A'}</TableCell>
                        <TableCell>{user.display_name || '—'}</TableCell>
                        <TableCell>
                          {getSubscriptionBadge(user.subscription_status, user.subscription_end)}
                        </TableCell>
                        <TableCell>
                          {user.isAdmin ? (
                            <Badge variant="default">Admin</Badge>
                          ) : (
                            <Badge variant="secondary">User</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {format(new Date(user.created_at), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleAdmin(user.user_id, user.email, user.isAdmin || false)}
                          >
                            {user.isAdmin ? (
                              <>
                                <ShieldX className="h-4 w-4 mr-1" />
                                Remove Admin
                              </>
                            ) : (
                              <>
                                <ShieldCheck className="h-4 w-4 mr-1" />
                                Make Admin
                              </>
                            )}
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete User</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete {user.email || 'this user'}? This will remove their profile data but not their auth account.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteUser(user.user_id, user.email)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </>
  );
}
