import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Sparkles, Flame, Calendar as CalIcon, BookOpen, Clock, Heart, ArrowRight } from "lucide-react";
import { DiaryEntry, User, Task, Habit } from "../types";

interface HomeViewProps {
  user: User;
  entries: DiaryEntry[];
  tasks: Task[];
  habits: Habit[];
  letters?: any[];
  bucketList?: any[];
  onNavigate: (tab: string, arg?: any) => void;
}

const INSIGHTS_AND_QUOTES = [
  { text: "For a tree to become tall, it must grow tough roots among the rocks.", author: "Nietzsche" },
  { text: "In all things of nature there is something of the marvelous.", author: "Aristotle" },
  { text: "Adopt the pace of nature: her secret is patience.", author: "Ralph Waldo Emerson" },
  { text: "The creation of a thousand forests is in one acorn.", author: "Ralph Waldo Emerson" },
  { text: "What we find in a diary is not just our past, but the soil from which we grow.", author: "Yggdrasil Keeper" },
  { text: "Live in each season as it passes; breathe the air, drink the drink, taste the fruit, and resign yourself to the influence of the earth.", author: "Henry David Thoreau" },
  { text: "Do not fear the cold winter of your life; deep down, your roots are preparing for the greenest spring.", author: "Scandinavian Wisdom" },
  { text: "I found more answers in the woods than in any page of written history.", author: "Hermann Hesse" },
];

export const HomeView: React.FC<HomeViewProps> = ({
  user,
  entries,
  tasks = [],
  habits = [],
  onNavigate,
}) => {
  const [focusText, setFocusText] = useState("");
  const [quote, setQuote] = useState({ text: "", author: "" });

  const todayStr = new Date().toISOString().split("T")[0];
  const tasksCount = {
    total: tasks.length,
    completed: tasks.filter((t) => t.completed).length,
  };
  const habitsCount = {
    total: habits.length,
    active: habits.filter((h) => h.logs && h.logs.includes(todayStr)).length,
  };

  useEffect(() => {
    // Select a semi-random quote based on the current day of the month
    const day = new Date().getDate();
    setQuote(INSIGHTS_AND_QUOTES[day % INSIGHTS_AND_QUOTES.length]);

    const savedFocus = localStorage.getItem(`ygg_focus_${user.id}`);
    if (savedFocus) setFocusText(savedFocus);
  }, [user.id]);

  const handleFocusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFocusText(e.target.value);
    localStorage.setItem(`ygg_focus_${user.id}`, e.target.value);
  };

  // Streak Calculation
  const calculateStreak = () => {
    if (entries.length === 0) return { current: 0, longest: 0 };
    const dates = [...new Set(entries.filter(e => !e.isTrash).map(e => e.date))].sort() as string[];
    if (dates.length === 0) return { current: 0, longest: 0 };

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    const todayStr = new Date().toISOString().split("T")[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    // Check if user journaled today or yesterday to maintain active streak
    const hasTodayOrYesterday = dates.includes(todayStr) || dates.includes(yesterdayStr);

    let prevDate: Date | null = null;
    for (let i = 0; i < dates.length; i++) {
      const currentDate = new Date(dates[i]);
      if (prevDate === null) {
        tempStreak = 1;
      } else {
        const diffTime = Math.abs(currentDate.getTime() - prevDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          tempStreak++;
        } else if (diffDays > 1) {
          tempStreak = 1;
        }
      }
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
      }
      prevDate = currentDate;
    }

    if (hasTodayOrYesterday) {
      // Find current contiguous streak back from today/yesterday
      let currentIdx = dates.length - 1;
      let checkDate = dates.includes(todayStr) ? new Date(todayStr) : new Date(yesterdayStr);
      currentStreak = 0;

      while (currentIdx >= 0) {
        const checkStr = checkDate.toISOString().split("T")[0];
        if (dates.includes(checkStr)) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
    } else {
      currentStreak = 0;
    }

    return { current: currentStreak, longest: Math.max(longestStreak, currentStreak) };
  };

  const streaks = calculateStreak();

  // Heatmap generation: Last 180 days (approx 26 weeks)
  const getHeatmapData = () => {
    const data = [];
    const today = new Date();
    // Go back 182 days to align into 26 weeks of 7 days
    const startDate = new Date();
    startDate.setDate(today.getDate() - 181);

    const activeDates = new Set(entries.filter(e => !e.isTrash).map(e => e.date));

    for (let i = 0; i < 182; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const dateStr = date.toISOString().split("T")[0];
      data.push({
        dateStr,
        active: activeDates.has(dateStr),
        dayOfWeek: date.getDay(),
      });
    }
    return data;
  };

  const heatmapData = getHeatmapData();

  // Recently updated notes
  const recentEntries = [...entries]
    .filter(e => !e.isTrash)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 3);

  // Get current hour welcome
  const getWelcomeText = () => {
    const hr = new Date().getHours();
    if (hr < 12) return "Good morning";
    if (hr < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Dynamic Welcome Heading */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl glass-panel relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16 animate-pulse-slow"></div>
        <div>
          <h1 className="text-3xl font-display font-semibold tracking-tight">
            {getWelcomeText()}, <span className="text-[var(--primary-color)]">{user.name}</span>
          </h1>
          <p className="text-sm opacity-70 mt-1">
            "Your branches seek the light, while your roots hold your history."
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <Flame className="w-5 h-5 text-amber-500 fill-amber-500 animate-pulse" />
            <div>
              <div className="text-xs opacity-60 font-mono">STREAK</div>
              <div className="text-lg font-bold font-mono">{streaks.current} Days</div>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500/10 border border-purple-500/20">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <div>
              <div className="text-xs opacity-60 font-mono">RECORD</div>
              <div className="text-lg font-bold font-mono">{streaks.longest} Days</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Grid of Quote & Today's Focus */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Quote of Day */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="p-6 rounded-2xl glass-panel flex flex-col justify-between border border-white/5 relative group"
        >
          <div className="absolute top-4 left-4 text-4xl font-serif text-white/5 pointer-events-none group-hover:text-white/10 transition-colors">
            “
          </div>
          <p className="text-lg font-serif italic relative z-10 leading-relaxed text-slate-100 pl-4 py-2">
            {quote.text}
          </p>
          <div className="mt-4 text-right pr-4">
            <span className="text-xs uppercase tracking-wider font-mono opacity-50">— {quote.author}</span>
          </div>
        </motion.div>

        {/* Focus & Quick Stats Widget */}
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          className="p-6 rounded-2xl glass-panel flex flex-col justify-between"
        >
          <div>
            <h3 className="text-xs uppercase tracking-wider font-mono opacity-60 flex items-center gap-2">
              <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" /> Today's Focus Anchor
            </h3>
            <div className="mt-4">
              <input
                type="text"
                value={focusText}
                onChange={handleFocusChange}
                placeholder="What is your singular point of focus today?"
                className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-base outline-none focus:border-[var(--primary-color)] transition-all font-serif"
              />
              <p className="text-xs opacity-40 mt-1.5 pl-1 italic">
                Saves automatically. Keeps you anchored throughout the day.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-6 pt-4 border-t border-white/5 text-center font-mono">
            <div>
              <div className="text-xs opacity-50">DIARY</div>
              <div className="text-xl font-bold mt-1 text-teal-400">{entries.filter(e => !e.isTrash).length}</div>
            </div>
            <div>
              <div className="text-xs opacity-50">TASKS</div>
              <div className="text-xl font-bold mt-1 text-purple-400">
                {tasksCount.completed}/{tasksCount.total}
              </div>
            </div>
            <div>
              <div className="text-xs opacity-50">HABITS</div>
              <div className="text-xl font-bold mt-1 text-amber-400">
                {habitsCount.active}/{habitsCount.total}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Recent Entries */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold tracking-wide flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[var(--primary-color)]" /> Recently Documented Memories
          </h3>
          <button
            onClick={() => onNavigate("diary")}
            className="text-xs text-[var(--primary-color)] hover:underline flex items-center gap-1 group font-mono"
          >
            All Logs <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {recentEntries.length === 0 ? (
          <div className="p-8 rounded-xl glass-panel text-center text-sm opacity-50 font-serif">
            No memories written down yet. Click the calendar or sidebar diary to document today!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recentEntries.map((entry) => (
              <motion.div
                key={entry.id}
                whileHover={{ y: -4 }}
                onClick={() => onNavigate("diary", entry)}
                className="p-5 rounded-xl glass-panel cursor-pointer hover:border-white/15 transition-all relative overflow-hidden group flex flex-col justify-between h-44"
              >
                <div className="absolute top-3 right-3 opacity-25 group-hover:opacity-50 transition-opacity">
                  <span className="text-2xl">{entry.emoji}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2 font-mono text-[10px] opacity-50 mb-1.5">
                    <Clock className="w-3 h-3" />
                    <span>{entry.date}</span>
                    <span className="px-1.5 py-0.5 rounded-full bg-white/5">{entry.subject}</span>
                  </div>
                  <h4 className="text-base font-semibold tracking-tight line-clamp-1 group-hover:text-[var(--primary-color)] transition-colors pr-8">
                    {entry.title || "Untitled Note"}
                  </h4>
                  <p className="text-xs opacity-65 mt-2 line-clamp-3 leading-relaxed font-serif">
                    {entry.description || "No text description written."}
                  </p>
                </div>
                <div className="mt-3 flex items-center justify-between font-mono text-[10px] opacity-40">
                  <span className="flex items-center gap-1 capitalize">
                    {entry.mood} mood
                  </span>
                  <span>Click to Edit</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
