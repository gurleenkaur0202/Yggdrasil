import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Save, Sparkles, Star, Tag, CheckSquare, CloudRain, MapPin, Smile, BookOpen, Trash2, ChevronRight, ChevronLeft, Calendar as CalIcon, ArrowRightLeft, Eye, Plus, Check, Play, Edit3
} from "lucide-react";
import { DiaryEntry } from "../types";

interface DiaryViewProps {
  initialDate: string;
  entries: DiaryEntry[];
  onSaveEntry: (entry: Partial<DiaryEntry>) => Promise<void>;
  onDeleteEntry: (id: string, permanent: boolean) => Promise<void>;
  token: string;
}

const CATEGORIES = ["Diary", "Idea", "Dream", "Travel", "College", "Fitness", "Business"];

const MOODS = [
  { label: "Happy", emoji: "😀", color: "text-amber-400 border-amber-500/20 bg-amber-500/10" },
  { label: "Good", emoji: "😊", color: "text-emerald-400 border-emerald-500/20 bg-emerald-500/10" },
  { label: "Normal", emoji: "😐", color: "text-blue-400 border-blue-500/20 bg-blue-500/10" },
  { label: "Sad", emoji: "😔", color: "text-indigo-400 border-indigo-500/20 bg-indigo-500/10" },
  { label: "Angry", emoji: "😡", color: "text-rose-400 border-rose-500/20 bg-rose-500/10" },
  { label: "Tired", emoji: "😴", color: "text-purple-400 border-purple-500/20 bg-purple-500/10" },
  { label: "Excited", emoji: "😍", color: "text-pink-400 border-pink-500/20 bg-pink-500/10" },
  { label: "Stressed", emoji: "🤯", color: "text-orange-400 border-orange-500/20 bg-orange-500/10" },
];

const WEATHER_OPTIONS = [
  { label: "sunny", emoji: "☀️" },
  { label: "rainy", emoji: "🌧️" },
  { label: "snowy", emoji: "❄️" },
  { label: "cloudy", emoji: "☁️" },
  { label: "windy", emoji: "💨" },
];

const PIN_COLORS = ["blue", "red", "yellow", "green", "pink"];

export const DiaryView: React.FC<DiaryViewProps> = ({
  initialDate,
  entries,
  onSaveEntry,
  onDeleteEntry,
  token,
}) => {
  const [currentDate, setCurrentDate] = useState(initialDate);

  // States
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("Personal");
  const [category, setCategory] = useState("Diary");
  const [description, setDescription] = useState("");
  const [checklist, setChecklist] = useState<{ text: string; completed: boolean }[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [emoji, setEmoji] = useState("📝");
  const [mood, setMood] = useState("Normal");
  const [weather, setWeather] = useState("sunny");
  const [location, setLocation] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [pinColor, setPinColor] = useState("blue");
  const [pinStar, setPinStar] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  // UI state
  const [newTagText, setNewTagText] = useState("");
  const [newChecklistItem, setNewChecklistItem] = useState("");
  const [newSubjectText, setNewSubjectText] = useState("");
  const [subjectsList, setSubjectsList] = useState<string[]>(["Personal", "College", "Fitness", "Ideas", "Recipes", "Work"]);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [aiAction, setAiAction] = useState<"summarize" | "grammar" | "rewrite" | "studynotes" | "todo" | "prompt" | "motivate">("summarize");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState("");
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");

  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);

  // Ref for debouncing save
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const descriptionRef = useRef(description);
  descriptionRef.current = description;

  // Load entry when currentDate changes
  useEffect(() => {
    const entry = entries.find((e) => e.date === currentDate && !e.isTrash);
    if (entry) {
      setActiveEntryId(entry.id);
      setTitle(entry.title);
      setSubject(entry.subject);
      setCategory(entry.category);
      setDescription(entry.description);
      setChecklist(entry.checklist || []);
      setTags(entry.tags || []);
      setEmoji(entry.emoji || "📝");
      setMood(entry.mood || "Normal");
      setWeather(entry.weather || "sunny");
      setLocation(entry.location || "");
      setIsPinned(entry.isPinned || false);
      setPinColor(entry.pinColor || "blue");
      setPinStar(entry.pinStar || false);
      setIsBookmarked(entry.isBookmarked || false);
      setSaveStatus("saved");
    } else {
      // Initialize with blank slate
      setActiveEntryId(null);
      setTitle("");
      setSubject("Personal");
      setCategory("Diary");
      setDescription("");
      setChecklist([]);
      setTags([]);
      setEmoji("📝");
      setMood("Normal");
      setWeather("sunny");
      setLocation("");
      setIsPinned(false);
      setPinColor("blue");
      setPinStar(false);
      setIsBookmarked(false);
      setSaveStatus("saved");
    }
  }, [currentDate, entries]);

  // Load dynamically created subjects from user data
  useEffect(() => {
    const uniqueSubjects = [...new Set(entries.filter(e => !e.isTrash).map(e => e.subject).filter(Boolean))];
    const base = ["Personal", "College", "Fitness", "Ideas", "Recipes", "Work"];
    const merged = Array.from(new Set([...base, ...uniqueSubjects]));
    setSubjectsList(merged);
  }, [entries]);

  // Handle auto-saving (saves automatically after typing stops for 2.5 seconds)
  const triggerAutoSave = () => {
    setSaveStatus("unsaved");
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(() => {
      setSaveStatus("saving");
      handleSave().then(() => {
        setSaveStatus("saved");
      });
    }, 2500);
  };

  const handleSave = async () => {
    const entryData: Partial<DiaryEntry> = {
      id: activeEntryId || undefined,
      date: currentDate,
      title,
      subject,
      category,
      description,
      checklist,
      tags,
      emoji,
      mood,
      weather,
      location,
      isPinned,
      pinColor,
      pinStar,
      isBookmarked,
    };
    await onSaveEntry(entryData);
  };

  // Immediate save on clicking save or blurring
  const handleImmediateSave = async () => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    setSaveStatus("saving");
    await handleSave();
    setSaveStatus("saved");
  };

  // Navigating dates
  const shiftDate = (days: number) => {
    const current = new Date(currentDate);
    current.setDate(current.getDate() + days);
    setCurrentDate(current.toISOString().split("T")[0]);
  };

  // Subject Creator
  const handleAddSubject = () => {
    const text = newSubjectText.trim();
    if (text && !subjectsList.includes(text)) {
      setSubjectsList([...subjectsList, text]);
      setSubject(text);
      setNewSubjectText("");
      triggerAutoSave();
    }
  };

  // Tag Manager
  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const val = newTagText.trim().replace(",", "");
      if (val && !tags.includes(val)) {
        setTags([...tags, val]);
        setNewTagText("");
        triggerAutoSave();
      }
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
    triggerAutoSave();
  };

  // Checklist Manager
  const handleAddChecklistItem = () => {
    const text = newChecklistItem.trim();
    if (text) {
      setChecklist([...checklist, { text, completed: false }]);
      setNewChecklistItem("");
      triggerAutoSave();
    }
  };

  const handleToggleChecklist = (index: number) => {
    const updated = [...checklist];
    updated[index].completed = !updated[index].completed;
    setChecklist(updated);
    triggerAutoSave();
  };

  const handleRemoveChecklistItem = (index: number) => {
    setChecklist(checklist.filter((_, i) => i !== index));
    triggerAutoSave();
  };

  // Markdown Tag Inserter Helper
  const insertMarkdown = (prefix: string, suffix: string = "") => {
    const textarea = document.getElementById("diary-editor") as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.substring(start, end);
    const replacement = prefix + selected + suffix;

    setDescription(text.substring(0, start) + replacement + text.substring(end));
    triggerAutoSave();

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
    }, 50);
  };

  // AI Assistant Call
  const handleAiAssist = async () => {
    setAiLoading(true);
    setAiResult("");
    try {
      const response = await fetch("/api/ai/assist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: aiAction,
          text: description || title || "Empty note content.",
          date: currentDate,
        }),
      });

      if (!response.ok) throw new Error(await response.text());
      const data = await response.json();
      setAiResult(data.result);
    } catch (err: any) {
      setAiResult(`Error compiling AI helper: ${err.message || err}`);
    } finally {
      setAiLoading(false);
    }
  };

  // Inject AI Result back into editor text
  const injectAiResult = (mode: "replace" | "append" | "checklist") => {
    if (!aiResult) return;
    if (mode === "replace") {
      setDescription(aiResult);
    } else if (mode === "append") {
      setDescription((prev) => prev + "\n\n" + aiResult);
    } else if (mode === "checklist") {
      // Parse list lines
      const lines = aiResult.split("\n");
      const newItems = lines
        .map((line) => line.replace(/^-\s*\[\s*\]\s*/, "").replace(/^-\s*/, "").trim())
        .filter(Boolean)
        .map((text) => ({ text, completed: false }));
      setChecklist([...checklist, ...newItems]);
    }
    triggerAutoSave();
    setIsAiOpen(false);
  };

  // Checklist statistics
  const completedChecklistCount = checklist.filter((c) => c.completed).length;
  const checklistPercent = checklist.length > 0 ? Math.round((completedChecklistCount / checklist.length) * 100) : 0;

  return (
    <div className="space-y-6 relative pb-12">
      {/* Date banner navigation */}
      <div className="flex justify-between items-center p-4 rounded-2xl glass-panel">
        <button
          onClick={() => shiftDate(-1)}
          className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 transition-all text-white/70 hover:text-white"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 font-mono text-sm tracking-wider">
          <CalIcon className="w-4 h-4 text-[var(--primary-color)]" />
          <input
            type="date"
            value={currentDate}
            onChange={(e) => setCurrentDate(e.target.value)}
            className="bg-transparent outline-none cursor-pointer border-b border-dashed border-white/20 pb-0.5"
          />
        </div>

        <button
          onClick={() => shiftDate(1)}
          className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 transition-all text-white/70 hover:text-white"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Editor Canvas (Left 2 columns) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl glass-panel space-y-4">
            {/* Save indicator & action headers */}
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{emoji}</span>
                <input
                  type="text"
                  value={emoji}
                  onChange={(e) => {
                    setEmoji(e.target.value.substring(0, 4));
                    triggerAutoSave();
                  }}
                  className="w-10 bg-black/20 text-center rounded-lg py-1 border border-white/5 outline-none font-sans"
                  title="Emoji representation"
                />
                <span className="text-xs font-mono uppercase tracking-wider bg-white/5 px-2.5 py-1 rounded-full text-slate-300">
                  {category}
                </span>
              </div>

              <div className="flex items-center gap-3 font-mono">
                {saveStatus === "saving" && (
                  <span className="text-xs text-amber-400 animate-pulse flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                    Saving...
                  </span>
                )}
                {saveStatus === "saved" && (
                  <span className="text-xs text-emerald-400 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Saved
                  </span>
                )}
                {saveStatus === "unsaved" && (
                  <span className="text-xs text-slate-400 italic">Unsaved changes</span>
                )}

                <button
                  onClick={handleImmediateSave}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 hover:text-white transition-all ml-1"
                  title="Save Now"
                >
                  <Save className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Title field */}
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                triggerAutoSave();
              }}
              placeholder="Give today's page a Title..."
              className="w-full bg-transparent border-none text-2xl font-display font-semibold outline-none tracking-tight placeholder-white/20 text-slate-100"
            />

            {/* Markdown toolbar helpers */}
            <div className="flex flex-wrap gap-1 p-1 bg-black/20 border border-white/5 rounded-xl text-xs font-mono">
              <button
                type="button"
                onClick={() => insertMarkdown("**", "**")}
                className="px-2 py-1 rounded hover:bg-white/5 font-bold"
              >
                B
              </button>
              <button
                type="button"
                onClick={() => insertMarkdown("*", "*")}
                className="px-2 py-1 rounded hover:bg-white/5 italic"
              >
                I
              </button>
              <button
                type="button"
                onClick={() => insertMarkdown("## ")}
                className="px-2 py-1 rounded hover:bg-white/5"
              >
                H2
              </button>
              <button
                type="button"
                onClick={() => insertMarkdown("\n> ")}
                className="px-2 py-1 rounded hover:bg-white/5 font-serif"
              >
                “ Quote
              </button>
              <button
                type="button"
                onClick={() => insertMarkdown("\n```\n", "\n```")}
                className="px-2 py-1 rounded hover:bg-white/5"
              >
                Code
              </button>
              <button
                type="button"
                onClick={() => insertMarkdown("\n- ")}
                className="px-2 py-1 rounded hover:bg-white/5"
              >
                • List
              </button>
              <div className="h-4 w-px bg-white/10 mx-1 align-middle my-auto" />
              <button
                type="button"
                onClick={() => setIsAiOpen(true)}
                className="px-2.5 py-1 rounded bg-[var(--primary-color)]/25 hover:bg-[var(--primary-color)]/45 text-[var(--primary-color)] font-medium flex items-center gap-1 tracking-wide"
              >
                <Sparkles className="w-3 h-3 animate-pulse" /> Ask Yggdrasil AI
              </button>
            </div>

            {/* Textarea description */}
            <textarea
              id="diary-editor"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                triggerAutoSave();
              }}
              placeholder="Pour your mind out. Document memories, list concepts studied, draw connections, set intentions..."
              className="w-full min-h-[350px] md:min-h-[420px] bg-transparent border-none outline-none resize-none text-base leading-relaxed font-serif placeholder-white/20 text-slate-200"
            />
          </div>

          {/* Interactive Checklists Section */}
          <div className="p-6 rounded-2xl glass-panel space-y-4">
            <h3 className="text-sm font-semibold tracking-wide flex items-center justify-between">
              <span className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-[var(--primary-color)]" /> Checklists & Milestones
              </span>
              {checklist.length > 0 && (
                <span className="text-xs font-mono opacity-50">{checklistPercent}% Complete</span>
              )}
            </h3>

            {checklist.length > 0 && (
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-400 transition-all duration-500"
                  style={{ width: `${checklistPercent}%` }}
                />
              </div>
            )}

            {checklist.length === 0 ? (
              <p className="text-xs opacity-40 font-serif italic">No checkboxes created for this date.</p>
            ) : (
              <div className="space-y-2">
                {checklist.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-black/20 border border-white/5 group">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={() => handleToggleChecklist(idx)}
                        className="w-4.5 h-4.5 rounded bg-black/30 border-white/10 text-emerald-400 focus:ring-0 cursor-pointer"
                      />
                      <span className={`text-sm ${item.completed ? "line-through opacity-40" : "opacity-85"}`}>
                        {item.text}
                      </span>
                    </div>
                    <button
                      onClick={() => handleRemoveChecklistItem(idx)}
                      className="text-white/35 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="text"
                value={newChecklistItem}
                onChange={(e) => setNewChecklistItem(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddChecklistItem()}
                placeholder="Create a new check-item..."
                className="flex-1 bg-black/30 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-[var(--primary-color)]"
              />
              <button
                onClick={handleAddChecklistItem}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm"
              >
                Add
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar Controls Panel (Right column) */}
        <div className="space-y-6">
          {/* Metadata configurations */}
          <div className="p-6 rounded-2xl glass-panel space-y-5">
            <h3 className="text-xs uppercase tracking-wider font-mono opacity-60 flex items-center gap-2">
              <BookOpen className="w-3.5 h-3.5" /> Categorization & Organizing
            </h3>

            {/* Category selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono opacity-50">Content Type</label>
              <div className="grid grid-cols-2 gap-1 bg-black/25 p-1 rounded-xl border border-white/5">
                {CATEGORIES.slice(0, 4).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setCategory(cat);
                      triggerAutoSave();
                    }}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-mono transition-all ${
                      category === cat
                        ? "bg-[var(--primary-color)] text-black font-semibold"
                        : "opacity-60 hover:opacity-100"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Subject Dropdown & Creator */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono opacity-50">Subject Folder</label>
              <select
                value={subject}
                onChange={(e) => {
                  setSubject(e.target.value);
                  triggerAutoSave();
                }}
                className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none text-slate-100 cursor-pointer"
              >
                {subjectsList.map((sub) => (
                  <option key={sub} value={sub} className="bg-slate-900 text-slate-100">
                    {sub}
                  </option>
                ))}
              </select>

              <div className="flex gap-1.5 mt-2">
                <input
                  type="text"
                  value={newSubjectText}
                  onChange={(e) => setNewSubjectText(e.target.value)}
                  placeholder="New Subject folder..."
                  className="flex-1 bg-black/20 border border-white/5 rounded-lg px-2 py-1 text-xs outline-none"
                />
                <button
                  onClick={handleAddSubject}
                  className="p-1 px-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-xs text-slate-300"
                >
                  Create
                </button>
              </div>
            </div>

            {/* Bookmark & Pins widget */}
            <div className="pt-2 border-t border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono opacity-50">Pin Calendar Event</span>
                <input
                  type="checkbox"
                  checked={isPinned}
                  onChange={(e) => {
                    setIsPinned(e.target.checked);
                    triggerAutoSave();
                  }}
                  className="w-4 h-4 rounded text-[var(--primary-color)] focus:ring-0 outline-none"
                />
              </div>

              {isPinned && (
                <div className="space-y-2 p-3 rounded-xl bg-black/20 border border-white/5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono opacity-50">Star Highlight Icon</span>
                    <input
                      type="checkbox"
                      checked={pinStar}
                      onChange={(e) => {
                        setPinStar(e.target.checked);
                        triggerAutoSave();
                      }}
                      className="w-3.5 h-3.5 rounded text-amber-400 focus:ring-0 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono opacity-50">Color Label</span>
                    <div className="flex gap-1.5">
                      {PIN_COLORS.map((col) => (
                        <button
                          key={col}
                          onClick={() => {
                            setPinColor(col);
                            triggerAutoSave();
                          }}
                          className={`w-4 h-4 rounded-full border border-white/10 ${
                            col === "blue" ? "bg-blue-400" :
                            col === "red" ? "bg-rose-400" :
                            col === "yellow" ? "bg-amber-400" :
                            col === "green" ? "bg-emerald-400" : "bg-pink-400"
                          } ${pinColor === col ? "ring-2 ring-white scale-125" : ""}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-xs font-mono opacity-50">Add to Bookmarks</span>
                <input
                  type="checkbox"
                  checked={isBookmarked}
                  onChange={(e) => {
                    setIsBookmarked(e.target.checked);
                    triggerAutoSave();
                  }}
                  className="w-4 h-4 rounded text-[var(--primary-color)] focus:ring-0 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Environmental parameters Mood, Weather, Location */}
          <div className="p-6 rounded-2xl glass-panel space-y-4">
            <h3 className="text-xs uppercase tracking-wider font-mono opacity-60 flex items-center gap-2">
              <Smile className="w-3.5 h-3.5" /> Environmental Anchors
            </h3>

            {/* Mood select */}
            <div className="space-y-2">
              <label className="text-xs font-mono opacity-50">Mood Selection</label>
              <div className="grid grid-cols-4 gap-1.5">
                {MOODS.map((md) => (
                  <button
                    key={md.label}
                    onClick={() => {
                      setMood(md.label);
                      triggerAutoSave();
                    }}
                    className={`p-2 rounded-xl text-center border text-sm transition-all flex flex-col items-center justify-center gap-1 ${
                      mood === md.label
                        ? md.color + " border-white/20 scale-105 shadow-md"
                        : "bg-black/10 border-white/5 opacity-40 hover:opacity-100"
                    }`}
                    title={md.label}
                  >
                    <span className="text-base">{md.emoji}</span>
                    <span className="text-[8px] font-mono tracking-tighter scale-90">{md.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Weather select */}
            <div className="space-y-2 pt-2 border-t border-white/5">
              <label className="text-xs font-mono opacity-50">Weather today</label>
              <div className="flex justify-between bg-black/20 p-1.5 rounded-xl border border-white/5">
                {WEATHER_OPTIONS.map((opt) => (
                  <button
                    key={opt.label}
                    onClick={() => {
                      setWeather(opt.label);
                      triggerAutoSave();
                    }}
                    className={`p-1.5 rounded-lg text-sm flex-1 text-center transition-all ${
                      weather === opt.label
                        ? "bg-white/10 opacity-100 scale-105"
                        : "opacity-45 hover:opacity-100"
                    }`}
                    title={opt.label}
                  >
                    {opt.emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Location input */}
            <div className="space-y-1.5 pt-2 border-t border-white/5">
              <label className="text-xs font-mono opacity-50 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => {
                  setLocation(e.target.value);
                  triggerAutoSave();
                }}
                placeholder="e.g. San Francisco, CA"
                className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-[var(--primary-color)] text-slate-200"
              />
            </div>
          </div>

          {/* Tags managers */}
          <div className="p-6 rounded-2xl glass-panel space-y-4">
            <h3 className="text-xs uppercase tracking-wider font-mono opacity-60 flex items-center gap-2">
              <Tag className="w-3.5 h-3.5" /> Tag References
            </h3>

            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 rounded-full bg-white/5 border border-white/5 text-[10px] font-mono text-slate-300 flex items-center gap-1 group"
                >
                  #{tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="text-white/30 hover:text-white/80 transition-colors cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>

            <input
              type="text"
              value={newTagText}
              onChange={(e) => setNewTagText(e.target.value)}
              onKeyDown={handleAddTag}
              placeholder="Press Enter to add tags..."
              className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-[var(--primary-color)] text-slate-200"
            />
          </div>
        </div>
      </div>

      {/* Slide-out or Glass Drawer for AI Assistant */}
      <AnimatePresence>
        {isAiOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end">
            {/* Click backdrop to close */}
            <div className="absolute inset-0" onClick={() => setIsAiOpen(false)} />

            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="w-full max-w-md bg-slate-950/95 border-l border-white/10 h-full p-6 relative flex flex-col justify-between overflow-y-auto"
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[var(--primary-color)] animate-pulse" />
                    <h3 className="text-lg font-semibold font-display tracking-tight text-white">
                      Yggdrasil Counsel AI
                    </h3>
                  </div>
                  <button
                    onClick={() => setIsAiOpen(false)}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-mono"
                  >
                    CLOSE
                  </button>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-mono opacity-50">Select Counsel Directive</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { key: "summarize", label: "Summarize Entry" },
                      { key: "grammar", label: "Proofread Prose" },
                      { key: "rewrite", label: "Poetic Rewrite" },
                      { key: "studynotes", label: "Generate Study Notes" },
                      { key: "todo", label: "Extract Checklist" },
                    ].map((opt) => (
                      <button
                        key={opt.key}
                        onClick={() => setAiAction(opt.key as any)}
                        className={`p-2.5 rounded-xl text-xs font-mono text-left border ${
                          aiAction === opt.key
                            ? "bg-[var(--primary-color)]/10 border-[var(--primary-color)] text-[var(--primary-color)]"
                            : "bg-black/30 border-white/5 opacity-60 hover:opacity-100"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleAiAssist}
                  disabled={aiLoading}
                  className="w-full py-3 rounded-xl bg-[var(--primary-color)] hover:bg-[var(--primary-color)]/80 text-black font-semibold text-sm tracking-wider flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                >
                  {aiLoading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      Weaving the world-tree thoughts...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" /> Run AI Directive
                    </>
                  )}
                </button>

                {/* AI Text Display Output */}
                {aiResult && (
                  <div className="space-y-3">
                    <label className="text-xs font-mono opacity-50">Yggdrasil counsel output:</label>
                    <div className="p-4 rounded-xl bg-black/45 border border-white/5 text-sm leading-relaxed text-slate-200 font-serif max-h-[300px] overflow-y-auto scrollbar-thin">
                      {aiResult}
                    </div>
                  </div>
                )}
              </div>

              {aiResult && (
                <div className="grid grid-cols-2 gap-2 pt-4 border-t border-white/10 mt-6">
                  {aiAction === "todo" ? (
                    <button
                      onClick={() => injectAiResult("checklist")}
                      className="w-full py-2 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-black text-xs font-mono font-bold"
                    >
                      Merge to Checklists
                    </button>
                  ) : (
                    <button
                      onClick={() => injectAiResult("append")}
                      className="w-full py-2 px-3 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs font-mono font-bold"
                    >
                      Append to Bottom
                    </button>
                  )}
                  <button
                    onClick={() => injectAiResult("replace")}
                    className="w-full py-2 px-3 rounded-lg bg-[var(--primary-color)] hover:bg-[var(--primary-color)]/80 text-black text-xs font-mono font-bold"
                  >
                    Replace Entire Note
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
