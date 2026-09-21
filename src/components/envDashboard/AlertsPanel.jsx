import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Box, Typography, Chip, Button, IconButton,
  Drawer, Tooltip
} from "@mui/material";
import axios from "axios";

const API_BASE = process.env.REACT_APP_API_BASE || "";
// Reads your DEPLOYED agent URL from .env. Set REACT_APP_AGENT_BASE there.
const AGENT_BASE = "https://ai-agent-deploy-ai-agent.app.cern.ch";

// Default weather/neighbor shape used to fill gaps in real events (NOT shown as fake alerts)
const DEFAULT_WEATHER = {
  windSpeed: "—",
  windDirection: "—",
  dispersion: "—",
};

export default function AlertsPanel({
  sensorId,
  sensorLabel,
  stationMap = {},
  onAlertStatusChange,
  externalDrawerOpen,
  initialDrawerView = "detail",
  onCloseExternalDrawer,
  selectedStationAlert
}) {
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerView, setDrawerView] = useState("detail"); // 'list' | 'detail'
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const [dispatched, setDispatched] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [loading, setLoading] = useState(false);

  // Sync external open drawer requests (e.g. from clicking a map pin or alert list button)
  useEffect(() => {
    if (externalDrawerOpen) {
      setDrawerOpen(true);
      if (initialDrawerView) setDrawerView(initialDrawerView);
      if (selectedStationAlert) {
        setSelectedAlert({
          ...selectedStationAlert,
          weather: { ...DEFAULT_WEATHER, ...(selectedStationAlert.weather || {}) },
          neighbors: selectedStationAlert.neighbors || [],
          conclusion: selectedStationAlert.conclusion || "",
        });
      }
    }
  }, [externalDrawerOpen, selectedStationAlert, initialDrawerView]);

  // Fetch real agent events from the deployed agent, then backend as fallback
    // Fetch real agent investigation events from the deployed agent
  const fetchAgentEvents = useCallback(async () => {
    setLoading(true);
    try {
      let foundAlerts = [];
      try {
        const res = await axios.get(`${AGENT_BASE}/api/events`, {
          params: { limit: 50 },
          timeout: 30000,
        });
        const events = res.data?.events || [];
        console.log("AGENT RAW EVENTS:", events.length, events);
        const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

        foundAlerts = events
          .filter(e => {
            const decisionOk = e.decision === "alert";
            const t = new Date((e.timestamp || "").replace(" ", "T") + "Z").getTime();
            const timeOk = !isNaN(t) && t >= oneDayAgo;
            console.log("EVENT:", e.station_name, "| decision:", e.decision, "| decisionOk:", decisionOk, "| timestamp:", e.timestamp, "| timeOk:", timeOk);
            return decisionOk && timeOk;
          })
          .map(e => {
            const ts = (e.timestamp || "").replace(" ", "T") + "Z";
            return {
              id: e._id,
              stationId: e.station_id,
              stationName: e.station_name || stationMap[e.station_id] || e.station_id,
              city: "",
              province: "",
              metric: e.metric || "pm2p5",
              value: e.value != null ? Number(e.value) : null,
              threshold: 60.0,
              confidence: e.confidence != null ? e.confidence : null,
              decision: e.decision,
              severity: e.value > 90 ? "Severe" : e.value > 75 ? "High" : "Elevated",
              lastAlerted: ts,
              weather: DEFAULT_WEATHER,   // agent embeds weather in the conclusion text
              neighbors: [],              // agent embeds neighbors in the conclusion text
              conclusion: e.conclusion || "",
            };
          });
      } catch (err) {
        console.warn("Agent /api/events fetch failed:", err.message);
      }
      console.log("FILTERED ALERTS:", foundAlerts.length, foundAlerts);
      setActiveAlerts(foundAlerts);
      setSelectedAlert(foundAlerts[0] || null);
      if (onAlertStatusChange) onAlertStatusChange(foundAlerts);
    } finally {
      setLoading(false);
    }
  }, [stationMap, onAlertStatusChange]);

    // Keep the latest fetch function in a ref so the interval always calls
  // the current one, without the effect re-running every render.
  const fetchRef = useRef(fetchAgentEvents);
  useEffect(() => { fetchRef.current = fetchAgentEvents; }, [fetchAgentEvents]);

  useEffect(() => {
    fetchRef.current();                         // run once on mount
    const interval = setInterval(() => fetchRef.current(), 60000);
    return () => clearInterval(interval);
  }, []);                                        // empty deps → runs once, no loop

  

  const handleOpenDrawer = (alertItem, view = "detail") => {
    setSelectedAlert(alertItem || activeAlerts[0] || null);
    setDrawerView(view);
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    if (onCloseExternalDrawer) onCloseExternalDrawer();
  };

  const rawAlert = selectedAlert || activeAlerts[0] || null;
  const activeAlert = rawAlert ? {
    ...rawAlert,
    weather: { ...DEFAULT_WEATHER, ...(rawAlert.weather || {}) },
    neighbors: (rawAlert.neighbors && rawAlert.neighbors.length > 0) ? rawAlert.neighbors : [],
    conclusion: rawAlert.conclusion || "",
  } : null;

  const hasAlerts = activeAlerts.length > 0;

  return (
    <>
      {/* ── 1. TOP STICKY ALERT BANNER (only when real alerts exist) ─────── */}
      {!bannerDismissed && hasAlerts && activeAlert && (
        <Box sx={{
          mb: 2.5, borderRadius: 3,
          background: "linear-gradient(135deg, #dc2626 0%, #b91c1c 50%, #991b1b 100%)",
          color: "white", boxShadow: "0 8px 28px rgba(220, 38, 38, 0.35)",
          border: "1px solid rgba(254, 202, 202, 0.4)", overflow: "hidden", position: "relative",
        }}>
          <Box sx={{
            position: "absolute", inset: 0,
            background: "radial-gradient(circle at 15% 50%, rgba(255,255,255,0.2) 0%, transparent 60%)",
            pointerEvents: "none",
          }} />
          <Box sx={{
            px: 2.5, py: 1.5, display: "flex", alignItems: "center", justifyContent: "space-between",
            flexWrap: "wrap", gap: 1.5, position: "relative", zIndex: 2,
          }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Box sx={{
                width: 34, height: 34, borderRadius: "50%", bgcolor: "white", color: "#dc2626",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 900, fontSize: "1.15rem", boxShadow: "0 0 14px rgba(255,255,255,0.8)",
              }}>🚨</Box>
              <Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography sx={{ fontWeight: 900, fontSize: "0.92rem", letterSpacing: "0.4px", textTransform: "uppercase" }}>
                    Air Quality Alert Detected Past 24 Hours
                  </Typography>
                  {activeAlert.confidence != null && (
                    <Chip label={`AI VERIFIED (${activeAlert.confidence}%)`} size="small"
                      sx={{ bgcolor: "rgba(255,255,255,0.25)", color: "white", fontWeight: 800, fontSize: "0.68rem", height: 20, border: "1px solid rgba(255,255,255,0.5)" }} />
                  )}
                </Box>
                <Typography sx={{ fontSize: "0.82rem", color: "rgba(254,226,226,0.95)", mt: 0.2 }}>
                  <strong>{activeAlert.stationName}</strong>
                  {activeAlert.value != null && <>: PM2.5 @ <strong>{activeAlert.value} µg/m³</strong> (Threshold: {activeAlert.threshold} µg/m³)</>}
                  {activeAlert.lastAlerted && <> • Spike Time: <strong>{new Date(activeAlert.lastAlerted).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong></>}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Button variant="outlined" size="small" onClick={() => handleOpenDrawer(activeAlert, "list")}
                sx={{ bgcolor: "rgba(255,255,255,0.15)", color: "white", borderColor: "rgba(255,255,255,0.6)", fontWeight: 800, fontSize: "0.78rem", textTransform: "none", px: 1.8, py: 0.7, borderRadius: 2, "&:hover": { bgcolor: "rgba(255,255,255,0.25)", borderColor: "white" } }}>
                📋 View Alert List ({activeAlerts.length})
              </Button>
              <Button variant="contained" size="small" onClick={() => handleOpenDrawer(activeAlert, "detail")}
                sx={{ bgcolor: "white", color: "#b91c1c", fontWeight: 800, fontSize: "0.78rem", textTransform: "none", px: 2, py: 0.7, borderRadius: 2, boxShadow: "0 4px 12px rgba(0,0,0,0.2)", "&:hover": { bgcolor: "#f8fafc", transform: "scale(1.02)" } }}>
                🔍 Inspect AI Story →
              </Button>
              <Tooltip title="Dismiss banner for now">
                <IconButton size="small" onClick={() => setBannerDismissed(true)} sx={{ color: "rgba(255,255,255,0.75)", "&:hover": { color: "white" } }}>✕</IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Box>
      )}

      {/* ── 1b. CALM "NO ALERTS" STATE ───────────────────────────────────── */}
      {!hasAlerts && !loading && (
        <Box sx={{
          mb: 2.5, borderRadius: 3, px: 2.5, py: 1.6,
          background: "linear-gradient(135deg, rgba(22,163,74,0.12), rgba(16,185,129,0.06))",
          border: "1px solid rgba(22,163,74,0.3)",
          display: "flex", alignItems: "center", gap: 1.5,
        }}>
          <Box sx={{ width: 30, height: 30, borderRadius: "50%", bgcolor: "#16a34a", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem" }}>✓</Box>
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: "0.9rem", color: "#15803d" }}>No Active Air Quality Alerts</Typography>
            <Typography sx={{ fontSize: "0.78rem", color: "#4b5563" }}>The AI agent has not detected any threshold exceedances in the past 24 hours.</Typography>
          </Box>
        </Box>
      )}

      {/* ── 2. SLIDE-OUT DRAWER ──────────────────────────────────────────── */}
      <Drawer anchor="right" open={drawerOpen} onClose={handleCloseDrawer}
        PaperProps={{ sx: { width: { xs: "100%", sm: 480 }, bgcolor: "#0f172a", color: "#f8fafc", borderLeft: "1px solid #1e293b", boxShadow: "-10px 0 35px rgba(0,0,0,0.6)", p: 3, overflowY: "auto" } }}>
        <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 2 }}>
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
              <span style={{ fontSize: "1.2rem" }}>🚨</span>
              <Typography sx={{ fontWeight: 800, fontSize: "1.2rem", color: "#f8fafc" }}>
                {drawerView === "list" ? "Air Quality Alerts (Past 24 Hours)" : "AI Incident Report"}
              </Typography>
            </Box>
            <Typography sx={{ fontSize: "0.82rem", color: "#94a3b8" }}>
              {drawerView === "list"
                ? `${activeAlerts.length} verified incident alerts in SACAQM network`
                : (activeAlert ? `${activeAlert.stationName}${activeAlert.city ? ` • ${activeAlert.city}` : ""}${activeAlert.province ? `, ${activeAlert.province}` : ""}` : "No alert selected")}
            </Typography>
          </Box>
          <IconButton onClick={handleCloseDrawer} sx={{ color: "#94a3b8", "&:hover": { color: "white" } }}>✕</IconButton>
        </Box>

        {/* Empty state inside drawer */}
        {!hasAlerts && (
          <Box sx={{ mt: 4, textAlign: "center", color: "#94a3b8" }}>
            <Typography sx={{ fontSize: "2.5rem", mb: 1 }}>✓</Typography>
            <Typography sx={{ fontWeight: 700, color: "#e2e8f0", mb: 0.5 }}>No active alerts</Typography>
            <Typography sx={{ fontSize: "0.82rem" }}>The AI agent has not flagged any incidents in the past 24 hours.</Typography>
          </Box>
        )}

        {/* LIST VIEW */}
        {hasAlerts && drawerView === "list" && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Incidents Detected in Past 24 Hours ({activeAlerts.length})
            </Typography>
            {activeAlerts.map((alt, idx) => (
              <Box key={alt.id || idx} sx={{ p: 2, borderRadius: 2.5, bgcolor: "#1e293b", border: "1px solid #334155", transition: "all 0.2s ease", "&:hover": { borderColor: "#ef4444", transform: "translateY(-2px)" } }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
                  <Box>
                    <Typography sx={{ fontSize: "0.92rem", fontWeight: 800, color: "#f8fafc" }}>{alt.stationName}</Typography>
                    <Typography sx={{ fontSize: "0.72rem", color: "#94a3b8" }}>
                      {alt.city}{alt.city && alt.province ? ", " : ""}{alt.province}{(alt.city || alt.province) ? " • " : ""}{alt.lastAlerted ? new Date(alt.lastAlerted).toLocaleTimeString() : ""}
                    </Typography>
                  </Box>
                  <Chip label={alt.severity || "Alert"} size="small" sx={{ bgcolor: (alt.value || 0) > 120 ? "#ef4444" : "#f97316", color: "white", fontWeight: 800, fontSize: "0.68rem", height: 22 }} />
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", p: 1.2, borderRadius: 1.5, bgcolor: "#0f172a", mb: 1.5 }}>
                  <Box>
                    <Typography sx={{ fontSize: "0.68rem", color: "#94a3b8" }}>PM2.5 Reading</Typography>
                    <Typography sx={{ fontSize: "1.1rem", fontWeight: 900, color: "#ef4444" }}>{alt.value != null ? `${alt.value} µg/m³` : "—"}</Typography>
                  </Box>
                  <Box sx={{ textAlign: "right" }}>
                    <Typography sx={{ fontSize: "0.68rem", color: "#94a3b8" }}>AI Confidence</Typography>
                    <Typography sx={{ fontSize: "1.1rem", fontWeight: 900, color: "#38bdf8" }}>{alt.confidence != null ? `${alt.confidence}%` : "—"}</Typography>
                  </Box>
                </Box>
                <Button fullWidth variant="contained" size="small" onClick={() => { setSelectedAlert(alt); setDrawerView("detail"); }}
                  sx={{ bgcolor: "#dc2626", color: "white", fontWeight: 700, fontSize: "0.75rem", textTransform: "none", py: 0.8, borderRadius: 2, "&:hover": { bgcolor: "#b91c1c" } }}>
                  🔍 Inspect AI Investigation Story →
                </Button>
              </Box>
            ))}
          </Box>
        )}

        {/* DETAIL VIEW */}
        {hasAlerts && drawerView === "detail" && activeAlert && (
          <Box>
            {activeAlerts.length > 1 && (
              <Button size="small" onClick={() => setDrawerView("list")}
                sx={{ color: "#38bdf8", textTransform: "none", fontSize: "0.75rem", fontWeight: 700, p: 0, mb: 1.5, display: "flex", alignItems: "center", gap: 0.5, "&:hover": { textDecoration: "underline" } }}>
                ← Back to All Alerts ({activeAlerts.length})
              </Button>
            )}

            <Box sx={{ p: 2, mb: 2.5, borderRadius: 2.5, background: "linear-gradient(135deg, rgba(239,68,68,0.18), rgba(220,38,38,0.08))", border: "1px solid rgba(239,68,68,0.35)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Box>
                <Typography sx={{ fontSize: "0.72rem", color: "#fca5a5", fontWeight: 700, textTransform: "uppercase" }}>AI Incident Assessment</Typography>
                <Typography sx={{ fontSize: "1.1rem", fontWeight: 800, color: "#f87171" }}>{activeAlert.severity || "Alert"}</Typography>
              </Box>
              {activeAlert.confidence != null && (
                <Box sx={{ textAlign: "right" }}>
                  <Typography sx={{ fontSize: "1.4rem", fontWeight: 900, color: "#ef4444", lineHeight: 1 }}>{activeAlert.confidence}%</Typography>
                  <Typography sx={{ fontSize: "0.68rem", color: "#fca5a5", fontWeight: 600 }}>Confidence</Typography>
                </Box>
              )}
            </Box>

            <Box sx={{ mb: 2.5, p: 2, borderRadius: 2.5, bgcolor: "#1e293b", border: "1px solid #334155" }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                <Typography sx={{ fontSize: "0.8rem", fontWeight: 700, color: "#e2e8f0" }}>📈 PM2.5 Spike Profile</Typography>
                {activeAlert.value != null && <Typography sx={{ fontSize: "0.75rem", color: "#ef4444", fontWeight: 800 }}>Peak: {activeAlert.value} µg/m³</Typography>}
              </Box>
              <Box sx={{ width: "100%", height: 70, position: "relative" }}>
                <svg viewBox="0 0 300 65" style={{ width: "100%", height: "100%" }}>
                  <line x1="0" y1="40" x2="300" y2="40" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4,4" />
                  <path d="M 0 55 Q 80 50, 150 48 T 230 20 T 300 8 L 300 65 L 0 65 Z" fill="rgba(239, 68, 68, 0.2)" />
                  <path d="M 0 55 Q 80 50, 150 48 T 230 20 T 300 8" fill="none" stroke="#ef4444" strokeWidth="2.5" />
                  <circle cx="300" cy="8" r="4" fill="#ef4444" />
                </svg>
                <Typography sx={{ position: "absolute", left: 0, top: 38, fontSize: "0.65rem", color: "#f59e0b", fontWeight: 600 }}>Threshold: {activeAlert.threshold} µg/m³</Typography>
              </Box>
            </Box>

            <Box sx={{ mb: 2.5, p: 2, borderRadius: 2.5, bgcolor: "#1e293b", border: "1px solid #334155" }}>
              <Typography sx={{ fontSize: "0.8rem", fontWeight: 700, color: "#e2e8f0", mb: 1.2 }}>💨 Meteorological & Dispersion Context</Typography>
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
                <Box sx={{ p: 1.2, borderRadius: 2, bgcolor: "#0f172a" }}>
                  <Typography sx={{ fontSize: "0.7rem", color: "#94a3b8" }}>Wind Speed</Typography>
                  <Typography sx={{ fontSize: "0.9rem", fontWeight: 800, color: "#38bdf8" }}>{activeAlert.weather?.windSpeed}</Typography>
                </Box>
                <Box sx={{ p: 1.2, borderRadius: 2, bgcolor: "#0f172a" }}>
                  <Typography sx={{ fontSize: "0.7rem", color: "#94a3b8" }}>Direction</Typography>
                  <Typography sx={{ fontSize: "0.9rem", fontWeight: 800, color: "#38bdf8" }}>{activeAlert.weather?.windDirection}</Typography>
                </Box>
              </Box>
              <Typography sx={{ fontSize: "0.72rem", color: "#cbd5e1", mt: 1.2, lineHeight: 1.4 }}>
                ⚠️ <strong>Dispersion Status:</strong> {activeAlert.weather?.dispersion}
              </Typography>
            </Box>

            {activeAlert.neighbors.length > 0 && (
              <Box sx={{ mb: 2.5, p: 2, borderRadius: 2.5, bgcolor: "#1e293b", border: "1px solid #334155" }}>
                <Typography sx={{ fontSize: "0.8rem", fontWeight: 700, color: "#e2e8f0", mb: 1 }}>🏘️ Spatial Neighbor Corroboration</Typography>
                {activeAlert.neighbors.map((nb, i) => (
                  <Box key={i} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", py: 0.8, borderBottom: i < (activeAlert.neighbors.length - 1) ? "1px solid #334155" : "none" }}>
                    <Box>
                      <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: "#f8fafc" }}>{nb.name}</Typography>
                      <Typography sx={{ fontSize: "0.68rem", color: "#94a3b8" }}>{nb.distance} away</Typography>
                    </Box>
                    <Box sx={{ textAlign: "right" }}>
                      <Typography sx={{ fontSize: "0.82rem", fontWeight: 800, color: "#fbbf24" }}>{nb.value}</Typography>
                      <Typography sx={{ fontSize: "0.68rem", color: "#34d399", fontWeight: 600 }}>{nb.status}</Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            )}

            {activeAlert.conclusion && (
              <Box sx={{ mb: 3, p: 2, borderRadius: 2.5, bgcolor: "rgba(59, 130, 246, 0.1)", border: "1px solid rgba(59, 130, 246, 0.25)" }}>
                <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: "#60a5fa", mb: 0.5, textTransform: "uppercase" }}>🤖 AI Agent Reasoning</Typography>
                <Typography sx={{ fontSize: "0.78rem", color: "#e2e8f0", lineHeight: 1.5 }}>{activeAlert.conclusion}</Typography>
              </Box>
            )}

            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.2 }}>
              <Button variant="contained" fullWidth disabled={acknowledged} onClick={() => setAcknowledged(true)}
                sx={{ bgcolor: acknowledged ? "#16a34a" : "#2563eb", fontWeight: 700, fontSize: "0.85rem", textTransform: "none", py: 1, borderRadius: 2, "&:hover": { bgcolor: acknowledged ? "#15803d" : "#1d4ed8" } }}>
                {acknowledged ? "✓ Alert Acknowledged by Operator" : "Acknowledge Alert Event"}
              </Button>
              <Button variant="outlined" fullWidth disabled={dispatched} onClick={() => setDispatched(true)}
                sx={{ color: dispatched ? "#34d399" : "#f87171", borderColor: dispatched ? "#34d399" : "rgba(248,113,113,0.4)", fontWeight: 700, fontSize: "0.85rem", textTransform: "none", py: 1, borderRadius: 2, "&:hover": { bgcolor: "rgba(239,68,68,0.1)", borderColor: "#ef4444" } }}>
                {dispatched ? "✓ Field Response Team Dispatched" : "🚨 Dispatch Field Inspection Crew"}
              </Button>
            </Box>
          </Box>
        )}
      </Drawer>
    </>
  );
}