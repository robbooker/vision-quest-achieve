import { MessageCircle, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";

const TOASTY_PHONE_DISPLAY = "989-266-5371";
const TOASTY_PHONE_SMS = "sms:+19892665371";

export function AnnouncementBar() {
  return (
    <div className="fixed inset-x-0 top-0 z-50 border-b bg-primary/10 backdrop-blur supports-[backdrop-filter]:bg-primary/10">
      <div className="container flex h-10 items-center justify-between gap-3 px-4">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <span className="inline-flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>
              Text <span className="font-semibold">Toasty</span>, Your Groovy Planning Assistant
            </span>
          </span>
        </div>

        <Button size="sm" asChild className="shrink-0">
          <a href={TOASTY_PHONE_SMS} aria-label={`Text Toasty at ${TOASTY_PHONE_DISPLAY}`}>
            <MessageCircle className="mr-2 h-4 w-4" />
            {TOASTY_PHONE_DISPLAY}
          </a>
        </Button>
      </div>
    </div>
  );
}
