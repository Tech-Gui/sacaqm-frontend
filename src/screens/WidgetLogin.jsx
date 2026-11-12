import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const WIDGET_USERNAME = "raghavSACAQMwidget";
const WIDGET_PASSWORD = "widgetMaker";
const WIDGET_ACCESS_KEY = "sacaqmWidgetAccess";

export default function WidgetLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    if (username !== WIDGET_USERNAME || password !== WIDGET_PASSWORD) {
      setError("The username or password is incorrect.");
      return;
    }
    sessionStorage.setItem(WIDGET_ACCESS_KEY, "granted");
    navigate(location.state?.from || "/news-widgets", { replace: true });
  };

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 20, background: "#f1f5f9", fontFamily: "system-ui, sans-serif" }}>
      <form onSubmit={handleSubmit} style={{ width: "min(100%, 390px)", boxSizing: "border-box", background: "#fff", padding: 32, borderRadius: 16, boxShadow: "0 12px 40px rgba(15,23,42,.12)" }}>
        <div style={{ color: "#e63946", fontSize: ".72rem", fontWeight: 800, letterSpacing: ".12em", textTransform: "uppercase" }}>SACAQM · Private</div>
        <h1 style={{ color: "#1a1a2e", fontFamily: "Georgia, serif", fontSize: "1.8rem", margin: "8px 0" }}>Widget access</h1>
        <p style={{ color: "#64748b", fontSize: ".9rem", lineHeight: 1.5, marginBottom: 24 }}>Sign in to open the prototype and prepare publisher embed snippets.</p>
        <label htmlFor="widget-username" style={{ display: "block", fontSize: ".8rem", fontWeight: 700, marginBottom: 6 }}>Username</label>
        <input id="widget-username" autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} required style={inputStyle} />
        <label htmlFor="widget-password" style={{ display: "block", fontSize: ".8rem", fontWeight: 700, margin: "16px 0 6px" }}>Password</label>
        <input id="widget-password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required style={inputStyle} />
        {error && <div role="alert" style={{ color: "#b91c1c", fontSize: ".84rem", marginTop: 12 }}>{error}</div>}
        <button type="submit" style={{ width: "100%", marginTop: 20, padding: 12, color: "#fff", background: "#1a1a2e", border: 0, borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>Sign in</button>
      </form>
    </main>
  );
}

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "11px 12px",
  border: "1px solid #cbd5e1",
  borderRadius: 7,
  fontSize: ".95rem",
};
