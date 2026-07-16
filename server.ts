import express from "express";
import path from "path";
import crypto from "crypto";
import { promises as fs } from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Initialize Google Gen AI
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// JSON File Database Setup
const DB_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DB_DIR, "db.json");

interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
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

interface DiaryEntry {
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

interface Habit {
  id: string;
  userId: string;
  name: string;
  logs: string[]; // dates: YYYY-MM-DD
  createdAt: string;
}

interface Task {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  text: string;
  completed: boolean;
  priority: "high" | "medium" | "low";
  category: string;
  recurrence: "none" | "daily" | "weekly" | "monthly";
}

interface FutureLetter {
  id: string;
  userId: string;
  title: string;
  content: string;
  targetOpenDate: string; // YYYY-MM-DD
  isOpened: boolean;
  createdAt: string;
}

interface BucketItem {
  id: string;
  userId: string;
  title: string;
  completed: boolean;
  category: string;
  targetDate?: string;
  createdAt: string;
}

interface DBData {
  users: User[];
  diaryEntries: DiaryEntry[];
  habits: Habit[];
  tasks: Task[];
  futureLetters: FutureLetter[];
  bucketList: BucketItem[];
}

const initialData: DBData = {
  users: [],
  diaryEntries: [],
  habits: [],
  tasks: [],
  futureLetters: [],
  bucketList: [],
};

async function readDB(): Promise<DBData> {
  try {
    await fs.mkdir(DB_DIR, { recursive: true });
    try {
      const content = await fs.readFile(DB_FILE, "utf-8");
      return JSON.parse(content);
    } catch {
      await fs.writeFile(DB_FILE, JSON.stringify(initialData, null, 2), "utf-8");
      return initialData;
    }
  } catch (err) {
    console.error("Database read error:", err);
    return initialData;
  }
}

async function writeDB(data: DBData): Promise<void> {
  try {
    await fs.mkdir(DB_DIR, { recursive: true });
    const tempFile = `${DB_FILE}.tmp`;
    await fs.writeFile(tempFile, JSON.stringify(data, null, 2), "utf-8");
    await fs.rename(tempFile, DB_FILE);
  } catch (err) {
    console.error("Database write error:", err);
  }
}

// Token and Hashing Security Configuration
const JWT_SECRET = process.env.JWT_SECRET || "yggdrasil-world-tree-secret-key-2026";

function hashPassword(password: string): string {
  return crypto.createHmac("sha256", JWT_SECRET).update(password).digest("hex");
}

function signToken(payload: { userId: string }): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const data = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 })).toString("base64url");
  const signature = crypto.createHmac("sha256", JWT_SECRET).update(`${header}.${data}`).digest("base64url");
  return `${header}.${data}.${signature}`;
}

function verifyToken(token: string): { userId: string } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, data, signature] = parts;
    const expectedSig = crypto.createHmac("sha256", JWT_SECRET).update(`${header}.${data}`).digest("base64url");
    if (signature !== expectedSig) return null;
    const decoded = JSON.parse(Buffer.from(data, "base64url").toString("utf8"));
    if (decoded.exp && Date.now() > decoded.exp) return null;
    return decoded;
  } catch {
    return null;
  }
}

// Auth Middleware
function authMiddleware(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }
  const token = authHeader.split(" ")[1];
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: "Invalid or expired session token." });
  }
  req.userId = payload.userId;
  next();
}

// Express Global Middleware
app.use(express.json({ limit: "20mb" }));

// --- API ROUTES ---

// 1. Authentication

// Register
app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: "All fields are required." });
    }

    const db = await readDB();
    const existingUser = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (existingUser) {
      return res.status(400).json({ error: "An account with this email already exists." });
    }

    const newUser: User = {
      id: crypto.randomUUID(),
      name,
      email: email.toLowerCase(),
      passwordHash: hashPassword(password),
      theme: "elegant_dark",
      accentColor: "emerald",
      font: "Inter",
      bgOption: "stars",
      createdAt: new Date().toISOString(),
    };

    db.users.push(newUser);
    await writeDB(db);

    const token = signToken({ userId: newUser.id });
    const { passwordHash, ...userResponse } = newUser;
    res.status(201).json({ user: userResponse, token });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Registration failed." });
  }
});

// Login
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const db = await readDB();
    const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user || user.passwordHash !== hashPassword(password)) {
      return res.status(400).json({ error: "Invalid email or password." });
    }

    const token = signToken({ userId: user.id });
    const { passwordHash, ...userResponse } = user;
    res.json({ user: userResponse, token });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Login failed." });
  }
});

// Get Current User
app.get("/api/auth/me", authMiddleware, async (req: any, res) => {
  try {
    const db = await readDB();
    const user = db.users.find((u) => u.id === req.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }
    const { passwordHash, ...userResponse } = user;
    res.json(userResponse);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update Profile Customizations
app.put("/api/auth/profile", authMiddleware, async (req: any, res) => {
  try {
    const { name, avatar, bio, birthday, occupation, studyField, quote } = req.body;
    const db = await readDB();
    const userIndex = db.users.findIndex((u) => u.id === req.userId);
    if (userIndex === -1) {
      return res.status(404).json({ error: "User not found." });
    }

    db.users[userIndex] = {
      ...db.users[userIndex],
      name: name || db.users[userIndex].name,
      avatar: avatar !== undefined ? avatar : db.users[userIndex].avatar,
      bio: bio !== undefined ? bio : db.users[userIndex].bio,
      birthday: birthday !== undefined ? birthday : db.users[userIndex].birthday,
      occupation: occupation !== undefined ? occupation : db.users[userIndex].occupation,
      studyField: studyField !== undefined ? studyField : db.users[userIndex].studyField,
      quote: quote !== undefined ? quote : db.users[userIndex].quote,
    };

    await writeDB(db);
    const { passwordHash, ...userResponse } = db.users[userIndex];
    res.json(userResponse);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update Preferences (Theme, Color, Fonts, etc.)
app.put("/api/auth/preferences", authMiddleware, async (req: any, res) => {
  try {
    const { theme, accentColor, font, bgOption } = req.body;
    const db = await readDB();
    const userIndex = db.users.findIndex((u) => u.id === req.userId);
    if (userIndex === -1) {
      return res.status(404).json({ error: "User not found." });
    }

    db.users[userIndex] = {
      ...db.users[userIndex],
      theme: theme || db.users[userIndex].theme,
      accentColor: accentColor || db.users[userIndex].accentColor,
      font: font || db.users[userIndex].font,
      bgOption: bgOption || db.users[userIndex].bgOption,
    };

    await writeDB(db);
    const { passwordHash, ...userResponse } = db.users[userIndex];
    res.json(userResponse);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete User Account
app.post("/api/auth/delete", authMiddleware, async (req: any, res) => {
  try {
    const db = await readDB();
    db.users = db.users.filter((u) => u.id !== req.userId);
    db.diaryEntries = db.diaryEntries.filter((e) => e.userId !== req.userId);
    db.habits = db.habits.filter((h) => h.userId !== req.userId);
    db.tasks = db.tasks.filter((t) => t.userId !== req.userId);
    db.futureLetters = db.futureLetters.filter((l) => l.userId !== req.userId);
    db.bucketList = db.bucketList.filter((b) => b.userId !== req.userId);
    await writeDB(db);
    res.json({ success: true, message: "Account successfully deleted." });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


// 2. Diary Entries API

// Get all Diary entries
app.get("/api/diary", authMiddleware, async (req: any, res) => {
  try {
    const db = await readDB();
    const userEntries = db.diaryEntries.filter((e) => e.userId === req.userId);
    res.json(userEntries);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create or update a Diary Entry (Supports Autosave)
app.post("/api/diary", authMiddleware, async (req: any, res) => {
  try {
    const {
      id,
      date,
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
      isArchived,
      isTrash,
    } = req.body;

    if (!date) {
      return res.status(400).json({ error: "Date is required." });
    }

    const db = await readDB();
    let entryIndex = -1;

    if (id) {
      entryIndex = db.diaryEntries.findIndex((e) => e.id === id && e.userId === req.userId);
    } else {
      // Find by date (only allow one primary entry per date if ID is not provided, or update)
      entryIndex = db.diaryEntries.findIndex((e) => e.date === date && e.userId === req.userId && !e.isTrash);
    }

    const entryId = id || (entryIndex !== -1 ? db.diaryEntries[entryIndex].id : crypto.randomUUID());

    const savedEntry: DiaryEntry = {
      id: entryId,
      userId: req.userId,
      date,
      title: title || "",
      subject: subject || "Personal",
      category: category || "Diary",
      description: description || "",
      checklist: checklist || [],
      tags: tags || [],
      emoji: emoji || "📝",
      mood: mood || "Normal",
      weather: weather || "sunny",
      location: location || "",
      isPinned: !!isPinned,
      pinColor: pinColor || "blue",
      pinStar: !!pinStar,
      isBookmarked: !!isBookmarked,
      isArchived: !!isArchived,
      isTrash: !!isTrash,
      recentlyViewedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (entryIndex !== -1) {
      db.diaryEntries[entryIndex] = savedEntry;
    } else {
      db.diaryEntries.push(savedEntry);
    }

    await writeDB(db);
    res.json(savedEntry);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Restore or Permanently Delete/Trash an Entry
app.delete("/api/diary/:id", authMiddleware, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { permanent } = req.query;
    const db = await readDB();

    if (permanent === "true") {
      db.diaryEntries = db.diaryEntries.filter((e) => !(e.id === id && e.userId === req.userId));
    } else {
      const entryIndex = db.diaryEntries.findIndex((e) => e.id === id && e.userId === req.userId);
      if (entryIndex !== -1) {
        db.diaryEntries[entryIndex].isTrash = true;
        db.diaryEntries[entryIndex].updatedAt = new Date().toISOString();
      }
    }

    await writeDB(db);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Restore from Trash
app.post("/api/diary/restore/:id", authMiddleware, async (req: any, res) => {
  try {
    const { id } = req.params;
    const db = await readDB();
    const entryIndex = db.diaryEntries.findIndex((e) => e.id === id && e.userId === req.userId);
    if (entryIndex !== -1) {
      db.diaryEntries[entryIndex].isTrash = false;
      db.diaryEntries[entryIndex].updatedAt = new Date().toISOString();
    }
    await writeDB(db);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


// 3. Task Manager API

app.get("/api/tasks", authMiddleware, async (req: any, res) => {
  try {
    const db = await readDB();
    const userTasks = db.tasks.filter((t) => t.userId === req.userId);
    res.json(userTasks);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/tasks", authMiddleware, async (req: any, res) => {
  try {
    const { id, date, text, completed, priority, category, recurrence } = req.body;
    if (!text || !date) {
      return res.status(400).json({ error: "Text and Date are required." });
    }

    const db = await readDB();
    const task: Task = {
      id: id || crypto.randomUUID(),
      userId: req.userId,
      date,
      text,
      completed: !!completed,
      priority: priority || "medium",
      category: category || "General",
      recurrence: recurrence || "none",
    };

    const taskIndex = db.tasks.findIndex((t) => t.id === task.id && t.userId === req.userId);
    if (taskIndex !== -1) {
      db.tasks[taskIndex] = task;
    } else {
      db.tasks.push(task);
    }

    await writeDB(db);
    res.json(task);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/tasks/:id", authMiddleware, async (req: any, res) => {
  try {
    const { id } = req.params;
    const db = await readDB();
    db.tasks = db.tasks.filter((t) => !(t.id === id && t.userId === req.userId));
    await writeDB(db);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


// 4. Habit Tracker API

app.get("/api/habits", authMiddleware, async (req: any, res) => {
  try {
    const db = await readDB();
    const userHabits = db.habits.filter((h) => h.userId === req.userId);
    res.json(userHabits);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/habits", authMiddleware, async (req: any, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: "Habit name is required." });
    }

    const db = await readDB();
    const newHabit: Habit = {
      id: crypto.randomUUID(),
      userId: req.userId,
      name,
      logs: [],
      createdAt: new Date().toISOString(),
    };

    db.habits.push(newHabit);
    await writeDB(db);
    res.json(newHabit);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/habits/:id/toggle", authMiddleware, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { date } = req.body; // YYYY-MM-DD
    if (!date) return res.status(400).json({ error: "Date is required." });

    const db = await readDB();
    const habitIndex = db.habits.findIndex((h) => h.id === id && h.userId === req.userId);
    if (habitIndex === -1) {
      return res.status(404).json({ error: "Habit not found." });
    }

    const habit = db.habits[habitIndex];
    const logIndex = habit.logs.indexOf(date);
    if (logIndex !== -1) {
      habit.logs.splice(logIndex, 1); // remove log
    } else {
      habit.logs.push(date); // add log
    }

    await writeDB(db);
    res.json(habit);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/habits/:id", authMiddleware, async (req: any, res) => {
  try {
    const { id } = req.params;
    const db = await readDB();
    db.habits = db.habits.filter((h) => !(h.id === id && h.userId === req.userId));
    await writeDB(db);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


// 5. Memory Capsule Letters API

app.get("/api/letters", authMiddleware, async (req: any, res) => {
  try {
    const db = await readDB();
    const letters = db.futureLetters.filter((l) => l.userId === req.userId);
    res.json(letters);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/letters", authMiddleware, async (req: any, res) => {
  try {
    const { title, content, targetOpenDate } = req.body;
    if (!title || !content || !targetOpenDate) {
      return res.status(400).json({ error: "All fields are required." });
    }

    const db = await readDB();
    const newLetter: FutureLetter = {
      id: crypto.randomUUID(),
      userId: req.userId,
      title,
      content,
      targetOpenDate,
      isOpened: false,
      createdAt: new Date().toISOString(),
    };

    db.futureLetters.push(newLetter);
    await writeDB(db);
    res.json(newLetter);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


// 6. Bucket List API

app.get("/api/bucket", authMiddleware, async (req: any, res) => {
  try {
    const db = await readDB();
    const bucket = db.bucketList.filter((b) => b.userId === req.userId);
    res.json(bucket);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/bucket", authMiddleware, async (req: any, res) => {
  try {
    const { id, title, completed, category, targetDate } = req.body;
    if (!title) {
      return res.status(400).json({ error: "Title is required." });
    }

    const db = await readDB();
    const item: BucketItem = {
      id: id || crypto.randomUUID(),
      userId: req.userId,
      title,
      completed: !!completed,
      category: category || "Life",
      targetDate,
      createdAt: new Date().toISOString(),
    };

    const itemIndex = db.bucketList.findIndex((b) => b.id === item.id && b.userId === req.userId);
    if (itemIndex !== -1) {
      db.bucketList[itemIndex] = item;
    } else {
      db.bucketList.push(item);
    }

    await writeDB(db);
    res.json(item);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/bucket/:id", authMiddleware, async (req: any, res) => {
  try {
    const { id } = req.params;
    const db = await readDB();
    db.bucketList = db.bucketList.filter((b) => !(b.id === id && b.userId === req.userId));
    await writeDB(db);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


// 7. AI Assistant API Endpoint

app.post("/api/ai/assist", authMiddleware, async (req: any, res) => {
  try {
    const { action, text, date } = req.body;
    if (!action) {
      return res.status(400).json({ error: "Action is required." });
    }

    let systemInstruction = "You are Yggdrasil, an ancient, wise, and comforting AI counselor embedded inside the World Tree Life Journal app. Your tone is warm, inspiring, and extremely empathetic. Write elegantly, incorporating subtle nature-themed world-tree wisdom without being cheesy.";
    let prompt = "";

    switch (action) {
      case "summarize":
        prompt = `Please summarize the following journal entry into a concise, beautiful 2-3 sentence overview, highlighting key memories, themes, and goals:\n\n"${text}"`;
        break;
      case "grammar":
        prompt = `Please review and correct the spelling, grammar, and flow of the following journal entry. Keep the original voice of the writer, but make it elegant and seamless. Return only the polished text, with no preamble or comments:\n\n"${text}"`;
        break;
      case "rewrite":
        prompt = `Please rewrite the following text in an evocative, beautifully poetic, and reflective diary tone. Keep all key details, but enhance the prose. Return only the revised text, with no conversational filler:\n\n"${text}"`;
        break;
      case "studynotes":
        prompt = `Based on the following notes, generate structured, easy-to-read revision summaries, critical key concepts, and 3 insightful self-test questions to help study this material:\n\n"${text}"`;
        break;
      case "todo":
        prompt = `Read this diary entry or thought dump, and extract a clean list of actionable, clear checkboxes and study goals. Format as simple, clear bullet points starting with - [ ] or lists:\n\n"${text}"`;
        break;
      case "prompt":
        prompt = `Generate a single, deeply thoughtful, creative journal writing prompt or goal suited for ${date || "today"}. It should help the user reflect on their life journey, goals, relationships, and growth. Keep it brief and inspiring.`;
        break;
      case "motivate":
        prompt = `The user is feeling stressed, tired, or seeking inspiration. Generate a deeply comforting, powerful, custom daily motivation message or quote. Mention the eternal growth of Yggdrasil's roots and branches.`;
        break;
      default:
        return res.status(400).json({ error: "Invalid action." });
    }

    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "MY_GEMINI_API_KEY") {
      // Return beautiful mock/fallback response if API key is not yet set
      let fallbackText = "";
      if (action === "summarize") fallbackText = "Yggdrasil's branches capture a quiet moment of reflection, weaving together threads of daily focus, gratitude, and peaceful quietude. (Configure GEMINI_API_KEY in Settings to unlock dynamic AI summaries!)";
      else if (action === "grammar") fallbackText = text;
      else if (action === "rewrite") fallbackText = "Like morning light filtering through deep forest leaves, your thoughts find their quiet rhythm. This is where your story unfolds. (Configure your GEMINI_API_KEY to unlock advanced AI poetic rewrites!)";
      else if (action === "studynotes") fallbackText = "📚 Core Concepts:\n1. Personal Development & Journaling\n2. Habitual Consistency\n\n❓ Self-Test Questions:\n- How does journaling every day affect long-term memory integration?\n- What small habits lead to the deepest spiritual and mental growth?";
      else if (action === "todo") fallbackText = "- [ ] Reflect on today's journey\n- [ ] Dedicate 15 minutes to quiet meditation\n- [ ] Plan goals for tomorrow";
      else if (action === "prompt") fallbackText = "🌱 Journal Prompt: 'If you were a tree, what kind of weather did your branches weather today, and what leaves did you shed to make room for new growth?'";
      else if (action === "motivate") fallbackText = "✨ Motivation: 'The tallest trees grow slowest. Do not fear the quiet, cold winters of your journey; your roots are deepening in the dark, preparing for an abundant spring.'";
      
      return res.json({ result: fallbackText });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    res.json({ result: response.text || "No response generated." });
  } catch (err: any) {
    console.error("Gemini Error:", err);
    res.status(500).json({ error: err.message || "Failed to generate AI response." });
  }
});


// Serve static files & Vite connection
async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Bind to port 3000 and host 0.0.0.0
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
});
