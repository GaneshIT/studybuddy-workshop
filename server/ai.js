import { ApiError, GoogleGenAI } from "@google/genai";

// The SDK reads the key we pass it. dotenv already loaded .env in index.js.
const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Free-tier rate limits are counted PER MODEL, so the newest, most popular
// model is also the most contended one. "gemini-flash-latest" currently
// resolves to gemini-3.8-flash: only 5 requests/minute, and frequent 503s.
// The lite model is faster, less busy, and plenty for summarising notes.
// Switching MODEL in .env also gives you a fresh quota bucket.
const MODEL = process.env.MODEL || "gemini-flash-lite-latest";

// Settings shared by every request in the app.
const COMMON = {
  // Ceiling on the reply length. Unused tokens cost nothing.
  maxOutputTokens: 4096,
  // Flash models "think" before answering. Summaries and study chat don't
  // need deep reasoning, so we keep it low: faster replies, fewer tokens.
  // Values: MINIMAL | LOW | MEDIUM | HIGH.
  thinkingConfig: { thinkingLevel: "LOW" },
};

// Gemini answers 503 "high demand" fairly often on the free tier. That is
// temporary and the same request usually succeeds a moment later, so retry it.
// 429 is NOT retried: that is our own rate limit, and hammering it makes it
// worse — the user is told to wait instead.
const RETRY_STATUSES = [500, 502, 503, 504];
const MAX_ATTEMPTS = 3;

async function withRetry(run) {
  for (let attempt = 1; ; attempt++) {
    try {
      return await run();
    } catch (err) {
      if (!RETRY_STATUSES.includes(err?.status) || attempt >= MAX_ATTEMPTS) throw err;
      const waitMs = 600 * 2 ** (attempt - 1); // 600ms, then 1200ms
      console.warn(`Gemini ${err.status} — retrying in ${waitMs}ms (${attempt}/${MAX_ATTEMPTS - 1})`);
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
  }
}

/**
 * Our app speaks {role: "user" | "assistant", content: "..."}.
 * Gemini wants {role: "user" | "model", parts: [{ text }]}.
 * Converting here means React and the routes never learn which AI we use.
 */
function toContents(messages) {
  return messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
}

/** Throws if the model was blocked instead of answering. */
function checkBlocked(response) {
  const blockReason = response.promptFeedback?.blockReason;
  if (blockReason) {
    throw new Error(`The AI declined this request (${blockReason}). Try different notes.`);
  }
  const finishReason = response.candidates?.[0]?.finishReason;
  if (finishReason && !["STOP", "MAX_TOKENS"].includes(finishReason)) {
    throw new Error(`The AI stopped early (${finishReason}). Try different notes.`);
  }
}

/** Send one prompt, get the complete answer back as text. Pass `schema` to get JSON. */
export async function askAI({ system, prompt, schema }) {
  const config = { ...COMMON, systemInstruction: system };
  if (schema) {
    config.responseMimeType = "application/json";
    config.responseJsonSchema = schema;
  }

  const response = await withRetry(() =>
    client.models.generateContent({
      model: MODEL,
      contents: toContents([{ role: "user", content: prompt }]),
      config,
    })
  );

  checkBlocked(response);

  const text = response.text ?? "";
  if (!text.trim()) throw new Error("The AI returned an empty answer. Try again.");
  return text;
}

/** Stream the answer piece by piece. Calls onText(chunk) for every new chunk. */
export async function streamAI({ system, messages, onText }) {
  // Only the opening request is retried. Once chunks are flowing we are
  // committed — the user is already reading the answer.
  const stream = await withRetry(() =>
    client.models.generateContentStream({
      model: MODEL,
      contents: toContents(messages),
      config: { ...COMMON, systemInstruction: system },
    })
  );

  let sawText = false;
  for await (const chunk of stream) {
    const piece = chunk.text;
    if (piece) {
      sawText = true;
      onText(piece);
    }
  }

  if (!sawText) onText("(The AI declined to answer this one.)");
}

/** Turn SDK errors into messages a student can act on. */
export function friendlyError(err) {
  if (!process.env.GEMINI_API_KEY) {
    return "No API key found. Add GEMINI_API_KEY to server/.env and restart the server.";
  }

  const status = err instanceof ApiError ? err.status : err?.status;
  const detail = err?.message || "";

  if (status === 401 || status === 403 || /API key not valid/i.test(detail)) {
    return "The API key is missing or wrong. Check GEMINI_API_KEY in server/.env.";
  }
  if (status === 429) {
    // Google tells us exactly how long to wait — use it instead of guessing.
    const seconds =
      detail.match(/"retryDelay":\s*"(\d+)s"/)?.[1] ||
      detail.match(/retry in ([\d.]+)s/)?.[1];
    const wait = seconds ? `${Math.ceil(Number(seconds))} seconds` : "a minute";
    return `Free-tier limit reached for this model. Try again in ${wait}.`;
  }
  if (status >= 500) {
    return `AI service error (${status}). Try again in a moment.`;
  }
  // A 400 means the request itself was rejected, so retrying never helps.
  // Pass the API's own message through — it says what to actually fix.
  if (status === 400) {
    return `AI service rejected the request: ${detail}`;
  }
  if (err?.name === "ConnectionError" || /fetch failed|ENOTFOUND/i.test(detail)) {
    return "Can't reach the AI service. Check your internet connection.";
  }
  return detail || "Something went wrong.";
}
