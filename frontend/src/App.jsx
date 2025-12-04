import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
// import { createRoot } from "react-dom/client"; // 제거: index.js에서 렌더링
import "./App.css";

export default function App() {
  const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:3000/api";

  // 파일 업로드 관련 상태/프리뷰
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState("");

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setFilePreview(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setFilePreview("");
    }
  }, [file]);

  // 결과 탭 상태 및 메시지 뷰
  const [viewMode, setViewMode] = useState("ocr"); // "ocr" | "parse"
  const [ocrMessages, setOcrMessages] = useState([]);
  const [parseMessages, setParseMessages] = useState([]);
  function viewMessages() {
    return viewMode === "ocr" ? ocrMessages : parseMessages;
  }
  function getCurrentViewText() {
    const msgs = viewMessages();
    return msgs.map(m => m.content).join("\n");
  }

  // 업로드 핸들러들(최소 구현)
  async function uploadOCR() {
    if (!file) return alert("파일을 선택하세요.");
    const fd = new FormData();
    fd.append("document", file);
    try {
      const res = await fetch(`${API_BASE}/ocr`, { method: "POST", body: fd });
      const body = await res.json();
      const text = body?.text || body?.content || JSON.stringify(body);
      setOcrMessages([{ id: Date.now(), role: "assistant", content: text }]);
      setViewMode("ocr");
    } catch (e) {
      setOcrMessages([{ id: Date.now(), role: "assistant", content: "OCR 요청 실패" }]);
    }
  }

  async function uploadParse() {
    if (!file) return alert("파일을 선택하세요.");
    const fd = new FormData();
    fd.append("document", file);
    try {
      const res = await fetch(`${API_BASE}/parse`, { method: "POST", body: fd });
      const body = await res.json();
      const text = body?.text || body?.content || JSON.stringify(body);
      setParseMessages([{ id: Date.now(), role: "assistant", content: text }]);
      setViewMode("parse");
    } catch (e) {
      setParseMessages([{ id: Date.now(), role: "assistant", content: "파싱 요청 실패" }]);
    }
  }

  // Embedding 저장/검색 상태/핸들러
  const [saveText, setSaveText] = useState("");
  const [savingEmbed, setSavingEmbed] = useState(false);
  async function saveEmbedding() {
    const text = (saveText || "").trim();
    if (!text) return alert("저장할 텍스트를 입력하세요.");
    setSavingEmbed(true);
    try {
      const res = await fetch(`${API_BASE}/embeddings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text })
      });
      const body = await res.json();
      alert(body?.message || "저장 완료");
    } catch {
      alert("저장 실패");
    } finally {
      setSavingEmbed(false);
    }
  }

  const [searchText, setSearchText] = useState("");
  const [searchingEmbed, setSearchingEmbed] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  async function doSearch() {
    const query = (searchText || "").trim();
    if (!query) return;
    setSearchingEmbed(true);
    try {
      const res = await fetch(`${API_BASE}/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query })
      });
      const body = await res.json();
      setSearchResults(body?.results || []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearchingEmbed(false);
    }
  }

  // 사용자/세션 식별자
  const [userId] = useState(() => {
    const k = "goryeomal_user_id";
    const existing = localStorage.getItem(k);
    if (existing) return existing;
    const uid = (crypto && crypto.randomUUID) ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
    localStorage.setItem(k, uid);
    return uid;
  });
  const [sessionId, setSessionId] = useState(localStorage.getItem("goryeomal_session_id") || "");
  const [sessions, setSessions] = useState([]);

  // 채팅 상태
  const [messages, setMessages] = useState([{ id: 1, role: "assistant", content: "안녕하세요. 무엇을 도와드릴까요?" }]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  // 세션 목록 로드
  async function loadSessions() {
    try {
      const res = await fetch(`${API_BASE}/chat/sessions?userId=${encodeURIComponent(userId)}`);
      const body = await res.json();
      setSessions(body.sessions || []);
    } catch {
      setSessions([]);
    }
  }

  // 세션 생성/선택/불러오기
  async function createNewSession() {
    const title = prompt("세션 제목을 입력하세요", "새 대화");
    if (!title) return;
    const res = await fetch(`${API_BASE}/chat/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, title })
    });
    const body = await res.json();
    if (body.id) {
      setSessionId(body.id);
      localStorage.setItem("goryeomal_session_id", body.id);
      await loadSession(body.id);
      await loadSessions();
    } else {
      alert("세션 생성 실패");
    }
  }

  async function loadSession(id) {
    const res = await fetch(`${API_BASE}/chat/session/${encodeURIComponent(id)}?userId=${encodeURIComponent(userId)}`);
    const body = await res.json();
    setSessionId(id);
    localStorage.setItem("goryeomal_session_id", id);
    const msgs = (body.messages || []).map(m => ({ id: m.id, role: m.role, content: m.content }));
    setMessages(msgs.length ? msgs : [{ id: 1, role: "assistant", content: "새 대화를 시작하세요." }]);
  }

  useEffect(() => { loadSessions(); }, []);
  useEffect(() => {
    if (sessionId) loadSession(sessionId);
  }, [sessionId]);

  async function sendMessage() {
    const text = input.trim();
    if (!text) return;
    if (!sessionId) {
      await createNewSession();
      if (!sessionId) return;
    }
    const userMsg = { id: Date.now(), role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setSending(true);
    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, sessionId, messages: [{ role: "user", content: text }] })
      });
      const body = await res.json();
      const assistantContent = body?.content || JSON.stringify(body, null, 2);
      const assistantMsg = { id: Date.now() + 1, role: "assistant", content: assistantContent };
      setMessages(prev => [...prev, assistantMsg]);
      loadSessions();
    } catch (err) {
      const errMsg = { id: Date.now() + 1, role: "assistant", content: "응답 중 오류가 발생했습니다." };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setSending(false);
    }
  }

  function SessionList() {
    return (
      <div className="session-list">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <h3 style={{ margin: 0, color: "var(--muted)" }}>대화 세션</h3>
          <button className="ghost" onClick={createNewSession}>새 세션</button>
        </div>
        <div className="session-items">
          {sessions.length === 0 ? (
            <div className="placeholder">세션이 없습니다. 새 세션을 만들어 주세요.</div>
          ) : (
            sessions.map(s => (
              <button
                key={s.id}
                className={`session-item ${sessionId === s.id ? "active" : ""}`}
                onClick={() => loadSession(s.id)}
                title={new Date(s.updatedAt).toLocaleString()}
              >
                <span className="title">{s.title}</span>
                <span className="date">{new Date(s.createdAt).toLocaleDateString()}</span>
              </button>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header"><h1>고려말 언어 보존 도구</h1></header>
      <main className="grid">
        <section className="panel">
          <SessionList />
          <h2>문서 업로드</h2>

          <input type="file" accept="image/*,.pdf" onChange={e => setFile(e.target.files?.[0] || null)} />

          {filePreview && (
            <div className="preview">
              {file?.type?.startsWith("image/") ? <img src={filePreview} alt="preview" /> : <div className="file-name">{file?.name}</div>}
            </div>
          )}

          <div className="row">
            <button onClick={uploadOCR}>OCR 실행</button>
            <button onClick={uploadParse}>문서 파싱</button>
          </div>

          <div className="result">
            <h3>결과</h3>
            <div className="result-buttons">
              <button className={`tab-btn ${viewMode === "ocr" ? "active" : ""}`} onClick={() => setViewMode("ocr")}>OCR</button>
              <button className={`tab-btn ${viewMode === "parse" ? "active" : ""}`} onClick={() => setViewMode("parse")}>파싱</button>
            </div>
            <div className="result-content">
              <div className="chat-window small">
                {viewMessages().map(m => (
                  <div key={m.id} className={`msg ${m.role === "user" ? "user" : "assistant"}`}>
                    <div className="bubble">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {m.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="embed-controls">
            <h3>Embedding 저장</h3>
            <textarea rows={2} placeholder="저장할 텍스트를 입력하세요" value={saveText} onChange={e => setSaveText(e.target.value)} />
            <div className="row">
              <button onClick={saveEmbedding} disabled={savingEmbed}>{savingEmbed ? "저장 중..." : "Embedding 저장"}</button>
              <button onClick={() => setSaveText(getCurrentViewText())} className="secondary">결과로 채우기</button>
            </div>

            <div className="search-section" style={{ marginTop: 12 }}>
              <h3>임베딩 검색</h3>
              <textarea rows={2} placeholder="검색어를 입력하세요" value={searchText} onChange={e => setSearchText(e.target.value)} />
              <button onClick={doSearch} disabled={searchingEmbed} style={{ marginTop: 8 }}>{searchingEmbed ? "검색 중..." : "검색"}</button>

              <div className="result-content" style={{ marginTop: 12 }}>
                {searchResults.length > 0 ? (
                  <div className="search-results">
                    {searchResults.map((res, idx) => (
                      <div key={idx} className="result-item">
                        <div className="meta">
                          <span className="source">{res.id}</span>
                          <span className="score">유사도: <span style={{ fontWeight: 600 }}>{(res.score * 100).toFixed(1)}%</span></span>
                        </div>
                        <div className="snippet">{(res.text || "").substring(0, 200)}{(res.text || "").length > 200 ? "..." : ""}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="placeholder">검색 결과 없음. 먼저 텍스트를 저장해주세요.</div>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="panel chat-panel">
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
            <textarea rows={2} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
            }} placeholder="질문을 입력하고 Enter를 누르세요 (Shift+Enter = 줄바꿈)" />
            <div className="chat-actions"><button onClick={sendMessage} disabled={sending}>{sending ? "보내는 중..." : "Send"}</button></div>
          </div>
        </section>
      </main>
    </div>
  );
}

// 제거: index.js가 렌더링을 담당
// const root = createRoot(document.getElementById("root"));
// root.render(<App />);