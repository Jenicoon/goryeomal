import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import "./App.css";

export default function App() {
<<<<<<< HEAD

  console.log(process.env.REACT_APP_API_BASE)

  
=======
  // 같은 도메인의 /api 호출 (Vercel 서버리스)
  const API_BASE = ""; // 빈 값이면 fetch(`/api/...`) 사용

>>>>>>> deploy
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [ocrResult, setOcrResult] = useState(null);
  const [parseResult, setParseResult] = useState(null);
  const [messages, setMessages] = useState([
    { id: 1, role: "assistant", content: "안녕하세요. 무엇을 도와드릴까요?" }
  ]);
  const [input, setInput] = useState("");
  const [viewMode, setViewMode] = useState("ocr"); // "ocr" | "parse"

  const [saveText, setSaveText] = useState("");
  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  const [savingEmbed, setSavingEmbed] = useState(false);
  const [searchingEmbed, setSearchingEmbed] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!file) {
      setFilePreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setFilePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  async function uploadOCR() {
    if (!file) return alert("파일을 선택하세요.");
    try {
      const fd = new FormData();
      fd.append("document", file);
      const res = await fetch(`${API_BASE}/api/ocr`, { method: "POST", body: fd });
      const body = await res.json();
      setOcrResult(body);
      setViewMode("ocr");
    } catch (err) {
      alert("OCR 오류: " + (err.message || err));
    }
  }

  async function uploadParse() {
    if (!file) return alert("파일을 선택하세요.");
    try {
      const fd = new FormData();
      fd.append("document", file);
      const res = await fetch(`${API_BASE}/api/parse`, { method: "POST", body: fd });
      const body = await res.json();
      setParseResult(body);
      setViewMode("parse");
    } catch (err) {
      alert("파싱 오류: " + (err.message || err));
    }
  }

  async function sendMessage() {
    const text = input.trim();
    if (!text) return;
    const userMsg = { id: Date.now(), role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setSending(true);
    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: text }] })
      });
      const body = await res.json();
      const assistantContent = body?.content || JSON.stringify(body, null, 2);
      const assistantMsg = { id: Date.now() + 1, role: "assistant", content: assistantContent };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      const errMsg = { id: Date.now() + 1, role: "assistant", content: "응답 중 오류가 발생했습니다." };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function getCurrentViewText() {
    if (viewMode === "ocr" && ocrResult) return ocrResult.text || JSON.stringify(ocrResult, null, 2);
    if (viewMode === "parse" && parseResult) return parseResult.text || JSON.stringify(parseResult, null, 2);
    return "";
  }

  function viewMessages() {
    if (viewMode === "ocr") {
      if (!ocrResult) return [{ id: "no-ocr", role: "assistant", content: "OCR을 실행하세요." }];
      return [{ id: "ocr", role: "assistant", content: ocrResult.text || JSON.stringify(ocrResult, null, 2) }];
    }
    if (viewMode === "parse") {
      if (!parseResult) return [{ id: "no-parse", role: "assistant", content: "파싱을 실행하세요." }];
      return [{ id: "parse", role: "assistant", content: parseResult.text || JSON.stringify(parseResult, null, 2) }];
    }
    return [];
  }

  async function saveEmbedding() {
    const text = (saveText || getCurrentViewText() || "").trim();
    if (!text) return alert("저장할 텍스트가 없습니다.");
    setSavingEmbed(true);
    try {
      const res = await fetch(`${API_BASE}/api/embeddings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, metadata: { savedAt: new Date().toISOString() } })
      });
      const body = await res.json();
      alert("Embedding 저장 완료: " + (body.id || "ok"));
      setSaveText("");
    } catch (err) {
      alert("저장 실패: " + (err.message || err));
    } finally {
      setSavingEmbed(false);
    }
  }

  async function doSearch() {
    const query = (searchText || "").trim();
    if (!query) return alert("검색어를 입력하세요.");
    setSearchingEmbed(true);
    try {
      const res = await fetch(`${API_BASE}/api/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, topK: 5 })
      });
      const body = await res.json();
      setSearchResults(body.results || []);
    } catch (err) {
      alert("검색 실패: " + (err.message || err));
    } finally {
      setSearchingEmbed(false);
    }
  }

  return (
    <div className="app">
      <header className="header">
        <h1>고려말 언어 보존 도구</h1>
      </header>

      <main className="grid">
        <section className="panel">
          <h2>문서 업로드</h2>

          <input
            type="file"
            accept="image/*,.pdf"
            onChange={e => setFile(e.target.files?.[0] || null)}
          />

          {filePreview && (
            <div className="preview">
              {file.type && file.type.startsWith("image/") ? (
                <img src={filePreview} alt="preview" />
              ) : (
                <div className="file-name">{file.name}</div>
              )}
            </div>
          )}

          <div className="row">
            <button onClick={uploadOCR}>OCR 실행</button>
            <button onClick={uploadParse}>문서 파싱</button>
          </div>

          <div className="result">
            <h3>결과</h3>
            <div className="result-buttons">
              <button 
                className={`tab-btn ${viewMode === "ocr" ? "active" : ""}`}
                onClick={() => setViewMode("ocr")}
              >
                OCR
              </button>
              <button 
                className={`tab-btn ${viewMode === "parse" ? "active" : ""}`}
                onClick={() => setViewMode("parse")}
              >
                파싱
              </button>
            </div>
            <div className="result-content">
              <div className="chat-window small">
                {viewMessages().map(m => (
                  <div key={m.id} className={`msg ${m.role === "user" ? "user" : "assistant"}`}>
                    <div className="bubble">{m.content}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="embed-controls">
            <h3>Embedding 저장</h3>
            <textarea
              rows={2}
              placeholder="저장할 텍스트를 입력하세요"
              value={saveText}
              onChange={e => setSaveText(e.target.value)}
            />
            <div className="row">
              <button onClick={() => saveEmbedding()} disabled={savingEmbed}>
                {savingEmbed ? "저장 중..." : "Embedding 저장"}
              </button>
              <button onClick={() => setSaveText(getCurrentViewText())} className="secondary">
                결과로 채우기
              </button>
            </div>

            <div className="search-section">
              <h3>임베딩 검색</h3>
              <textarea
                rows={2}
                placeholder="검색어를 입력하세요"
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
              />
              <button onClick={doSearch} disabled={searchingEmbed} style={{ marginTop: "8px" }}>
                {searchingEmbed ? "검색 중..." : "검색"}
              </button>

              <div className="result-content" style={{ marginTop: "12px" }}>
                {searchResults.length > 0 ? (
                  <div className="search-results">
                    {searchResults.map((res, idx) => (
                      <div key={idx} className="result-item">
                        <div className="meta">
                          <span className="source">{res.id}</span>
                          <span className="score">
                            유사도: <span style={{ fontWeight: 600 }}>{(res.score * 100).toFixed(1)}%</span>
                          </span>
                        </div>
                        <div className="snippet">{res.text.substring(0, 100)}...</div>
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
                <div className="bubble">{m.content}</div>
              </div>
            ))}
          </div>

          <div className="chat-input">
            <textarea
              rows={2}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="질문을 입력하고 Enter를 누르세요 (Shift+Enter = 줄바꿈)"
            />
            <div className="chat-actions">
              <button onClick={sendMessage}>Send</button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

const root = createRoot(document.getElementById("root"));
root.render(<App />);