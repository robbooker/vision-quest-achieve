import { useState } from "react";
import { AdminTabs } from "@/components/admin/AdminTabs";
import { changelog, type ChangeItem } from "@/data/changelog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { format, parseISO } from "date-fns";

const categories = [
  "briefing",
  "trading",
  "physical",
  "infrastructure",
  "spiritual",
  "journal",
  "search",
  "general",
] as const;

const categoryColors: Record<ChangeItem["category"], string> = {
  briefing: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  trading: "bg-green-500/20 text-green-400 border-green-500/30",
  physical: "bg-red-500/20 text-red-400 border-red-500/30",
  infrastructure: "bg-slate-500/20 text-slate-400 border-slate-500/30",
  spiritual: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  journal: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  search: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  general: "bg-muted text-muted-foreground border-border",
};

export default function AdminChangelog() {
  const [activeCategories, setActiveCategories] = useState<Set<string>>(
    new Set(categories)
  );

  const toggleCategory = (cat: string) => {
    setActiveCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) {
        next.delete(cat);
      } else {
        next.add(cat);
      }
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <AdminTabs />

        <h1 className="text-2xl font-bold text-foreground mb-6">Changelog</h1>

        {/* Category filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => toggleCategory(cat)}
              className={`px-3 py-1 text-xs font-medium rounded-full border capitalize transition-opacity ${
                categoryColors[cat]
              } ${activeCategories.has(cat) ? "opacity-100" : "opacity-30"}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Version cards */}
        <div className="space-y-4">
          {changelog.map((entry) => {
            const filteredChanges = entry.changes.filter((c) =>
              activeCategories.has(c.category)
            );
            if (filteredChanges.length === 0) return null;

            return (
              <Card key={entry.version} className="border-border">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <Badge variant="default" className="text-xs">
                      v{entry.version}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {format(parseISO(entry.date), "MMM d, yyyy")}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {entry.highlights}
                  </p>
                </CardHeader>
                <CardContent className="pt-0">
                  <ul className="space-y-2">
                    {filteredChanges.map((change) => (
                      <li
                        key={change.label}
                        className="flex flex-wrap items-start gap-2 text-sm"
                      >
                        <span className="font-semibold text-foreground">
                          {change.label}
                        </span>
                        <span className="text-muted-foreground">
                          {change.description}
                        </span>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-full border capitalize ${
                            categoryColors[change.category]
                          }`}
                        >
                          {change.category}
                        </span>
                        {change.internal && (
                          <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-full border bg-amber-500/20 text-amber-400 border-amber-500/30">
                            Internal
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
