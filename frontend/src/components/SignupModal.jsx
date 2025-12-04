import React, { useState, useEffect } from "react";

export default function SignupModal({ open, onClose, onSubmit }) {
  const [name, setName] = useState("");
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");

  useEffect(() => {
    if (open) { setName(""); setId(""); setPw(""); }
  }, [open]);

  if (!open) return null;
  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h3>회원가입</h3>
        <div className="field">
          <label>아이디</label>
          <input value={id} onChange={e => setId(e.target.value)} placeholder="원하는 아이디" />
        </div>
        <div className="field">
          <label>이름/닉네임</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="예: 홍길동" />
        </div>
        <div className="field">
          <label>비밀번호</label>
          <input type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="비밀번호" />
        </div>
        <div className="row">
          <button className="primary" onClick={() => onSubmit({ id, name, pw })}>가입</button>
          <button className="ghost" onClick={onClose}>닫기</button>
        </div>
      </div>
    </div>
  );
}