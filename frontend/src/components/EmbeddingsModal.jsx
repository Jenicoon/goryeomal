import React, { useEffect, useMemo, useState } from "react";

// 한글 초성 계산
function getInitial(ch) {
  const code = ch.charCodeAt(0);
  if (code < 0xac00 || code > 0xd7a3) return "#"; // 한글 아닌 경우
  const initials = ["ㄱ","ㄲ","ㄴ","ㄷ","ㄸ","ㄹ","ㅁ","ㅂ","ㅃ","ㅅ","ㅆ","ㅇ","ㅈ","ㅉ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"];
  const idx = Math.floor((code - 0xac00) / 588);
  return initials[idx] || "#";
}

const INITIAL_TABS = ["ㄱ","ㄲ","ㄴ","ㄷ","ㄸ","ㄹ","ㅁ","ㅂ","ㅃ","ㅅ","ㅆ","ㅇ","ㅈ","ㅉ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ","#"];

export default function EmbeddingsModal({ open, onClose, items, onDelete }) {
  const [active, setActive] = useState("ㄱ");

  useEffect(() => {
    if (open) setActive("ㄱ");
  }, [open]);

  const grouped = useMemo(() => {
    const g = {};
    INITIAL_TABS.forEach(k => g[k] = []);
    for (const it of items) {
      const text = (it.text || "").trim();
      const init = text ? getInitial(text[0]) : "#";
      if (!g[init]) g[init] = [];
      g[init].push(it);
    }
    return g;
  }, [items]);

  if (!open) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal" style={{ width: 560 }}>
        <h3>임베딩 전체 보기</h3>

        <div className="row" style={{ flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
          {INITIAL_TABS.map(k => (
            <button
              key={k}
              className={`tab-btn ${active === k ? "active" : ""}`}
              onClick={() => setActive(k)}
            >
              {k}
            </button>
          ))}
        </div>

        <div className="result-content" style={{ maxHeight: 360, overflowY: "auto" }}>
          {grouped[active]?.length ? grouped[active].map(item => (
            <div key={item.id} className="result-item" style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:8, padding:"6px 0", borderBottom:"1px solid #f1f5f9" }}>
              <div style={{ flex:1 }}>
                {item.text}
              </div>
              <button className="ghost" onClick={() => onDelete(item.id)}>삭제</button>
            </div>
          )) : (
            <div className="placeholder">해당 초성으로 시작하는 항목이 없습니다.</div>
          )}
        </div>

        <div className="row" style={{ marginTop: 12 }}>
          <button className="ghost" onClick={onClose}>닫기</button>
        </div>
      </div>
    </div>
  );
}