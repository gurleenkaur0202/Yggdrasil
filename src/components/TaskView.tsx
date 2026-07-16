import React, { useState } from "react";
import { motion } from "motion/react";
import { CheckSquare, Trash2, Plus, Calendar, AlertTriangle, ArrowRight, BookOpen, Clock, Play } from "lucide-react";
import { Task } from "../types";

interface TaskViewProps {
  tasks: Task[];
  onSaveTask: (task: Partial<Task>) => Promise<void>;
  onDeleteTask: (id: string) => Promise<void>;
}

export const TaskView: React.FC<TaskViewProps> = ({ tasks, onSaveTask, onDeleteTask }) => {
  const [text, setText] = useState("");
  const [priority, setPriority] = useState<"high" | "medium" | "low">("medium");
  const [category, setCategory] = useState("Study");
  const [recurrence, setRecurrence] = useState<"none" | "daily" | "weekly" | "monthly">("none");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  // Filters
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "completed">("all");
  const [categoryFilter, setCategoryFilter] = useState("All");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    await onSaveTask({
      text: text.trim(),
      priority,
      category,
      recurrence,
      date,
      completed: false,
    });

    setText("");
    setRecurrence("none");
  };

  const handleToggleComplete = async (task: Task) => {
    await onSaveTask({
      ...task,
      completed: !task.completed,
    });
  };

  // Filter computations
  const categories = ["All", ...new Set(tasks.map((t) => t.category).filter(Boolean))];

  const filteredTasks = tasks.filter((t) => {
    const matchesTab =
      activeTab === "all" ? true : activeTab === "completed" ? t.completed : !t.completed;
    const matchesCategory = categoryFilter === "All" ? true : t.category === categoryFilter;
    return matchesTab && matchesCategory;
  });

  const getPriorityBadgeColor = (p: string) => {
    if (p === "high") return "bg-rose-500/10 text-rose-400 border-rose-500/20";
    if (p === "medium") return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    return "bg-slate-500/10 text-slate-400 border-slate-500/20";
  };

  const completedCount = tasks.filter((t) => t.completed).length;
  const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Title & Stats */}
      <div className="p-6 rounded-2xl glass-panel grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        <div className="md:col-span-2 space-y-1">
          <h2 className="text-xl font-display font-semibold tracking-tight">Active Task Manager</h2>
          <p className="text-xs opacity-60">
            Keep your schedule clear. Link prioritized goals directly with your diary days.
          </p>
          {tasks.length > 0 && (
            <div className="pt-3 space-y-1.5 max-w-sm">
              <div className="flex justify-between text-xs font-mono opacity-70">
                <span>Total Completion Rate</span>
                <span>{progressPercent}% ({completedCount}/{tasks.length})</span>
              </div>
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-400 transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 text-right">
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 px-4 text-center">
            <span className="text-xs font-mono text-rose-400 block uppercase">Critical Tasks</span>
            <span className="text-xl font-bold font-mono text-rose-400 mt-1">
              {tasks.filter((t) => t.priority === "high" && !t.completed).length}
            </span>
          </div>
          <div className="bg-teal-500/10 border border-teal-500/20 rounded-xl p-3 px-4 text-center">
            <span className="text-xs font-mono text-teal-400 block uppercase">Cleared Tasks</span>
            <span className="text-xl font-bold font-mono text-teal-400 mt-1">{completedCount}</span>
          </div>
        </div>
      </div>

      {/* Grid: Create Task Form (Left) & Task List View (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form panel */}
        <div className="p-6 rounded-2xl glass-panel h-fit space-y-5">
          <h3 className="text-sm font-semibold tracking-wide flex items-center gap-2">
            <Plus className="w-4 h-4 text-[var(--primary-color)]" /> Register Task Anchor
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-mono opacity-50">Task Directive</label>
              <input
                type="text"
                required
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="What objective is pending?"
                className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[var(--primary-color)]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-mono opacity-50">Target Date</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-xs outline-none text-white cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono opacity-50">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-2 py-2 text-xs outline-none cursor-pointer"
                >
                  <option value="Study" className="bg-slate-900">Study</option>
                  <option value="Placement" className="bg-slate-900">Placement</option>
                  <option value="Research" className="bg-slate-900">Research</option>
                  <option value="Fitness" className="bg-slate-900">Fitness</option>
                  <option value="Travel" className="bg-slate-900">Travel</option>
                  <option value="Personal" className="bg-slate-900">Personal</option>
                  <option value="Business" className="bg-slate-900">Business</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-mono opacity-50">Priority Level</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-2 py-2 text-xs outline-none cursor-pointer"
                >
                  <option value="high" className="bg-slate-900">High 🔴</option>
                  <option value="medium" className="bg-slate-900">Medium 🟡</option>
                  <option value="low" className="bg-slate-900">Low 🔵</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono opacity-50">Recurrence</label>
                <select
                  value={recurrence}
                  onChange={(e) => setRecurrence(e.target.value as any)}
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-2 py-2 text-xs outline-none cursor-pointer"
                >
                  <option value="none" className="bg-slate-900">None</option>
                  <option value="daily" className="bg-slate-900">Daily</option>
                  <option value="weekly" className="bg-slate-900">Weekly</option>
                  <option value="monthly" className="bg-slate-900">Monthly</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[var(--primary-color)] hover:bg-[var(--primary-color)]/90 text-black font-semibold text-xs tracking-wider uppercase transition-colors"
            >
              Add Task Anchor
            </button>
          </form>
        </div>

        {/* List Filter Panel & Lists (Right 2 columns) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-black/25 border border-white/5">
            <div className="flex gap-1.5 text-xs font-mono">
              {["all", "pending", "completed"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`px-3 py-1.5 rounded-lg capitalize ${
                    activeTab === tab
                      ? "bg-white/10 text-white font-semibold"
                      : "opacity-60 hover:opacity-100"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5 text-xs font-mono">
              <span className="opacity-50">Category Filter:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-black/20 border border-white/5 px-2 py-1.5 rounded-lg outline-none cursor-pointer"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat} className="bg-slate-900">
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {filteredTasks.length === 0 ? (
            <div className="p-12 rounded-2xl glass-panel text-center font-serif text-sm opacity-55">
              No tasks matched the filters or criteria. Your horizons are clear!
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredTasks.map((task) => (
                <div
                  key={task.id}
                  className={`p-4 rounded-xl glass-panel flex items-center justify-between gap-4 border border-white/5 hover:border-white/10 transition-all ${
                    task.completed ? "opacity-60 bg-black/10 border-transparent" : ""
                  }`}
                >
                  <div className="flex items-center gap-3.5 flex-1">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => handleToggleComplete(task)}
                      className="w-5 h-5 rounded bg-black/30 border-white/15 text-[var(--primary-color)] focus:ring-0 cursor-pointer"
                    />
                    <div className="space-y-0.5">
                      <p className={`text-sm ${task.completed ? "line-through opacity-45" : "opacity-90 font-medium"}`}>
                        {task.text}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono opacity-50">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-2.5 h-2.5" />
                          {task.date}
                        </span>
                        <span>•</span>
                        <span className="px-1.5 py-0.5 rounded bg-white/5 uppercase">
                          {task.category}
                        </span>
                        {task.recurrence !== "none" && (
                          <>
                            <span>•</span>
                            <span className="text-amber-400 capitalize">↺ {task.recurrence}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded border text-[9px] font-mono uppercase font-bold tracking-wider ${getPriorityBadgeColor(task.priority)}`}>
                      {task.priority}
                    </span>
                    <button
                      onClick={() => onDeleteTask(task.id)}
                      className="text-white/20 hover:text-rose-400 p-1.5 rounded-lg hover:bg-white/5 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
