import { Link } from "react-router-dom";
import { FileText, ArrowRight, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";

export function AnnouncementBar() {
  return (
    <div className="fixed inset-x-0 top-0 z-50 border-b bg-primary/10 backdrop-blur supports-[backdrop-filter]:bg-primary/10">
      <div className="container flex h-10 items-center justify-between gap-3 px-4">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <span className="inline-flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <span className="hidden sm:inline">
              <span className="font-semibold">New:</span> Month in Review — Generate your January audit now!
            </span>
            <span className="sm:hidden">
              <span className="font-semibold">New:</span> January Audit ready!
            </span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" asChild className="shrink-0 gap-1.5 hidden sm:flex">
            <Link to="/blog/month-in-review">
              Learn how
            </Link>
          </Button>
          <Button size="sm" asChild className="shrink-0 gap-1.5">
            <Link to="/monthly-audit">
              <Sparkles className="h-3.5 w-3.5" />
              Generate
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
