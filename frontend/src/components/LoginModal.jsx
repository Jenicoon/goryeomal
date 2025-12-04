import React, { useState, useEffect } from "react";

export default function LoginModal({ open, onClose, onSubmit }) {
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");

  useEffect(() => {
    if (open) { setId(""); setPw(""); }
  }, [open]);

  if (!open) return null;
  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h3>로그인</h3>
        <div className="field">
          <label>아이디(UUID)</label>
          <input value={id} onChange={e => setId(e.target.value)} placeholder="발급받은 ID" />
        </div>
        <div className="field">
          <label>비밀번호</label>
          <input type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="비밀번호" />
        </div>
        <div className="row">
          <button className="primary" onClick={() => onSubmit(id, pw)}>로그인</button>
          <button className="ghost" onClick={onClose}>닫기</button>
        </div>
      </div>
    </div>
  );
}