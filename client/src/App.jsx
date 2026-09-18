import { useEffect, useState } from "react";
import { getJSON } from "./api.js";
import NotesInput from "./components/NotesInput.jsx";
import SummaryPanel from "./components/SummaryPanel.jsx";
import QuizPanel from "./components/QuizPanel.jsx";
import ChatTutor from "./components/ChatTutor.jsx";
import HistoryList from "./components/HistoryList.jsx";

export default function App() {
  const [notes, setNotes] = useState("");
  const [summary, setSummary] = useState("");
  const [history, setHistory] = useState([]);

  async function refreshHistory() {
    try {
      setHistory(await getJSON("/api/history"));
    } catch {
      // History is optional: the app still works without it.
    }
  }

  useEffect(() => {
    refreshHistory();
  }, []);

  function openSession(session) {
    setNotes(session.notes);
    setSummary(session.summary);
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>StudyBuddy AI</h1>
        <p>Paste your lecture notes. Get a summary, a quiz, and a tutor for your doubts.</p>
      </header>

      <main className="layout">
        <section className="column">
          <NotesInput notes={notes} setNotes={setNotes} />
          <HistoryList history={history} onOpen={openSession} />
        </section>

        <section className="column">
          <SummaryPanel notes={notes} summary={summary} setSummary={setSummary} onSaved={refreshHistory} />
          <QuizPanel notes={notes} />
          <ChatTutor notes={notes} />
        </section>
      </main>
    </div>
  );
}
