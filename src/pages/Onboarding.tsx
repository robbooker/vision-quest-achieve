import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Toasty } from "@/components/tour/Toasty";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useSiteTour } from "@/hooks/useSiteTour";

export default function Onboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { startTour } = useSiteTour();
  
  const [displayName, setDisplayName] = useState("");
  const [phoneUs, setPhoneUs] = useState("");
  const [phoneWhatsapp, setPhoneWhatsapp] = useState("");
  const [consentEmail, setConsentEmail] = useState(false);
  const [consentSms, setConsentSms] = useState(false);
  const [consentWhatsapp, setConsentWhatsapp] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      if (!user) return;
      
      const { data } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", user.id)
        .single();
      
      if (data?.display_name) {
        setDisplayName(data.display_name);
      }
      setIsLoading(false);
    }
    
    loadProfile();
  }, [user]);

  const formatUsPhone = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 10);
    if (digits.length === 0) return "";
    if (digits.length <= 3) return `(${digits}`;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  };

  const handlePhoneUsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhoneUs(formatUsPhone(e.target.value));
  };

  const handleSubmit = async () => {
    if (!user) return;
    
    if (!displayName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter what you'd like to be called.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      const hasAnyConsent = consentEmail || consentSms || consentWhatsapp;
      const cleanPhoneUs = phoneUs.replace(/\D/g, "");
      
      const profileData = {
        user_id: user.id,
        display_name: displayName.trim(),
        phone_us: cleanPhoneUs.length > 0 ? cleanPhoneUs : null,
        phone_whatsapp: phoneWhatsapp.trim().length > 0 ? phoneWhatsapp.trim() : null,
        consent_email: consentEmail,
        consent_sms: consentSms,
        consent_whatsapp: consentWhatsapp,
        consent_timestamp: hasAnyConsent ? new Date().toISOString() : null,
        onboarding_completed: true,
      };
      
      const { error } = await supabase
        .from("profiles")
        .upsert(profileData, { onConflict: "user_id" })
        .select();

      if (error) {
        toast({
          title: "Error saving profile",
          description: error.message,
          variant: "destructive",
        });
        setIsSaving(false);
        return;
      }

      // Verify the update was committed by refetching
      const { data: verifyData } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("user_id", user.id)
        .single();

      if (!verifyData?.onboarding_completed) {
        // If verification fails, wait and try again
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Clear the tour completion flag so Toasty tour starts fresh
      localStorage.removeItem("groovy-planning-tour-completed");
      
      // Mark that we just completed onboarding (for ProtectedRoute to skip re-check)
      sessionStorage.setItem("just-completed-onboarding", "true");

      toast({
        title: "Welcome aboard! 🍞",
        description: "You're all set up. Let me show you around!",
      });

      setIsSaving(false);
      
      // Start the tour BEFORE navigation so it's set in the shared context
      startTour();
      
      // Small delay to ensure tour state is set, then navigate
      setTimeout(() => {
        // Use window.location for guaranteed navigation (bypasses any React Router issues)
        window.location.href = "/today";
      }, 100);
      
    } catch (err) {
      console.error("Unexpected error during onboarding:", err);
      toast({
        title: "Something went wrong",
        description: "Please try again or skip for now.",
        variant: "destructive",
      });
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 space-y-6">
          {/* Toasty Welcome */}
          <div className="flex flex-col items-center text-center space-y-3">
            <Toasty expression="wave" size="lg" />
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-foreground">Welcome to Groovy Planning!</h1>
              <p className="text-muted-foreground">
                I'm Toasty, and I'll help you get set up in just a minute!
              </p>
            </div>
          </div>

          {/* Name Input */}
          <div className="space-y-2">
            <Label htmlFor="displayName">What should I call you?</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your preferred name"
              className="text-lg"
            />
          </div>

          {/* Phone Numbers */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Phone Numbers (optional)</Label>
            
            <div className="space-y-2">
              <Label htmlFor="phoneUs" className="text-sm text-muted-foreground">
                US Phone (for SMS reminders)
              </Label>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">+1</span>
                <Input
                  id="phoneUs"
                  value={phoneUs}
                  onChange={handlePhoneUsChange}
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
              />
            </div>
          </div>

          {/* Consent Checkboxes */}
          <div className="space-y-3">
            <Label className="text-base font-medium">How can we remind you about your goals?</Label>
            
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

            <p className="text-xs text-muted-foreground italic pt-2">
              We promise to only send helpful reminders — never spam! 🤞
            </p>
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={isSaving || !displayName.trim()}
            className="w-full text-lg py-6"
            size="lg"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Setting up...
              </>
            ) : (
              "Let's Get Started!"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
