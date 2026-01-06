import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AdminTabs } from '@/components/admin/AdminTabs';
import { Users, Shield, Crown, Clock, Gift, Loader2, ArrowRight } from 'lucide-react';
import { format, addMonths, addYears } from 'date-fns';
import { Link } from 'react-router-dom';

export default function Admin() {
  const [stats, setStats] = useState({ total: 0, active: 0, trial: 0, granted: 0, admins: 0 });
  const [loading, setLoading] = useState(true);
  const [grantEmail, setGrantEmail] = useState('');
  const [grantDuration, setGrantDuration] = useState('1year');
  const [granting, setGranting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data: profiles } = await supabase.from('profiles').select('user_id');
        const { data: adminRoles } = await supabase.from('user_roles').select('user_id').eq('role', 'admin');
        const { data: subscriptions } = await supabase.from('subscriptions').select('status');

        setStats({
          total: profiles?.length || 0,
          active: subscriptions?.filter(s => s.status === 'active').length || 0,
          trial: subscriptions?.filter(s => s.status === 'trialing').length || 0,
          granted: subscriptions?.filter(s => s.status === 'admin_granted').length || 0,
          admins: adminRoles?.length || 0,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const handleGrantAccess = async () => {
    if (!grantEmail.trim()) {
      toast({ title: 'Missing email', description: 'Please enter an email address', variant: 'destructive' });
      return;
    }

    setGranting(true);
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('email', grantEmail.trim())
        .single();

      if (profileError || !profile) throw new Error('User not found with that email');

      const now = new Date();
      let endDate: Date;
      switch (grantDuration) {
        case '1month': endDate = addMonths(now, 1); break;
        case '6months': endDate = addMonths(now, 6); break;
        default: endDate = addYears(now, 1); break;
      }

      const { error: subError } = await supabase.from('subscriptions').upsert({
        user_id: profile.user_id,
        status: 'admin_granted',
        subscription_end: endDate.toISOString(),
        granted_by_admin: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

      if (subError) throw subError;

      toast({ title: 'Access granted', description: `${grantEmail} now has access until ${format(endDate, 'MMMM d, yyyy')}` });
      setGrantEmail('');
    } catch (error: any) {
      console.error('Error granting access:', error);
      toast({ title: 'Error', description: error.message || 'Failed to grant access', variant: 'destructive' });
    } finally {
      setGranting(false);
    }
  };

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

          <AdminTabs />

          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? '...' : stats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active</CardTitle>
                <Crown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? '...' : stats.active}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Trial</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? '...' : stats.trial}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Granted</CardTitle>
                <Gift className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? '...' : stats.granted}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Admins</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? '...' : stats.admins}</div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="h-5 w-5" />
                  Grant Free Access
                </CardTitle>
                <CardDescription>Give a user complimentary access</CardDescription>
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
                    {granting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Gift className="h-4 w-4 mr-1" />}
                    Grant
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  User Management
                </CardTitle>
                <CardDescription>View, filter, and manage all users</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild>
                  <Link to="/admin/users">
                    Manage Users <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    </>
  );
}
