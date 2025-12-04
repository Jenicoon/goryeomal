import React from "react";

export default function SessionList({ sessions, sessionId, onCreate, onSelect, onDelete }) {
  return (
    <div className="session-list">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <h3 style={{ margin: 0, color: "var(--muted)" }}>대화 세션</h3>
        <button className="ghost" onClick={onCreate}>새 세션</button>
      </div>
      <div className="session-items scroll">
        {sessions.length === 0 ? (
          <div className="placeholder">세션이 없습니다. 새 세션을 만들어 주세요.</div>
        ) : (
          sessions.map(s => (
            <div
              key={s.id}
              className={`session-item ${sessionId === s.id ? "active" : ""}`}
              onClick={() => onSelect(s.id)}
              title={new Date(s.updatedAt).toLocaleString()}
            >
              <div style={{ display:"flex", flexDirection:"column" }}>
                <span className="title">{s.title}</span>
                <span className="date">{new Date(s.createdAt).toLocaleDateString()}</span>
              </div>
              <button
                className="ghost"
                onClick={(e) => { e.stopPropagation(); onDelete(s.id); }}
                title="세션 삭제"
              >
                삭제
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}