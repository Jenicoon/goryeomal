import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function UploadPanel({
  file,
  setFile,
  filePreview,
  viewMode,
  setViewMode,
  viewMessages,
  onOCR,
  onParse
}) {
  return (
    <section className="panel">
      <h2>문서 업로드</h2>

      <input type="file" accept="image/*,.pdf" onChange={e => setFile(e.target.files?.[0] || null)} />

      {filePreview && (
        <div className="preview">
          {file?.type?.startsWith("image/") ? <img src={filePreview} alt="preview" /> : <div className="file-name">{file?.name}</div>}
        </div>
      )}

      <div className="row">
        <button onClick={onOCR}>OCR 실행</button>
        <button onClick={onParse}>문서 파싱</button>
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
    </section>
  );
}