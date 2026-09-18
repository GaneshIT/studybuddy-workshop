import "dotenv/config";
import express from "express";
import { fileURLToPath } from "node:url";
import { askAI, friendlyError, streamAI } from "./ai.js";
import { SYSTEM_PROMPT, summaryPrompt, QUIZ_SCHEMA, quizPrompt, tutorSystemPrompt } from "./prompts.js";
import { loadHistory, saveToHistory } from "./history.js";

const app = express();
const PORT = process.env.PORT || 3001;
const MAX_NOTES = 30000;

app.use(express.json({ limit: "1mb" }));

if (!process.env.GEMINI_API_KEY) {
  console.warn("⚠ GEMINI_API_KEY is not set. Add it to server/.env before using AI features.");
}

// Returns clean notes, or sends a 400 error and returns null.
function readNotes(req, res) {
  const notes = String(req.body.notes || "").trim();
  if (notes.length < 50) {
    res.status(400).json({ error: "Paste a few lines of notes first (at least 50 characters)." });
    return null;
  }
  if (notes.length > MAX_NOTES) {
    res.status(400).json({ error: `Notes are too long. Keep them under ${MAX_NOTES} characters.` });
    return null;
  }
  return notes;
}

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

app.post("/api/summary", async (req, res) => {
  const notes = readNotes(req, res);
  if (!notes) return;

  try {
    const summary = await askAI({ system: SYSTEM_PROMPT, prompt: summaryPrompt(notes) });
    await saveToHistory({ notes, summary });
    res.json({ summary });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: friendlyError(err) });
  }
});

app.post("/api/quiz", async (req, res) => {
  const notes = readNotes(req, res);
  if (!notes) return;

  const difficulty = ["easy", "medium", "hard"].includes(req.body.difficulty)
    ? req.body.difficulty
    : "medium";

  try {
    const json = await askAI({
      system: SYSTEM_PROMPT,
      prompt: quizPrompt(notes, difficulty),
      schema: QUIZ_SCHEMA,
    });
    res.json(JSON.parse(json));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: friendlyError(err) });
  }
});

// Keep only valid chat turns, the last 20, starting with a user turn.
function cleanMessages(list) {
  const messages = (Array.isArray(list) ? list : [])
    .filter((m) => ["user", "assistant"].includes(m?.role))
    .filter((m) => typeof m.content === "string" && m.content.trim())
    .map((m) => ({ role: m.role, content: m.content }))
    .slice(-20);
  while (messages.length && messages[0].role !== "user") messages.shift();
  return messages;
}

app.post("/api/chat", async (req, res) => {
  const notes = readNotes(req, res);
  if (!notes) return;

  const messages = cleanMessages(req.body.messages);
  if (messages.at(-1)?.role !== "user") {
    return res.status(400).json({ error: "Type a question first." });
  }

  // Send the answer as plain text chunks, as soon as each chunk arrives.
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  try {
    await streamAI({
      system: tutorSystemPrompt(notes),
      messages,
      onText: (text) => res.write(text),
    });
  } catch (err) {
    console.error(err);
    res.write(`\n\n⚠ ${friendlyError(err)}`);
  }
  res.end();
});

app.get("/api/history", async (req, res) => {
  res.json(await loadHistory());
});

// In production, Express also serves the built React app (client/dist).
const clientDist = fileURLToPath(new URL("../client/dist", import.meta.url));
app.use(express.static(clientDist));
app.use((req, res, next) => {
  if (req.method !== "GET" || req.path.startsWith("/api")) return next();
  res.sendFile("index.html", { root: clientDist }, (err) => err && next());
});

app.listen(PORT, () => {
  console.log(`✅ StudyBuddy API running at http://localhost:${PORT}`);
});
