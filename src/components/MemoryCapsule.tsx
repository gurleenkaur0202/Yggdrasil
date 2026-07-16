import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Lock, Unlock, Mail, Clock, Calendar, Plus, PenTool, Check, Inbox } from "lucide-react";
import { FutureLetter } from "../types";

interface MemoryCapsuleProps {
  letters: FutureLetter[];
  onSaveLetter: (letter: Partial<FutureLetter>) => Promise<void>;
}

export const MemoryCapsule: React.FC<MemoryCapsuleProps> = ({ letters, onSaveLetter }) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [targetOpenDate, setTargetOpenDate] = useState("");
  const [selectedLetter, setSelectedLetter] = useState<FutureLetter | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !targetOpenDate) return;

    // Check if targetOpenDate is at least tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    if (targetOpenDate < tomorrowStr) {
      alert("A memory capsule must be projected into the future! Please choose a date starting from tomorrow.");
      return;
    }

    await onSaveLetter({
      title: title.trim(),
      content: content.trim(),
      targetOpenDate,
    });

    setTitle("");
    setContent("");
    setTargetOpenDate("");
    setShowCreateForm(false);
  };

  const todayStr = new Date().toISOString().split("T")[0];

  const getRemainingDays = (dateStr: string) => {
    const diff = new Date(dateStr).getTime() - new Date(todayStr).getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="space-y-6">
      {/* Banner Intro */}
      <div className="p-6 rounded-2xl glass-panel relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl pointer-events-none -mr-12"></div>
        <div className="space-y-1 relative z-10">
          <h2 className="text-xl font-display font-semibold tracking-tight">Memory Letters Capsule</h2>
          <p className="text-xs opacity-60 max-w-xl">
            "Weave a letter to your future self, projected forward in time. Your thoughts are sealed in deep vault roots and will only unlock when the appointed date arrives."
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-4 py-2.5 rounded-xl bg-[var(--primary-color)] text-black font-semibold text-xs tracking-wider flex items-center gap-2 font-mono hover:bg-[var(--primary-color)]/80 transition-all relative z-10"
        >
          <PenTool className="w-4 h-4" /> WRITE NEW LETTER
        </button>
      </div>

      <AnimatePresence>
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="p-6 rounded-2xl glass-panel border border-white/10 space-y-4 overflow-hidden"
          >
            <h3 className="text-sm font-semibold tracking-wide flex items-center gap-2">
              <Plus className="w-4 h-4 text-[var(--primary-color)]" /> Draft Future projections
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono opacity-50">Capsule Letter Header</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Read this on my 25th Birthday"
                    className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[var(--primary-color)] text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono opacity-50">Unseal Release Date (Target Date)</label>
                  <input
                    type="date"
                    required
                    value={targetOpenDate}
                    onChange={(e) => setTargetOpenDate(e.target.value)}
                    className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-xs outline-none text-white cursor-pointer"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono opacity-50">Confessions, dreams, thoughts, or advice to your future self...</label>
                <textarea
                  required
                  rows={6}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Where are you in life now? What do you hope you have achieved? Be honest, poetic, and reflective..."
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm leading-relaxed outline-none focus:border-[var(--primary-color)] text-white font-serif resize-none"
                />
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-mono"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[var(--primary-color)] hover:bg-[var(--primary-color)]/90 text-black font-semibold text-xs tracking-wider"
                >
                  SEAL CAPSULE
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Letters list */}
        {letters.length === 0 ? (
          <div className="md:col-span-3 p-12 rounded-2xl glass-panel text-center font-serif text-sm opacity-50 flex flex-col items-center justify-center gap-2">
            <Inbox className="w-8 h-8 opacity-30 text-slate-400" />
            No future letters projected yet. Take some time to write a message to yourself!
          </div>
        ) : (
          letters.map((letter) => {
            const isLocked = letter.targetOpenDate > todayStr;
            const daysLeft = isLocked ? getRemainingDays(letter.targetOpenDate) : 0;

            return (
              <motion.div
                key={letter.id}
                whileHover={{ y: -4 }}
                className={`p-5 rounded-2xl glass-panel flex flex-col justify-between h-48 border transition-all ${
                  isLocked
                    ? "border-white/5 bg-black/45 cursor-not-allowed opacity-75"
                    : "border-amber-500/10 bg-amber-500/5 hover:border-amber-500/30 cursor-pointer"
                }`}
                onClick={() => !isLocked && setSelectedLetter(letter)}
              >
                <div>
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-mono opacity-40">
                      Sealed: {new Date(letter.createdAt).toLocaleDateString()}
                    </span>
                    {isLocked ? (
                      <div className="flex items-center gap-1 text-rose-400 text-xs bg-rose-400/10 px-2 py-0.5 rounded-full border border-rose-400/20">
                        <Lock className="w-3 h-3" />
                        <span className="font-mono text-[10px]">LOCKED</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-emerald-400 text-xs bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/20">
                        <Unlock className="w-3 h-3" />
                        <span className="font-mono text-[10px]">UNLOCKED</span>
                      </div>
                    )}
                  </div>

                  <h3 className="text-base font-semibold tracking-tight mt-3 text-slate-100 line-clamp-1">
                    {letter.title}
                  </h3>

                  <p className="text-xs opacity-50 mt-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> Open Date: {letter.targetOpenDate}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs font-mono">
                  {isLocked ? (
                    <span className="text-slate-400 text-[11px] flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 animate-pulse" /> Unseals in {daysLeft} days
                    </span>
                  ) : (
                    <span className="text-amber-400 font-bold flex items-center gap-1 animate-pulse">
                      <Mail className="w-3.5 h-3.5 animate-bounce" /> READ LETTER
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Reader Dialog Overlay */}
      <AnimatePresence>
        {selectedLetter && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-2xl bg-amber-50 text-slate-900 rounded-3xl p-6 md:p-8 relative shadow-2xl overflow-y-auto max-h-[85vh] border-8 border-[#3e2723]"
            >
              {/* Retro letterhead design */}
              <div className="absolute top-4 right-4">
                <button
                  onClick={() => setSelectedLetter(null)}
                  className="p-1 px-3 bg-[#3e2723]/10 hover:bg-[#3e2723]/25 text-[#3e2723] text-xs font-mono rounded-lg transition-all"
                >
                  CLOSE
                </button>
              </div>

              <div className="space-y-6 pt-4 text-[#3e2723]">
                <div className="text-center space-y-1">
                  <div className="text-[10px] font-mono tracking-widest uppercase opacity-60">
                    ✉ Projector Memory Capsule letter ✉
                  </div>
                  <h3 className="text-2xl font-serif font-bold tracking-tight border-b-2 border-[#3e2723]/20 pb-2">
                    {selectedLetter.title}
                  </h3>
                  <div className="flex justify-center gap-4 text-xs font-mono opacity-70 pt-1">
                    <span>SEALED: {new Date(selectedLetter.createdAt).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>UNSEALED: {selectedLetter.targetOpenDate}</span>
                  </div>
                </div>

                <div className="font-serif leading-relaxed text-base italic whitespace-pre-line pl-2 pr-2 py-3 bg-[#fbe9e7]/30 rounded-2xl min-h-[250px]">
                  "{selectedLetter.content}"
                </div>

                <div className="text-right pr-4 pt-4 border-t border-[#3e2723]/15 font-serif text-sm">
                  <p className="opacity-70 italic">Reflecting on the past,</p>
                  <p className="font-bold mt-1">Your Past Self</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
