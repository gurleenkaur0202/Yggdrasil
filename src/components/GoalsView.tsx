import React, { useState } from "react";
import { motion } from "motion/react";
import { Compass, Calendar, Plus, Trash2, CheckCircle2, Award, BookOpen, Clock, Heart } from "lucide-react";
import { BucketItem } from "../types";

interface GoalsViewProps {
  bucketList: BucketItem[];
  onSaveBucket: (item: Partial<BucketItem>) => Promise<void>;
  onDeleteBucket: (id: string) => Promise<void>;
}

export const GoalsView: React.FC<GoalsViewProps> = ({
  bucketList,
  onSaveBucket,
  onDeleteBucket,
}) => {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Travel");
  const [targetDate, setTargetDate] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    await onSaveBucket({
      title: title.trim(),
      category,
      targetDate: targetDate || undefined,
      completed: false,
    });

    setTitle("");
    setTargetDate("");
  };

  const handleToggleComplete = async (item: BucketItem) => {
    await onSaveBucket({
      ...item,
      completed: !item.completed,
    });
  };

  // Group bucket list items
  const activeItems = bucketList.filter((b) => !b.completed);
  const completedItems = bucketList.filter((b) => b.completed).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="space-y-6">
      {/* Vision Header Banner */}
      <div className="p-6 rounded-2xl glass-panel relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/5 rounded-full blur-3xl pointer-events-none -mr-12 animate-pulse-slow"></div>
        <div className="space-y-1 relative z-10">
          <h2 className="text-xl font-display font-semibold tracking-tight">Visions & Life Goals</h2>
          <p className="text-xs opacity-60 max-w-xl">
            "Your branches seek the stars. Map your dreams, lock down milestones, and document achievements along the timeline of life."
          </p>
        </div>
        <div className="flex gap-4 relative z-10 font-mono">
          <div className="p-3 px-5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-center">
            <span className="text-xs opacity-50 block uppercase text-purple-400">Pursuits</span>
            <span className="text-xl font-bold text-purple-400 mt-1">{activeItems.length}</span>
          </div>
          <div className="p-3 px-5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
            <span className="text-xs opacity-50 block uppercase text-amber-400">Completed</span>
            <span className="text-xl font-bold text-amber-400 mt-1">{completedItems.length}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create Goal Form (Left column) */}
        <div className="p-6 rounded-2xl glass-panel h-fit space-y-4">
          <h3 className="text-sm font-semibold tracking-wide flex items-center gap-2">
            <Plus className="w-4 h-4 text-[var(--primary-color)]" /> Register Vision Goal
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-mono opacity-50">Goal Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Complete a marathon"
                className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-[var(--primary-color)] text-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono opacity-50">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-xl px-2.5 py-2 text-xs outline-none cursor-pointer"
              >
                <option value="Career" className="bg-slate-900">Career & Knowledge 💼</option>
                <option value="Travel" className="bg-slate-900">Travel & Exploration 🌎</option>
                <option value="Fitness" className="bg-slate-900">Fitness & Vitality 🏃‍♂️</option>
                <option value="Creative" className="bg-slate-900">Creative & Projects 🎨</option>
                <option value="Spiritual" className="bg-slate-900">Spiritual & Mindfulness 🧘‍♂️</option>
                <option value="Financial" className="bg-slate-900">Financial Independence 💵</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono opacity-50">Target Accomplish Date (Optional)</label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-xs outline-none text-white cursor-pointer"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[var(--primary-color)] hover:bg-[var(--primary-color)]/90 text-black font-semibold text-xs tracking-wider uppercase transition-colors"
            >
              Add Vision Pursuit
            </button>
          </form>
        </div>

        {/* Vision Goals List (Middle column) */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold tracking-wide flex items-center gap-2 px-1">
            <Compass className="w-4 h-4 text-purple-400 animate-spin-slow" /> Active Vision Pursuits
          </h3>

          {activeItems.length === 0 ? (
            <div className="p-8 rounded-2xl glass-panel text-center font-serif text-xs opacity-50">
              No active goals listed. Set your sails to the open waters! Register a goal on the left.
            </div>
          ) : (
            <div className="space-y-3">
              {activeItems.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl glass-panel flex justify-between items-center gap-3 border border-white/5 hover:border-white/10 transition-all group"
                >
                  <div className="space-y-1 flex-1">
                    <p className="text-sm font-medium opacity-90 pr-3">{item.title}</p>
                    <div className="flex items-center gap-2 text-[10px] font-mono opacity-50">
                      <span className="px-1.5 py-0.5 rounded bg-white/5">{item.category}</span>
                      {item.targetDate && (
                        <span className="flex items-center gap-0.5 text-amber-400">
                          <Calendar className="w-2.5 h-2.5" />
                          Target: {item.targetDate}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleToggleComplete(item)}
                      className="p-1 px-2.5 text-[10px] font-mono rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 flex items-center gap-1 transition-all"
                      title="Mark Achieved"
                    >
                      ✔ Achieve
                    </button>
                    <button
                      onClick={() => onDeleteBucket(item.id)}
                      className="text-white/20 hover:text-rose-400 p-1.5 rounded-lg hover:bg-white/5 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Achievement Timeline (Right column) */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold tracking-wide flex items-center gap-2 px-1">
            <Award className="w-4 h-4 text-amber-400 fill-amber-400/20" /> Achievement Timeline
          </h3>

          {completedItems.length === 0 ? (
            <div className="p-8 rounded-2xl glass-panel text-center font-serif text-xs opacity-50">
              No accomplishments registered yet. The ledger of your deeds is still clean. Achieve a goal to fill it!
            </div>
          ) : (
            <div className="relative pl-5 border-l border-white/10 space-y-6 py-2 ml-3">
              {completedItems.map((item, index) => (
                <div key={item.id} className="relative group">
                  {/* Timeline bullet dot */}
                  <div className="absolute -left-[27px] top-1 w-3.5 h-3.5 rounded-full bg-amber-400 border-2 border-slate-950 flex items-center justify-center shadow shadow-amber-400/50">
                    <CheckCircle2 className="w-2 h-2 text-slate-950 fill-slate-950" />
                  </div>

                  <div className="p-3.5 rounded-xl glass-panel border border-amber-500/10 bg-amber-500/5 group-hover:border-amber-500/25 transition-all">
                    <span className="text-[9px] font-mono uppercase tracking-wider text-amber-400/70 block">
                      {new Date(item.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                    <h4 className="text-sm font-semibold tracking-tight text-slate-100 mt-1 pr-6">
                      {item.title}
                    </h4>
                    <div className="flex items-center justify-between mt-2.5">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 opacity-60">
                        {item.category}
                      </span>
                      <button
                        onClick={() => onDeleteBucket(item.id)}
                        className="text-white/20 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
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
