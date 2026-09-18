import { useState } from "react";
import { postJSON } from "../api.js";
import { notesReady } from "../constants.js";

export default function QuizPanel({ notes }) {
  const [difficulty, setDifficulty] = useState("medium");
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({}); // { questionIndex: chosenOptionIndex }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleGenerate() {
    setLoading(true);
    setError("");
    setAnswers({});
    setQuestions([]); // clear the old quiz, so a failure can't look like a stale answer
    try {
      const data = await postJSON("/api/quiz", { notes, difficulty });
      setQuestions(data.questions);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const answeredAll = questions.length > 0 && Object.keys(answers).length === questions.length;
  const score = questions.filter((q, i) => answers[i] === q.answerIndex).length;

  return (
    <div className="card">
      <div className="card-head">
        <h2>Quiz</h2>
        <div className="row">
          <select
            id="difficulty"
            aria-label="Difficulty"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
          <button onClick={handleGenerate} disabled={loading || !notesReady(notes)}>
            {loading ? "Creating quiz..." : "Make quiz"}
          </button>
        </div>
      </div>

      {error && <p className="error">{error}</p>}
      {questions.length === 0 && !error && (
        <p className="hint">Five multiple-choice questions from your notes.</p>
      )}

      <ol className="quiz">
        {questions.map((q, i) => {
          const chosen = answers[i];
          return (
            <li key={i}>
              <p className="question">{q.question}</p>
              <div className="options">
                {q.options.map((option, j) => {
                  let className = "option";
                  if (chosen !== undefined && j === q.answerIndex) className += " correct";
                  else if (chosen === j) className += " wrong";
                  return (
                    <button
                      key={j}
                      className={className}
                      disabled={chosen !== undefined}
                      onClick={() => setAnswers({ ...answers, [i]: j })}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
              {chosen !== undefined && <p className="explain">{q.explanation}</p>}
            </li>
          );
        })}
      </ol>

      {answeredAll && (
        <p className="score">
          Score: {score} / {questions.length}
        </p>
      )}
    </div>
  );
}
