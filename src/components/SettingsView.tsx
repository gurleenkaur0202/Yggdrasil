import React, { useState } from "react";
import { motion } from "motion/react";
import {
  Palette, User as UserIcon, Shield, Settings2, Download, Upload, Trash2, Check, Sparkles, BookOpen, Clock, Heart, Plus
} from "lucide-react";
import { User, ThemeType, THEMES } from "../types";

interface SettingsViewProps {
  user: User;
  onUpdateProfile: (data: Partial<User>) => Promise<void>;
  onUpdatePreferences: (data: { theme: string; accentColor: string; font: string; bgOption: string }) => Promise<void>;
  onDeleteAccount: () => Promise<void>;
  onLogout: () => void;
  entries: any[];
  tasks: any[];
  habits: any[];
  letters: any[];
  bucket: any[];
}

const FONTS = [
  "Inter", "Poppins", "Space Grotesk", "Roboto", "Montserrat", "Nunito", "Playfair Display", "Merriweather", "JetBrains Mono"
];

const BACKGROUND_OPTIONS = [
  { id: "stars", label: "Twinkling Cosmic Stars ✨" },
  { id: "forest", label: "Gentle Floating Leaves 🍃" },
  { id: "rain", label: "Grave Falling Rain 🌧️" },
  { id: "snow", label: "Silent Falling Snow ❄️" },
  { id: "minimal", label: "Minimal Static Canvas 🌫️" },
];

const AVATAR_PRESETS = [
  "🌳", "🌌", "🦅", "🐺", "🍁", "🏔️", "🐋", "🦉", "🍄", "🦊"
];

export const SettingsView: React.FC<SettingsViewProps> = ({
  user,
  onUpdateProfile,
  onUpdatePreferences,
  onDeleteAccount,
  onLogout,
  entries,
  tasks,
  habits,
  letters,
  bucket,
}) => {
  // Profile State
  const [name, setName] = useState(user.name || "");
  const [avatar, setAvatar] = useState(user.avatar || "🌳");
  const [bio, setBio] = useState(user.bio || "");
  const [birthday, setBirthday] = useState(user.birthday || "");
  const [occupation, setOccupation] = useState(user.occupation || "");
  const [studyField, setStudyField] = useState(user.studyField || "");
  const [quote, setQuote] = useState(user.quote || "");

  // Status indicators
  const [profileSaving, setProfileSaving] = useState(false);
  const [prefSaving, setPrefSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteEmailConfirm, setDeleteEmailConfirm] = useState("");

  const handleUpdateProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    await onUpdateProfile({
      name,
      avatar,
      bio,
      birthday,
      occupation,
      studyField,
      quote,
    });
    setProfileSaving(false);
    alert("Profile configurations saved successfully!");
  };

  const handlePreferenceChange = async (key: string, value: string) => {
    setPrefSaving(true);
    const prefs = {
      theme: user.theme,
      accentColor: user.accentColor,
      font: user.font,
      bgOption: user.bgOption,
      [key]: value,
    };
    await onUpdatePreferences(prefs);
    setPrefSaving(false);
  };

  // Export Data JSON Backup
  const handleExportData = () => {
    const backupData = {
      v: "1.0.0",
      userProfile: {
        name: user.name,
        email: user.email,
        bio,
        birthday,
        occupation,
        studyField,
        quote,
        avatar,
        theme: user.theme,
        accentColor: user.accentColor,
        font: user.font,
        bgOption: user.bgOption,
      },
      diaryEntries: entries,
      tasks,
      habits,
      futureLetters: letters,
      bucketList: bucket,
    };

    const str = JSON.stringify(backupData, null, 2);
    const blob = new Blob([str], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `yggdrasil_backup_${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Import Backup logic
  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (!data.diaryEntries || !data.tasks) {
          throw new Error("Invalid database backup file.");
        }

        // Restore loops
        const confirmRestore = window.confirm(
          `Found backup containing:\n- ${data.diaryEntries.length} diary entries\n- ${data.tasks.length} tasks\n- ${data.habits?.length || 0} habits\nDo you want to restore this backup? Note: This will merge data.`
        );

        if (confirmRestore) {
          // Restore user settings if available
          if (data.userProfile) {
            await onUpdateProfile(data.userProfile);
            await onUpdatePreferences({
              theme: data.userProfile.theme || "galaxy",
              accentColor: data.userProfile.accentColor || "purple",
              font: data.userProfile.font || "Inter",
              bgOption: data.userProfile.bgOption || "stars",
            });
          }

          // Loop restoration calls
          for (const entry of data.diaryEntries) {
            const { id, userId, ...cleanEntry } = entry;
            await fetch("/api/diary", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("ygg_token")}`,
              },
              body: JSON.stringify(cleanEntry),
            });
          }

          for (const task of data.tasks || []) {
            const { id, userId, ...cleanTask } = task;
            await fetch("/api/tasks", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("ygg_token")}`,
              },
              body: JSON.stringify(cleanTask),
            });
          }

          for (const habit of data.habits || []) {
            const { id, userId, ...cleanHabit } = habit;
            await fetch("/api/habits", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("ygg_token")}`,
              },
              body: JSON.stringify(cleanHabit),
            });
          }

          alert("Database restored successfully! Reloading configuration...");
          window.location.reload();
        }
      } catch (err: any) {
        alert("Failed to parse backup file: " + err.message);
      }
    };
    reader.readAsText(file);
  };

  const handleDeleteAccountConfirm = async () => {
    if (deleteEmailConfirm.toLowerCase() !== user.email.toLowerCase()) {
      alert("Verification email does not match.");
      return;
    }

    await onDeleteAccount();
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Tab select settings header */}
      <div className="p-6 rounded-2xl glass-panel space-y-1">
        <h2 className="text-xl font-display font-semibold tracking-tight">Yggdrasil Core Settings</h2>
        <p className="text-xs opacity-60">
          Personalize typography, visual layouts, themes, backup records, and account configs.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 columns: Customizations & Profile */}
        <div className="lg:col-span-2 space-y-6">
          {/* Theme Store Panel */}
          <div className="p-6 rounded-2xl glass-panel space-y-5">
            <h3 className="text-sm font-semibold tracking-wide flex items-center gap-2">
              <Palette className="w-4 h-4 text-[var(--primary-color)]" /> Yggdrasil Theme Store
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.values(THEMES).map((themeOption) => {
                const isActive = user.theme === themeOption.id;

                return (
                  <button
                    key={themeOption.id}
                    onClick={() => handlePreferenceChange("theme", themeOption.id)}
                    className={`p-3 rounded-xl border flex flex-col justify-between text-left h-24 transition-all hover:scale-102 ${
                      themeOption.background
                    } ${
                      isActive
                        ? "ring-2 ring-white scale-103 shadow-lg border-white/40"
                        : "border-white/5 opacity-75 hover:opacity-100"
                    }`}
                  >
                    <span className="text-xs font-mono font-bold tracking-tight">{themeOption.name}</span>
                    <div className="flex gap-1.5 mt-2">
                      <div className="w-3.5 h-3.5 rounded-full border border-white/20" style={{ backgroundColor: themeOption.primary }} />
                      <div className="w-3.5 h-3.5 rounded-full border border-white/20" style={{ backgroundColor: themeOption.accent }} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Profile form */}
          <div className="p-6 rounded-2xl glass-panel space-y-4">
            <h3 className="text-sm font-semibold tracking-wide flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-[var(--primary-color)]" /> Life Journal Profile Personalization
            </h3>

            <form onSubmit={handleUpdateProfileSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-mono opacity-50">Select Avatar Preset</label>
                <div className="flex flex-wrap gap-2">
                  {AVATAR_PRESETS.map((av) => (
                    <button
                      key={av}
                      type="button"
                      onClick={() => setAvatar(av)}
                      className={`w-10 h-10 rounded-xl bg-black/20 border text-lg flex items-center justify-center transition-all ${
                        avatar === av ? "ring-2 ring-[var(--primary-color)] border-white/30 scale-110" : "border-white/5 opacity-50 hover:opacity-100"
                      }`}
                    >
                      {av}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono opacity-50">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-[var(--primary-color)] text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono opacity-50">Favorite Quote / Motto</label>
                  <input
                    type="text"
                    value={quote}
                    onChange={(e) => setQuote(e.target.value)}
                    placeholder="e.g. Ad Astra per Aspera"
                    className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-[var(--primary-color)] text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono opacity-50">Occupation / Status</label>
                  <input
                    type="text"
                    value={occupation}
                    onChange={(e) => setOccupation(e.target.value)}
                    placeholder="e.g. Software Researcher"
                    className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-[var(--primary-color)] text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono opacity-50">Study Field / Interests</label>
                  <input
                    type="text"
                    value={studyField}
                    onChange={(e) => setStudyField(e.target.value)}
                    placeholder="e.g. AI & Cryptography"
                    className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-[var(--primary-color)] text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono opacity-50">Birthday</label>
                  <input
                    type="date"
                    value={birthday}
                    onChange={(e) => setBirthday(e.target.value)}
                    className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-xs outline-none text-white cursor-pointer"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono opacity-50">Self Biography / Life Description</label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell your future self about your current priorities, views, and values..."
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-sm leading-relaxed outline-none focus:border-[var(--primary-color)] text-white font-serif resize-none"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={profileSaving}
                  className="px-5 py-2 rounded-xl bg-[var(--primary-color)] hover:bg-[var(--primary-color)]/90 text-black font-semibold text-xs font-mono uppercase tracking-wider disabled:opacity-50"
                >
                  {profileSaving ? "Saving..." : "Save Profile Details"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right column: Typography, Visual options & backups */}
        <div className="space-y-6">
          {/* Typography config */}
          <div className="p-6 rounded-2xl glass-panel space-y-4">
            <h3 className="text-sm font-semibold tracking-wide flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-[var(--primary-color)]" /> Typography & Canvas
            </h3>

            {/* Font selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono opacity-50">System Typography Font</label>
              <select
                value={user.font || "Inter"}
                onChange={(e) => handlePreferenceChange("font", e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none text-slate-100 cursor-pointer"
              >
                {FONTS.map((f) => (
                  <option key={f} value={f} className="bg-slate-900 text-slate-100">
                    {f}
                  </option>
                ))}
              </select>
            </div>

            {/* Background selections */}
            <div className="space-y-1.5 pt-2 border-t border-white/5">
              <label className="text-xs font-mono opacity-50">Animated Canvas Environment</label>
              <select
                value={user.bgOption || "stars"}
                onChange={(e) => handlePreferenceChange("bgOption", e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none text-slate-100 cursor-pointer"
              >
                {BACKGROUND_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id} className="bg-slate-900 text-slate-100">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Backup options */}
          <div className="p-6 rounded-2xl glass-panel space-y-4">
            <h3 className="text-sm font-semibold tracking-wide flex items-center gap-2">
              <Download className="w-4 h-4 text-purple-400" /> Database Backup Vault
            </h3>

            <div className="space-y-3">
              <button
                onClick={handleExportData}
                className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono font-semibold tracking-wide flex items-center justify-center gap-2 text-slate-200"
              >
                <Download className="w-3.5 h-3.5 text-purple-400" /> Export JSON Backup
              </button>

              <div className="relative">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportData}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <button className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono font-semibold tracking-wide flex items-center justify-center gap-2 text-slate-200">
                  <Upload className="w-3.5 h-3.5 text-emerald-400" /> Import JSON Backup
                </button>
              </div>
            </div>
          </div>

          {/* Logout & Delete Account security */}
          <div className="p-6 rounded-2xl glass-panel space-y-4 border border-rose-500/10">
            <h3 className="text-sm font-semibold tracking-wide flex items-center gap-2 text-rose-400">
              <Shield className="w-4 h-4" /> Secure Area
            </h3>

            <div className="space-y-3">
              <button
                onClick={onLogout}
                className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-xs font-mono font-bold tracking-wider text-rose-400"
              >
                LOGOUT SESSION
              </button>

              <button
                onClick={() => setShowDeleteModal(true)}
                className="w-full py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-mono font-bold tracking-wider"
              >
                DELETE ACCOUNT
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-950 border border-rose-500/20 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-rose-400 flex items-center gap-2 font-display">
              ⚠️ Permanent Account Deletion Action
            </h3>
            <p className="text-xs opacity-75 leading-relaxed font-serif">
              You are about to permanently delete your Yggdrasil World Tree account. This action is irreversible. All diary pages, goals, tasks, streaks, letters, and settings will be permanently shredded from our database files.
            </p>
            <div className="space-y-2">
              <label className="text-[11px] font-mono opacity-50 block">
                Type your email to confirm deletion: <span className="text-slate-300 font-bold">{user.email}</span>
              </label>
              <input
                type="text"
                value={deleteEmailConfirm}
                onChange={(e) => setDeleteEmailConfirm(e.target.value)}
                placeholder="Confirm your email..."
                className="w-full bg-black/30 border border-rose-500/20 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-rose-500 text-rose-400 font-mono"
              />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteEmailConfirm("");
                }}
                className="px-4 py-2 rounded-xl bg-white/5 text-xs font-mono"
              >
                CANCEL
              </button>
              <button
                onClick={handleDeleteAccountConfirm}
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-black font-bold text-xs font-mono"
              >
                SHRED PERMANENTLY
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
