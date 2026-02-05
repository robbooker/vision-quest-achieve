import { Link } from "react-router-dom";
import { ArrowRight, Mic } from "lucide-react";

import { Button } from "@/components/ui/button";

export function AnnouncementBar() {
  return (
    <div className="fixed inset-x-0 top-0 z-50 border-b bg-primary/10 backdrop-blur supports-[backdrop-filter]:bg-primary/10">
      <div className="container flex h-10 items-center justify-between gap-3 px-4">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <span className="inline-flex items-center gap-2">
            <Mic className="h-4 w-4 text-primary" />
            <span className="hidden sm:inline">
              <span className="font-semibold">New:</span> AI Morning Briefing — Wake up to a personalized audio podcast!
            </span>
            <span className="sm:hidden">
              <span className="font-semibold">New:</span> Morning Briefing!
            </span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" asChild className="shrink-0 gap-1.5 hidden sm:flex">
            <Link to="/blog/morning-briefing">
              Learn how
            </Link>
          </Button>
          <Button size="sm" asChild className="shrink-0 gap-1.5">
            <Link to="/morning-briefing">
              <Mic className="h-3.5 w-3.5" />
              Set Up
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
