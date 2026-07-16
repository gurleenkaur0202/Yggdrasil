import React, { useState } from "react";
import { motion } from "motion/react";
import { Award, Check, TrendingUp, Sparkles, Smile, RefreshCw, Flame, Plus, Trash2, ShieldAlert } from "lucide-react";
import { Habit, DiaryEntry } from "../types";

interface StatsViewProps {
  habits: Habit[];
  entries: DiaryEntry[];
  onSaveHabit: (name: string) => Promise<void>;
  onToggleHabit: (id: string, date: string) => Promise<void>;
  onDeleteHabit: (id: string) => Promise<void>;
}

const MOODS = ["Happy", "Good", "Normal", "Sad", "Angry", "Tired", "Excited", "Stressed"];
const MOOD_EMOJIS: Record<string, string> = {
  Happy: "😀", Good: "😊", Normal: "😐", Sad: "😔", Angry: "😡", Tired: "😴", Excited: "😍", Stressed: "🤯"
};

export const StatsView: React.FC<StatsViewProps> = ({
  habits,
  entries,
  onSaveHabit,
  onToggleHabit,
  onDeleteHabit,
}) => {
  const [newHabitName, setNewHabitName] = useState("");
  const todayStr = new Date().toISOString().split("T")[0];

  const handleCreateHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newHabitName.trim();
    if (name) {
      await onSaveHabit(name);
      setNewHabitName("");
    }
  };

  // Calculate habit streaks
  const getStreakData = (habit: Habit) => {
    const sortedDates = [...habit.logs].sort();
    if (sortedDates.length === 0) return { current: 0, longest: 0 };

    let current = 0;
    let longest = 0;
    let temp = 0;

    // Check if yesterday or today is logged to determine active streak
    const todayObj = new Date(todayStr);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];
    const hasActiveStreak = habit.logs.includes(todayStr) || habit.logs.includes(yesterdayStr);

    let prev: Date | null = null;
    for (let i = 0; i < sortedDates.length; i++) {
      const currentD = new Date(sortedDates[i]);
      if (prev === null) {
        temp = 1;
      } else {
        const diff = Math.abs(currentD.getTime() - prev.getTime());
        const diffDays = Math.ceil(diff / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          temp++;
        } else if (diffDays > 1) {
          temp = 1;
        }
      }
      if (temp > longest) longest = temp;
      prev = currentD;
    }

    if (hasActiveStreak) {
      // Trace contiguous logs back
      let checkDate = habit.logs.includes(todayStr) ? new Date(todayStr) : new Date(yesterdayStr);
      while (true) {
        const checkStr = checkDate.toISOString().split("T")[0];
        if (habit.logs.includes(checkStr)) {
          current++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
    } else {
      current = 0;
    }

    return { current, longest: Math.max(longest, current) };
  };

  // Mood frequency analysis
  const getMoodFrequencies = () => {
    const freqs: Record<string, number> = {};
    MOODS.forEach((m) => (freqs[m] = 0));

    entries.filter(e => !e.isTrash).forEach((entry) => {
      if (entry.mood && freqs[entry.mood] !== undefined) {
        freqs[entry.mood]++;
      }
    });

    return freqs;
  };

  const moodFreqs = getMoodFrequencies();
  const maxMoodCount = Math.max(...Object.values(moodFreqs), 1);

  // Weekly productivity score based on logs (past 7 days)
  const getWeeklyStats = () => {
    const past7Days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split("T")[0];
    });

    const journalCount = entries.filter((e) => !e.isTrash && past7Days.includes(e.date)).length;
    let habitToggles = 0;
    habits.forEach((h) => {
      past7Days.forEach((date) => {
        if (h.logs.includes(date)) habitToggles++;
      });
    });

    return { journalCount, habitToggles };
  };

  const weeklyStats = getWeeklyStats();

  return (
    <div className="space-y-6 pb-12">
      {/* High-level performance banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl glass-panel text-center relative overflow-hidden flex flex-col justify-between h-36">
          <span className="text-xs font-mono uppercase opacity-55 text-teal-400 block">Weekly Reflection Logs</span>
          <span className="text-4xl font-bold font-mono tracking-tight text-teal-400">{weeklyStats.journalCount} Pages</span>
          <p className="text-[10px] opacity-40 font-serif italic">Entries written over the past 7 days</p>
        </div>
        <div className="p-5 rounded-2xl glass-panel text-center relative overflow-hidden flex flex-col justify-between h-36">
          <span className="text-xs font-mono uppercase opacity-55 text-purple-400 block">Habits Accomplished</span>
          <span className="text-4xl font-bold font-mono tracking-tight text-purple-400">{weeklyStats.habitToggles} times</span>
          <p className="text-[10px] opacity-40 font-serif italic">Habit logs completed in the past week</p>
        </div>
        <div className="p-5 rounded-2xl glass-panel text-center relative overflow-hidden flex flex-col justify-between h-36">
          <span className="text-xs font-mono uppercase opacity-55 text-amber-400 block">Journaling Consistency</span>
          <span className="text-4xl font-bold font-mono tracking-tight text-amber-400">
            {entries.length > 0 ? Math.round((entries.filter(e => !e.isTrash).length / Math.max(entries.length, 1)) * 100) : 0}%
          </span>
          <p className="text-[10px] opacity-40 font-serif italic">Diary entries to overall pages ratio</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Habit list and management (Left 2 columns) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Habit Tracker Board */}
          <div className="p-6 rounded-2xl glass-panel space-y-4">
            <h3 className="text-sm font-semibold tracking-wide flex items-center justify-between">
              <span className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[var(--primary-color)]" /> Daily Habit Streaks
              </span>
              <span className="text-xs opacity-50 font-mono">Today: {todayStr}</span>
            </h3>

            {/* Create habit */}
            <form onSubmit={handleCreateHabit} className="flex gap-2">
              <input
                type="text"
                required
                value={newHabitName}
                onChange={(e) => setNewHabitName(e.target.value)}
                placeholder="Register new habit (e.g. Exercise, Read, Meditation)..."
                className="flex-1 bg-black/30 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-[var(--primary-color)] text-white"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[var(--primary-color)] hover:bg-[var(--primary-color)]/90 text-black font-semibold text-xs font-mono uppercase tracking-wider"
              >
                Register
              </button>
            </form>

            {habits.length === 0 ? (
              <p className="p-8 text-center text-xs opacity-50 font-serif italic">
                No custom habits registered. Create one above to begin tracking consistent routines!
              </p>
            ) : (
              <div className="space-y-3">
                {habits.map((habit) => {
                  const isLoggedToday = habit.logs.includes(todayStr);
                  const stats = getStreakData(habit);

                  return (
                    <div
                      key={habit.id}
                      className="p-4 rounded-xl bg-black/20 border border-white/5 flex items-center justify-between gap-4 group hover:border-white/10 transition-all"
                    >
                      <div className="space-y-1">
                        <h4 className="text-sm font-semibold tracking-tight opacity-90">{habit.name}</h4>
                        <div className="flex items-center gap-3 text-[10px] font-mono opacity-50">
                          <span className="flex items-center gap-0.5 text-amber-500">
                            <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /> Current: {stats.current} days
                          </span>
                          <span>•</span>
                          <span>Record: {stats.longest} days</span>
                          <span>•</span>
                          <span>Logs: {habit.logs.length} times</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Toggle button */}
                        <button
                          onClick={() => onToggleHabit(habit.id, todayStr)}
                          className={`p-1.5 px-3 rounded-lg text-xs font-mono font-semibold flex items-center gap-1 border transition-all ${
                            isLoggedToday
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : "bg-white/5 hover:bg-white/10 border-white/10 text-slate-300"
                          }`}
                        >
                          {isLoggedToday ? (
                            <>
                              <Check className="w-3.5 h-3.5" /> Checked Off
                            </>
                          ) : (
                            "Log Completed"
                          )}
                        </button>
                        <button
                          onClick={() => onDeleteHabit(habit.id)}
                          className="text-white/20 hover:text-rose-400 p-1.5 rounded-lg hover:bg-white/5 opacity-0 group-hover:opacity-100 transition-all"
                          title="Delete Habit"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Mood Analysis Column (Right column) */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl glass-panel space-y-4">
            <h3 className="text-sm font-semibold tracking-wide flex items-center gap-2">
              <Smile className="w-4 h-4 text-amber-400 fill-amber-400/20" /> Emotional Mood Landscape
            </h3>

            <div className="space-y-3 pt-2">
              {MOODS.map((md) => {
                const count = moodFreqs[md] || 0;
                const pct = Math.round((count / maxMoodCount) * 100);

                return (
                  <div key={md} className="space-y-1">
                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className="flex items-center gap-1.5">
                        <span className="text-sm">{MOOD_EMOJIS[md]}</span>
                        <span className="opacity-75">{md}</span>
                      </span>
                      <span className="opacity-50">{count} times</span>
                    </div>

                    <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          md === "Happy" ? "bg-amber-400" :
                          md === "Good" ? "bg-emerald-400" :
                          md === "Normal" ? "bg-blue-400" :
                          md === "Sad" ? "bg-indigo-400" :
                          md === "Angry" ? "bg-rose-500" :
                          md === "Tired" ? "bg-purple-400" :
                          md === "Excited" ? "bg-pink-400" : "bg-orange-400"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
