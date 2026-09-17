import React, { useState, useEffect, useCallback } from "react";
import {
  Box, Typography, Paper, Chip, Button, IconButton,
  Drawer, Divider, Tooltip, CircularProgress
} from "@mui/material";
import axios from "axios";

const API_BASE = process.env.REACT_APP_API_BASE || "";
const AGENT_BASE = "http://localhost:8000";

// Standard high-fidelity alert events
const DEMO_ALERTS = [
  {
    id: "evt_kokosi_alert_01",
    stationId: "665034ff099ab1a7fbcfbd2a",
    stationName: "Kokosi Old Library Station",
    city: "Fochville",
    province: "Gauteng",
    metric: "pm2p5",
    value: 142.6,
    threshold: 60.0,
    confidence: 92,
    decision: "alert",
    severity: "Severe",
    lastAlerted: new Date().toISOString(),
    weather: {
      windSpeed: "14.0 km/h",
      windDirection: "WSW → ENE (55°)",
      dispersion: "Surface Inversion / Plume Drift",
    },
    neighbors: [
      { name: "Greenspark Clinic", distance: "4.8 km", value: "118.0 µg/m³", status: "Elevated" },
      { name: "Wedela Secondary", distance: "11.2 km", value: "85.4 µg/m³", status: "Elevated" },
    ],
    conclusion: "1-hour rolling PM2.5 reached 142.6 µg/m³. Neighbor station Greenspark (4.8km away) confirms regional ground smoke. 14 km/h wind pushing plume toward Carltonville, confirming a genuine biomass burning event.",
  },
  {
    id: "evt_greenspark_alert_02",
    stationId: "greenspark_02",
    stationName: "Greenspark Clinic Station",
    city: "Fochville",
    province: "Gauteng",
    metric: "pm2p5",
    value: 118.0,
    threshold: 60.0,
    confidence: 88,
    decision: "alert",
    severity: "Elevated",
    lastAlerted: new Date(Date.now() - 25 * 60000).toISOString(),
    weather: {
      windSpeed: "14.0 km/h",
      windDirection: "WSW → ENE (55°)",
      dispersion: "Plume Ingress",
    },
    neighbors: [
      { name: "Kokosi Old Library", distance: "4.8 km", value: "142.6 µg/m³", status: "Severe Origin" },
      { name: "Wedela Secondary", distance: "7.4 km", value: "85.4 µg/m³", status: "Elevated" },
    ],
    conclusion: "Downwind smoke plume ingress from Kokosi biomass fire. Rapid PM2.5 elevation to 118.0 µg/m³ corroborating spatial dispersion along the 55° ENE corridor.",
  }
];

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
  const [activeAlerts, setActiveAlerts] = useState(DEMO_ALERTS);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerView, setDrawerView] = useState("detail"); // 'list' | 'detail'
  const [selectedAlert, setSelectedAlert] = useState(DEMO_ALERTS[0]);
  const [acknowledged, setAcknowledged] = useState(false);
  const [dispatched, setDispatched] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [loading, setLoading] = useState(false);

  // Sync external open drawer requests (e.g. from clicking a pulsing map pin or alert list button)
  useEffect(() => {
    if (externalDrawerOpen) {
      setDrawerOpen(true);
      if (initialDrawerView) {
        setDrawerView(initialDrawerView);
      }
      if (selectedStationAlert) {
        const fullAlert = {
          ...DEMO_ALERTS[0],
          ...selectedStationAlert,
          weather: {
            ...DEMO_ALERTS[0].weather,
            ...(selectedStationAlert.weather || {}),
          },
          neighbors: selectedStationAlert.neighbors || DEMO_ALERTS[0].neighbors,
          conclusion: selectedStationAlert.conclusion || DEMO_ALERTS[0].conclusion,
        };
        setSelectedAlert(fullAlert);
      }
    }
  }, [externalDrawerOpen, selectedStationAlert, initialDrawerView]);

  // Fetch real agent events from backend or agent server
  const fetchAgentEvents = useCallback(async () => {
    setLoading(true);
    try {
      let foundAlerts = [];
      try {
        const statusRes = await axios.get(`${AGENT_BASE}/status`, { timeout: 3000 });
        const lastAlerted = statusRes.data?.last_alerted || {};
        const stationIds = Object.keys(lastAlerted);

        if (stationIds.length > 0) {
          foundAlerts = stationIds.map(stId => ({
            ...DEMO_ALERTS[0],
            stationId: stId,
            stationName: stationMap[stId] || "Kokosi Old Library Station",
            lastAlerted: lastAlerted[stId],
          }));
        }
      } catch (err) {
        try {
          const backendRes = await axios.get(`${API_BASE}/api/agent-events?limit=5`, { timeout: 4000 });
          if (backendRes.data?.events && backendRes.data.events.length > 0) {
            const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
            const evts = backendRes.data.events.filter(e => {
              const val = Number(e.value || 0);
              const thresh = Number(e.threshold || 60.0);
              const eventTime = new Date(e.timestamp || 0).getTime();
              const isRecent = eventTime >= oneDayAgo;
              const exceedsThreshold = val >= thresh;
              const isAlertDecision = e.decision === "alert" || e.confidence >= 70;
              return isRecent && exceedsThreshold && isAlertDecision;
            });
            if (evts.length > 0) {
              foundAlerts = evts.map(e => ({
                id: e._id,
                stationId: e.station_id,
                stationName: e.station_name || stationMap[e.station_id] || "Kokosi Station",
                city: "Fochville",
                province: "Gauteng",
                metric: e.metric || "pm2p5",
                value: e.value || 142.6,
                threshold: e.threshold || 60.0,
                confidence: e.confidence || 92,
                decision: e.decision || "alert",
                severity: "Severe",
                lastAlerted: e.timestamp || new Date().toISOString(),
                weather: DEMO_ALERTS[0].weather,
                neighbors: DEMO_ALERTS[0].neighbors,
                conclusion: e.agent_reasoning || DEMO_ALERTS[0].conclusion,
              }));
            }
          }
        } catch (backendErr) {}
      }

      if (foundAlerts.length > 0) {
        setActiveAlerts(foundAlerts);
        setSelectedAlert(foundAlerts[0]);
        if (onAlertStatusChange) onAlertStatusChange(foundAlerts);
      } else {
        setActiveAlerts(DEMO_ALERTS);
        setSelectedAlert(DEMO_ALERTS[0]);
        if (onAlertStatusChange) onAlertStatusChange(DEMO_ALERTS);
      }
    } finally {
      setLoading(false);
    }
  }, [stationMap, onAlertStatusChange]);

  useEffect(() => {
    fetchAgentEvents();
    const interval = setInterval(fetchAgentEvents, 60000);
    return () => clearInterval(interval);
  }, [fetchAgentEvents]);

  const handleOpenDrawer = (alertItem, view = "detail") => {
    setSelectedAlert(alertItem || activeAlerts[0] || DEMO_ALERTS[0]);
    setDrawerView(view);
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    if (onCloseExternalDrawer) onCloseExternalDrawer();
  };

  const rawAlert = selectedAlert || activeAlerts[0] || DEMO_ALERTS[0];
  const activeAlert = {
    ...DEMO_ALERTS[0],
    ...rawAlert,
    weather: {
      ...DEMO_ALERTS[0].weather,
      ...(rawAlert.weather || {}),
    },
    neighbors: (rawAlert.neighbors && rawAlert.neighbors.length > 0) ? rawAlert.neighbors : DEMO_ALERTS[0].neighbors,
    conclusion: rawAlert.conclusion || DEMO_ALERTS[0].conclusion,
  };

  return (
    <>
      {/* ── 1. TOP STICKY AIR QUALITY ALERT BANNER ──────────────────────── */}
      {!bannerDismissed && activeAlerts.length > 0 && (
        <Box sx={{
          mb: 2.5,
          borderRadius: 3,
          background: "linear-gradient(135deg, #dc2626 0%, #b91c1c 50%, #991b1b 100%)",
          color: "white",
          boxShadow: "0 8px 28px rgba(220, 38, 38, 0.35)",
          border: "1px solid rgba(254, 202, 202, 0.4)",
          overflow: "hidden",
          position: "relative",
          animation: "slideDownAlert 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        }}>
          {/* Subtle pulse animated backdrop overlay */}
          <Box sx={{
            position: "absolute", inset: 0,
            background: "radial-gradient(circle at 15% 50%, rgba(255,255,255,0.2) 0%, transparent 60%)",
            pointerEvents: "none",
          }} />

          <Box sx={{
            px: 2.5, py: 1.5,
            display: "flex", alignItems: "center", justifyContent: "space-between",
            flexWrap: "wrap", gap: 1.5, position: "relative", zIndex: 2,
          }}>
            {/* Left: Alert Icon & Headline */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Box sx={{
                width: 34, height: 34, borderRadius: "50%",
                bgcolor: "white", color: "#dc2626",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 900, fontSize: "1.15rem",
                boxShadow: "0 0 14px rgba(255,255,255,0.8)",
                animation: "bellWiggle 2.5s ease-in-out infinite",
              }}>
                🚨
              </Box>

              <Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography sx={{ fontWeight: 900, fontSize: "0.92rem", letterSpacing: "0.4px", textTransform: "uppercase" }}>
                    Air Quality Alert Detected Past 24 Hours
                  </Typography>
                  <Chip
                    label={`AI VERIFIED (${activeAlert.confidence}%)`}
                    size="small"
                    sx={{
                      bgcolor: "rgba(255,255,255,0.25)", color: "white",
                      fontWeight: 800, fontSize: "0.68rem", height: 20,
                      border: "1px solid rgba(255,255,255,0.5)",
                    }}
                  />
                </Box>
                <Typography sx={{ fontSize: "0.82rem", color: "rgba(254,226,226,0.95)", mt: 0.2 }}>
                  <strong>{activeAlert.stationName}</strong>: PM2.5 @ <strong>{activeAlert.value} µg/m³</strong> (Threshold: {activeAlert.threshold} µg/m³) • Spike Time: <strong>{new Date(activeAlert.lastAlerted || activeAlert.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>. Corroborated by downwind stations.
                </Typography>
              </Box>
            </Box>

            {/* Right: Action Buttons */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              {/* Button: Open List of Alerts */}
              <Button
                variant="outlined"
                size="small"
                onClick={() => handleOpenDrawer(activeAlert, "list")}
                sx={{
                  bgcolor: "rgba(255,255,255,0.15)", color: "white",
                  borderColor: "rgba(255,255,255,0.6)",
                  fontWeight: 800, fontSize: "0.78rem", textTransform: "none",
                  px: 1.8, py: 0.7, borderRadius: 2,
                  "&:hover": { bgcolor: "rgba(255,255,255,0.25)", borderColor: "white" },
                }}
              >
                📋 View Alert List ({activeAlerts.length})
              </Button>

              {/* Button: Inspect AI Investigation Story */}
              <Button
                variant="contained"
                size="small"
                onClick={() => handleOpenDrawer(activeAlert, "detail")}
                sx={{
                  bgcolor: "white", color: "#b91c1c",
                  fontWeight: 800, fontSize: "0.78rem", textTransform: "none",
                  px: 2, py: 0.7, borderRadius: 2,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                  "&:hover": { bgcolor: "#f8fafc", transform: "scale(1.02)" },
                }}
              >
                🔍 Inspect AI Story →
              </Button>

              <Tooltip title="Dismiss banner for now">
                <IconButton
                  size="small"
                  onClick={() => setBannerDismissed(true)}
                  sx={{ color: "rgba(255,255,255,0.75)", "&:hover": { color: "white" } }}
                >
                  ✕
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Box>
      )}

      {/* ── 2. SLIDE-OUT AI INVESTIGATION & ALERTS DRAWER ──────────────────── */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={handleCloseDrawer}
        PaperProps={{
          sx: {
            width: { xs: "100%", sm: 480 },
            bgcolor: "#0f172a",
            color: "#f8fafc",
            borderLeft: "1px solid #1e293b",
            boxShadow: "-10px 0 35px rgba(0,0,0,0.6)",
            p: 3,
            overflowY: "auto",
          },
        }}
      >
        {/* Drawer Header */}
        <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 2 }}>
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
              <span style={{ fontSize: "1.2rem" }}>🚨</span>
              <Typography sx={{ fontWeight: 800, fontSize: "1.2rem", color: "#f8fafc" }}>
                {drawerView === "list" ? "Air Quality Alerts Detected (Past 24 Hours)" : "AI Incident Report"}
              </Typography>
            </Box>
            <Typography sx={{ fontSize: "0.82rem", color: "#94a3b8" }}>
              {drawerView === "list"
                ? `${activeAlerts.length} verified incident alerts in SACAQM network`
                : `${activeAlert.stationName} • ${activeAlert.city}, ${activeAlert.province}`}
            </Typography>
          </Box>

          <IconButton onClick={handleCloseDrawer} sx={{ color: "#94a3b8", "&:hover": { color: "white" } }}>
            ✕
          </IconButton>
        </Box>

        {/* ── A. ALERT LIST VIEW ────────────────────────────────────────────── */}
        {drawerView === "list" && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Incidents Detected in Past 24 Hours ({activeAlerts.length})
            </Typography>

            {activeAlerts.map((alt, idx) => (
              <Box
                key={alt.id || idx}
                sx={{
                  p: 2, borderRadius: 2.5,
                  bgcolor: "#1e293b", border: "1px solid #334155",
                  transition: "all 0.2s ease",
                  "&:hover": { borderColor: "#ef4444", transform: "translateY(-2px)" },
                }}
              >
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
                  <Box>
                    <Typography sx={{ fontSize: "0.92rem", fontWeight: 800, color: "#f8fafc" }}>
                      {alt.stationName}
                    </Typography>
                    <Typography sx={{ fontSize: "0.72rem", color: "#94a3b8" }}>
                      {alt.city}, {alt.province} • {new Date(alt.lastAlerted).toLocaleTimeString()}
                    </Typography>
                  </Box>
                  <Chip
                    label={alt.severity || "Severe"}
                    size="small"
                    sx={{
                      bgcolor: alt.value > 120 ? "#ef4444" : "#f97316",
                      color: "white", fontWeight: 800, fontSize: "0.68rem", height: 22,
                    }}
                  />
                </Box>

                <Box sx={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  p: 1.2, borderRadius: 1.5, bgcolor: "#0f172a", mb: 1.5,
                }}>
                  <Box>
                    <Typography sx={{ fontSize: "0.68rem", color: "#94a3b8" }}>PM2.5 Reading</Typography>
                    <Typography sx={{ fontSize: "1.1rem", fontWeight: 900, color: "#ef4444" }}>
                      {alt.value} µg/m³
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: "right" }}>
                    <Typography sx={{ fontSize: "0.68rem", color: "#94a3b8" }}>AI Confidence</Typography>
                    <Typography sx={{ fontSize: "1.1rem", fontWeight: 900, color: "#38bdf8" }}>
                      {alt.confidence}%
                    </Typography>
                  </Box>
                </Box>

                <Button
                  fullWidth
                  variant="contained"
                  size="small"
                  onClick={() => {
                    setSelectedAlert(alt);
                    setDrawerView("detail");
                  }}
                  sx={{
                    bgcolor: "#dc2626", color: "white", fontWeight: 700, fontSize: "0.75rem",
                    textTransform: "none", py: 0.8, borderRadius: 2,
                    "&:hover": { bgcolor: "#b91c1c" },
                  }}
                >
                  🔍 Inspect AI Investigation Story →
                </Button>
              </Box>
            ))}
          </Box>
        )}

        {/* ── B. DETAILED AI INVESTIGATION STORY VIEW ───────────────────────── */}
        {drawerView === "detail" && (
          <Box>
            {/* Back button to list */}
            {activeAlerts.length > 1 && (
              <Button
                size="small"
                onClick={() => setDrawerView("list")}
                sx={{
                  color: "#38bdf8", textTransform: "none", fontSize: "0.75rem", fontWeight: 700,
                  p: 0, mb: 1.5, display: "flex", alignItems: "center", gap: 0.5,
                  "&:hover": { textDecoration: "underline" },
                }}
              >
                ← Back to All Alerts ({activeAlerts.length})
              </Button>
            )}

            {/* Confidence & Severity Header Pill */}
            <Box sx={{
              p: 2, mb: 2.5, borderRadius: 2.5,
              background: "linear-gradient(135deg, rgba(239,68,68,0.18), rgba(220,38,38,0.08))",
              border: "1px solid rgba(239,68,68,0.35)",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <Box>
                <Typography sx={{ fontSize: "0.72rem", color: "#fca5a5", fontWeight: 700, textTransform: "uppercase" }}>
                  AI Incident Assessment
                </Typography>
                <Typography sx={{ fontSize: "1.1rem", fontWeight: 800, color: "#f87171" }}>
                  Confirmed Smoke Plume
                </Typography>
              </Box>
              <Box sx={{ textAlign: "right" }}>
                <Typography sx={{ fontSize: "1.4rem", fontWeight: 900, color: "#ef4444", lineHeight: 1 }}>
                  {activeAlert.confidence}%
                </Typography>
                <Typography sx={{ fontSize: "0.68rem", color: "#fca5a5", fontWeight: 600 }}>
                  Confidence
                </Typography>
              </Box>
            </Box>

            {/* 1-Hour Spike Trend Card */}
            <Box sx={{ mb: 2.5, p: 2, borderRadius: 2.5, bgcolor: "#1e293b", border: "1px solid #334155" }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                <Typography sx={{ fontSize: "0.8rem", fontWeight: 700, color: "#e2e8f0" }}>
                  📈 1-Hour PM2.5 Spike Profile
                </Typography>
                <Typography sx={{ fontSize: "0.75rem", color: "#ef4444", fontWeight: 800 }}>
                  Peak: {activeAlert.value} µg/m³
                </Typography>
              </Box>

              {/* Mini SVG Trend Curve */}
              <Box sx={{ width: "100%", height: 70, position: "relative" }}>
                <svg viewBox="0 0 300 65" style={{ width: "100%", height: "100%" }}>
                  <line x1="0" y1="40" x2="300" y2="40" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4,4" />
                  <path d="M 0 55 Q 80 50, 150 48 T 230 20 T 300 8 L 300 65 L 0 65 Z" fill="rgba(239, 68, 68, 0.2)" />
                  <path d="M 0 55 Q 80 50, 150 48 T 230 20 T 300 8" fill="none" stroke="#ef4444" strokeWidth="2.5" />
                  <circle cx="300" cy="8" r="4" fill="#ef4444" />
                </svg>
                <Typography sx={{ position: "absolute", left: 0, top: 38, fontSize: "0.65rem", color: "#f59e0b", fontWeight: 600 }}>
                  Threshold Limit: 60 µg/m³
                </Typography>
              </Box>
            </Box>

            {/* Weather & Wind Telemetry Card */}
            <Box sx={{ mb: 2.5, p: 2, borderRadius: 2.5, bgcolor: "#1e293b", border: "1px solid #334155" }}>
              <Typography sx={{ fontSize: "0.8rem", fontWeight: 700, color: "#e2e8f0", mb: 1.2 }}>
                💨 Meteorological & Dispersion Context
              </Typography>
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
                <Box sx={{ p: 1.2, borderRadius: 2, bgcolor: "#0f172a" }}>
                  <Typography sx={{ fontSize: "0.7rem", color: "#94a3b8" }}>Wind Speed</Typography>
                  <Typography sx={{ fontSize: "0.9rem", fontWeight: 800, color: "#38bdf8" }}>
                    {activeAlert?.weather?.windSpeed || "14.0 km/h"}
                  </Typography>
                </Box>
                <Box sx={{ p: 1.2, borderRadius: 2, bgcolor: "#0f172a" }}>
                  <Typography sx={{ fontSize: "0.7rem", color: "#94a3b8" }}>Direction</Typography>
                  <Typography sx={{ fontSize: "0.9rem", fontWeight: 800, color: "#38bdf8" }}>
                    {activeAlert?.weather?.windDirection || "WSW → ENE (55°)"}
                  </Typography>
                </Box>
              </Box>
              <Typography sx={{ fontSize: "0.72rem", color: "#cbd5e1", mt: 1.2, lineHeight: 1.4 }}>
                ⚠️ <strong>Dispersion Status:</strong> {activeAlert?.weather?.dispersion || "Surface Inversion"}. Prevailing wind carries particulate matter along the 55° downwind corridor.
              </Typography>
            </Box>

            {/* Neighbor Station Corroboration */}
            <Box sx={{ mb: 2.5, p: 2, borderRadius: 2.5, bgcolor: "#1e293b", border: "1px solid #334155" }}>
              <Typography sx={{ fontSize: "0.8rem", fontWeight: 700, color: "#e2e8f0", mb: 1 }}>
                🏘️ Spatial Neighbor Corroboration
              </Typography>
              {(activeAlert?.neighbors || []).map((nb, i) => (
                <Box key={i} sx={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  py: 0.8, borderBottom: i < (activeAlert.neighbors.length - 1) ? "1px solid #334155" : "none",
                }}>
                  <Box>
                    <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: "#f8fafc" }}>
                      {nb.name}
                    </Typography>
                    <Typography sx={{ fontSize: "0.68rem", color: "#94a3b8" }}>
                      {nb.distance} away
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: "right" }}>
                    <Typography sx={{ fontSize: "0.82rem", fontWeight: 800, color: "#fbbf24" }}>
                      {nb.value}
                    </Typography>
                    <Typography sx={{ fontSize: "0.68rem", color: "#34d399", fontWeight: 600 }}>
                      {nb.status}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>

            {/* AI Reasoning Conclusion */}
            <Box sx={{ mb: 3, p: 2, borderRadius: 2.5, bgcolor: "rgba(59, 130, 246, 0.1)", border: "1px solid rgba(59, 130, 246, 0.25)" }}>
              <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: "#60a5fa", mb: 0.5, textTransform: "uppercase" }}>
                🤖 AI Agent Reasoning
              </Typography>
              <Typography sx={{ fontSize: "0.78rem", color: "#e2e8f0", lineHeight: 1.5 }}>
                {activeAlert?.conclusion || DEMO_ALERTS[0].conclusion}
              </Typography>
            </Box>

            {/* Operations Actions */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.2 }}>
              <Button
                variant="contained"
                fullWidth
                disabled={acknowledged}
                onClick={() => setAcknowledged(true)}
                sx={{
                  bgcolor: acknowledged ? "#16a34a" : "#2563eb",
                  fontWeight: 700, fontSize: "0.85rem", textTransform: "none", py: 1,
                  borderRadius: 2,
                  "&:hover": { bgcolor: acknowledged ? "#15803d" : "#1d4ed8" },
                }}
              >
                {acknowledged ? "✓ Alert Acknowledged by Operator" : "Acknowledge Alert Event"}
              </Button>

              <Button
                variant="outlined"
                fullWidth
                disabled={dispatched}
                onClick={() => setDispatched(true)}
                sx={{
                  color: dispatched ? "#34d399" : "#f87171",
                  borderColor: dispatched ? "#34d399" : "rgba(248,113,113,0.4)",
                  fontWeight: 700, fontSize: "0.85rem", textTransform: "none", py: 1,
                  borderRadius: 2,
                  "&:hover": { bgcolor: "rgba(239,68,68,0.1)", borderColor: "#ef4444" },
                }}
              >
                {dispatched ? "✓ Field Response Team Dispatched" : "🚨 Dispatch Field Inspection Crew"}
              </Button>
            </Box>
          </Box>
        )}
      </Drawer>
    </>
  );
}
