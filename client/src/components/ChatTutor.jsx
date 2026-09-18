import { useEffect, useRef, useState } from "react";
import { streamChat } from "../api.js";
import { notesReady } from "../constants.js";

export default function ChatTutor({ notes }) {
  const [messages, setMessages] = useState([]); // [{ role: "user" | "assistant", content }]
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const logRef = useRef(null);

  // Keep the newest message in view while the answer streams in.
  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [messages]);

  async function handleSend(e) {
    e.preventDefault();
    const question = input.trim();
    if (!question || streaming) return;

    // Error bubbles are for display only, so don't send them back to the AI.
    const history = [...messages.filter((m) => !m.error), { role: "user", content: question }];
    setMessages([...history, { role: "assistant", content: "" }]);
    setInput("");
    setStreaming(true);

    try {
      await streamChat({
        notes,
        messages: history,
        onText: (answer) => setMessages([...history, { role: "assistant", content: answer }]),
      });
    } catch (err) {
      setMessages([...history, { role: "assistant", content: err.message, error: true }]);
    } finally {
      setStreaming(false);
    }
  }

  return (
    <div className="card">
      <div className="card-head">
        <h2>Ask a doubt</h2>
        <button className="ghost" onClick={() => setMessages([])} disabled={streaming}>
          Clear chat
        </button>
      </div>

      <div className="chat-log" ref={logRef}>
        {messages.length === 0 && (
          <p className="hint">
            {notesReady(notes)
              ? `Try: "What's the difference between 2NF and 3NF? Give an example."`
              : "Add your notes above, then ask anything about them."}
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`bubble ${m.role}${m.error ? " error" : ""}`}>
            {m.content || <span className="typing">Thinking...</span>}
          </div>
        ))}
      </div>

      <form className="chat-form" onSubmit={handleSend}>
        <input
          id="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your doubt..."
          autoComplete="off"
        />
        <button type="submit" disabled={streaming || !input.trim() || !notesReady(notes)}>
          {streaming ? "Answering..." : "Send"}
        </button>
      </form>
    </div>
  );
}
