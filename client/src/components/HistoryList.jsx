export default function HistoryList({ history, onOpen }) {
  if (history.length === 0) return null;

  return (
    <div className="card">
      <h2>Recent sessions</h2>
      <ul className="history">
        {history.map((item) => (
          <li key={item.id}>
            <button className="history-item" onClick={() => onOpen(item)}>
              <span>{item.title}</span>
              <small>{new Date(item.createdAt).toLocaleString()}</small>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
