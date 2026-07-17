import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Book,
  Calendar as CalIcon,
  CheckSquare,
  Compass,
  Mail,
  TrendingUp,
  Settings,
  LogOut,
  ChevronRight,
  Shield,
  Sparkles,
  Award,
  Clock,
  User as UserIcon,
  Lock,
  TreePine,
  Edit2
} from "lucide-react";

// Types and Themes
import { User, DiaryEntry, Task, Habit, FutureLetter, BucketItem, THEMES } from "./types";

// Visual Views
import { CanvasBackground } from "./components/CanvasBackground";
import { HomeView } from "./components/HomeView";
import { CalendarView } from "./components/CalendarView";
import { DiaryView } from "./components/DiaryView";
import { TaskView } from "./components/TaskView";
import { GoalsView } from "./components/GoalsView";
import { StatsView } from "./components/StatsView";
import { SettingsView } from "./components/SettingsView";
import { ProfileModal } from "./components/ProfileModal";

export default function App() {
  // Auth State
  const [token, setToken] = useState<string | null>(localStorage.getItem("ygg_token"));
  const [user, setUser] = useState<User | null>(
    localStorage.getItem("ygg_user") ? JSON.parse(localStorage.getItem("ygg_user")!) : null
  );

  // Authentication Fields
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // Nav State
  const [activeTab, setActiveTab] = useState<
    "home" | "calendar" | "diary" | "tasks" | "goals" | "stats" | "settings"
  >("diary");
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Content States
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [letters, setLetters] = useState<FutureLetter[]>([]);
  const [bucketList, setBucketList] = useState<BucketItem[]>([]);

  // Time state for the Header widget
  const [currentTime, setCurrentTime] = useState(new Date());

  // Tick the clock
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const isLocalMode = (activeToken?: string | null) => {
    const t = activeToken || token;
    return t ? t.startsWith("local-session-") : false;
  };

  // Fetch all user records upon successful authentication
  useEffect(() => {
    if (token) {
      fetchAllUserData(token);
    }
  }, [token]);

  // Apply custom CSS variable colors based on active selected theme
  useEffect(() => {
    if (user) {
      const activeTheme = THEMES[user.theme] || THEMES.elegant_dark;
      document.documentElement.style.setProperty("--primary-color", activeTheme.primary);
      document.documentElement.style.setProperty("--accent-color", activeTheme.accent);
    }
  }, [user]);

  const fetchAllUserData = async (activeToken?: string | null) => {
    const currentToken = activeToken || token;
    if (!currentToken) return;

    if (isLocalMode(currentToken)) {
      const savedEntries = localStorage.getItem("ygg_local_entries");
      const savedTasks = localStorage.getItem("ygg_local_tasks");
      const savedHabits = localStorage.getItem("ygg_local_habits");
      const savedLetters = localStorage.getItem("ygg_local_letters");
      const savedBucket = localStorage.getItem("ygg_local_bucket");

      if (savedEntries) setEntries(JSON.parse(savedEntries));
      if (savedTasks) setTasks(JSON.parse(savedTasks));
      if (savedHabits) setHabits(JSON.parse(savedHabits));
      if (savedLetters) setLetters(JSON.parse(savedLetters));
      if (savedBucket) setBucketList(JSON.parse(savedBucket));
      return;
    }

    try {
      const headers = { Authorization: `Bearer ${currentToken}` };

      const [entriesRes, tasksRes, habitsRes, lettersRes, bucketRes] = await Promise.all([
        fetch("/api/diary", { headers }),
        fetch("/api/tasks", { headers }),
        fetch("/api/habits", { headers }),
        fetch("/api/letters", { headers }),
        fetch("/api/bucket", { headers }),
      ]);

      if (entriesRes.ok) setEntries(await entriesRes.json());
      if (tasksRes.ok) setTasks(await tasksRes.json());
      if (habitsRes.ok) setHabits(await habitsRes.json());
      if (lettersRes.ok) setLetters(await lettersRes.json());
      if (bucketRes.ok) setBucketList(await bucketRes.json());
    } catch (err) {
      console.error("Failed to load database nodes:", err);
    }
  };

  const handleProceedLocally = (customName?: string, customEmail?: string) => {
    const nameCleaned = (customName || authName).trim() || "Traveler";
    const emailCleaned = (customEmail || authEmail).trim() || `${nameCleaned.toLowerCase().replace(/[^a-z0-9]/g, '') || "stranger"}@yggdrasil.io`;
    
    const localUser: User = {
      id: "local-user",
      name: nameCleaned,
      email: emailCleaned,
      theme: "elegant_dark",
      accentColor: "emerald",
      font: "Inter",
      bgOption: "stars",
      createdAt: new Date().toISOString()
    };
    const localToken = `local-session-${Date.now()}`;

    localStorage.setItem("ygg_token", localToken);
    localStorage.setItem("ygg_user", JSON.stringify(localUser));
    setToken(localToken);
    setUser(localUser);
    setActiveTab("diary");
  };

  // Onboarding Start (Name & Email setup)
  const handleStartGrowingThoughts = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authName.trim() || !authEmail.trim()) {
      setAuthError("Please provide your name and email to begin.");
      return;
    }
    setAuthError("");
    setAuthLoading(true);

    try {
      const nameCleaned = authName.trim();
      const emailCleaned = authEmail.trim();

      // Attempt to notify the server about the login
      await fetch("/api/auth/notify-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailCleaned,
          name: nameCleaned,
        }),
      }).catch(() => {
        // Silently catch fetch errors to ensure zero blocking
      });

      // Always proceed locally immediately to guarantee no UI errors
      handleProceedLocally(nameCleaned, emailCleaned);
    } catch (err: any) {
      console.error("Auto-login fallback failed:", err);
      // Failsafe
      handleProceedLocally();
    } finally {
      setAuthLoading(false);
    }
  };

  // Logouts
  const handleLogout = () => {
    localStorage.removeItem("ygg_token");
    localStorage.removeItem("ygg_user");
    setToken(null);
    setUser(null);
    setEntries([]);
    setTasks([]);
    setHabits([]);
    setLetters([]);
    setBucketList([]);
    setActiveTab("home");
  };

  // API operations wrapper functions
  const handleSaveDiaryEntry = async (entryData: Partial<DiaryEntry>) => {
    if (isLocalMode()) {
      setEntries((prev) => {
        const id = entryData.id || crypto.randomUUID();
        const exists = prev.some((e) => e.id === id);
        let next;
        if (exists) {
          next = prev.map((e) => (e.id === id ? { ...e, ...entryData, updatedAt: new Date().toISOString() } : e));
        } else {
          const newEntry: DiaryEntry = {
            id,
            userId: "local-user",
            date: entryData.date || new Date().toISOString().split("T")[0],
            title: entryData.title || "",
            subject: entryData.subject || "",
            category: entryData.category || "General",
            description: entryData.description || "",
            checklist: entryData.checklist || [],
            tags: entryData.tags || [],
            emoji: entryData.emoji || "🌱",
            mood: entryData.mood || "neutral",
            isPinned: !!entryData.isPinned,
            isBookmarked: !!entryData.isBookmarked,
            isArchived: !!entryData.isArchived,
            isTrash: !!entryData.isTrash,
            updatedAt: new Date().toISOString(),
          };
          next = [...prev, newEntry];
        }
        localStorage.setItem("ygg_local_entries", JSON.stringify(next));
        return next;
      });
      return;
    }
    try {
      const response = await fetch("/api/diary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(entryData),
      });

      if (response.ok) {
        const saved = await response.json();
        // Update states inline
        setEntries((prev) => {
          const exists = prev.some((e) => e.id === saved.id);
          if (exists) {
            return prev.map((e) => (e.id === saved.id ? saved : e));
          } else {
            return [...prev, saved];
          }
        });
      }
    } catch (err) {
      console.error("Auto-save sync failure:", err);
    }
  };

  const handleDeleteDiaryEntry = async (id: string, permanent: boolean) => {
    if (isLocalMode()) {
      setEntries((prev) => {
        let next;
        if (permanent) {
          next = prev.filter((e) => e.id !== id);
        } else {
          next = prev.map((e) => (e.id === id ? { ...e, isTrash: true, updatedAt: new Date().toISOString() } : e));
        }
        localStorage.setItem("ygg_local_entries", JSON.stringify(next));
        return next;
      });
      return;
    }
    try {
      await fetch(`/api/diary/${id}?permanent=${permanent}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (permanent) {
        setEntries((prev) => prev.filter((e) => e.id !== id));
      } else {
        setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, isTrash: true } : e)));
      }
    } catch (err) {
      console.error("Delete operation failure:", err);
    }
  };

  const handleSaveTask = async (taskData: Partial<Task>) => {
    if (isLocalMode()) {
      setTasks((prev) => {
        const id = taskData.id || crypto.randomUUID();
        const exists = prev.some((t) => t.id === id);
        let next;
        if (exists) {
          next = prev.map((t) => (t.id === id ? { ...t, ...taskData } : t));
        } else {
          const newTask: Task = {
            id,
            userId: "local-user",
            date: taskData.date || new Date().toISOString().split("T")[0],
            text: taskData.text || "",
            completed: !!taskData.completed,
            priority: taskData.priority || "medium",
            category: taskData.category || "General",
            recurrence: taskData.recurrence || "none",
          };
          next = [...prev, newTask];
        }
        localStorage.setItem("ygg_local_tasks", JSON.stringify(next));
        return next;
      });
      return;
    }
    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(taskData),
      });

      if (response.ok) {
        const saved = await response.json();
        setTasks((prev) => {
          const exists = prev.some((t) => t.id === saved.id);
          if (exists) return prev.map((t) => (t.id === saved.id ? saved : t));
          return [...prev, saved];
        });
      }
    } catch (err) {
      console.error("Task update fail:", err);
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (isLocalMode()) {
      setTasks((prev) => {
        const next = prev.filter((t) => t.id !== id);
        localStorage.setItem("ygg_local_tasks", JSON.stringify(next));
        return next;
      });
      return;
    }
    try {
      await fetch(`/api/tasks/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.error("Task delete fail:", err);
    }
  };

  const handleSaveHabit = async (name: string) => {
    if (isLocalMode()) {
      setHabits((prev) => {
        const newHabit: Habit = {
          id: crypto.randomUUID(),
          userId: "local-user",
          name,
          logs: [],
          createdAt: new Date().toISOString(),
        };
        const next = [...prev, newHabit];
        localStorage.setItem("ygg_local_habits", JSON.stringify(next));
        return next;
      });
      return;
    }
    try {
      const response = await fetch("/api/habits", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name }),
      });

      if (response.ok) {
        const saved = await response.json();
        setHabits((prev) => [...prev, saved]);
      }
    } catch (err) {
      console.error("Habit creation failure:", err);
    }
  };

  const handleToggleHabit = async (id: string, date: string) => {
    if (isLocalMode()) {
      setHabits((prev) => {
        const next = prev.map((h) => {
          if (h.id === id) {
            const hasLog = h.logs.includes(date);
            const logs = hasLog ? h.logs.filter((d) => d !== date) : [...h.logs, date];
            return { ...h, logs };
          }
          return h;
        });
        localStorage.setItem("ygg_local_habits", JSON.stringify(next));
        return next;
      });
      return;
    }
    try {
      const response = await fetch("/api/habits/log", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id, date }),
      });

      if (response.ok) {
        const updated = await response.json();
        setHabits((prev) => prev.map((h) => (h.id === updated.id ? updated : h)));
      }
    } catch (err) {
      console.error("Habit toggle failure:", err);
    }
  };

  const handleDeleteHabit = async (id: string) => {
    if (isLocalMode()) {
      setHabits((prev) => {
        const next = prev.filter((h) => h.id !== id);
        localStorage.setItem("ygg_local_habits", JSON.stringify(next));
        return next;
      });
      return;
    }
    try {
      await fetch(`/api/habits/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setHabits((prev) => prev.filter((h) => h.id !== id));
    } catch (err) {
      console.error("Habit delete failure:", err);
    }
  };

  const handleSaveLetter = async (letterData: Partial<FutureLetter>) => {
    if (isLocalMode()) {
      setLetters((prev) => {
        const newLetter: FutureLetter = {
          id: letterData.id || crypto.randomUUID(),
          userId: "local-user",
          title: letterData.title || "",
          content: letterData.content || "",
          targetOpenDate: letterData.targetOpenDate || new Date().toISOString().split("T")[0],
          isOpened: !!letterData.isOpened,
          createdAt: new Date().toISOString(),
        };
        const next = [...prev, newLetter];
        localStorage.setItem("ygg_local_letters", JSON.stringify(next));
        return next;
      });
      return;
    }
    try {
      const response = await fetch("/api/letters", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(letterData),
      });

      if (response.ok) {
        const saved = await response.json();
        setLetters((prev) => [...prev, saved]);
      }
    } catch (err) {
      console.error("Letter projection seal failure:", err);
    }
  };

  const handleSaveBucket = async (bucketData: Partial<BucketItem>) => {
    if (isLocalMode()) {
      setBucketList((prev) => {
        const id = bucketData.id || crypto.randomUUID();
        const exists = prev.some((b) => b.id === id);
        let next;
        if (exists) {
          next = prev.map((b) => (b.id === id ? { ...b, ...bucketData } : b));
        } else {
          const newItem: BucketItem = {
            id,
            userId: "local-user",
            title: bucketData.title || "",
            completed: !!bucketData.completed,
            category: bucketData.category || "General",
            targetDate: bucketData.targetDate,
            createdAt: new Date().toISOString(),
          };
          next = [...prev, newItem];
        }
        localStorage.setItem("ygg_local_bucket", JSON.stringify(next));
        return next;
      });
      return;
    }
    try {
      const response = await fetch("/api/bucket", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bucketData),
      });

      if (response.ok) {
        const saved = await response.json();
        setBucketList((prev) => {
          const exists = prev.some((b) => b.id === saved.id);
          if (exists) return prev.map((b) => (b.id === saved.id ? saved : b));
          return [...prev, saved];
        });
      }
    } catch (err) {
      console.error("Bucket goal creation fail:", err);
    }
  };

  const handleDeleteBucket = async (id: string) => {
    if (isLocalMode()) {
      setBucketList((prev) => {
        const next = prev.filter((b) => b.id !== id);
        localStorage.setItem("ygg_local_bucket", JSON.stringify(next));
        return next;
      });
      return;
    }
    try {
      await fetch(`/api/bucket/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setBucketList((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      console.error("Bucket delete failure:", err);
    }
  };

  // Profile preferences modifications
  const handleUpdateProfile = async (profileData: Partial<User>) => {
    if (isLocalMode()) {
      setUser((prev) => {
        if (!prev) return null;
        const next = { ...prev, ...profileData };
        localStorage.setItem("ygg_user", JSON.stringify(next));
        return next;
      });
      return;
    }
    try {
      const response = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profileData),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUser(updatedUser);
        localStorage.setItem("ygg_user", JSON.stringify(updatedUser));
      }
    } catch (err) {
      console.error("Profile saving failure:", err);
    }
  };

  const handleUpdatePreferences = async (prefData: {
    theme: string;
    accentColor: string;
    font: string;
    bgOption: string;
  }) => {
    if (isLocalMode()) {
      setUser((prev) => {
        if (!prev) return null;
        const next = { ...prev, ...prefData };
        localStorage.setItem("ygg_user", JSON.stringify(next));
        return next;
      });
      return;
    }
    try {
      const response = await fetch("/api/auth/preferences", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(prefData),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUser(updatedUser);
        localStorage.setItem("ygg_user", JSON.stringify(updatedUser));
      }
    } catch (err) {
      console.error("Preference change failed:", err);
    }
  };

  const handleDeleteAccount = async () => {
    if (isLocalMode()) {
      handleLogout();
      return;
    }
    try {
      const response = await fetch("/api/auth/delete", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        handleLogout();
      }
    } catch (err) {
      console.error("Account delete execution failure:", err);
    }
  };

  const handleCalendarSelectDate = (dateStr: string) => {
    setSelectedDate(dateStr);
    setActiveTab("diary");
  };

  // Quick helper to fetch selected day's properties for the home header summary
  const getSelectedDayLabel = () => {
    const todayStr = new Date().toISOString().split("T")[0];
    if (selectedDate === todayStr) return "Today's Canvas";
    return selectedDate;
  };

  // Nav item compiler helper
  const NAV_ITEMS = [
    { id: "home", label: "Dashboard", icon: TreePine },
    { id: "calendar", label: "Calendar", icon: CalIcon },
    { id: "diary", label: "Life Journal", icon: Book },
    { id: "tasks", label: "Schedule", icon: CheckSquare },
    { id: "goals", label: "Visions", icon: Compass },
    { id: "stats", label: "Habits", icon: TrendingUp },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const currentTheme = user ? THEMES[user.theme] || THEMES.elegant_dark : THEMES.elegant_dark;

  return (
    <div
      className={`min-h-screen ${currentTheme.background} flex flex-col transition-all duration-700 select-none relative overflow-hidden`}
      style={{
        fontFamily: user?.font ? `"${user.font}", sans-serif` : '"Inter", sans-serif',
      }}
    >
      {/* Ambient background glows */}
      <div 
        className="absolute -top-48 -left-48 w-[500px] h-[500px] blur-[160px] rounded-full pointer-events-none z-0 opacity-25 transition-all duration-1000"
        style={{ backgroundColor: currentTheme.primary }}
      />
      <div 
        className="absolute -bottom-48 -right-48 w-[500px] h-[500px] blur-[160px] rounded-full pointer-events-none z-0 opacity-25 transition-all duration-1000"
        style={{ backgroundColor: currentTheme.accent }}
      />

      {/* Animated canvas background */}
      <CanvasBackground type={user?.bgOption || "stars"} />

      {/* Dynamic Fonts Import */}
      {user?.font && (
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=${user.font.replace(
            " ",
            "+"
          )}:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap');
        `}</style>
      )}

      <AnimatePresence mode="wait">
        {!token ? (
          /* Onboarding Setup Screen (Simplified Name-Only Entrance) */
          <motion.div
            key="auth"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="flex-1 flex items-center justify-center p-4 min-h-screen"
          >
            <div className="w-full max-w-md p-8 rounded-3xl glass-panel relative border border-white/10 space-y-6">
              {/* Decorative world tree lights background */}
              <div className="absolute -top-12 -left-12 w-48 h-48 bg-[var(--primary-color)]/5 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-[var(--accent-color)]/5 rounded-full blur-3xl pointer-events-none" />

              <div className="text-center space-y-2">
                <div className="inline-flex p-3 rounded-2xl bg-white/5 border border-white/10 mb-1">
                  <TreePine className="w-8 h-8 text-[var(--primary-color)] animate-pulse" />
                </div>
                <h1 className="text-3xl font-display font-bold tracking-tight text-white">Yggdrasil</h1>
                <p className="text-xs text-slate-400 max-w-xs mx-auto font-serif italic">
                  "The mythical World Tree that stores the thoughts, memories, and stories of every world."
                </p>
              </div>

              {authError && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs text-center font-mono flex items-center gap-2 justify-center">
                  <Shield className="w-4 h-4 shrink-0" />
                  {authError}
                </div>
              )}

              <form onSubmit={handleStartGrowingThoughts} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-mono tracking-widest text-slate-400 uppercase block text-center">Your Name</label>
                  <input
                    type="text"
                    required
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    placeholder="Enter your name to begin..."
                    className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-[var(--primary-color)] text-white text-center tracking-wide"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-mono tracking-widest text-slate-400 uppercase block text-center">Your Email</label>
                  <input
                    type="email"
                    required
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="Enter your email ID"
                    className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-[var(--primary-color)] text-white text-center tracking-wide font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-3.5 rounded-xl bg-[var(--primary-color)] hover:bg-[var(--primary-color)]/95 text-black font-semibold text-xs tracking-widest uppercase flex items-center justify-center gap-2 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg disabled:opacity-50 mt-4"
                >
                  {authLoading ? (
                    <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Start growing your thoughts</span>
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        ) : (
          /* Main Dashboard Hub */
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col md:flex-row h-screen overflow-hidden"
          >
            {/* Header / Sidebar Controller (Desktop Left Sidebar, Mobile Top/Bottom bar combo) */}
            <aside className="w-full md:w-64 bg-slate-950/75 border-b md:border-b-0 md:border-r border-white/10 flex flex-col justify-between shrink-0 h-auto md:h-screen z-20 backdrop-blur-md">
              <div className="flex flex-col h-full">
                {/* Brand Header */}
                <div className="p-5 flex items-center justify-between border-b border-white/15">
                  <div className="flex items-center gap-2.5">
                    <TreePine className="w-5 h-5 text-[var(--primary-color)]" />
                    <span className="text-lg font-display font-semibold tracking-wide">Yggdrasil</span>
                  </div>
                </div>

                {/* Profile interactive card with all details */}
                {user && (
                  <div
                    onClick={() => setIsProfileModalOpen(true)}
                    className="p-4 mx-3 my-3 bg-white/5 hover:bg-white/10 active:scale-98 rounded-2xl border border-white/5 hover:border-white/10 flex flex-col gap-2.5 transition-all cursor-pointer group relative overflow-hidden"
                  >
                    {/* Glow effect on hover */}
                    <div className="absolute inset-0 bg-gradient-to-r from-[var(--primary-color)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className="flex items-center gap-3 relative z-10">
                      <div className="text-2xl w-10 h-10 rounded-xl bg-black/20 flex items-center justify-center relative shrink-0">
                        {user.avatar || "🌳"}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                          <Edit2 className="w-4 h-4 text-white" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold truncate text-white group-hover:text-[var(--primary-color)] transition-colors flex items-center gap-1.5">
                          {user.name}
                          <Edit2 className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </h4>
                        <p className="text-[10px] font-mono opacity-50 truncate">{user.email}</p>
                      </div>
                    </div>

                    {/* All about details shows in this section */}
                    {(user.quote || user.occupation || user.studyField || user.birthday || user.bio) && (
                      <div className="pt-2.5 border-t border-white/10 space-y-2 text-[11px] font-mono relative z-10">
                        {user.quote && (
                          <div className="text-[11px] italic text-[var(--primary-color)] font-sans border-l-2 border-[var(--primary-color)]/30 pl-2 leading-tight">
                            "{user.quote}"
                          </div>
                        )}
                        <div className="space-y-1 opacity-75">
                          {user.occupation && (
                            <div className="flex items-center gap-1.5 text-slate-300">
                              <span className="text-xs opacity-65">💼</span>
                              <span className="truncate">{user.occupation}</span>
                            </div>
                          )}
                          {user.studyField && (
                            <div className="flex items-center gap-1.5 text-slate-300">
                              <span className="text-xs opacity-65">🎓</span>
                              <span className="truncate">{user.studyField}</span>
                            </div>
                          )}
                          {user.birthday && (
                            <div className="flex items-center gap-1.5 text-slate-300">
                              <span className="text-xs opacity-65">🎂</span>
                              <span>{user.birthday}</span>
                            </div>
                          )}
                        </div>
                        {user.bio && (
                          <div className="text-slate-400 font-sans text-[11px] leading-relaxed line-clamp-2 bg-black/25 p-1.5 rounded-lg border border-white/5">
                            {user.bio}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Tab selections list */}
                <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto scrollbar-thin">
                  {NAV_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;

                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id as any)}
                        className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-mono transition-all text-left group relative ${
                          isActive
                            ? "bg-[var(--primary-color)]/10 text-[var(--primary-color)] font-semibold border-l-4 border-[var(--primary-color)]"
                            : "opacity-60 hover:opacity-100 hover:bg-white/5"
                        }`}
                      >
                        <Icon className="w-4 h-4 group-hover:scale-105 transition-transform" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Sidebar Footer details */}
              <div className="p-4 border-t border-white/10 hidden md:flex flex-col gap-2.5">

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-mono text-rose-400 border border-white/5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>SECURE OUT</span>
                </button>
              </div>
            </aside>

            {/* Main viewports rendering window */}
            <main className="flex-1 overflow-y-auto p-5 md:p-8 space-y-6">
              {/* Responsive Header Row */}
              <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-white/5">
                <div className="space-y-0.5">
                  <h1 className="text-2xl font-display font-semibold tracking-tight text-white capitalize">
                    {activeTab === "home" ? "Daily Dashboard" : activeTab}
                  </h1>
                  <p className="text-xs opacity-50">
                    Welcome back, {user?.name}. Your digital life ledger is synchronized.
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  {/* Time-only clock */}
                  <div className="text-sm font-bold text-slate-200 tracking-wider font-mono">
                    {currentTime.toLocaleTimeString(undefined, {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                      hour12: false,
                    })}
                  </div>
                </div>
              </header>

              {/* View Selection switch content rendering */}
              <div className="relative">
                {activeTab === "home" && (
                  <HomeView
                    user={user!}
                    entries={entries}
                    tasks={tasks}
                    habits={habits}
                    letters={letters}
                    bucketList={bucketList}
                    onNavigate={(tab, payload) => {
                      if (tab) setActiveTab(tab as any);
                      if (payload?.date) setSelectedDate(payload.date);
                    }}
                  />
                )}

                {activeTab === "calendar" && (
                  <CalendarView entries={entries} onSelectDate={handleCalendarSelectDate} />
                )}

                {activeTab === "diary" && (
                  <DiaryView
                    initialDate={selectedDate}
                    entries={entries}
                    onSaveEntry={handleSaveDiaryEntry}
                    onDeleteEntry={handleDeleteDiaryEntry}
                    token={token!}
                  />
                )}

                {activeTab === "tasks" && (
                  <TaskView tasks={tasks} onSaveTask={handleSaveTask} onDeleteTask={handleDeleteTask} />
                )}

                {activeTab === "goals" && (
                  <GoalsView
                    bucketList={bucketList}
                    onSaveBucket={handleSaveBucket}
                    onDeleteBucket={handleDeleteBucket}
                  />
                )}

                {activeTab === "stats" && (
                  <StatsView
                    habits={habits}
                    entries={entries}
                    onSaveHabit={handleSaveHabit}
                    onToggleHabit={handleToggleHabit}
                    onDeleteHabit={handleDeleteHabit}
                  />
                )}

                {activeTab === "settings" && (
                  <SettingsView
                    user={user!}
                    onUpdateProfile={handleUpdateProfile}
                    onUpdatePreferences={handleUpdatePreferences}
                    onDeleteAccount={handleDeleteAccount}
                    onLogout={handleLogout}
                    entries={entries}
                    tasks={tasks}
                    habits={habits}
                    letters={letters}
                    bucket={bucketList}
                  />
                )}
              </div>
            </main>
          </motion.div>
        )}
      </AnimatePresence>

      {user && (
        <ProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          user={user}
          onUpdateProfile={handleUpdateProfile}
        />
      )}
    </div>
  );
}
