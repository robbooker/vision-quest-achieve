import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Helmet } from "react-helmet-async";
import { Sparkles } from "lucide-react";

export default function Spiritual() {
  return (
    <DashboardLayout>
      <Helmet>
        <title>Spiritual | Groovy Planning</title>
        <meta name="description" content="Track your spiritual growth and practices." />
      </Helmet>
      
      <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-xl bg-violet-500/20">
            <Sparkles className="h-8 w-8 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Spiritual</h1>
            <p className="text-sm text-muted-foreground">
              Track your spiritual growth and practices
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-dashed border-muted-foreground/30 p-12 text-center">
          <Sparkles className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-muted-foreground mb-2">
            Coming Soon
          </h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            This page will house your spiritual journey tracking. For now, you can tag 
            tasks, focus sessions, notes, and more with the Spiritual pillar.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
