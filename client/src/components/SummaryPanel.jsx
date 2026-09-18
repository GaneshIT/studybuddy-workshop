import { useState } from "react";
import { postJSON } from "../api.js";
import { notesReady } from "../constants.js";

export default function SummaryPanel({ notes, summary, setSummary, onSaved }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSummarise() {
    setLoading(true);
    setError("");
    setSummary(""); // clear the old result, so a failure can't look like a stale answer
    try {
      const data = await postJSON("/api/summary", { notes });
      setSummary(data.summary);
      onSaved?.(); // refresh the history list, if the parent gave us this function
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <div className="card-head">
        <h2>Summary</h2>
        <button onClick={handleSummarise} disabled={loading || !notesReady(notes)}>
          {loading ? "Summarising..." : "Summarise notes"}
        </button>
      </div>
      {error && <p className="error">{error}</p>}
      {summary ? (
        <p className="output">{summary}</p>
      ) : (
        <p className="hint">Your one-minute revision summary appears here.</p>
      )}
    </div>
  );
}
