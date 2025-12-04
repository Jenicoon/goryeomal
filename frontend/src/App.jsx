import React, { useState, useEffect } from "react";
import "./App.css";
import AuthBar from "./components/AuthBar.jsx";
import UploadPanel from "./components/UploadPanel.jsx";
import EmbeddingPanel from "./components/EmbeddingPanel.jsx";
import ChatPanel from "./components/ChatPanel.jsx";
import SignupModal from "./components/SignupModal.jsx";
import LoginModal from "./components/LoginModal.jsx";
import EmbeddingsModal from "./components/EmbeddingsModal.jsx";

export default function App() {
  const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:3000/api";

  // 계정 목록 로딩/저장
  const [accounts, setAccounts] = useState(() => {
    try { return JSON.parse(localStorage.getItem("goryeomal_accounts") || "[]"); } catch { return []; }
  });
  function saveAccounts(next) {
    setAccounts(next);
    localStorage.setItem("goryeomal_accounts", JSON.stringify(next));
  }

  const [userId, setUserId] = useState(localStorage.getItem("goryeomal_user_id") || "");
  const [userName, setUserName] = useState(localStorage.getItem("goryeomal_user_name") || "");
  const [userPw, setUserPw] = useState(localStorage.getItem("goryeomal_user_pw") || "");

  // 모달 열림 상태
  const [signupOpen, setSignupOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [allEmbeddingsOpen, setAllEmbeddingsOpen] = useState(false);

  // 변경: 사용자 입력한 id로 가입
  function signup({ id, name, pw }) {
    const uid = String(id || "").trim();
    const n = String(name || "").trim();
    const p = String(pw || "").trim();
    if (!uid) return alert("아이디를 입력하세요.");
    if (!n) return alert("이름/닉네임을 입력하세요.");

    const existsById = accounts.find(a => a.id === uid);
    if (existsById) {
      alert("이미 있는 계정입니다");
      return;
    }
    const next = [...accounts, { id: uid, name: n, pw: p }];
    saveAccounts(next);

    localStorage.setItem("goryeomal_user_id", uid);
    localStorage.setItem("goryeomal_user_name", n);
    localStorage.setItem("goryeomal_user_pw", p);
    localStorage.removeItem("goryeomal_session_id");

    setUserId(uid);
    setUserName(n);
    setUserPw(p);
    setSessionId("");
    setMessages([{ id: 1, role: "assistant", content: "가입 완료! 세션을 불러오는 중..." }]);
    setSignupOpen(false);

    // 본인 세션 목록 로드
    (async () => {
      const list = await loadSessions();
      if (list.length > 0) {
        const latest = list[0];
        localStorage.setItem("goryeomal_session_id", latest.id);
        setSessionId(latest.id);
        await loadSession(latest.id);
      }
    })();
  }

  // 로그인은 입력한 id/pw가 accounts에 있어야만 허용(기존 로직 유지)
  function login(uid, pw) {
    const id = (uid || "").trim();
    const p = (pw || "").trim();
    if (!id) return alert("아이디를 입력하세요.");
    const account = accounts.find(a => a.id === id);
    if (!account) return alert("가입되지 않은 아이디입니다. 먼저 가입해주세요.");
    if ((account.pw || "") !== p) return alert("아이디/비밀번호가 일치하지 않습니다.");

    localStorage.setItem("goryeomal_user_id", id);
    localStorage.setItem("goryeomal_user_name", account.name || "");
    localStorage.setItem("goryeomal_user_pw", p);
    localStorage.removeItem("goryeomal_session_id");

    setUserId(id);
    setUserName(account.name || "");
    setUserPw(p);
    setSessionId("");
    setMessages([{ id: 1, role: "assistant", content: "로그인했습니다. 세션을 불러오는 중..." }]);
    setLoginOpen(false);

    (async () => {
      const list = await loadSessions();
      if (list.length > 0) {
        const latest = list[0];
        localStorage.setItem("goryeomal_session_id", latest.id);
        setSessionId(latest.id);
        await loadSession(latest.id);
      } else {
        setMessages([{ id: 1, role: "assistant", content: "세션이 없습니다. 새 세션을 만들어주세요." }]);
      }
    })();
  }

  function logout() {
    localStorage.removeItem("goryeomal_user_id");
    localStorage.removeItem("goryeomal_user_name");
    localStorage.removeItem("goryeomal_user_pw");
    localStorage.removeItem("goryeomal_session_id");
    setUserId(""); setUserName(""); setUserPw("");
    setSessionId("");
    setSessions([]);
    setMessages([{ id: 1, role: "assistant", content: "로그아웃되었습니다. 가입/로그인 후 시작하세요." }]);
  }

  // 파일/프리뷰
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState("");
  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setFilePreview(url);
      return () => URL.revokeObjectURL(url);
    } else setFilePreview("");
  }, [file]);

  // 결과 뷰
  const [viewMode, setViewMode] = useState("ocr");
  const [ocrMessages, setOcrMessages] = useState([]);
  const [parseMessages, setParseMessages] = useState([]);
  const viewMessages = () => (viewMode === "ocr" ? ocrMessages : parseMessages);
  const getCurrentViewText = () => viewMessages().map(m => m.content).join("\n");

  // Embedding
  const [saveText, setSaveText] = useState("");
  const [savingEmbed, setSavingEmbed] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [searchingEmbed, setSearchingEmbed] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [allEmbeddings, setAllEmbeddings] = useState([]);

  // 세션/채팅 상태
  const [sessionId, setSessionId] = useState(localStorage.getItem("goryeomal_session_id") || "");
  const [sessions, setSessions] = useState([]);
  const [messages, setMessages] = useState([{ id: 1, role: "assistant", content: "안녕하세요. 무엇을 도와드릴까요?" }]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  async function loadSessions() {
    if (!userId) { setSessions([]); return []; }
    try {
      const r = await fetch(`${API_BASE}/chat/sessions?userId=${encodeURIComponent(userId)}`);
      const b = await r.json();
      const list = (b.sessions || []).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      setSessions(list);
      return list;
    } catch {
      setSessions([]);
      return [];
    }
  }

  async function createNewSession() {
    if (!userId) return alert("먼저 가입/로그인 해주세요.");
    const title = prompt("세션 제목을 입력하세요", "새 대화");
    if (!title) return;
    try {
      const r = await fetch(`${API_BASE}/chat/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, title })
      });
      if (!r.ok) throw new Error(await r.text());
      const b = await r.json();
      if (b.id) {
        setSessionId(b.id);
        localStorage.setItem("goryeomal_session_id", b.id);
        await loadSession(b.id);
        await loadSessions();
      } else {
        alert("세션 생성 실패");
      }
    } catch (e) {
      console.error(e);
      alert("세션 생성 중 오류가 발생했습니다.");
    }
  }

  async function deleteSession(id) {
    if (!userId) return alert("먼저 가입/로그인 해주세요.");
    const ok = confirm("이 세션을 삭제하시겠습니까?");
    if (!ok) return;
    try {
      const r = await fetch(`${API_BASE}/chat/session/${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId })
      });
      const b = await r.json();
      if (b?.ok) {
        if (sessionId === id) {
          localStorage.removeItem("goryeomal_session_id");
          setSessionId("");
          setMessages([{ id: 1, role: "assistant", content: "세션이 삭제되었습니다." }]);
        }
        await loadSessions();
      } else {
        alert(b?.error || "삭제 실패");
      }
    } catch (e) {
      alert("삭제 중 오류가 발생했습니다.");
    }
  }

  async function loadSession(id) {
    if (!userId) return;
    try {
      const r = await fetch(`${API_BASE}/chat/session/${encodeURIComponent(id)}?userId=${encodeURIComponent(userId)}`);
      const b = await r.json();
      setSessionId(id);
      localStorage.setItem("goryeomal_session_id", id);
      const msgs = (b.messages || []).map(m => ({ id: m.id, role: m.role, content: m.content }));
      setMessages(msgs.length ? msgs : [{ id: 1, role: "assistant", content: "새 대화를 시작하세요." }]);
    } catch {
      setMessages([{ id: 1, role: "assistant", content: "세션을 불러오지 못했습니다." }]);
    }
  }

  useEffect(() => { if (userId) loadSessions(); }, [userId]);
  useEffect(() => { if (sessionId && userId) loadSession(sessionId); }, [sessionId, userId]);

  async function sendMessage() {
    const text = input.trim();
    if (!text) return;
    if (!userId) return alert("먼저 가입/로그인 해주세요.");
    if (!sessionId) {
      await createNewSession();
      if (!sessionId) return;
    }
    const userMsg = { id: Date.now(), role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput(""); setSending(true);
    try {
      const r = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, sessionId, messages: [{ role: "user", content: text }] })
      });
      const b = await r.json();
      const assistantMsg = { id: Date.now() + 1, role: "assistant", content: b?.content || JSON.stringify(b, null, 2) };
      setMessages(prev => [...prev, assistantMsg]);
      await loadSessions();
    } catch {
      const errMsg = { id: Date.now() + 1, role: "assistant", content: "응답 중 오류가 발생했습니다." };
      setMessages(prev => [...prev, errMsg]);
    } finally { setSending(false); }
  }

  // 추가: OCR 업로드
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

  // 추가: 파싱 업로드
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

  // Embedding 저장
  async function saveEmbedding() {
    const text = (saveText || "").trim();
    if (!text) return alert("저장할 텍스트를 입력하세요.");
    if (!userId) return alert("먼저 가입/로그인 해주세요.");
    setSavingEmbed(true);
    try {
      // 저장
      await fetch(`${API_BASE}/embeddings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, userId, sessionId })
      });
      alert("저장 완료");
    } catch (e) {
      alert("저장 실패");
    } finally {
      setSavingEmbed(false);
    }
  }

  // Embedding 검색
  async function doSearch() {
    const query = (searchText || "").trim();
    if (!query) return;
    if (!userId) return alert("먼저 가입/로그인 해주세요.");
    setSearchingEmbed(true);
    try {
      const res = await fetch(`${API_BASE}/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, userId, sessionId })
      });
      const body = await res.json();
      setSearchResults(body?.results || []);
    } catch (e) {
      setSearchResults([]);
    } finally {
      setSearchingEmbed(false);
    }
  }

  async function loadAllEmbeddings() {
    if (!userId) return alert("먼저 가입/로그인 해주세요.");
    try {
      const res = await fetch(`${API_BASE}/embeddings/all?userId=${encodeURIComponent(userId)}&sessionId=${encodeURIComponent(sessionId || "")}`);
      const body = await res.json();
      setAllEmbeddings(body?.items || []);
      setAllEmbeddingsOpen(true);
    } catch {
      alert("임베딩을 불러오지 못했습니다.");
    }
  }

  async function deleteEmbedding(id) {
    if (!userId) return alert("먼저 가입/로그인 해주세요.");
    const ok = confirm("이 임베딩 항목을 삭제하시겠습니까?");
    if (!ok) return;
    try {
      const res = await fetch(`${API_BASE}/embeddings/${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId })
      });
      const b = await res.json();
      if (b?.ok) {
        // 모달 목록 갱신
        setAllEmbeddings(prev => prev.filter(it => it.id !== id));
        // 검색 결과도 갱신
        setSearchResults(prev => prev.filter(it => it.id !== id));
      } else {
        alert(b?.error || "삭제 실패");
      }
    } catch {
      alert("삭제 중 오류가 발생했습니다.");
    }
  }

  return (
    <div className="app">
      <header className="header">
        <h1>고려말 언어 보존 도구</h1>
        <AuthBar
          isLoggedIn={!!userId}
          displayName={userName || (userId ? userId : "")}
          onLogout={logout}
          onOpenSignup={() => setSignupOpen(true)}
          onOpenLogin={() => setLoginOpen(true)}
        />
      </header>

      <SignupModal open={signupOpen} onClose={() => setSignupOpen(false)} onSubmit={signup} />
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} onSubmit={login} />

      {/* 임베딩 전체 보기 모달 */}
      <EmbeddingsModal
        open={allEmbeddingsOpen}
        onClose={() => setAllEmbeddingsOpen(false)}
        items={allEmbeddings}
        onDelete={deleteEmbedding}
      />

      <main className="grid">
        <section className="panel">
          <UploadPanel
            file={file}
            setFile={setFile}
            filePreview={filePreview}
            viewMode={viewMode}
            setViewMode={setViewMode}
            viewMessages={viewMessages}
            onOCR={uploadOCR}
            onParse={uploadParse}
          />
          <EmbeddingPanel
            saveText={saveText}
            setSaveText={setSaveText}
            savingEmbed={savingEmbed}
            onSave={saveEmbedding}
            getCurrentViewText={getCurrentViewText}
            searchText={searchText}
            setSearchText={setSearchText}
            searchingEmbed={searchingEmbed}
            onSearch={doSearch}
            searchResults={searchResults}
          />
          <div className="row" style={{ marginTop: 8 }}>
            <button className="secondary" onClick={loadAllEmbeddings}>임베딩 전체 보기</button>
          </div>
        </section>

        <ChatPanel
          messages={messages}
          input={input}
          setInput={setInput}
          sending={sending}
          onSend={sendMessage}
          sessions={sessions}
          sessionId={sessionId}
          onCreateSession={createNewSession}
          onSelectSession={loadSession}
          onDeleteSession={deleteSession}
        />
      </main>
    </div>
  );
}