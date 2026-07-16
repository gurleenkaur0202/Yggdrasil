export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  birthday?: string;
  occupation?: string;
  studyField?: string;
  quote?: string;
  theme: string;
  accentColor: string;
  font: string;
  bgOption: string;
  createdAt: string;
}

export interface DiaryEntry {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  title: string;
  subject: string;
  category: string;
  description: string;
  checklist: { text: string; completed: boolean }[];
  tags: string[];
  emoji: string;
  mood: string;
  weather?: string;
  location?: string;
  isPinned: boolean;
  pinColor?: string;
  pinStar?: boolean;
  isBookmarked: boolean;
  isArchived: boolean;
  isTrash: boolean;
  recentlyViewedAt?: string;
  updatedAt: string;
}

export interface Habit {
  id: string;
  userId: string;
  name: string;
  logs: string[]; // dates: YYYY-MM-DD
  createdAt: string;
}

export interface Task {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  text: string;
  completed: boolean;
  priority: "high" | "medium" | "low";
  category: string;
  recurrence: "none" | "daily" | "weekly" | "monthly";
}

export interface FutureLetter {
  id: string;
  userId: string;
  title: string;
  content: string;
  targetOpenDate: string; // YYYY-MM-DD
  isOpened: boolean;
  createdAt: string;
}

export interface BucketItem {
  id: string;
  userId: string;
  title: string;
  completed: boolean;
  category: string;
  targetDate?: string;
  createdAt: string;
}

export type ThemeType =
  | "light"
  | "dark"
  | "forest"
  | "ocean"
  | "aurora"
  | "sunset"
  | "galaxy"
  | "cyberpunk"
  | "pastel"
  | "midnight"
  | "lavender"
  | "coffee"
  | "elegant_dark";

export interface ThemeConfig {
  id: ThemeType;
  name: string;
  background: string;
  text: string;
  primary: string;
  accent: string;
  cardBg: string;
  borderColor: string;
  glowColor: string;
}

export const THEMES: Record<ThemeType, ThemeConfig> = {
  elegant_dark: {
    id: "elegant_dark",
    name: "Elegant Dark",
    background: "bg-[#050505] text-zinc-300",
    text: "text-zinc-300",
    primary: "#34d399",
    accent: "#0891b2",
    cardBg: "bg-white/[0.03] backdrop-blur-sm border border-white/5",
    borderColor: "border-white/5",
    glowColor: "rgba(52, 211, 153, 0.15)",
  },
  light: {
    id: "light",
    name: "Light Alabaster",
    background: "bg-slate-50 text-slate-900",
    text: "text-slate-900",
    primary: "#0f172a",
    accent: "#3b82f6",
    cardBg: "bg-white/80 backdrop-blur-md",
    borderColor: "border-slate-200/50",
    glowColor: "rgba(59, 130, 246, 0.15)",
  },
  dark: {
    id: "dark",
    name: "Obsidian Dark",
    background: "bg-slate-950 text-slate-100",
    text: "text-slate-100",
    primary: "#6366f1",
    accent: "#a5b4fc",
    cardBg: "bg-slate-900/40 backdrop-blur-xl",
    borderColor: "border-slate-800/40",
    glowColor: "rgba(99, 102, 241, 0.2)",
  },
  forest: {
    id: "forest",
    name: "Sylvan Canopy",
    background: "bg-emerald-950 text-emerald-50",
    text: "text-emerald-50",
    primary: "#10b981",
    accent: "#34d399",
    cardBg: "bg-emerald-900/30 backdrop-blur-xl",
    borderColor: "border-emerald-800/30",
    glowColor: "rgba(16, 185, 129, 0.25)",
  },
  ocean: {
    id: "ocean",
    name: "Abyssal Trench",
    background: "bg-cyan-950 text-cyan-50",
    text: "text-cyan-50",
    primary: "#06b6d4",
    accent: "#22d3ee",
    cardBg: "bg-cyan-950/40 backdrop-blur-xl",
    borderColor: "border-cyan-900/30",
    glowColor: "rgba(6, 182, 212, 0.25)",
  },
  aurora: {
    id: "aurora",
    name: "Northern Lights",
    background: "bg-indigo-950 text-teal-100",
    text: "text-teal-100",
    primary: "#14b8a6",
    accent: "#818cf8",
    cardBg: "bg-teal-950/20 backdrop-blur-xl border border-teal-500/10",
    borderColor: "border-teal-500/20",
    glowColor: "rgba(20, 184, 166, 0.3)",
  },
  sunset: {
    id: "sunset",
    name: "Solar Flare",
    background: "bg-amber-950 text-orange-100",
    text: "text-orange-100",
    primary: "#f97316",
    accent: "#fbcfe8",
    cardBg: "bg-amber-950/35 backdrop-blur-xl",
    borderColor: "border-orange-800/20",
    glowColor: "rgba(249, 115, 22, 0.25)",
  },
  galaxy: {
    id: "galaxy",
    name: "Cosmic Nebula",
    background: "bg-[#090514] text-[#ece7f5]",
    text: "text-[#ece7f5]",
    primary: "#c084fc",
    accent: "#fb7185",
    cardBg: "bg-purple-950/20 backdrop-blur-xl",
    borderColor: "border-purple-500/10",
    glowColor: "rgba(192, 132, 252, 0.3)",
  },
  cyberpunk: {
    id: "cyberpunk",
    name: "Neon Grid",
    background: "bg-black text-[#00ffcc]",
    text: "text-[#00ffcc]",
    primary: "#ff007f",
    accent: "#00f0ff",
    cardBg: "bg-zinc-950/80 border-2 border-[#ff007f]/40 backdrop-blur-md",
    borderColor: "border-[#00f0ff]/30",
    glowColor: "rgba(0, 240, 255, 0.4)",
  },
  pastel: {
    id: "pastel",
    name: "Cotton Candy",
    background: "bg-pink-50 text-indigo-900",
    text: "text-indigo-900",
    primary: "#f472b6",
    accent: "#818cf8",
    cardBg: "bg-white/90 backdrop-blur-md",
    borderColor: "border-pink-200/50",
    glowColor: "rgba(244, 114, 182, 0.15)",
  },
  midnight: {
    id: "midnight",
    name: "Polar Void",
    background: "bg-[#020617] text-slate-100",
    text: "text-slate-100",
    primary: "#38bdf8",
    accent: "#0284c7",
    cardBg: "bg-slate-900/60 backdrop-blur-xl",
    borderColor: "border-slate-800/60",
    glowColor: "rgba(56, 189, 248, 0.2)",
  },
  lavender: {
    id: "lavender",
    name: "Lavender Field",
    background: "bg-[#18122B] text-[#E5D5FC]",
    text: "text-[#E5D5FC]",
    primary: "#9C4DF4",
    accent: "#D6C3F9",
    cardBg: "bg-[#393053]/40 backdrop-blur-xl",
    borderColor: "border-[#443C68]/40",
    glowColor: "rgba(156, 77, 244, 0.25)",
  },
  coffee: {
    id: "coffee",
    name: "Mocha Dream",
    background: "bg-[#1c120c] text-amber-100",
    text: "text-amber-100",
    primary: "#d97706",
    accent: "#fcd34d",
    cardBg: "bg-[#2d1b0f]/55 backdrop-blur-xl",
    borderColor: "border-amber-900/20",
    glowColor: "rgba(217, 119, 6, 0.2)",
  },
};
