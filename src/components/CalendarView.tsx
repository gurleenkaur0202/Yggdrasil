import React, { useState } from "react";
import { motion } from "motion/react";
import { ChevronLeft, ChevronRight, Calendar as CalIcon, Star, Search, Filter } from "lucide-react";
import { DiaryEntry } from "../types";

interface CalendarViewProps {
  entries: DiaryEntry[];
  onSelectDate: (dateStr: string) => void;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const MOOD_COLORS: Record<string, string> = {
  Happy: "bg-amber-400 border-amber-500",
  Good: "bg-emerald-400 border-emerald-500",
  Normal: "bg-blue-400 border-blue-500",
  Sad: "bg-indigo-400 border-indigo-500",
  Angry: "bg-rose-500 border-rose-600",
  Tired: "bg-purple-400 border-purple-500",
  Excited: "bg-pink-400 border-pink-500",
  Stressed: "bg-orange-400 border-orange-500",
};

export const CalendarView: React.FC<CalendarViewProps> = ({ entries, onSelectDate }) => {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [searchDate, setSearchDate] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("All");

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleJumpToToday = () => {
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchDate) return;
    const parsedDate = new Date(searchDate);
    if (!isNaN(parsedDate.getTime())) {
      setCurrentMonth(parsedDate.getMonth());
      setCurrentYear(parsedDate.getFullYear());
      // Navigate to selected date directly
      const dateStr = searchDate;
      onSelectDate(dateStr);
    }
  };

  // Compute Grid Data
  const daysInMonth = getDaysInMonth(currentMonth, currentYear);
  const firstDayIndex = getFirstDayOfMonth(currentMonth, currentYear);

  // Pad the start with days from the previous month
  const prevMonthIdx = currentMonth === 0 ? 11 : currentMonth - 1;
  const prevYearIdx = currentMonth === 0 ? currentYear - 1 : currentYear;
  const daysInPrevMonth = getDaysInMonth(prevMonthIdx, prevYearIdx);

  const gridCells = [];

  // Previous month padding cells
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i;
    const dateStr = `${prevYearIdx}-${String(prevMonthIdx + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    gridCells.push({ dayNum: d, isCurrentMonth: false, dateStr });
  }

  // Current month cells
  for (let i = 1; i <= daysInMonth; i++) {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
    gridCells.push({ dayNum: i, isCurrentMonth: true, dateStr });
  }

  // Next month padding cells
  const remainingCells = 42 - gridCells.length; // standard 6-row grid
  const nextMonthIdx = currentMonth === 11 ? 0 : currentMonth + 1;
  const nextYearIdx = currentMonth === 11 ? currentYear + 1 : currentYear;
  for (let i = 1; i <= remainingCells; i++) {
    const dateStr = `${nextYearIdx}-${String(nextMonthIdx + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
    gridCells.push({ dayNum: i, isCurrentMonth: false, dateStr });
  }

  // Fetch unique subjects for filter list
  const activeEntries = entries.filter(e => !e.isTrash);
  const subjects = ["All", ...new Set(activeEntries.map(e => e.subject).filter(Boolean))];

  return (
    <div className="space-y-6">
      {/* Calendar Header / Navigation Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 p-5 rounded-2xl glass-panel">
        <div className="flex items-center gap-2">
          <CalIcon className="w-5 h-5 text-[var(--primary-color)]" />
          <h2 className="text-xl font-display font-semibold tracking-tight">
            {MONTHS[currentMonth]} {currentYear}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handlePrevMonth}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 transition-all"
            title="Previous Month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleJumpToToday}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-mono tracking-wider"
          >
            TODAY
          </button>
          <button
            onClick={handleNextMonth}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 transition-all"
            title="Next Month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Subject Filter removed */}
        </div>

        {/* Date jumper removed */}
      </div>

      {/* Weekdays indicator bar */}
      <div className="grid grid-cols-7 gap-2 text-center text-xs uppercase tracking-wider font-mono opacity-50 font-semibold py-1">
        {WEEKDAYS.map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>

      {/* Calendar 6x7 Grid */}
      <div className="grid grid-cols-7 gap-2">
        {gridCells.map((cell, idx) => {
          // Find matching active entry for this cell
          const cellEntries = activeEntries.filter((e) => e.date === cell.dateStr);
          // Apply subject filter if any
          const filteredEntries = subjectFilter === "All"
            ? cellEntries
            : cellEntries.filter(e => e.subject === subjectFilter);

          const entry = filteredEntries[0]; // Take first matching entry as primary cell represent
          const isToday = cell.dateStr === today.toISOString().split("T")[0];

          return (
            <motion.div
              key={idx}
              whileHover={{ scale: 1.02 }}
              onClick={() => onSelectDate(cell.dateStr)}
              className={`min-h-[90px] md:min-h-[110px] p-2 rounded-xl border flex flex-col justify-between cursor-pointer transition-all ${
                cell.isCurrentMonth
                  ? "bg-white/5 border-white/5 hover:border-white/15"
                  : "bg-transparent border-transparent opacity-30 hover:opacity-50"
              } ${isToday ? "ring-2 ring-[var(--primary-color)] shadow-lg shadow-[var(--primary-color)]/20" : ""}`}
            >
              {/* Day Number and Pin Highlights */}
              <div className="flex justify-between items-center">
                <span
                  className={`text-xs font-mono ${
                    isToday
                      ? "bg-[var(--primary-color)] text-black font-bold w-5 h-5 flex items-center justify-center rounded-full"
                      : "opacity-60"
                  }`}
                >
                  {cell.dayNum}
                </span>

                {/* Stars/Pins display */}
                {entry?.isPinned && (
                  <Star
                    className="w-3.5 h-3.5 animate-pulse"
                    style={{
                      color: entry.pinColor || "#fbbf24",
                      fill: entry.pinColor || "#fbbf24",
                    }}
                  />
                )}
              </div>

              {/* Central Details Badge */}
              {entry ? (
                <div className="flex flex-col gap-1 my-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] hidden md:inline font-mono opacity-70 truncate max-w-[50px] bg-white/5 px-1 py-0.5 rounded">
                      {entry.subject}
                    </span>
                  </div>
                  <div className="text-[10px] hidden md:block opacity-85 truncate font-serif italic font-medium pr-1">
                    {entry.title || "Documented"}
                  </div>
                </div>
              ) : (
                <div className="h-6 md:h-10" />
              )}

              {/* Bottom Mood Color and Status Details */}
              <div className="flex justify-between items-center">
                {entry?.mood && MOOD_COLORS[entry.mood] ? (
                  <div
                    className={`w-2.5 h-2.5 rounded-full border ${MOOD_COLORS[entry.mood]}`}
                    title={`Mood: ${entry.mood}`}
                  />
                ) : (
                  <div className="w-1" />
                )}

                {entry?.checklist?.length > 0 && (
                  <span className="text-[9px] font-mono opacity-40">
                    ✔ {entry.checklist.filter(c => c.completed).length}/{entry.checklist.length}
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
