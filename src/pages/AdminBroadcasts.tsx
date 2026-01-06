import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { AdminTabs } from '@/components/admin/AdminTabs';
import { Mail, Loader2, Send, Megaphone, MessageSquare } from 'lucide-react';

type BroadcastMode = 'email' | 'sms';

export default function AdminBroadcasts() {
  const [sendingTestEmail, setSendingTestEmail] = useState(false);
  const [sendingTestSms, setSendingTestSms] = useState(false);
  const [sendingBroadcast, setSendingBroadcast] = useState(false);
  const [broadcastMode, setBroadcastMode] = useState<BroadcastMode>('email');
  const [broadcastSubject, setBroadcastSubject] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [emailOptInCount, setEmailOptInCount] = useState(0);
  const [smsOptInCount, setSmsOptInCount] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    const fetchCounts = async () => {
      const { data: profiles } = await supabase.from('profiles').select('consent_email, consent_sms');
      if (profiles) {
        setEmailOptInCount(profiles.filter(p => p.consent_email).length);
        setSmsOptInCount(profiles.filter(p => p.consent_sms).length);
      }
    };
    fetchCounts();
  }, []);

  const handleTestEmail = async () => {
    setSendingTestEmail(true);
    try {
      const { data, error } = await supabase.functions.invoke('test-email');
      if (error) throw error;
      if (data?.success) {
        toast({ title: 'Test email sent!', description: 'Check your inbox to verify it arrived.' });
      } else {
        throw new Error(data?.error || 'Failed to send test email');
      }
    } catch (error: any) {
      console.error('Test email error:', error);
      toast({ title: 'Email test failed', description: error.message || 'Failed to send test email', variant: 'destructive' });
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
        toast({ title: 'Test SMS sent!', description: 'Check your phone to verify it arrived.' });
      } else {
        throw new Error(data?.error || 'Failed to send test SMS');
      }
    } catch (error: any) {
      console.error('Test SMS error:', error);
      toast({ title: 'SMS test failed', description: error.message || 'Failed to send test SMS', variant: 'destructive' });
    } finally {
      setSendingTestSms(false);
    }
  };

  const handleSendBroadcast = async () => {
    if (broadcastMode === 'email') {
      if (!broadcastSubject.trim() || !broadcastMessage.trim()) {
        toast({ title: 'Missing fields', description: 'Please enter both subject and message', variant: 'destructive' });
        return;
      }
    } else {
      if (!broadcastMessage.trim()) {
        toast({ title: 'Missing message', description: 'Please enter a message', variant: 'destructive' });
        return;
      }
    }

    setSendingBroadcast(true);
    try {
      if (broadcastMode === 'email') {
        const { data, error } = await supabase.functions.invoke('send-broadcast', {
          body: { subject: broadcastSubject, message: broadcastMessage },
        });
        if (error) throw error;
        if (data?.success) {
          toast({ title: 'Broadcast sent!', description: `Email sent to ${data.sentCount} user(s)` });
          setBroadcastSubject('');
          setBroadcastMessage('');
        } else {
          throw new Error(data?.error || 'Failed to send broadcast');
        }
      } else {
        const { data, error } = await supabase.functions.invoke('send-sms-broadcast', {
          body: { message: broadcastMessage },
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
      toast({ title: 'Broadcast failed', description: error.message || 'Failed to send broadcast', variant: 'destructive' });
    } finally {
      setSendingBroadcast(false);
    }
  };

  const currentRecipientCount = broadcastMode === 'email' ? emailOptInCount : smsOptInCount;
  const canSendBroadcast = broadcastMode === 'email'
    ? broadcastSubject.trim() && broadcastMessage.trim() && emailOptInCount > 0
    : broadcastMessage.trim() && smsOptInCount > 0;

  return (
    <>
      <Helmet>
        <title>Broadcasts | Admin</title>
      </Helmet>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage users, subscriptions, and system settings</p>
          </div>

          <AdminTabs />

          {/* Test Cards */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Email Test</CardTitle>
                <Mail className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <Button variant="outline" size="sm" onClick={handleTestEmail} disabled={sendingTestEmail} className="gap-2">
                  {sendingTestEmail ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
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
                <Button variant="outline" size="sm" onClick={handleTestSms} disabled={sendingTestSms} className="gap-2">
                  {sendingTestSms ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
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
              <CardDescription>Send a message to all users who have opted in</CardDescription>
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
                  <Button disabled={sendingBroadcast || !canSendBroadcast} className="gap-2">
                    {sendingBroadcast ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    {sendingBroadcast
                      ? 'Sending...'
                      : `Send ${broadcastMode === 'email' ? 'Email' : 'SMS'} to ${currentRecipientCount} User${currentRecipientCount !== 1 ? 's' : ''}`}
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
        </div>
      </DashboardLayout>
    </>
  );
}
