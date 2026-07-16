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
import { MemoryCapsule } from "./components/MemoryCapsule";
import { StatsView } from "./components/StatsView";
import { SettingsView } from "./components/SettingsView";

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
    "home" | "calendar" | "diary" | "tasks" | "goals" | "capsule" | "stats" | "settings"
  >("diary");
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]);

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

  // Auto-login immediately if no token is present to bypass login screen and direct user straight to the diary app
  useEffect(() => {
    const performSilentAutoLogin = async () => {
      if (!token) {
        try {
          const response = await fetch("/api/auth/auto-login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: "kaurgurleen0202@gmail.com",
              name: "gurleen",
            }),
          });
          if (response.ok) {
            const data = await response.json();
            localStorage.setItem("ygg_token", data.token);
            localStorage.setItem("ygg_user", JSON.stringify(data.user));
            setToken(data.token);
            setUser(data.user);
            setActiveTab("diary");
          }
        } catch (err) {
          console.error("Auto-login error:", err);
        }
      }
    };
    performSilentAutoLogin();
  }, [token]);

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

  // Auth Submit
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthLoading(true);

    const endpoint = authMode === "login" ? "/api/auth/login" : "/api/auth/register";
    const body = authMode === "login"
      ? { email: authEmail, password: authPassword }
      : { email: authEmail, password: authPassword, name: authName };

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Authentication failed.");
      }

      // Store credentials
      localStorage.setItem("ygg_token", data.token);
      localStorage.setItem("ygg_user", JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      setActiveTab("diary");
    } catch (err: any) {
      setAuthError(err.message || "Server connectivity lost.");
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
    try {
      const response = await fetch("/api/auth/delete", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        alert("Your account was successfully deleted.");
        handleLogout();
      } else {
        alert("Shred action failed. Contact tree roots.");
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
    { id: "capsule", label: "Capsule", icon: Mail },
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
          /* Authentication Screen with premium glassmorphism */
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

              {/* Navigation Tab Selector for Auth Modes */}
              <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("login");
                    setAuthError("");
                  }}
                  className={`flex-1 py-2 text-center rounded-lg text-xs font-mono tracking-wider transition-all duration-200 ${
                    authMode === "login"
                      ? "bg-[var(--primary-color)] text-black font-semibold shadow"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  LOGIN CHAMBER
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("register");
                    setAuthError("");
                  }}
                  className={`flex-1 py-2 text-center rounded-lg text-xs font-mono tracking-wider transition-all duration-200 ${
                    authMode === "register"
                      ? "bg-[var(--primary-color)] text-black font-semibold shadow"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  REGISTER ROOT
                </button>
              </div>

              {authError && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs text-center font-mono flex items-center gap-2 justify-center">
                  <Shield className="w-4 h-4 shrink-0" />
                  {authError}
                </div>
              )}

              <form onSubmit={handleAuthSubmit} className="space-y-4">
                {authMode === "register" && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono opacity-50 block">Full Name</label>
                    <input
                      type="text"
                      required
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      placeholder="Enter your name"
                      className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[var(--primary-color)] text-white"
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-mono opacity-50 block">Email Address</label>
                  <input
                    type="email"
                    required
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="name@university.edu"
                    className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[var(--primary-color)] text-white font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono opacity-50 block">Access Key Code (Password)</label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[var(--primary-color)] text-white font-mono"
                    />
                    <Lock className="w-4 h-4 opacity-40 absolute right-3.5 top-3.5" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-3 rounded-xl bg-[var(--primary-color)] hover:bg-[var(--primary-color)]/95 text-black font-semibold text-sm tracking-wider flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  {authLoading ? (
                    <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : authMode === "login" ? (
                    "ENTER DIARY CHAMBERS"
                  ) : (
                    "PLANT NEW ROOT"
                  )}
                </button>
              </form>

              <div className="text-center pt-2 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode(authMode === "login" ? "register" : "login");
                    setAuthError("");
                  }}
                  className="text-xs font-mono text-[var(--primary-color)] hover:underline"
                >
                  {authMode === "login" ? "Create a new private diary root →" : "Already registered? Login chamber →"}
                </button>
              </div>
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
                  <div className="flex items-center gap-1.5 font-mono text-[10px] opacity-45">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    <span>SECURED</span>
                  </div>
                </div>

                {/* Profile mini-card */}
                {user && (
                  <div className="p-4 mx-3 my-3 bg-white/5 rounded-2xl border border-white/5 flex items-center gap-3">
                    <div className="text-2xl w-10 h-10 rounded-xl bg-black/20 flex items-center justify-center">
                      {user.avatar || "🌳"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold truncate text-white">{user.name}</h4>
                      <p className="text-[10px] font-mono opacity-50 truncate">{user.email}</p>
                    </div>
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
                <div className="bg-black/35 rounded-xl p-3 border border-white/5 text-center font-mono">
                  <span className="text-[10px] opacity-40 block uppercase">Chamber Clock</span>
                  <span className="text-xs font-bold text-slate-200 tracking-wider">
                    {currentTime.toLocaleTimeString(undefined, {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                      hour12: false,
                    })}
                  </span>
                </div>

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
                    {activeTab === "home" ? "Daily Dashboard" : activeTab === "capsule" ? "Memory Letters" : activeTab}
                  </h1>
                  <p className="text-xs opacity-50">
                    Welcome back, {user?.name}. Your digital life ledger is synchronized.
                  </p>
                </div>

                {/* Selected Date indicator widget */}
                <div className="flex items-center gap-2 bg-black/25 px-4 py-2 rounded-2xl border border-white/5 text-xs font-mono">
                  <Clock className="w-4 h-4 text-[var(--primary-color)]" />
                  <span className="opacity-60">Canvas Target:</span>
                  <span className="text-[var(--primary-color)] font-bold">{getSelectedDayLabel()}</span>
                  <button
                    onClick={() => handleCalendarSelectDate(new Date().toISOString().split("T")[0])}
                    className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 border border-white/5 text-[9px]"
                  >
                    TODAY
                  </button>
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

                {activeTab === "capsule" && (
                  <MemoryCapsule letters={letters} onSaveLetter={handleSaveLetter} />
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
    </div>
  );
}
