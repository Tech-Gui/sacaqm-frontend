import React, { useState, useEffect, useCallback } from "react";
import {
  Box, Typography, Paper, Chip, Collapse,
  Tooltip, CircularProgress, Button, IconButton,
} from "@mui/material";
import axios from "axios";

// Direct CERN AI Agent URL — the only live service with alert state
// const AGENT_BASE = "https://ai-agent-deploy-ai-agent.app.cern.ch";
const AGENT_BASE = "http://localhost:8000";

function relativeTime(isoStr) {
  const diff = Date.now() - new Date(isoStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

/* ─── keyframe styles (injected once) ─────────────────────────────────────── */
const keyframes = `
@keyframes neuralPulse {
  0%, 100% { opacity: 0.4; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.15); }
}
@keyframes scanLine {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(200%); }
}
@keyframes alertGlow {
  0%, 100% { box-shadow: 0 0 8px rgba(239,68,68,0.15); }
  50% { box-shadow: 0 0 20px rgba(239,68,68,0.35); }
}
@keyframes dotPulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.8); opacity: 0.3; }
}
@keyframes fadeSlideIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes borderGlow {
  0%, 100% { border-color: rgba(99,102,241,0.25); }
  50% { border-color: rgba(99,102,241,0.6); }
}
`;

// ── Alert Card ─────────────────────────────────────────────────────────────────
function AlertCard({ event, onDismiss, stationMap, index }) {
  const [expanded, setExpanded] = useState(false);
  const isAlert = event.isAlert;

  const stationName = stationMap?.[event.stationId] || event.stationId.slice(-8);

  return (
    <Box
      onClick={() => setExpanded(p => !p)}
      sx={{
        position: "relative",
        borderRadius: 3,
        overflow: "hidden",
        cursor: "pointer",
        mb: 1.5,
        border: isAlert
          ? "1px solid rgba(239,68,68,0.25)"
          : "1px solid rgba(148,163,184,0.15)",
        background: isAlert
          ? "linear-gradient(135deg, rgba(239,68,68,0.04) 0%, rgba(249,115,22,0.03) 100%)"
          : "linear-gradient(135deg, rgba(255,255,255,0.6) 0%, rgba(241,245,249,0.4) 100%)",
        backdropFilter: "blur(8px)",
        transition: "all 0.25s cubic-bezier(0.4,0,0.2,1)",
        animation: `fadeSlideIn 0.35s ease-out ${index * 0.06}s backwards, ${isAlert ? "alertGlow 2.5s ease-in-out infinite" : "none"}`,
        "&:hover": {
          transform: "translateY(-1px)",
          boxShadow: isAlert
            ? "0 8px 25px rgba(239,68,68,0.12)"
            : "0 6px 20px rgba(0,0,0,0.06)",
          borderColor: isAlert ? "rgba(239,68,68,0.4)" : "rgba(99,102,241,0.3)",
        },
      }}
    >
      {/* Top accent line */}
      {isAlert && (
        <Box sx={{
          position: "absolute", top: 0, left: 0, right: 0, height: "2px",
          background: "linear-gradient(90deg, #ef4444, #f97316, #ef4444)",
          backgroundSize: "200% 100%",
          animation: "scanLine 3s linear infinite",
        }} />
      )}

      <Box sx={{ p: 2, display: "flex", alignItems: "center", gap: 1.5 }}>
        {/* Status indicator */}
        <Box sx={{ position: "relative", width: 12, height: 12, flexShrink: 0 }}>
          {isAlert && (
            <Box sx={{
              position: "absolute", inset: -3, borderRadius: "50%",
              bgcolor: "rgba(239,68,68,0.2)",
              animation: "dotPulse 1.8s ease-in-out infinite",
            }} />
          )}
          <Box sx={{
            position: "absolute", inset: 0, borderRadius: "50%",
            bgcolor: isAlert ? "#ef4444" : "#10b981",
            boxShadow: isAlert
              ? "0 0 8px rgba(239,68,68,0.5)"
              : "0 0 6px rgba(16,185,129,0.4)",
          }} />
        </Box>

        {/* Station name and status */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.3 }}>
            <Typography sx={{
              fontSize: "0.85rem", fontWeight: 700,
              color: isAlert ? "#dc2626" : "#1e293b",
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}>
              {stationName}
            </Typography>
            <Chip
              label={isAlert ? "ALERTED" : "MONITORING"}
              size="small"
              sx={{
                height: 18, fontSize: "0.6rem", fontWeight: 800, letterSpacing: "0.5px",
                bgcolor: isAlert ? "rgba(239,68,68,0.1)" : "rgba(16,185,129,0.1)",
                color: isAlert ? "#dc2626" : "#059669",
                border: `1px solid ${isAlert ? "rgba(239,68,68,0.2)" : "rgba(16,185,129,0.2)"}`,
                "& .MuiChip-label": { px: 1 },
              }}
            />
          </Box>
          <Typography sx={{ fontSize: "0.72rem", color: "#94a3b8", lineHeight: 1.3 }}>
            PM2.5 threshold: <strong style={{ color: "#64748b" }}>{event.threshold} µg/m³</strong>
          </Typography>
        </Box>

        {/* Time */}
        <Box sx={{ textAlign: "right", flexShrink: 0 }}>
          {event.lastAlerted && (
            <Typography sx={{
              fontSize: "0.68rem", color: isAlert ? "#f87171" : "#94a3b8",
              fontWeight: 600, whiteSpace: "nowrap",
            }}>
              {relativeTime(event.lastAlerted)}
            </Typography>
          )}
        </Box>

        {/* Expand arrow */}
        <Box sx={{
          width: 22, height: 22, borderRadius: "50%",
          display: "flex", alignItems: "center", justifyContent: "center",
          bgcolor: "rgba(0,0,0,0.03)",
          transition: "transform 0.2s",
          transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
          flexShrink: 0,
        }}>
          <Typography sx={{ fontSize: "0.55rem", color: "#94a3b8", lineHeight: 1 }}>▼</Typography>
        </Box>

        {/* Dismiss */}
        <IconButton
          size="small"
          onClick={e => { e.stopPropagation(); onDismiss(event._key); }}
          sx={{
            width: 20, height: 20, flexShrink: 0,
            color: "#cbd5e1", "&:hover": { color: "#ef4444", bgcolor: "rgba(239,68,68,0.06)" },
          }}
        >
          <span style={{ fontSize: "0.6rem" }}>✕</span>
        </IconButton>
      </Box>

      {/* Expanded details */}
      <Collapse in={expanded}>
        <Box sx={{
          mx: 2, mb: 2, p: 2, borderRadius: 2.5,
          bgcolor: isAlert ? "rgba(239,68,68,0.03)" : "rgba(99,102,241,0.03)",
          border: `1px solid ${isAlert ? "rgba(239,68,68,0.1)" : "rgba(99,102,241,0.1)"}`,
        }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, mb: 1.2 }}>
            <Box sx={{
              width: 20, height: 20, borderRadius: 1.5,
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Typography sx={{ fontSize: "0.6rem", color: "white" }}>🤖</Typography>
            </Box>
            <Typography sx={{
              fontSize: "0.7rem", fontWeight: 800, color: "#6366f1",
              textTransform: "uppercase", letterSpacing: "0.8px",
            }}>
              Agent Investigation
            </Typography>
          </Box>

          <Typography sx={{ fontSize: "0.78rem", color: "#475569", lineHeight: 1.7 }}>
            {isAlert
              ? <>
                  <strong>{stationName}</strong> was last alerted at{" "}
                  <Box component="span" sx={{ color: "#dc2626", fontWeight: 600 }}>
                    {new Date(event.lastAlerted).toLocaleString()}
                  </Box>.
                  PM2.5 exceeded the <strong>{event.threshold} µg/m³</strong> rolling 1-hour threshold.
                  The AI agent investigated using weather data, neighboring stations, and sensor history
                  before confirming this alert.
                </>
              : <>
                  <strong>{stationName}</strong> is being actively monitored.
                  No PM2.5 threshold breaches detected. Current threshold:{" "}
                  <strong>{event.threshold} µg/m³</strong>. The agent checks every 15 minutes.
                </>
            }
          </Typography>

          {isAlert && (
            <Box sx={{
              mt: 1.5, pt: 1.5, borderTop: "1px dashed rgba(0,0,0,0.06)",
              display: "flex", gap: 2, flexWrap: "wrap",
            }}>
              {[
                { label: "Type", value: "Rolling 1h Avg", icon: "📊" },
                { label: "Metric", value: "PM2.5", icon: "🌫️" },
                { label: "Limit", value: `${event.threshold} µg/m³`, icon: "⚡" },
              ].map(item => (
                <Box key={item.label} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <Typography sx={{ fontSize: "0.65rem" }}>{item.icon}</Typography>
                  <Typography sx={{ fontSize: "0.68rem", color: "#94a3b8" }}>{item.label}:</Typography>
                  <Typography sx={{ fontSize: "0.68rem", color: "#334155", fontWeight: 600 }}>{item.value}</Typography>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </Collapse>
    </Box>
  );
}

// ── Main AlertsPanel ───────────────────────────────────────────────────────────
export default function AlertsPanel({ sensorId, sensorLabel, stationMap = {} }) {
  const [allEvents, setAllEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [agentOnline, setAgentOnline] = useState(null);
  const [open, setOpen] = useState(true);
  const [schedulerOk, setSchedulerOk] = useState(null);
  const [dismissed, setDismissed] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem("dismissed_alerts") || "{}"); }
    catch { return {}; }
  });

  const withKey = (events) =>
    events.map((e, i) => ({ ...e, _key: `${e.stationId}_${i}` }));

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch both status and thresholds in parallel from the CERN agent
      const [statusRes, threshRes] = await Promise.all([
        axios.get(`${AGENT_BASE}/status`, { timeout: 15000 }),
        axios.get(`${AGENT_BASE}/thresholds`, { timeout: 15000 }),
      ]);

      const status = statusRes.data;
      const thresholds = threshRes.data;
      const pm25Thr = thresholds?.rolling_1h_threshold?.pm2p5 ?? 60;
      const dailyThr = thresholds?.daily_outlier_threshold ?? 40;

      setAgentOnline(true);
      setSchedulerOk(status.scheduler_running === true);

      const lastAlerted = status.last_alerted || {};
      const dailyAlerted = status.daily_alerted || {};

      // Build one row per station that has been alerted
      const alertedIds = new Set([
        ...Object.keys(lastAlerted),
        ...Object.keys(dailyAlerted),
      ]);

      const events = Array.from(alertedIds).map(stationId => ({
        stationId,
        isAlert: true,
        lastAlerted: lastAlerted[stationId] || dailyAlerted[stationId] || null,
        threshold: pm25Thr,
        dailyOutlierThreshold: dailyThr,
      }));

      // If the current sensor is NOT in the alerted list, add a "monitoring" row for it
      // so the user always sees their selected sensor in the panel
      if (sensorId && !alertedIds.has(sensorId)) {
        events.push({
          stationId: sensorId,
          isAlert: false,
          lastAlerted: null,
          threshold: pm25Thr,
          dailyOutlierThreshold: dailyThr,
        });
      }

      setAllEvents(withKey(events));
    } catch (err) {
      console.error("[AlertsPanel] fetch error:", err.code, err.message, err.response?.status);
      if (err.code === "ERR_NETWORK" || err.code === "ECONNREFUSED" || err.code === "ERR_EMPTY_RESPONSE") {
        setAgentOnline(false);
      } else {
        setAgentOnline(true);
        setAllEvents([]);
      }
    } finally {
      setLoading(false);
    }
  }, [sensorId]);

  // Fetch on mount and whenever sensorId changes; also poll every 5 minutes
  useEffect(() => {
    fetchAlerts();
    const iv = setInterval(fetchAlerts, 5 * 60 * 1000);
    return () => clearInterval(iv);
  }, [fetchAlerts]);

  const dismiss = (key) => {
    const next = { ...dismissed, [key]: true };
    setDismissed(next);
    try { sessionStorage.setItem("dismissed_alerts", JSON.stringify(next)); } catch { }
  };

  const dismissAllVisible = () => {
    const next = { ...dismissed };
    visible.forEach(e => { next[e._key] = true; });
    setDismissed(next);
    try { sessionStorage.setItem("dismissed_alerts", JSON.stringify(next)); } catch { }
  };

  // ── Offline state ──────────────────────────────────────────────────────────
  if (agentOnline === false) {
    return (
      <>
        <style>{keyframes}</style>
        <Paper sx={{
          mb: 3, borderRadius: 4, overflow: "hidden",
          background: "linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(241,245,249,0.6) 100%)",
          backdropFilter: "blur(20px) saturate(180%)",
          border: "1px solid rgba(148,163,184,0.2)",
          boxShadow: "0 4px 24px rgba(0,0,0,0.04)",
        }}>
          <Box sx={{
            px: 2.5, py: 2,
            background: "linear-gradient(135deg, rgba(241,245,249,0.9) 0%, rgba(226,232,240,0.7) 100%)",
            borderBottom: "1px solid rgba(148,163,184,0.15)",
            display: "flex", alignItems: "center", gap: 1.5,
          }}>
            <Box sx={{
              width: 28, height: 28, borderRadius: 2,
              background: "linear-gradient(135deg, #94a3b8, #64748b)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Typography sx={{ fontSize: "0.85rem" }}>🤖</Typography>
            </Box>
            <Typography sx={{ fontWeight: 800, fontSize: "0.9rem", color: "#475569", letterSpacing: "0.3px" }}>
              AI Agent
            </Typography>
            <Chip
              label="OFFLINE"
              size="small"
              sx={{
                height: 20, fontSize: "0.6rem", fontWeight: 800, letterSpacing: "1px",
                bgcolor: "rgba(148,163,184,0.15)", color: "#64748b",
                border: "1px solid rgba(148,163,184,0.3)",
              }}
            />
            <Box sx={{ flex: 1 }} />
            <Button
              size="small"
              onClick={fetchAlerts}
              sx={{
                minWidth: 0, px: 2, py: 0.5, fontSize: "0.7rem",
                color: "#6366f1", fontWeight: 700, textTransform: "none", borderRadius: 2,
                border: "1px solid rgba(99,102,241,0.25)",
                "&:hover": { bgcolor: "rgba(99,102,241,0.06)" },
              }}
            >
              ↻ Retry
            </Button>
          </Box>
        </Paper>
      </>
    );
  }

  const undismissed = allEvents.filter(e => !dismissed[e._key]);
  const realAlerts = undismissed.filter(e => e.isAlert);
  const visible = undismissed; // show all rows (alert + monitoring)
  const alertCount = realAlerts.length;
  const hasAlerts = alertCount > 0;

  return (
    <>
      <style>{keyframes}</style>
      <Paper
        sx={{
          mb: 3, borderRadius: 4, overflow: "hidden",
          background: "linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(241,245,249,0.6) 100%)",
          backdropFilter: "blur(24px) saturate(180%)",
          border: hasAlerts
            ? "1px solid rgba(239,68,68,0.2)"
            : "1px solid rgba(99,102,241,0.12)",
          boxShadow: hasAlerts
            ? "0 8px 40px rgba(239,68,68,0.08), 0 2px 8px rgba(0,0,0,0.04)"
            : "0 8px 40px rgba(99,102,241,0.06), 0 2px 8px rgba(0,0,0,0.03)",
          transition: "all 0.3s ease",
        }}
      >
        {/* ── Dark header ── */}
        <Box
          onClick={() => setOpen(p => !p)}
          sx={{
            px: 2.5, py: 1.8,
            background: hasAlerts
              ? "linear-gradient(135deg, rgba(254,226,226,0.5) 0%, rgba(255,237,213,0.3) 50%, rgba(241,245,249,0.8) 100%)"
              : "linear-gradient(135deg, rgba(241,245,249,0.9) 0%, rgba(224,231,255,0.5) 50%, rgba(241,245,249,0.9) 100%)",
            borderBottom: "1px solid rgba(0,0,0,0.04)",
            display: "flex", alignItems: "center", gap: 1.5,
            cursor: "pointer", userSelect: "none",
            position: "relative", overflow: "hidden",
            "&:hover": { "& .header-glow": { opacity: 0.12 } },
          }}
        >
          {/* Ambient glow on hover */}
          <Box className="header-glow" sx={{
            position: "absolute", inset: 0, opacity: 0,
            background: hasAlerts
              ? "radial-gradient(circle at 30% 50%, rgba(239,68,68,0.12), transparent 70%)"
              : "radial-gradient(circle at 30% 50%, rgba(99,102,241,0.12), transparent 70%)",
            transition: "opacity 0.3s",
          }} />

          {/* AI Icon with pulse */}
          <Box sx={{ position: "relative", zIndex: 1 }}>
            <Box sx={{
              width: 32, height: 32, borderRadius: 2.5,
              background: hasAlerts
                ? "linear-gradient(135deg, #ef4444, #f97316)"
                : "linear-gradient(135deg, #6366f1, #8b5cf6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: hasAlerts
                ? "0 0 12px rgba(239,68,68,0.3)"
                : "0 0 12px rgba(99,102,241,0.25)",
            }}>
              <Typography sx={{ fontSize: "1rem", lineHeight: 1 }}>🤖</Typography>
            </Box>
            {hasAlerts && (
              <Box sx={{
                position: "absolute", top: -2, right: -2,
                width: 10, height: 10, borderRadius: "50%",
                bgcolor: "#ef4444", border: "2px solid white",
                animation: "dotPulse 1.5s ease-in-out infinite",
              }} />
            )}
          </Box>

          {/* Title block */}
          <Box sx={{ flex: 1, zIndex: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography sx={{
                fontWeight: 800, fontSize: "0.95rem", color: "#1e293b",
                letterSpacing: "0.2px",
              }}>
                AI Agent Monitor
              </Typography>

              {/* Alert count or all-clear badge */}
              {agentOnline === true && (
                hasAlerts ? (
                  <Chip
                    label={`${alertCount} ALERT${alertCount > 1 ? "S" : ""}`}
                    size="small"
                    sx={{
                      height: 20, fontSize: "0.6rem", fontWeight: 800, letterSpacing: "0.8px",
                      bgcolor: "rgba(239,68,68,0.1)", color: "#dc2626",
                      border: "1px solid rgba(239,68,68,0.25)",
                      animation: "borderGlow 2s ease-in-out infinite",
                      "& .MuiChip-label": { px: 1 },
                    }}
                  />
                ) : (
                  <Chip
                    label="ALL CLEAR"
                    size="small"
                    sx={{
                      height: 20, fontSize: "0.6rem", fontWeight: 800, letterSpacing: "0.8px",
                      bgcolor: "rgba(16,185,129,0.1)", color: "#059669",
                      border: "1px solid rgba(16,185,129,0.2)",
                      "& .MuiChip-label": { px: 1 },
                    }}
                  />
                )
              )}
            </Box>

            {/* Subtitle with scheduler status */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.3 }}>
              <Typography sx={{ fontSize: "0.68rem", color: "#94a3b8", fontWeight: 500 }}>
                Real-time environmental monitoring
              </Typography>
              {schedulerOk !== null && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.4 }}>
                  <Box sx={{
                    width: 5, height: 5, borderRadius: "50%",
                    bgcolor: schedulerOk ? "#10b981" : "#ef4444",
                    boxShadow: schedulerOk ? "0 0 4px rgba(16,185,129,0.5)" : "0 0 4px rgba(239,68,68,0.5)",
                  }} />
                  <Typography sx={{ fontSize: "0.6rem", color: schedulerOk ? "#059669" : "#dc2626", fontWeight: 600 }}>
                    {schedulerOk ? "Scheduler active" : "Scheduler stopped"}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>

          {/* Actions */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, zIndex: 1 }}>
            {!loading ? (
              <Tooltip title="Refresh alerts">
                <IconButton
                  size="small"
                  onClick={e => { e.stopPropagation(); fetchAlerts(); }}
                  sx={{
                    width: 30, height: 30, borderRadius: 2,
                    color: "#94a3b8", border: "1px solid rgba(0,0,0,0.06)",
                    "&:hover": { bgcolor: "rgba(99,102,241,0.06)", color: "#6366f1" },
                  }}
                >
                  <span style={{ fontSize: "0.8rem" }}>↻</span>
                </IconButton>
              </Tooltip>
            ) : (
              <CircularProgress size={16} sx={{ color: "#818cf8", mx: 0.5 }} />
            )}

            {visible.length > 0 && (
              <Tooltip title="Dismiss all">
                <IconButton
                  size="small"
                  onClick={e => { e.stopPropagation(); dismissAllVisible(); }}
                  sx={{
                    width: 30, height: 30, borderRadius: 2,
                    color: "#94a3b8", border: "1px solid rgba(0,0,0,0.06)",
                    "&:hover": { bgcolor: "rgba(239,68,68,0.06)", color: "#ef4444" },
                  }}
                >
                  <span style={{ fontSize: "0.65rem" }}>✕</span>
                </IconButton>
              </Tooltip>
            )}

            {/* Chevron */}
            <Box sx={{
              width: 24, height: 24, borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              bgcolor: "rgba(0,0,0,0.04)",
              transition: "transform 0.25s ease",
              transform: open ? "rotate(180deg)" : "rotate(0deg)",
            }}>
              <Typography sx={{ fontSize: "0.6rem", color: "#94a3b8" }}>▼</Typography>
            </Box>
          </Box>
        </Box>

        {/* ── Stats bar ── */}
        {open && agentOnline === true && (
          <Box sx={{
            px: 2.5, py: 1,
            borderBottom: "1px solid rgba(0,0,0,0.04)",
            display: "flex", gap: 3, flexWrap: "wrap",
            bgcolor: "rgba(248,250,252,0.5)",
          }}>
            {[
              {
                label: "Status",
                value: hasAlerts ? "Investigating" : "Nominal",
                color: hasAlerts ? "#f59e0b" : "#10b981",
                icon: hasAlerts ? "⚡" : "✓",
              },
              {
                label: "Stations",
                value: `${visible.length} tracked`,
                color: "#6366f1",
                icon: "📡",
              },
              {
                label: "Interval",
                value: "Every 15m",
                color: "#64748b",
                icon: "⏱",
              },
              {
                label: "Threshold",
                value: `${allEvents[0]?.threshold || 60} µg/m³`,
                color: "#64748b",
                icon: "🎯",
              },
            ].map(stat => (
              <Box key={stat.label} sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
                <Typography sx={{ fontSize: "0.65rem" }}>{stat.icon}</Typography>
                <Typography sx={{ fontSize: "0.65rem", color: "#94a3b8", fontWeight: 600 }}>
                  {stat.label}:
                </Typography>
                <Typography sx={{ fontSize: "0.65rem", color: stat.color, fontWeight: 700 }}>
                  {stat.value}
                </Typography>
              </Box>
            ))}
          </Box>
        )}

        {/* ── Body ── */}
        <Collapse in={open}>
          {/* Loading shimmer */}
          {loading && agentOnline === null && (
            <Box sx={{ px: 2.5, py: 2 }}>
              {[1, 2].map(i => (
                <Box key={i} sx={{
                  height: 56, borderRadius: 3, mb: 1.5,
                  background: "linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)",
                  backgroundSize: "200% 100%",
                  animation: "scanLine 1.5s ease-in-out infinite",
                }} />
              ))}
            </Box>
          )}

          {/* Alert cards */}
          {!loading && agentOnline === true && visible.length > 0 && (
            <Box sx={{
              maxHeight: 400, overflowY: "auto", p: 2,
              "&::-webkit-scrollbar": { width: 4 },
              "&::-webkit-scrollbar-track": { bgcolor: "transparent" },
              "&::-webkit-scrollbar-thumb": { bgcolor: "#cbd5e1", borderRadius: 2 },
            }}>
              {visible.map((event, index) => (
                <AlertCard
                  key={event._key}
                  event={event}
                  onDismiss={dismiss}
                  stationMap={stationMap}
                  index={index}
                />
              ))}
            </Box>
          )}

          {/* Empty state */}
          {!loading && agentOnline === true && visible.length === 0 && (
            <Box sx={{
              py: 4, px: 3, display: "flex", flexDirection: "column",
              alignItems: "center", textAlign: "center",
            }}>
              <Box sx={{
                width: 52, height: 52, borderRadius: 3, mb: 2,
                background: "linear-gradient(135deg, #dcfce7, #d1fae5)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 4px 12px rgba(16,185,129,0.15)",
              }}>
                <Typography sx={{ fontSize: "1.5rem" }}>🌿</Typography>
              </Box>
              <Typography sx={{ fontSize: "0.88rem", fontWeight: 700, color: "#1e293b", mb: 0.5 }}>
                No Active Alerts
              </Typography>
              <Typography sx={{ fontSize: "0.75rem", color: "#94a3b8", maxWidth: 280 }}>
                All stations are within threshold limits. The AI agent continues to monitor every 15 minutes.
              </Typography>
            </Box>
          )}
        </Collapse>
      </Paper>
    </>
  );
}
