import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, Mail, Share2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { MonthlyRecap } from "@/hooks/useMonthlyRecap";
import { supabase } from "@/integrations/supabase/client";
import { format, parse } from "date-fns";

interface RecapExportMenuProps {
  recap: MonthlyRecap;
}

export function RecapExportMenu({ recap }: RecapExportMenuProps) {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const monthDate = parse(recap.month + '-01', 'yyyy-MM-dd', new Date());
  const monthLabel = format(monthDate, 'MMMM yyyy');

  const handlePdfExport = async () => {
    setIsExporting(true);
    try {
      // Dynamically import the libraries
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);

      // Find the recap preview element
      const element = document.querySelector('[data-recap-preview]');
      if (!element) {
        throw new Error('Recap preview not found');
      }

      const canvas = await html2canvas(element as HTMLElement, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`recap-${recap.month}.pdf`);

      toast({
        title: "PDF exported!",
        description: `Your ${monthLabel} recap has been downloaded`,
      });
    } catch (error) {
      console.error('PDF export error:', error);
      toast({
        title: "Export failed",
        description: "Could not generate PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleEmailSend = async () => {
    if (!recipientEmail) return;

    setIsSendingEmail(true);
    try {
      const { error } = await supabase.functions.invoke('email-recap', {
        body: {
          recap_id: recap.id,
          recipient_email: recipientEmail,
        },
      });

      if (error) throw error;

      toast({
        title: "Email sent!",
        description: `Recap sent to ${recipientEmail}`,
      });
      setEmailDialogOpen(false);
      setRecipientEmail('');
    } catch (error) {
      console.error('Email send error:', error);
      toast({
        title: "Failed to send",
        description: "Could not send email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={isExporting}>
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Share2 className="h-4 w-4 mr-2" />
            )}
            Export
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handlePdfExport} disabled={isExporting}>
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setEmailDialogOpen(true)}>
            <Mail className="h-4 w-4 mr-2" />
            Send via Email
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Recap via Email</DialogTitle>
            <DialogDescription>
              Send your {monthLabel} recap summary to any email address.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Recipient Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="friend@example.com"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleEmailSend}
              disabled={!recipientEmail || isSendingEmail}
            >
              {isSendingEmail ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Send Email
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
