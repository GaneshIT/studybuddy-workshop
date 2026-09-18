import { mkdir, readFile, writeFile } from "node:fs/promises";

// A JSON file is our "database" for today. Real apps use MongoDB, PostgreSQL, etc.
const DATA_DIR = new URL("./data/", import.meta.url);
const HISTORY_FILE = new URL("./data/history.json", import.meta.url);

export async function loadHistory() {
  try {
    return JSON.parse(await readFile(HISTORY_FILE, "utf8"));
  } catch {
    return []; // file doesn't exist yet
  }
}

export async function saveToHistory({ notes, summary }) {
  const history = await loadHistory();
  const firstLine = notes.split("\n").find((line) => line.trim()) || "Untitled notes";

  history.unshift({
    id: Date.now(),
    title: firstLine.trim().slice(0, 60),
    createdAt: new Date().toISOString(),
    notes,
    summary,
  });

  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(HISTORY_FILE, JSON.stringify(history.slice(0, 20), null, 2));
}
