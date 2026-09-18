// These mirror the limits in server/index.js (readNotes).
// The server checks them again on every request — this copy exists only so the
// UI can react instantly instead of waiting for a 400 to come back.
// Client-side checks are for speed. Server-side checks are for safety.
export const MIN_NOTES = 50;
export const MAX_NOTES = 30000;

/** True when there are enough notes to send to the AI. */
export function notesReady(notes) {
  return notes.trim().length >= MIN_NOTES;
}
