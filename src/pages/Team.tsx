import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useTeamTasks } from "@/hooks/useTeamTasks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Plus, CheckCircle2, Inbox, Circle, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Helmet } from "react-helmet-async";

const TEAM_MEMBERS = [
  { value: "rob", label: "Rob", initials: "R", color: "bg-indigo-500" },
  { value: "liz", label: "Liz", initials: "L", color: "bg-rose-500" },
  { value: "buddy", label: "Buddy", initials: "B", color: "bg-emerald-500" },
];

const PRIORITY_CONFIG = {
  high: { label: "High", className: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800" },
  normal: { label: "Normal", className: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700" },
  low: { label: "Low", className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800" },
};

type FilterStatus = "all" | "open" | "done";

function AvatarPill({ member }: { member: string | null }) {
  const found = TEAM_MEMBERS.find((m) => m.value === member);
  if (!found) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
        <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-semibold">?</span>
        Unassigned
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-foreground">
      <span className={cn("w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white", found.color)}>
        {found.initials}
      </span>
      {found.label}
    </span>
  );
}

export default function Team() {
  const { tasks, loading, addTask, completeTask, reopenTask } = useTeamTasks();
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [completingIds, setCompletingIds] = useState<Set<string>>(new Set());

  // Form state
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newPriority, setNewPriority] = useState("normal");
  const [newAssignedTo, setNewAssignedTo] = useState<string>("");
  const [newCreatedBy, setNewCreatedBy] = useState("rob");

  const filteredTasks = tasks.filter((t) => {
    if (filter === "all") return true;
    return t.status === filter;
  });

  // Sort: open first, then done
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (a.status === "open" && b.status === "done") return -1;
    if (a.status === "done" && b.status === "open") return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const handleComplete = async (id: string) => {
    setCompletingIds((prev) => new Set(prev).add(id));
    await completeTask(id, "rob"); // Default completer from UI is Rob
    setTimeout(() => setCompletingIds((prev) => { const n = new Set(prev); n.delete(id); return n; }), 600);
  };

  const handleSubmit = async () => {
    if (!newTitle.trim()) return;
    const success = await addTask({
      title: newTitle.trim(),
      description: newDescription.trim() || undefined,
      priority: newPriority,
      created_by: newCreatedBy,
      assigned_to: newAssignedTo || null,
    });
    if (success) {
      setNewTitle("");
      setNewDescription("");
      setNewPriority("normal");
      setNewAssignedTo("");
      setSheetOpen(false);
    }
  };

  const openCount = tasks.filter((t) => t.status === "open").length;
  const doneCount = tasks.filter((t) => t.status === "done").length;

  return (
    <DashboardLayout>
      <Helmet>
        <title>Command Center | Scout</title>
      </Helmet>

      <div className="max-w-md mx-auto px-4 pb-24 pt-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Command Center</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Scout HQ · Active Tasks</p>
        </div>

        {/* Filter bar */}
        <div className="flex gap-2 mb-6">
          {([
            { key: "all" as FilterStatus, label: "All", count: tasks.length },
            { key: "open" as FilterStatus, label: "Open", count: openCount },
            { key: "done" as FilterStatus, label: "Done", count: doneCount },
          ]).map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "px-3.5 py-1.5 rounded-full text-xs font-medium transition-all",
                filter === f.key
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {f.label} <span className="ml-1 opacity-70">{f.count}</span>
            </button>
          ))}
        </div>

        {/* Task list */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : sortedTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Inbox className="w-10 h-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">All clear. Nothing on the board.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            <AnimatePresence mode="popLayout">
              {sortedTasks.map((task) => {
                const isDone = task.status === "done";
                const isCompleting = completingIds.has(task.id);
                const priorityCfg = PRIORITY_CONFIG[task.priority as keyof typeof PRIORITY_CONFIG] || PRIORITY_CONFIG.normal;

                return (
                  <motion.div
                    key={task.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: isCompleting ? 0.5 : 1, y: 0, scale: isCompleting ? 0.98 : 1 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                    className={cn(
                      "rounded-xl border bg-card p-4 shadow-sm transition-all",
                      isDone && "opacity-60"
                    )}
                  >
                    <div className="flex gap-3">
                      {/* Checkbox */}
                      <button
                        onClick={() => isDone ? reopenTask(task.id) : handleComplete(task.id)}
                        className="mt-0.5 shrink-0"
                      >
                        {isDone ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        ) : (
                          <Circle className="w-5 h-5 text-muted-foreground/40 hover:text-primary transition-colors" />
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        {/* Title */}
                        <p className={cn(
                          "text-[15px] font-medium leading-snug",
                          isDone && "line-through text-muted-foreground"
                        )}>
                          {task.title}
                        </p>

                        {/* Description */}
                        {task.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
                        )}

                        {/* Meta row */}
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <span className={cn("inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider", priorityCfg.className)}>
                            {priorityCfg.label}
                          </span>
                          <AvatarPill member={task.assigned_to} />
                          {isDone && task.completed_by && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                              <Check className="w-3 h-3" />
                              {TEAM_MEMBERS.find((m) => m.value === task.completed_by)?.label || task.completed_by}
                            </span>
                          )}
                        </div>

                        {/* Footer */}
                        <p className="text-[10px] text-muted-foreground/60 mt-1.5">
                          Added by {TEAM_MEMBERS.find((m) => m.value === task.created_by)?.label || task.created_by || "unknown"}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* FAB - outside scroll container */}
      <div className="fixed bottom-6 right-6 z-[9999]">
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <button className="w-14 h-14 rounded-full bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 flex items-center justify-center transition-all hover:scale-105 active:scale-95">
              <Plus className="w-6 h-6" />
            </button>
          </SheetTrigger>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh]">
          <SheetHeader>
            <SheetTitle className="text-left">New Task</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 mt-4 pb-6">
            <Input
              placeholder="What needs to happen?"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="text-base"
              autoFocus
            />
            <Textarea
              placeholder="Details (optional)"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              rows={2}
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Priority</label>
                <Select value={newPriority} onValueChange={setNewPriority}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">🔴 High</SelectItem>
                    <SelectItem value="normal">⚪ Normal</SelectItem>
                    <SelectItem value="low">🟢 Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Assign to</label>
                <Select value={newAssignedTo} onValueChange={setNewAssignedTo}>
                  <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rob">Rob</SelectItem>
                    <SelectItem value="liz">Liz</SelectItem>
                    <SelectItem value="buddy">Buddy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Created by</label>
              <Select value={newCreatedBy} onValueChange={setNewCreatedBy}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="rob">Rob</SelectItem>
                  <SelectItem value="liz">Liz</SelectItem>
                  <SelectItem value="buddy">Buddy</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSubmit} className="w-full bg-indigo-500 hover:bg-indigo-600 text-white" disabled={!newTitle.trim()}>
              Add Task
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
}
