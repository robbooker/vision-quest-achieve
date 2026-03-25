import { useState, useCallback, useRef } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useTeamTasks, TeamTask } from "@/hooks/useTeamTasks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Inbox, Check, Trash2 } from "lucide-react";
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

const CELEBRATION_EMOJI = ["🎉", "🍌", "🍦", "🐸", "🎊", "⭐", "🔥", "🥳", "🏆", "💪", "🌈", "🦄", "🍕", "🎯", "✨", "🚀"];

type FilterStatus = "all" | "open" | "done";

interface EmojiBurst {
  id: number;
  emoji: string;
  x: number;
  y: number;
  angle: number;
  distance: number;
  delay: number;
}

function useEmojiBurst() {
  const [bursts, setBursts] = useState<EmojiBurst[]>([]);
  const idRef = useRef(0);

  const trigger = useCallback((originX: number, originY: number) => {
    const count = 10 + Math.floor(Math.random() * 6);
    const newBursts: EmojiBurst[] = [];
    for (let i = 0; i < count; i++) {
      newBursts.push({
        id: idRef.current++,
        emoji: CELEBRATION_EMOJI[Math.floor(Math.random() * CELEBRATION_EMOJI.length)],
        x: originX,
        y: originY,
        angle: (Math.random() * 360) * (Math.PI / 180),
        distance: 60 + Math.random() * 120,
        delay: Math.random() * 0.15,
      });
    }
    setBursts((prev) => [...prev, ...newBursts]);
    setTimeout(() => {
      setBursts((prev) => prev.filter((b) => !newBursts.includes(b)));
    }, 1200);
  }, []);

  return { bursts, trigger };
}

function EmojiBurstOverlay({ bursts }: { bursts: EmojiBurst[] }) {
  return (
    <div className="fixed inset-0 pointer-events-none z-[99999]">
      <AnimatePresence>
        {bursts.map((b) => (
          <motion.span
            key={b.id}
            initial={{ 
              x: b.x, 
              y: b.y, 
              opacity: 1, 
              scale: 0.3,
              rotate: 0 
            }}
            animate={{
              x: b.x + Math.cos(b.angle) * b.distance,
              y: b.y + Math.sin(b.angle) * b.distance - 40,
              opacity: 0,
              scale: 0.8 + Math.random() * 0.6,
              rotate: (Math.random() - 0.5) * 180,
            }}
            exit={{ opacity: 0 }}
            transition={{ 
              duration: 0.7 + Math.random() * 0.4, 
              delay: b.delay,
              ease: [0.25, 0.46, 0.45, 0.94] 
            }}
            className="absolute text-2xl select-none"
            style={{ left: 0, top: 0 }}
          >
            {b.emoji}
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  );
}

function FatCheckbox({ checked, onToggle, completing }: { checked: boolean; onToggle: (e: React.MouseEvent) => void; completing: boolean }) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        "relative shrink-0 w-9 h-9 rounded-xl border-[2.5px] flex items-center justify-center transition-all duration-200 active:scale-90",
        checked
          ? "bg-emerald-500 border-emerald-500 shadow-md shadow-emerald-500/30"
          : "border-muted-foreground/30 hover:border-primary hover:bg-primary/5 hover:scale-110",
        completing && "animate-bounce"
      )}
    >
      <AnimatePresence mode="wait">
        {checked && (
          <motion.div
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 45 }}
            transition={{ type: "spring", stiffness: 500, damping: 25 }}
          >
            <Check className="w-5 h-5 text-white stroke-[3]" />
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
}

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
  const { tasks, loading, addTask, completeTask, reopenTask, updateTask, deleteTask } = useTeamTasks();
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [completingIds, setCompletingIds] = useState<Set<string>>(new Set());
  const { bursts, trigger: triggerBurst } = useEmojiBurst();

  // Edit state
  const [editingTask, setEditingTask] = useState<TeamTask | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPriority, setEditPriority] = useState("normal");
  const [editAssignedTo, setEditAssignedTo] = useState<string>("");

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

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (a.status === "open" && b.status === "done") return -1;
    if (a.status === "done" && b.status === "open") return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const handleComplete = async (id: string, e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const originX = rect.left + rect.width / 2;
    const originY = rect.top + rect.height / 2;
    
    triggerBurst(originX, originY);
    setCompletingIds((prev) => new Set(prev).add(id));
    await completeTask(id, "rob");
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

  const openEditDialog = (task: TeamTask) => {
    setEditingTask(task);
    setEditTitle(task.title);
    setEditDescription(task.description || "");
    setEditPriority(task.priority);
    setEditAssignedTo(task.assigned_to || "");
  };

  const handleEditSave = async () => {
    if (!editingTask || !editTitle.trim()) return;
    const success = await updateTask(editingTask.id, {
      title: editTitle.trim(),
      description: editDescription.trim() || null,
      priority: editPriority,
      assigned_to: editAssignedTo || null,
    });
    if (success) setEditingTask(null);
  };

  const handleDelete = async () => {
    if (!editingTask) return;
    const success = await deleteTask(editingTask.id);
    if (success) setEditingTask(null);
  };

  const openCount = tasks.filter((t) => t.status === "open").length;
  const doneCount = tasks.filter((t) => t.status === "done").length;

  return (
    <DashboardLayout>
      <Helmet>
        <title>Command Center | Scout</title>
      </Helmet>

      <EmojiBurstOverlay bursts={bursts} />

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
                    <div className="flex gap-3 items-start">
                      {/* Fat Checkbox */}
                      <FatCheckbox
                        checked={isDone}
                        completing={isCompleting}
                        onToggle={(e) => isDone ? reopenTask(task.id) : handleComplete(task.id, e)}
                      />

                      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => openEditDialog(task)}>
                        <p className={cn(
                          "text-[15px] font-medium leading-snug",
                          isDone && "line-through text-muted-foreground"
                        )}>
                          {task.title}
                        </p>

                        {task.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
                        )}

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

      {/* FAB */}
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
      </div>
    </DashboardLayout>
  );
}
