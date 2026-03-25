import { useState, useCallback, useRef, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useTeamTasks, TeamTask } from "@/hooks/useTeamTasks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Inbox, Check, Trash2, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { Helmet } from "react-helmet-async";
import { useIsMobile } from "@/hooks/use-mobile";

const TEAM_MEMBERS = [
  { value: "rob", label: "Rob", initials: "R", avatarColor: "bg-indigo-500", cardBg: "bg-sky-50 dark:bg-sky-950/30 border-sky-200/60 dark:border-sky-800/40" },
  { value: "liz", label: "Liz", initials: "L", avatarColor: "bg-rose-500", cardBg: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200/60 dark:border-emerald-800/40" },
  { value: "buddy", label: "Buddy", initials: "B", avatarColor: "bg-emerald-500", cardBg: "bg-orange-50 dark:bg-orange-950/30 border-orange-200/60 dark:border-orange-800/40" },
];

const MEMBER_COLUMN_HEADER: Record<string, { label: string; emoji: string; borderColor: string }> = {
  rob: { label: "Rob", emoji: "💙", borderColor: "border-sky-300 dark:border-sky-700" },
  liz: { label: "Liz", emoji: "💚", borderColor: "border-emerald-300 dark:border-emerald-700" },
  buddy: { label: "Buddy", emoji: "🧡", borderColor: "border-orange-300 dark:border-orange-700" },
};

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
            initial={{ x: b.x, y: b.y, opacity: 1, scale: 0.3, rotate: 0 }}
            animate={{
              x: b.x + Math.cos(b.angle) * b.distance,
              y: b.y + Math.sin(b.angle) * b.distance - 40,
              opacity: 0,
              scale: 0.8 + Math.random() * 0.6,
              rotate: (Math.random() - 0.5) * 180,
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7 + Math.random() * 0.4, delay: b.delay, ease: [0.25, 0.46, 0.45, 0.94] }}
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

function getCardBg(assignedTo: string | null) {
  const member = TEAM_MEMBERS.find((m) => m.value === assignedTo);
  return member?.cardBg || "bg-card border-border";
}

function TaskCard({
  task,
  isDusting,
  isCompleting,
  onComplete,
  onReopen,
  onEdit,
  onDelete,
  showDragHandle,
}: {
  task: TeamTask;
  isDusting: boolean;
  isCompleting: boolean;
  onComplete: (id: string, e: React.MouseEvent) => void;
  onReopen: (id: string) => void;
  onEdit: (task: TeamTask) => void;
  onDelete: (id: string) => void;
  showDragHandle: boolean;
}) {
  const isDone = task.status === "done";
  const priorityCfg = PRIORITY_CONFIG[task.priority as keyof typeof PRIORITY_CONFIG] || PRIORITY_CONFIG.normal;
  const cardBg = getCardBg(task.assigned_to);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={isDusting
        ? { opacity: 0, scale: 0.7, filter: "blur(8px) saturate(0)", y: -20, transition: { duration: 0.8, ease: [0.4, 0, 0.2, 1] } }
        : { opacity: isCompleting ? 0.5 : 1, y: 0, scale: isCompleting ? 0.98 : 1, filter: "blur(0px) saturate(1)" }
      }
      exit={{ opacity: 0, scale: 0.5, filter: "blur(12px)", transition: { duration: 0.4 } }}
      transition={{ duration: 0.25 }}
      className={cn(
        "rounded-xl border p-3.5 shadow-sm transition-all relative group",
        cardBg,
        isDone && "opacity-60",
        isDusting && "pointer-events-none"
      )}
    >
      <div className="flex gap-2.5 items-start">
        {showDragHandle && (
          <div className="shrink-0 cursor-grab active:cursor-grabbing mt-1.5 text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors">
            <GripVertical className="w-4 h-4" />
          </div>
        )}

        <FatCheckbox
          checked={isDone}
          completing={isCompleting}
          onToggle={(e) => isDone ? onReopen(task.id) : onComplete(task.id, e)}
        />

        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onEdit(task)}>
          <p className={cn("text-[14px] font-medium leading-snug", isDone && "line-through text-muted-foreground")}>
            {task.title}
          </p>
          {task.description && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{task.description}</p>
          )}
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            <span className={cn("inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider", priorityCfg.className)}>
              {priorityCfg.label}
            </span>
            {isDone && task.completed_by && (
              <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                <Check className="w-3 h-3" />
                {TEAM_MEMBERS.find((m) => m.value === task.completed_by)?.label || task.completed_by}
              </span>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground/60 mt-1">
            Added by {TEAM_MEMBERS.find((m) => m.value === task.created_by)?.label || task.created_by || "unknown"}
          </p>
        </div>

        <button
          onClick={() => onDelete(task.id)}
          className="shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
          title="Delete task"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}

export default function Team() {
  const { tasks, loading, addTask, completeTask, reopenTask, updateTask, deleteTask, reorderTasks } = useTeamTasks();
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [completingIds, setCompletingIds] = useState<Set<string>>(new Set());
  const [dustingIds, setDustingIds] = useState<Set<string>>(new Set());
  const { bursts, trigger: triggerBurst } = useEmojiBurst();
  const isMobile = useIsMobile();

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

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (filter === "all") return true;
      return t.status === filter;
    });
  }, [tasks, filter]);

  // For mobile: single sorted list
  const sortedTasks = useMemo(() => {
    return [...filteredTasks].sort((a, b) => {
      if (a.status === "open" && b.status === "done") return -1;
      if (a.status === "done" && b.status === "open") return 1;
      return a.position - b.position;
    });
  }, [filteredTasks]);

  // For desktop: grouped by assigned_to
  const columnTasks = useMemo(() => {
    const columns: Record<string, TeamTask[]> = { rob: [], liz: [], buddy: [] };
    filteredTasks.forEach((t) => {
      const key = t.assigned_to && columns[t.assigned_to] ? t.assigned_to : "rob"; // unassigned goes to Rob's column
      columns[key].push(t);
    });
    // Sort each column by position
    Object.values(columns).forEach((col) => col.sort((a, b) => a.position - b.position));
    return columns;
  }, [filteredTasks]);

  const handleComplete = async (id: string, e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    triggerBurst(rect.left + rect.width / 2, rect.top + rect.height / 2);
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

  const handleInlineDelete = async (id: string) => {
    setDustingIds((prev) => new Set(prev).add(id));
    setTimeout(async () => {
      await deleteTask(id);
      setDustingIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
    }, 800);
  };

  const handleColumnReorder = (memberKey: string, newOrder: TeamTask[]) => {
    const updates = newOrder.map((task, index) => ({ id: task.id, position: index }));
    reorderTasks(updates);
  };

  const openCount = tasks.filter((t) => t.status === "open").length;
  const doneCount = tasks.filter((t) => t.status === "done").length;

  const renderTaskCard = (task: TeamTask, showDrag = true) => (
    <TaskCard
      key={task.id}
      task={task}
      isDusting={dustingIds.has(task.id)}
      isCompleting={completingIds.has(task.id)}
      onComplete={handleComplete}
      onReopen={reopenTask}
      onEdit={openEditDialog}
      onDelete={handleInlineDelete}
      showDragHandle={showDrag}
    />
  );

  return (
    <DashboardLayout>
      <Helmet>
        <title>Command Center | Scout</title>
      </Helmet>

      <EmojiBurstOverlay bursts={bursts} />

      <div className={cn("mx-auto px-4 pb-24 pt-6", isMobile ? "max-w-md" : "max-w-5xl")}>
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

        {/* Task area */}
        {loading ? (
          <div className={cn(isMobile ? "space-y-3" : "grid grid-cols-3 gap-4")}>
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Inbox className="w-10 h-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">All clear. Nothing on the board.</p>
          </div>
        ) : isMobile ? (
          /* Mobile: single reorderable list */
          <Reorder.Group
            axis="y"
            values={sortedTasks}
            onReorder={(newOrder) => {
              const updates = newOrder.map((task, index) => ({ id: task.id, position: index }));
              reorderTasks(updates);
            }}
            className="space-y-2.5"
          >
            {sortedTasks.map((task) => (
              <Reorder.Item key={task.id} value={task} className="list-none">
                {renderTaskCard(task, true)}
              </Reorder.Item>
            ))}
          </Reorder.Group>
        ) : (
          /* Desktop: 3 columns by team member */
          <div className="grid grid-cols-3 gap-5">
            {["rob", "liz", "buddy"].map((memberKey) => {
              const header = MEMBER_COLUMN_HEADER[memberKey];
              const colTasks = columnTasks[memberKey] || [];

              return (
                <div key={memberKey} className="space-y-3">
                  {/* Column header */}
                  <div className={cn("flex items-center gap-2 pb-2 border-b-2", header.borderColor)}>
                    <span className="text-lg">{header.emoji}</span>
                    <h2 className="text-sm font-semibold text-foreground">{header.label}</h2>
                    <span className="ml-auto text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">{colTasks.length}</span>
                  </div>

                  {colTasks.length === 0 ? (
                    <p className="text-xs text-muted-foreground/50 text-center py-8">No tasks</p>
                  ) : (
                    <Reorder.Group
                      axis="y"
                      values={colTasks}
                      onReorder={(newOrder) => handleColumnReorder(memberKey, newOrder)}
                      className="space-y-2"
                    >
                      {colTasks.map((task) => (
                        <Reorder.Item key={task.id} value={task} className="list-none">
                          {renderTaskCard(task, true)}
                        </Reorder.Item>
                      ))}
                    </Reorder.Group>
                  )}
                </div>
              );
            })}
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
              <Input placeholder="What needs to happen?" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="text-base" autoFocus />
              <Textarea placeholder="Details (optional)" value={newDescription} onChange={(e) => setNewDescription(e.target.value)} rows={2} />
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

      {/* Edit Task Dialog */}
      <Dialog open={!!editingTask} onOpenChange={(open) => !open && setEditingTask(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <Input placeholder="Task title" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="text-base" />
            <Textarea placeholder="Details (optional)" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={2} />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Priority</label>
                <Select value={editPriority} onValueChange={setEditPriority}>
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
                <Select value={editAssignedTo} onValueChange={setEditAssignedTo}>
                  <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    <SelectItem value="rob">Rob</SelectItem>
                    <SelectItem value="liz">Liz</SelectItem>
                    <SelectItem value="buddy">Buddy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter className="flex gap-2 sm:gap-0 mt-4">
            <Button variant="destructive" size="sm" onClick={handleDelete} className="mr-auto">
              <Trash2 className="w-4 h-4 mr-1" /> Delete
            </Button>
            <Button variant="outline" size="sm" onClick={() => setEditingTask(null)}>Cancel</Button>
            <Button size="sm" onClick={handleEditSave} disabled={!editTitle.trim()} className="bg-indigo-500 hover:bg-indigo-600 text-white">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
