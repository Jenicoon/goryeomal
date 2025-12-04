import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import SessionList from "./SessionList.jsx";

export default function ChatPanel({
  messages, input, setInput, sending, onSend,
  sessions, sessionId, onCreateSession, onSelectSession, onDeleteSession
}) {
  return (
    <section className="panel chat-panel">
      <div className="chat-split">
        <div className="chat-left">
          <h2>AI 대화</h2>
          <div className="chat-window">
            {messages.map(m => (
              <div key={m.id} className={`msg ${m.role === "user" ? "user" : "assistant"}`}>
                <div className="bubble">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {m.content}
                  </ReactMarkdown>
                </div>
              </div>
            ))}
          </div>
          <div className="chat-input">
            <textarea
              rows={2}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(); } }}
              placeholder="질문을 입력하고 Enter를 누르세요 (Shift+Enter = 줄바꿈)"
            />
            <div className="chat-actions">
              <button onClick={onSend} disabled={sending}>{sending ? "보내는 중..." : "Send"}</button>
            </div>
          </div>
        </div>

        <div className="chat-right">
          <SessionList
            sessions={sessions}
            sessionId={sessionId}
            onCreate={onCreateSession}
            onSelect={onSelectSession}
            onDelete={onDeleteSession}
          />
        </div>
      </div>
    </section>
  );
}