import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { User as UserIcon, X, Check, Camera, Calendar, Award, BookOpen, Quote } from "lucide-react";
import { User } from "../types";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onUpdateProfile: (data: Partial<User>) => Promise<void>;
}

const AVATAR_PRESETS = [
  "🌳", "🌌", "🦅", "🐺", "🍁", "🏔️", "🐋", "🦉", "🍄", "🦊"
];

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  onUpdateProfile,
}) => {
  // Local profile editing states
  const [name, setName] = useState(user.name || "");
  const [avatar, setAvatar] = useState(user.avatar || "🌳");
  const [bio, setBio] = useState(user.bio || "");
  const [birthday, setBirthday] = useState(user.birthday || "");
  const [occupation, setOccupation] = useState(user.occupation || "");
  const [studyField, setStudyField] = useState(user.studyField || "");
  const [quote, setQuote] = useState(user.quote || "");
  const [profileSaving, setProfileSaving] = useState(false);

  // Sync state if user changes
  useEffect(() => {
    if (isOpen) {
      setName(user.name || "");
      setAvatar(user.avatar || "🌳");
      setBio(user.bio || "");
      setBirthday(user.birthday || "");
      setOccupation(user.occupation || "");
      setStudyField(user.studyField || "");
      setQuote(user.quote || "");
    }
  }, [isOpen, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    try {
      await onUpdateProfile({
        name,
        avatar,
        bio,
        birthday,
        occupation,
        studyField,
        quote,
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setProfileSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="relative w-full max-w-2xl bg-slate-900/90 border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl overflow-y-auto max-h-[90vh] scrollbar-thin"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/5 transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="mb-6 space-y-1">
              <h3 className="text-xl font-display font-semibold tracking-tight text-white flex items-center gap-2">
                <UserIcon className="w-5 h-5 text-[var(--primary-color)]" /> Life Journal Profile Personalization
              </h3>
              <p className="text-xs text-slate-400">
                Update your digital self-identity. These details are projected onto your life dashboards.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Avatar Selector */}
              <div className="space-y-2">
                <label className="text-xs font-mono opacity-50 text-slate-300 block">Select Avatar Preset</label>
                <div className="flex flex-wrap gap-2.5">
                  {AVATAR_PRESETS.map((av) => (
                    <button
                      key={av}
                      type="button"
                      onClick={() => setAvatar(av)}
                      className={`w-11 h-11 rounded-xl bg-black/35 border text-xl flex items-center justify-center transition-all ${
                        avatar === av
                          ? "ring-2 ring-[var(--primary-color)] border-white/40 scale-110 bg-[var(--primary-color)]/10"
                          : "border-white/5 opacity-50 hover:opacity-100 hover:bg-white/5"
                      }`}
                    >
                      {av}
                    </button>
                  ))}
                </div>
              </div>

              {/* Basic Fields Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono opacity-50 text-slate-300 block">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-black/45 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[var(--primary-color)] text-white transition-all focus:bg-black/60"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono opacity-50 text-slate-300 block">Favorite Quote / Motto</label>
                  <input
                    type="text"
                    value={quote}
                    onChange={(e) => setQuote(e.target.value)}
                    placeholder="e.g. Ad Astra per Aspera"
                    className="w-full bg-black/45 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[var(--primary-color)] text-white transition-all focus:bg-black/60"
                  />
                </div>
              </div>

              {/* Detail Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono opacity-50 text-slate-300 block">Occupation / Status</label>
                  <input
                    type="text"
                    value={occupation}
                    onChange={(e) => setOccupation(e.target.value)}
                    placeholder="e.g. Software Researcher"
                    className="w-full bg-black/45 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[var(--primary-color)] text-white transition-all focus:bg-black/60"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono opacity-50 text-slate-300 block">Study Field / Interests</label>
                  <input
                    type="text"
                    value={studyField}
                    onChange={(e) => setStudyField(e.target.value)}
                    placeholder="e.g. AI & Cryptography"
                    className="w-full bg-black/45 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[var(--primary-color)] text-white transition-all focus:bg-black/60"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono opacity-50 text-slate-300 block">Birthday</label>
                  <input
                    type="date"
                    value={birthday}
                    onChange={(e) => setBirthday(e.target.value)}
                    className="w-full bg-black/45 border border-white/10 rounded-xl px-3 py-2.5 text-xs outline-none text-white cursor-pointer transition-all focus:border-[var(--primary-color)] focus:bg-black/60"
                  />
                </div>
              </div>

              {/* Biography text area */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono opacity-50 text-slate-300 block">Self Biography / Life Description</label>
                <textarea
                  rows={4}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell your future self about your current priorities, views, and values..."
                  className="w-full bg-black/45 border border-white/10 rounded-xl px-4 py-3 text-sm leading-relaxed outline-none focus:border-[var(--primary-color)] text-white font-sans resize-none transition-all focus:bg-black/60"
                />
              </div>

              {/* Bottom buttons */}
              <div className="flex justify-end gap-3 pt-2 border-t border-white/5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold text-xs font-mono uppercase tracking-wider transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={profileSaving}
                  className="px-6 py-2.5 rounded-xl bg-[var(--primary-color)] hover:opacity-90 active:scale-95 text-black font-bold text-xs font-mono uppercase tracking-wider disabled:opacity-50 transition-all flex items-center gap-1.5"
                >
                  {profileSaving ? "Saving..." : "Save Profile Details"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
