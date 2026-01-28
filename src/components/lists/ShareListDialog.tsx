import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useListShares, ListShare } from "@/hooks/useListShares";
import { List } from "@/hooks/useLists";
import { Loader2, X, Check, Clock, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ShareListDialogProps {
  list: List | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShareListDialog({ list, open, onOpenChange }: ShareListDialogProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const { shares, shareList, deleteShare } = useListShares(list?.id);
  const { toast } = useToast();

  const handleShare = async () => {
    if (!phoneNumber.trim()) return;
    
    await shareList.mutateAsync({ phoneNumber: phoneNumber.trim() });
    setPhoneNumber("");
  };

  const copyShareLink = (share: ListShare) => {
    const url = `${window.location.origin}/list/view/${share.access_token}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Link copied to clipboard" });
  };

  const formatPhone = (phone: string) => {
    // Format E.164 to readable format
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length === 11 && cleaned.startsWith("1")) {
      return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
    return phone;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share "{list?.title}"</DialogTitle>
          <DialogDescription>
            Share this list via text message. Recipients can view the list without an account.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Phone number</Label>
            <div className="flex gap-2">
              <Input
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+1 (555) 123-4567"
                type="tel"
              />
              <Button 
                onClick={handleShare} 
                disabled={shareList.isPending || !phoneNumber.trim()}
              >
                {shareList.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Send"
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              They'll receive a text with a link to view this list.
            </p>
          </div>

          {shares.length > 0 && (
            <div className="space-y-2">
              <Label>Currently shared with</Label>
              <div className="space-y-2">
                {shares.map((share) => (
                  <div 
                    key={share.id} 
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{formatPhone(share.phone_number)}</span>
                      {share.first_viewed_at ? (
                        <span className="flex items-center gap-1 text-xs text-green-600">
                          <Check className="h-3 w-3" />
                          Viewed
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          Pending
                        </span>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => copyShareLink(share)}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => deleteShare.mutate(share.id)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
