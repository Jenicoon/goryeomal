import React from "react";

export default function AuthBar({ isLoggedIn, displayName, onLogout, onOpenSignup, onOpenLogin }) {
  return (
    <div className="auth-bar">
      {isLoggedIn ? (
        <>
          <span className="user-pill">사용자: {displayName}</span>
          <button className="ghost" onClick={onLogout}>로그아웃</button>
        </>
      ) : (
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button className="primary" onClick={onOpenSignup}>가입</button>
          <button className="secondary" onClick={onOpenLogin}>로그인</button>
        </div>
      )}
    </div>
  );
}