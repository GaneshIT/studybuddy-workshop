import { SAMPLE_NOTES } from "../sampleNotes.js";
import { MAX_NOTES, MIN_NOTES } from "../constants.js";

export default function NotesInput({ notes, setNotes }) {
  return (
    <div className="card">
      <div className="card-head">
        <h2>Your notes</h2>
        <button className="ghost" onClick={() => setNotes(SAMPLE_NOTES)}>
          Load sample notes
        </button>
      </div>
      <textarea
        id="notes"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Paste your lecture notes here..."
        rows={18}
      />
      <p className="hint">
        {notes.trim().length > 0 && notes.trim().length < MIN_NOTES
          ? `${MIN_NOTES - notes.trim().length} more characters before you can summarise`
          : `${notes.length.toLocaleString()} / ${MAX_NOTES.toLocaleString()} characters`}
      </p>
    </div>
  );
}
