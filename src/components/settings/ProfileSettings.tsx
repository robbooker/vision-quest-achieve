import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { User, Check, Loader2, Phone, MessageSquare, Trash2, Hash } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface ProfileData {
  display_name: string | null;
  phone_us: string | null;
  phone_whatsapp: string | null;
  consent_email: boolean | null;
  consent_sms: boolean | null;
  consent_whatsapp: boolean | null;
  member_pin: string | null;
}

export function ProfileSettings() {
  const { user, signOut } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [phoneUs, setPhoneUs] = useState('');
  const [phoneWhatsapp, setPhoneWhatsapp] = useState('');
  const [consentEmail, setConsentEmail] = useState(false);
  const [consentSms, setConsentSms] = useState(false);
  const [consentWhatsapp, setConsentWhatsapp] = useState(false);
  const [memberPin, setMemberPin] = useState<string | null>(null);
  
  const [originalData, setOriginalData] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const formatUsPhone = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 10);
    if (digits.length === 0) return "";
    if (digits.length <= 3) return `(${digits}`;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  };

  const formatStoredPhone = (digits: string | null) => {
    if (!digits) return '';
    return formatUsPhone(digits);
  };

  useEffect(() => {
    async function fetchProfile() {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('display_name, phone_us, phone_whatsapp, consent_email, consent_sms, consent_whatsapp, member_pin')
        .eq('user_id', user.id)
        .single();
      
      if (error) {
        console.error('Error fetching profile:', error);
      } else if (data) {
        setDisplayName(data.display_name || '');
        setPhoneUs(formatStoredPhone(data.phone_us));
        setPhoneWhatsapp(data.phone_whatsapp || '');
        setConsentEmail(data.consent_email || false);
        setConsentSms(data.consent_sms || false);
        setConsentWhatsapp(data.consent_whatsapp || false);
        setMemberPin(data.member_pin);
        setOriginalData(data);
      }
      setIsLoading(false);
    }

    fetchProfile();
  }, [user]);

  const hasChanges = () => {
    if (!originalData) return false;
    const currentPhoneDigits = phoneUs.replace(/\D/g, '');
    return (
      displayName !== (originalData.display_name || '') ||
      currentPhoneDigits !== (originalData.phone_us || '') ||
      phoneWhatsapp !== (originalData.phone_whatsapp || '') ||
      consentEmail !== (originalData.consent_email || false) ||
      consentSms !== (originalData.consent_sms || false) ||
      consentWhatsapp !== (originalData.consent_whatsapp || false)
    );
  };

  const handleSave = async () => {
    if (!user || !hasChanges()) return;
    
    setIsSaving(true);
    
    const phoneUsDigits = phoneUs.replace(/\D/g, '') || null;
    const phoneWhatsappValue = phoneWhatsapp.trim() || null;
    const hasAnyConsent = consentEmail || consentSms || consentWhatsapp;
    
    const { error } = await supabase
      .from('profiles')
      .update({ 
        display_name: displayName.trim(),
        phone_us: phoneUsDigits,
        phone_whatsapp: phoneWhatsappValue,
        consent_email: consentEmail,
        consent_sms: consentSms,
        consent_whatsapp: consentWhatsapp,
        consent_timestamp: hasAnyConsent ? new Date().toISOString() : null,
      })
      .eq('user_id', user.id);
    
    if (error) {
      toast.error('Failed to update profile');
      console.error('Error updating profile:', error);
    } else {
      setOriginalData({
        display_name: displayName.trim(),
        phone_us: phoneUsDigits,
        phone_whatsapp: phoneWhatsappValue,
        consent_email: consentEmail,
        consent_sms: consentSms,
        consent_whatsapp: consentWhatsapp,
        member_pin: memberPin,
      });
      toast.success('Profile updated');
    }
    setIsSaving(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          Profile
        </CardTitle>
        <CardDescription>
          Your display name, contact info, and communication preferences.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Display Name */}
        <div className="space-y-2">
          <Label htmlFor="displayName">Display Name</Label>
          {isLoading ? (
            <div className="h-10 bg-muted animate-pulse rounded-md" />
          ) : (
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              className="max-w-xs"
            />
          )}
        </div>
        
        <div className="space-y-2">
          <Label>Email</Label>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
        </div>

        {/* Member PIN */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Hash className="h-4 w-4 text-primary" />
            <Label>Member Number</Label>
          </div>
          {isLoading ? (
            <div className="h-8 bg-muted animate-pulse rounded-md w-20" />
          ) : memberPin ? (
            <Badge variant="secondary" className="text-lg font-mono px-3 py-1">
              {memberPin}
            </Badge>
          ) : (
            <p className="text-sm text-muted-foreground">Not assigned</p>
          )}
          <p className="text-xs text-muted-foreground">Your unique member PIN</p>
        </div>

        <Separator />

        {/* Phone Numbers */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-primary" />
            <Label className="text-base font-medium">Phone Numbers</Label>
          </div>
          
          {isLoading ? (
            <div className="space-y-3">
              <div className="h-10 bg-muted animate-pulse rounded-md max-w-xs" />
              <div className="h-10 bg-muted animate-pulse rounded-md max-w-xs" />
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="phoneUs" className="text-sm text-muted-foreground">
                  US Phone (for SMS reminders)
                </Label>
                <div className="flex items-center gap-2 max-w-xs">
                  <span className="text-muted-foreground text-sm">+1</span>
                  <Input
                    id="phoneUs"
                    value={phoneUs}
                    onChange={(e) => setPhoneUs(formatUsPhone(e.target.value))}
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneWhatsapp" className="text-sm text-muted-foreground">
                  WhatsApp Number (include country code)
                </Label>
                <Input
                  id="phoneWhatsapp"
                  value={phoneWhatsapp}
                  onChange={(e) => setPhoneWhatsapp(e.target.value)}
                  placeholder="+1 555 123 4567"
                  className="max-w-xs"
                />
              </div>
            </>
          )}
        </div>

        <Separator />

        {/* Communication Preferences */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            <Label className="text-base font-medium">Communication Preferences</Label>
          </div>
          
          {isLoading ? (
            <div className="space-y-3">
              <div className="h-6 bg-muted animate-pulse rounded-md w-48" />
              <div className="h-6 bg-muted animate-pulse rounded-md w-48" />
              <div className="h-6 bg-muted animate-pulse rounded-md w-48" />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="consentEmail"
                  checked={consentEmail}
                  onCheckedChange={(checked) => setConsentEmail(checked === true)}
                />
                <label htmlFor="consentEmail" className="text-sm leading-tight cursor-pointer">
                  <span className="font-medium">Email reminders</span>
                  <p className="text-muted-foreground text-xs">Weekly reviews and goal updates</p>
                </label>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="consentSms"
                  checked={consentSms}
                  onCheckedChange={(checked) => setConsentSms(checked === true)}
                  disabled={!phoneUs}
                />
                <label htmlFor="consentSms" className="text-sm leading-tight cursor-pointer">
                  <span className="font-medium">SMS text messages</span>
                  <p className="text-muted-foreground text-xs">
                    {phoneUs ? "Quick reminders to your phone" : "Add a US phone number to enable"}
                  </p>
                </label>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="consentWhatsapp"
                  checked={consentWhatsapp}
                  onCheckedChange={(checked) => setConsentWhatsapp(checked === true)}
                  disabled={!phoneWhatsapp}
                />
                <label htmlFor="consentWhatsapp" className="text-sm leading-tight cursor-pointer">
                  <span className="font-medium">WhatsApp messages</span>
                  <p className="text-muted-foreground text-xs">
                    {phoneWhatsapp ? "Reminders via WhatsApp" : "Add a WhatsApp number to enable"}
                  </p>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Save Button */}
        {hasChanges() && (
          <Button onClick={handleSave} disabled={isSaving} className="mt-4">
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        )}

        <Separator className="mt-6" />

        {/* Delete Account */}
        <div className="space-y-2 pt-4">
          <Label className="text-destructive font-medium">Danger Zone</Label>
          <p className="text-sm text-muted-foreground">
            Permanently delete your account and all associated data.
          </p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={isDeleting}>
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Account
                  </>
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete your account
                  and remove all your data including goals, cycles, tasks, and preferences.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={async () => {
                    if (!user) return;
                    setIsDeleting(true);
                    try {
                      // Use type assertion since the function was just created and types haven't been regenerated
                      const { error } = await (supabase.rpc as any)('delete_user_account');
                      if (error) throw error;
                      toast.success('Account deleted successfully');
                      await signOut();
                    } catch (error) {
                      console.error('Error deleting account:', error);
                      toast.error('Failed to delete account');
                      setIsDeleting(false);
                    }
                  }}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete Account
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
