import React, { useMemo } from "react";

export default function EmbeddingPanel({
  saveText,
  setSaveText,
  savingEmbed,
  onSave,
  getCurrentViewText,
  searchText,
  setSearchText,
  searchingEmbed,
  onSearch,
  searchResults
}) {
  const [orderMode, setOrderMode] = React.useState("time"); // time | score
  // Removed similarity chart
  return (
    <div className="embed-controls">
      <h3>Embedding 저장</h3>
      <textarea rows={2} placeholder="저장할 텍스트를 입력하세요" value={saveText} onChange={e => setSaveText(e.target.value)} />
      <div className="row">
        <button onClick={onSave} disabled={savingEmbed}>{savingEmbed ? "저장 중..." : "Embedding 저장"}</button>
        <button onClick={() => setSaveText(getCurrentViewText())} className="secondary">결과로 채우기</button>
      </div>

      <div className="search-section" style={{ marginTop: 12 }}>
        <h3>임베딩 검색</h3>
        <textarea rows={2} placeholder="검색어를 입력하세요" value={searchText} onChange={e => setSearchText(e.target.value)} />
        <button onClick={onSearch} disabled={searchingEmbed} style={{ marginTop: 8 }}>
          {searchingEmbed ? "검색 중..." : "검색"}
        </button>

        <div className="result-content" style={{ marginTop: 12 }}>
          {searchResults.length > 0 ? (
            <div className="search-results">
              <div className="row" style={{ gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: "#64748b" }}>정렬:</span>
                <button className={`tab-btn ${orderMode === "time" ? "active" : ""}`} onClick={() => setOrderMode("time")}>시간순</button>
                <button className={`tab-btn ${orderMode === "score" ? "active" : ""}`} onClick={() => setOrderMode("score")}>정확도순</button>
              </div>
              {(orderMode === "score"
                ? [...searchResults].sort((a, b) => Number(b.score) - Number(a.score))
                : [...searchResults].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
               ).map((res, idx) => (
                <div key={idx} className="result-item">
                  <div className="meta">
                    <span className="source">{res.id}</span>
                    <span className="score">유사도: <span style={{ fontWeight: 600 }}>{(Math.max(0, Math.min(1, Number(res.score))) * 100).toFixed(1)}%</span></span>
                  </div>
                  <div className="snippet">
                    {(res.text || "").substring(0, 200)}{(res.text || "").length > 200 ? "..." : ""}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="placeholder">검색 결과 없음. 먼저 텍스트를 저장해주세요.</div>
          )}
        </div>
      </div>
    </div>
  );
}