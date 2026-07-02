import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  PointElement, LineElement, Filler, Tooltip
} from "chart.js";
import TopNavBar from "../components/topNavBar";
import { useSensorData } from "../contextProviders/sensorDataContext";
import { useAuth } from "../contextProviders/AuthContext";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip);

const API_BASE = process.env.REACT_APP_API_BASE;

/* ── thresholds from Excel ── */
const HOURLY_THRESHOLDS = {
  pm10: 190,
  pm25: 103,
  noise: 85,
  temperature: 32,
  humidity: 85,
  voc: 200,
  nox: 106
};

const DAILY_THRESHOLDS = {
  pm10: 75,
  pm25: 40
};

const pm25Level = v => {
  if (v == null) return { label: "N/A", color: "#64748b", pct: 0 };
  if (v <= 103) return { label: "Good", color: "#10b981", pct: (v / 103) * 25 };
  if (v <= 153) return { label: "Moderate", color: "#eab308", pct: 25 + ((v - 103) / 50) * 25 };
  if (v <= 203) return { label: "High", color: "#f97316", pct: 50 + ((v - 153) / 50) * 25 };
  if (v <= 253) return { label: "Very High", color: "#ef4444", pct: 75 + ((v - 203) / 50) * 25 };
  return { label: "Severe", color: "#8b5cf6", pct: 100 };
};

const tempLevel = v => {
  if (v == null) return { label: "N/A", color: "#64748b", pct: 0 };
  if (v >= 15 && v <= 25) return { label: "Comfortable", color: "#10b981", pct: 50 };
  if (v >= 26 && v <= 31) return { label: "Moderate", color: "#eab308", pct: 70 };
  if (v >= 32 && v <= 37) return { label: "Action Level", color: "#f97316", pct: 85 };
  if (v >= 38 && v <= 42) return { label: "Very High", color: "#ef4444", pct: 95 };
  return { label: "Severe", color: "#8b5cf6", pct: 100 };
};

const online = ls => ls && Date.now() - new Date(ls) < 86400000;

/* ── Progress bar ── */
const Bar = ({ pct, color }) => (
  <div style={{ height: "6px", borderRadius: "99px", background: "rgba(59,130,246,0.10)", overflow: "hidden", marginTop: "8px" }}>
    <div style={{
      height: "100%", width: `${Math.min(100, Math.max(0, pct))}%`, borderRadius: "99px",
      background: `linear-gradient(90deg, ${color}88, ${color})`,
      boxShadow: `0 0 8px ${color}80`,
      transition: "width 1s cubic-bezier(.4,0,.2,1)",
    }} />
  </div>
);


/* ── noise level helper ── */
const noiseLevel = v => {
  if (v == null) return { label: "N/A", color: "#64748b", pct: 0 };
  if (v < 70) return { label: "Good", color: "#10b981", pct: (v / 70) * 25 };
  if (v <= 82) return { label: "Moderate", color: "#eab308", pct: 25 + ((v - 70) / 12) * 25 };
  if (v <= 85) return { label: "High", color: "#f97316", pct: 50 + ((v - 82) / 3) * 25 };
  if (v <= 105) return { label: "Very High", color: "#ef4444", pct: 75 + ((v - 85) / 20) * 25 };
  return { label: "Severe", color: "#8b5cf6", pct: 100 };
};
/* ── pm10 level helper ── */
const pm10Level = v => {
  if (v == null) return { label: "N/A", color: "#64748b", pct: 0 };
  if (v <= 190) return { label: "Good", color: "#10b981", pct: (v / 190) * 25 };
  if (v <= 240) return { label: "Moderate", color: "#eab308", pct: 25 + ((v - 190) / 50) * 25 };
  if (v <= 290) return { label: "High", color: "#f97316", pct: 50 + ((v - 240) / 50) * 25 };
  if (v <= 340) return { label: "Very High", color: "#ef4444", pct: 75 + ((v - 290) / 50) * 25 };
  return { label: "Severe", color: "#8b5cf6", pct: 100 };
};

/* ── Metric tile ── */
const MiniMetric = ({ title, val, unit, lvl, threshold }) => (
  <div style={{ background: `linear-gradient(135deg,${lvl.color}08,rgba(255,255,255,0.8))`, borderRadius: "14px", padding: "18px 18px 14px", border: `1px solid ${lvl.color}25`, display: "flex", flexDirection: "column", gap: "6px" }}>
    <div style={{ fontSize: "10px", fontWeight: 800, letterSpacing: "1.5px", color: "#64748b" }}>{title}</div>
    <div style={{ fontSize: "34px", fontWeight: 900, color: lvl.color, lineHeight: 1, letterSpacing: "-1px" }}>
      {val != null ? Number(val).toFixed(1) : "—"}
      <span style={{ fontSize: "13px", color: "#94a3b8", marginLeft: "4px", fontWeight: 600 }}>{unit}</span>
    </div>
    <Bar pct={lvl.pct} color={lvl.color} />
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "2px" }}>
      <span style={{ fontSize: "11px", fontWeight: 700, color: lvl.color, background: `${lvl.color}15`, padding: "2px 9px", borderRadius: "999px", border: `1px solid ${lvl.color}30` }}>{lvl.label}</span>
      {threshold && <span style={{ fontSize: "10px", color: "#94a3b8" }}>limit: {threshold}</span>}
    </div>
  </div>
);

/* ── Mini sparkline with threshold lines ── */
const SparkLine = ({ data, label, color, unit, thresholds, isDaily }) => {
  const labels = (data || []).map(d => {
    if (!d.timestamp) return "";
    const date = new Date(d.timestamp);
    return isDaily
      ? date.toLocaleDateString([], { month: "short", day: "numeric" })
      : date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  });
  const values = (data || []).map(d => d[label]);
  const chartData = {
    labels,
    datasets: [
      {
        data: values, borderColor: color, borderWidth: 2,
        backgroundColor: `${color}18`, fill: true, tension: 0.4,
        pointRadius: 0, spanGaps: true,
      },
      ...(thresholds || []).map(t => ({
        data: data.map(() => t.value),
        borderColor: t.color, borderWidth: 1.5, borderDash: [5, 3],
        pointRadius: 0, fill: false, tension: 0,
        label: t.label,
      })),
    ],
  };
  const opts = {
    responsive: true, maintainAspectRatio: false, animation: false,
    plugins: {
      legend: {
        display: thresholds?.length > 0,
        position: "top",
        labels: {
          filter: i => thresholds?.some(t => t.label === i.text),
          font: { size: 10 }, boxWidth: 24, padding: 6, color: "#475569",
        },
      },
      tooltip: {
        callbacks: { label: ctx => `${ctx.parsed.y?.toFixed(1)} ${unit}` },
      },
    },
    scales: {
      x: {
        display: true,
        ticks: { font: { size: 9 }, color: "#64748b", maxTicksLimit: 7 },
        grid: { display: false },
      },
      y: {
        display: true, position: "right",
        ticks: { font: { size: 10 }, color: "#64748b", maxTicksLimit: 5, callback: v => `${v}${unit}` },
        grid: { color: "rgba(0,0,0,0.05)" },
      },
    },
  };
  return (
    <div style={{ height: "160px" }}>
      <Line data={chartData} options={opts} />
    </div>
  );
};


const Card = ({ station, histData, busy, onView }) => {
  const last = histData?.length ? histData[histData.length - 1] : null;
  const live = online(station.lastSeen);

  const getLatest = (key) => {
    if (!histData?.length) return null;
    for (let i = histData.length - 1; i >= 0; i--) {
      if (histData[i][key] != null) return histData[i][key];
    }
    return null;
  };

  const pm = getLatest('pm2p5');
  const tp = getLatest('temperature');
  const pm10 = getLatest('pm10p0');
  const dba = getLatest('dba');
  const pl = pm25Level(pm);
  const tl = tempLevel(tp);
  const p10l = pm10Level(pm10);
  const nl = noiseLevel(dba);

  const dailyAvgs = groupReadingsByDay(histData);
  const lastDaily = dailyAvgs.length ? dailyAvgs[dailyAvgs.length - 1] : null;

  const hasHourlyAlert = last && (
    (last.pm2p5 != null && last.pm2p5 > HOURLY_THRESHOLDS.pm25) ||
    (last.pm10p0 != null && last.pm10p0 > HOURLY_THRESHOLDS.pm10) ||
    (last.dba != null && last.dba > HOURLY_THRESHOLDS.noise) ||
    (last.temperature != null && (last.temperature > HOURLY_THRESHOLDS.temperature || last.temperature < 15)) ||
    (last.humidity != null && last.humidity > HOURLY_THRESHOLDS.humidity) ||
    (last.voc != null && last.voc > HOURLY_THRESHOLDS.voc) ||
    (last.nox != null && last.nox > HOURLY_THRESHOLDS.nox)
  );

  const hasDailyAlert = lastDaily && (
    (lastDaily.pm2p5 != null && lastDaily.pm2p5 > DAILY_THRESHOLDS.pm25) ||
    (lastDaily.pm10p0 != null && lastDaily.pm10p0 > DAILY_THRESHOLDS.pm10)
  );

  const alert = hasHourlyAlert || hasDailyAlert;
  const accentColor = alert ? "#ef4444" : "#3b82f6";

  return (
    <div style={{
      background: "linear-gradient(145deg,#ffffff,#f0f7ff)",
      borderRadius: "20px",
      border: `1px solid ${alert ? "rgba(239,68,68,0.3)" : "rgba(59,130,246,0.12)"}`,
      overflow: "hidden", position: "relative",
      boxShadow: alert
        ? "0 8px 32px rgba(239,68,68,0.12),0 2px 8px rgba(0,0,0,0.06)"
        : "0 8px 32px rgba(59,130,246,0.08),0 2px 8px rgba(0,0,0,0.04)",
      transition: "transform .25s,box-shadow .25s",
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-6px)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; }}
    >
      {/* top accent stripe */}
      <div style={{
        height: "3px",
        background: `linear-gradient(90deg,${accentColor},${alert ? "#f97316" : "#6366f1"})`,
      }} />

      {/* glow blob */}
      <div style={{
        position: "absolute", width: "200px", height: "200px", borderRadius: "50%",
        background: `radial-gradient(circle,${accentColor}12 0%,transparent 70%)`,
        top: "-60px", right: "-60px", pointerEvents: "none",
      }} />

      <div style={{ padding: "20px" }}>
        {/* header row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
          <div>
            <div style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.3px" }}>
              {station.name}
            </div>
            <div style={{ fontSize: "10px", color: "#94a3b8", marginTop: "3px" }}>
              {station.lastSeen ? new Date(station.lastSeen).toLocaleString() : "No data"}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px" }}>
            <span style={{
              fontSize: "10px", fontWeight: 800, padding: "3px 10px", borderRadius: "999px",
              background: live ? "rgba(16,185,129,0.15)" : "rgba(100,116,139,0.12)",
              color: live ? "#10b981" : "#475569",
              border: `1px solid ${live ? "rgba(16,185,129,0.3)" : "rgba(100,116,139,0.2)"}`,
              letterSpacing: "0.5px",
            }}>
              {live ? "● LIVE" : "○ OFFLINE"}
            </span>
            {alert && !busy && (
              <span style={{
                fontSize: "9px", fontWeight: 700, padding: "2px 8px", borderRadius: "999px",
                background: "rgba(239,68,68,0.12)", color: "#ef4444",
                border: "1px solid rgba(239,68,68,0.25)", letterSpacing: "0.5px",
              }}>⚠ ALERT</span>
            )}
          </div>
        </div>

        {/* metrics */}
        {busy ? (
          <div style={{ textAlign: "center", padding: "32px 0", color: "#94a3b8", fontSize: "13px" }}>
            <div style={{
              width: "32px", height: "32px", border: "3px solid #bfdbfe",
              borderTopColor: "#3b82f6", borderRadius: "50%",
              animation: "spin 0.8s linear infinite", margin: "0 auto 10px",
            }} />
            Loading…
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <MiniMetric title="PM 2.5" val={pm} unit="μg/m³" lvl={pl} threshold="103 μg/m³" />
            <MiniMetric title="TEMP" val={tp} unit="°C" lvl={tl} threshold="32°C" />
            <MiniMetric title="PM 10" val={pm10} unit="μg/m³" lvl={p10l} threshold="190 μg/m³" />
            <MiniMetric title="NOISE" val={dba} unit="dB" lvl={nl} threshold="85 dB" />
          </div>
        )}

        {/* footer */}
        <button onClick={() => onView(station._id)} style={{
          width: "100%", marginTop: "14px", padding: "11px",
          background: `linear-gradient(135deg,#3b82f6,#6366f1)`,
          color: "#fff", border: "none", borderRadius: "12px",
          fontSize: "13px", fontWeight: 700, cursor: "pointer", letterSpacing: "0.3px",
          boxShadow: "0 4px 15px rgba(99,102,241,0.35)",
          transition: "opacity .2s",
        }}
          onMouseEnter={e => e.currentTarget.style.opacity = ".8"}
          onMouseLeave={e => e.currentTarget.style.opacity = "1"}
        >
          View Full Details →
        </button>
      </div>
    </div>
  );
};

/* ── KPI tile ── */
const KPI = ({ label, value, color, sub }) => (
  <div style={{
    background: "linear-gradient(145deg,#ffffff,#f0f9ff)",
    border: `1px solid ${color}30`,
    borderRadius: "16px", padding: "20px 24px", textAlign: "center",
    boxShadow: `0 4px 20px ${color}15`,
    position: "relative", overflow: "hidden",
  }}>
    <div style={{
      position: "absolute", bottom: "-20px", right: "-20px",
      width: "80px", height: "80px", borderRadius: "50%",
      background: `radial-gradient(circle,${color}20,transparent 70%)`,
    }} />
    <div style={{ fontSize: "36px", fontWeight: 900, color, lineHeight: 1 }}>{value}</div>
    <div style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", marginTop: "6px" }}>{label}</div>
    {sub && <div style={{ fontSize: "9px", color: "#94a3b8", marginTop: "2px", fontWeight: 700, letterSpacing: "0.5px" }}>{sub}</div>}
  </div>
);

/* ── Legend chip ── */
const Chip = ({ label, color }) => (
  <span style={{
    padding: "4px 11px", borderRadius: "999px", fontSize: "10px", fontWeight: 700,
    color, background: `${color}14`, border: `1px solid ${color}30`, whiteSpace: "nowrap",
  }}>{label}</span>
);

/* ── Group & Aggregate Readings By Day ── */
const groupReadingsByDay = (data) => {
  if (!data || !data.length) return [];
  const groups = {};
  data.forEach(d => {
    if (!d.timestamp) return;
    const dateStr = new Date(d.timestamp).toLocaleDateString([], { month: "short", day: "numeric" });
    if (!groups[dateStr]) {
      groups[dateStr] = {
        timestamp: d.timestamp,
        dateStr,
        pm2p5: [],
        pm10p0: [],
        temperature: [],
        dba: []
      };
    }
    if (d.pm2p5 != null) groups[dateStr].pm2p5.push(Number(d.pm2p5));
    if (d.pm10p0 != null) groups[dateStr].pm10p0.push(Number(d.pm10p0));
    if (d.temperature != null) groups[dateStr].temperature.push(Number(d.temperature));
    if (d.dba != null) groups[dateStr].dba.push(Number(d.dba));
  });

  const result = Object.values(groups).map(g => {
    const avg = arr => arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : null;
    return {
      timestamp: g.timestamp,
      dateStr: g.dateStr,
      pm2p5: avg(g.pm2p5),
      pm10p0: avg(g.pm10p0),
      temperature: avg(g.temperature),
      dba: avg(g.dba)
    };
  });

  result.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  return result;
};

/* ════════════════════════════════════
   MAIN
════════════════════════════════════ */
export default function PrivateSummaryDashboard() {
  const navigate = useNavigate();
  const { setSelectedSensor, setSelectedPeriod } = useSensorData();
  const { logout } = useAuth();

  const [stations, setStations] = useState([]);
  const [readings, setReadings] = useState({});
  const [loadingSt, setLoadingSt] = useState(true);
  const [loadingR, setLoadingR] = useState({});
  const [error, setError] = useState(null);
  const [refreshed, setRefreshed] = useState(null);



  const handleLogout = () => {
    delete axios.defaults.headers.common["Authorization"];
    logout();
    navigate("/login");
  };

  const fetchStations = useCallback(async () => {
    setLoadingSt(true); setError(null);
    try {
      const tok = localStorage.getItem("authToken");
      let list = [];
      if (tok) {
        // Logged in: fetch only the user's assigned stations (same as mineDashboard)
        const { data } = await axios.get(`${API_BASE}/api/users_sensors/me/stations`, {
          headers: { Authorization: `Bearer ${tok}` },
        });
        list = Array.isArray(data) ? [...data] : [];
      } else {
        // Not logged in: fetch all private stations
        const { data } = await axios.get(`${API_BASE}/api/stations/private`);
        list = Array.isArray(data) ? [...data] : [];
        list = list.filter(s => s.visibility === "private");
      }
      list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
      setStations(list); return list;
    } catch (e) {
      setError(e?.response?.data?.message || e.message || "Failed"); return [];
    } finally { setLoadingSt(false); }
  }, []);

  const fetchReadings = useCallback(async (list) => {
    if (!list?.length) return;
    const lm = {}; list.forEach(s => { lm[s._id] = true; }); setLoadingR({ ...lm });
    const tok = localStorage.getItem("authToken");
    const res = await Promise.allSettled(list.map(async s => {
      let data = [];
      try {
        const r = await axios.get(`${API_BASE}/api/stations/${s._id}/sensorData?days=7`);
        data = r.data || [];
      } catch (e) {
        console.warn("Failed to fetch sensorData for", s.name);
      }

      // Fallback: If sensorData is empty, try nodedata/aggregated if sensorIds exists
      if ((!data || data.length === 0) && s.sensorIds && s.sensorIds.length > 0) {
        try {
          const d = new Date();
          const end = d.toISOString();
          d.setDate(d.getDate() - 7);
          const start = d.toISOString();

          const nr = await axios.get(`${API_BASE}/api/nodedata/aggregated`, {
            params: { sensor_id: s.sensorIds[0], start, end, resolution: 'hourly' },
            headers: tok ? { Authorization: `Bearer ${tok}` } : {}
          });

          if (nr.data && Array.isArray(nr.data)) {
            data = nr.data;
          }
        } catch (e) {
          console.warn("Failed fallback fetch for", s.name);
        }
      }

      return { id: s._id, data };
    }));
    const nr = {};
    res.forEach(r => {
      if (r.status === "fulfilled") {
        const { id, data } = r.value;
        let arr = Array.isArray(data) ? data : [];
        arr.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        nr[id] = arr;
      }
    });
    setReadings(nr); setLoadingR({}); setRefreshed(new Date());
  }, []);

  const refresh = useCallback(async () => { const l = await fetchStations(); if (l?.length) await fetchReadings(l); }, [fetchStations, fetchReadings]);

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => { const t = setInterval(refresh, 300000); return () => clearInterval(t); }, [refresh]);

  const onView = (id) => {
    setSelectedSensor(id);
    setSelectedPeriod("Today");
    sessionStorage.setItem("privateComplianceStationId", id);
    sessionStorage.removeItem("privateComplianceSensorId");
    navigate("/private-compliance");
  };

  const liveCount = stations.filter(s => online(s.lastSeen)).length;

  let totalHourlyAlerts = 0;
  let totalDailyAlerts = 0;
  stations.forEach(s => {
    const hist = readings[s._id] || [];
    const last = hist.length ? hist[hist.length - 1] : null;

    // Count active hourly alerts from the latest reading only
    if (last) {
      if ((last.pm2p5 || 0) > HOURLY_THRESHOLDS.pm25) totalHourlyAlerts++;
      if ((last.pm10p0 || 0) > HOURLY_THRESHOLDS.pm10) totalHourlyAlerts++;
      if ((last.dba || 0) > HOURLY_THRESHOLDS.noise) totalHourlyAlerts++;
      if (last.temperature != null && (last.temperature > HOURLY_THRESHOLDS.temperature || last.temperature < 15)) totalHourlyAlerts++;
      if ((last.humidity || 0) > HOURLY_THRESHOLDS.humidity) totalHourlyAlerts++;
      if ((last.voc || 0) > HOURLY_THRESHOLDS.voc) totalHourlyAlerts++;
      if ((last.nox || 0) > HOURLY_THRESHOLDS.nox) totalHourlyAlerts++;
    }

    // Count active daily alerts from the latest day only
    const dailyAvgs = groupReadingsByDay(hist);
    const lastDaily = dailyAvgs.length ? dailyAvgs[dailyAvgs.length - 1] : null;
    if (lastDaily) {
      if ((lastDaily.pm2p5 || 0) > DAILY_THRESHOLDS.pm25) totalDailyAlerts++;
      if ((lastDaily.pm10p0 || 0) > DAILY_THRESHOLDS.pm10) totalDailyAlerts++;
    }
  });

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "linear-gradient(145deg,#f0f7ff 0%,#e8f0fe 40%,#dbeafe 70%,#eff6ff 100%)", fontFamily: "'Inter',system-ui,sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
        @keyframes spin { to { transform:rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0;transform:translateY(20px); } to { opacity:1;transform:translateY(0); } }
        .sensor-grid > * { animation: fadeUp 0.4s ease both; }
        .sensor-grid > *:nth-child(1){animation-delay:.05s} .sensor-grid > *:nth-child(2){animation-delay:.1s}
        .sensor-grid > *:nth-child(3){animation-delay:.15s} .sensor-grid > *:nth-child(4){animation-delay:.2s}
        .sensor-grid > *:nth-child(5){animation-delay:.25s} .sensor-grid > *:nth-child(6){animation-delay:.3s}
        .sensor-grid > *:nth-child(7){animation-delay:.35s} .sensor-grid > *:nth-child(8){animation-delay:.4s}
        ::-webkit-scrollbar{width:4px;} ::-webkit-scrollbar-track{background:#e8f0fe;} ::-webkit-scrollbar-thumb{background:#93c5fd;border-radius:4px;}
      `}</style>

      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "0 28px" }}><TopNavBar /></div>

        <div style={{ padding: "0 28px 56px" }}>

          {/* ── Hero header ── */}
          <div style={{
            background: "linear-gradient(135deg,#ffffff,#eff6ff)",
            border: "1px solid rgba(59,130,246,0.15)", borderRadius: "20px",
            padding: "28px 32px", marginBottom: "28px",
            display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px",
            boxShadow: "0 4px 24px rgba(59,130,246,0.08)",
          }}>
            <div>
              <div style={{ fontSize: "26px", fontWeight: 900, color: "#0f172a", letterSpacing: "-0.8px", lineHeight: 1.1 }}>
                Private Sensors
                <span style={{ background: "linear-gradient(135deg,#2563eb,#0ea5e9)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginLeft: "10px" }}>
                  Live Summary
                </span>
              </div>
              {refreshed && <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "6px", fontWeight: 600 }}>· Refreshed {refreshed.toLocaleTimeString()}</div>}
            </div>
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>

              <button onClick={handleLogout} style={{
                padding: "12px 26px", borderRadius: "14px",
                background: "#fff",
                color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)", fontSize: "14px", fontWeight: 800,
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(239,68,68,0.1)",
                letterSpacing: "0.3px", display: "flex", alignItems: "center", gap: "8px",
              }}>
                <span style={{ fontSize: "18px" }}>🚪</span> Logout
              </button>
              <button onClick={refresh} disabled={loadingSt} style={{
                padding: "12px 26px", borderRadius: "14px",
                background: "linear-gradient(135deg,#3b82f6,#6366f1)",
                color: "#fff", border: "none", fontSize: "14px", fontWeight: 800,
                cursor: loadingSt ? "not-allowed" : "pointer", opacity: loadingSt ? .7 : 1,
                boxShadow: "0 6px 24px rgba(99,102,241,0.4)",
                letterSpacing: "0.3px", display: "flex", alignItems: "center", gap: "8px",
              }}>
                <span style={{ fontSize: "18px" }}>↻</span> Refresh
              </button>
            </div>
          </div>

          {/* ── KPI row ── */}
          {!loadingSt && stations.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: "14px", marginBottom: "28px" }}>
              <KPI label="Total Sensors" value={stations.length} color="#3b82f6" />
              <KPI label="Live" value={liveCount} color="#10b981" />
              <KPI label="Offline" value={stations.length - liveCount} color="#475569" />
              <KPI label="Hourly Alerts" value={totalHourlyAlerts} color={totalHourlyAlerts > 0 ? "#ef4444" : "#10b981"} />
              <KPI label="Daily Alerts" value={totalDailyAlerts} color={totalDailyAlerts > 0 ? "#f97316" : "#10b981"} />
            </div>
          )}

          {/* ── Alerts Center ── */}
          {!loadingSt && stations.length > 0 && (
            <div style={{
              background: "rgba(255,255,255,0.85)",
              border: "1px solid rgba(59,130,246,0.12)",
              backdropFilter: "blur(8px)",
              borderRadius: "18px",
              padding: "24px",
              marginBottom: "28px",
              boxShadow: "0 8px 32px rgba(59,130,246,0.05)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                <span style={{ fontSize: "20px" }}>🚨</span>
                <div style={{ fontSize: "18px", fontWeight: 850, color: "#0f172a", letterSpacing: "-0.5px" }}>
                  Active Alerts Summary (Both Sensors)
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
                {stations.map(s => {
                  const hist = readings[s._id] || [];
                  const last = hist.length ? hist[hist.length - 1] : null;
                  const dailyAvgs = groupReadingsByDay(hist);
                  const lastDaily = dailyAvgs.length ? dailyAvgs[dailyAvgs.length - 1] : null;

                  const hAlerts = [];
                  if (last) {
                    if (last.pm2p5 != null && last.pm2p5 > HOURLY_THRESHOLDS.pm25) {
                      hAlerts.push(`PM2.5 (${Number(last.pm2p5).toFixed(1)} > ${HOURLY_THRESHOLDS.pm25} µg/m³)`);
                    }
                    if (last.pm10p0 != null && last.pm10p0 > HOURLY_THRESHOLDS.pm10) {
                      hAlerts.push(`PM10 (${Number(last.pm10p0).toFixed(1)} > ${HOURLY_THRESHOLDS.pm10} µg/m³)`);
                    }

                    if (last.dba != null && last.dba > HOURLY_THRESHOLDS.noise) {
                      hAlerts.push(`Noise (${Number(last.dba).toFixed(1)} > ${HOURLY_THRESHOLDS.noise} dBA)`);
                    }
                    if (last.temperature != null && (last.temperature > HOURLY_THRESHOLDS.temperature || last.temperature < 15)) {
                      hAlerts.push(`Temp (${Number(last.temperature).toFixed(1)}°C outside 15-${HOURLY_THRESHOLDS.temperature}°C)`);
                    }
                    if (last.humidity != null && last.humidity > HOURLY_THRESHOLDS.humidity) {
                      hAlerts.push(`Humidity (${Number(last.humidity).toFixed(1)}% > ${HOURLY_THRESHOLDS.humidity}%)`);
                    }
                    if (last.voc != null && last.voc > HOURLY_THRESHOLDS.voc) {
                      hAlerts.push(`VOCs (${Number(last.voc).toFixed(1)} > ${HOURLY_THRESHOLDS.voc} µg/m³)`);
                    }
                    if (last.nox != null && last.nox > HOURLY_THRESHOLDS.nox) {
                      hAlerts.push(`NOx (${Number(last.nox).toFixed(1)} > ${HOURLY_THRESHOLDS.nox} ppb)`);
                    }
                  }

                  const dAlerts = [];
                  if (lastDaily) {
                    if (lastDaily.pm2p5 != null && lastDaily.pm2p5 > DAILY_THRESHOLDS.pm25) {
                      dAlerts.push(`PM2.5 (${Number(lastDaily.pm2p5).toFixed(1)} > ${DAILY_THRESHOLDS.pm25} µg/m³)`);
                    }
                    if (lastDaily.pm10p0 != null && lastDaily.pm10p0 > DAILY_THRESHOLDS.pm10) {
                      dAlerts.push(`PM10 (${Number(lastDaily.pm10p0).toFixed(1)} > ${DAILY_THRESHOLDS.pm10} µg/m³)`);
                    }

                  }

                  const hasAny = hAlerts.length > 0 || dAlerts.length > 0;

                  return (
                    <div key={s._id} style={{
                      background: hasAny ? "rgba(239, 68, 68, 0.03)" : "rgba(16, 185, 129, 0.03)",
                      border: `1px solid ${hasAny ? "rgba(239, 68, 68, 0.15)" : "rgba(16, 185, 129, 0.15)"}`,
                      borderRadius: "14px",
                      padding: "16px 20px"
                    }}>
                      <div style={{ fontSize: "15px", fontWeight: 800, color: "#1e293b", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: hasAny ? "#ef4444" : "#10b981" }} />
                        {s.name}
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        <div>
                          <div style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>Hourly Alerts</div>
                          {hAlerts.length > 0 ? (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                              {hAlerts.map((a, idx) => (
                                <span key={idx} style={{ background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "6px", border: "1px solid rgba(239, 68, 68, 0.15)" }}>
                                  {a}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span style={{ fontSize: "12px", color: "#10b981", fontWeight: 600 }}>✓ Normal (All Hourly metrics within limit)</span>
                          )}
                        </div>

                        <div>
                          <div style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>Daily Alerts</div>
                          {dAlerts.length > 0 ? (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                              {dAlerts.map((a, idx) => (
                                <span key={idx} style={{ background: "rgba(249, 115, 22, 0.1)", color: "#f97316", fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "6px", border: "1px solid rgba(249, 115, 22, 0.15)" }}>
                                  {a}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span style={{ fontSize: "12px", color: "#10b981", fontWeight: 600 }}>✓ Normal (All Daily metrics within limit)</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Legend ── */}
          <div style={{
            background: "rgba(255,255,255,0.85)", border: "1px solid rgba(59,130,246,0.12)", backdropFilter: "blur(8px)",
            borderRadius: "14px", padding: "16px 22px", marginBottom: "28px",
            display: "flex", flexWrap: "wrap", gap: "18px",
          }}>
            <div>
              <div style={{ fontSize: "9px", fontWeight: 800, color: "#64748b", letterSpacing: "1.5px", marginBottom: "8px" }}>PM2.5 — EXCEL COMPLIANCE BANDS (μg/m³)</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {[["Good ≤103", "#10b981"], ["Moderate 104–153", "#eab308"], ["High 154–203", "#f97316"], ["Very High 204–253", "#ef4444"], ["Severe >254", "#8b5cf6"]]
                  .map(([l, c]) => <Chip key={l} label={l} color={c} />)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: "9px", fontWeight: 800, color: "#64748b", letterSpacing: "1.5px", marginBottom: "8px" }}>TEMPERATURE — DRY-BULB LIMITS (°C)</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {[["Comfortable 15–25", "#10b981"], ["Moderate 26–31", "#eab308"], ["Action Level 32–37", "#f97316"], ["Very High 38–42", "#ef4444"], ["Severe <4 or >42", "#8b5cf6"]]
                  .map(([l, c]) => <Chip key={l} label={l} color={c} />)}
              </div>
            </div>
          </div>

          {/* ── Error ── */}
          {error && (
            <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: "12px", padding: "14px 20px", color: "#f87171", marginBottom: "24px", fontSize: "13px", fontWeight: 600 }}>
              ⚠ {error}
            </div>
          )}

          {/* ── States ── */}
          {loadingSt ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "120px 0", gap: "20px" }}>
              <div style={{ width: "52px", height: "52px", border: "4px solid #bfdbfe", borderTopColor: "#3b82f6", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              <div style={{ color: "#64748b", fontSize: "14px", fontWeight: 600 }}>Loading your private sensors…</div>
            </div>
          ) : stations.length === 0 ? (
            <div style={{ textAlign: "center", padding: "120px 0" }}>
              <div style={{ fontSize: "64px", marginBottom: "16px" }}>📡</div>
              <div style={{ fontSize: "20px", fontWeight: 800, color: "#1e293b", marginBottom: "8px" }}>No sensors found</div>
              <div style={{ fontSize: "13px", color: "#64748b" }}>Contact your administrator to be assigned private sensors.</div>
            </div>
          ) : (
            <>
              <div style={{ fontSize: "12px", color: "#1e293b", fontWeight: 700, letterSpacing: "0.5px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ color: "#2563eb" }}>■</span>
                {stations.length} SENSOR{stations.length !== 1 ? "S" : ""} ASSIGNED
                {Object.keys(loadingR).length > 0 && <span style={{ color: "#3b82f6", fontWeight: 600 }}>· Fetching readings…</span>}
              </div>
              <div className="sensor-grid" style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(420px,1fr))",
                gap: "24px",
              }}>
                {stations.map(s => (
                  <Card
                    key={s._id}
                    station={s}
                    histData={readings[s._id]}
                    busy={!!loadingR[s._id]}
                    onView={onView}
                  />
                ))}
              </div>

              {/* ── Historical Trends section ── */}
              {stations.some(s => readings[s._id]?.length > 1) && (
                <div style={{ marginTop: "40px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
                    <div style={{ width: "4px", height: "24px", background: "linear-gradient(180deg,#3b82f6,#6366f1)", borderRadius: "2px" }} />
                    <div>
                      <div style={{ fontSize: "18px", fontWeight: 900, color: "#0f172a", letterSpacing: "-0.3px" }}>Historical Trends</div>
                      <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>7-day daily data · PM2.5 (WHO 2021) · Temperature (ASHRAE 55) · Noise (NIOSH)</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                    {stations.filter(s => readings[s._id]?.length > 1).map(s => (
                      <div key={s._id} style={{
                        background: "linear-gradient(145deg,#ffffff,#f8faff)",
                        borderRadius: "20px", padding: "22px 24px",
                        border: "1px solid rgba(59,130,246,0.12)",
                        boxShadow: "0 4px 20px rgba(59,130,246,0.06)",
                      }}>
                        <div style={{ fontSize: "14px", fontWeight: 800, color: "#0f172a", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: online(s.lastSeen) ? "#10b981" : "#94a3b8", display: "inline-block" }} />
                          {s.name}
                          <span style={{ fontSize: "10px", color: "#94a3b8", fontWeight: 600 }}>· Last 7 days</span>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: "16px" }}>
                          <div style={{ background: "#fff", borderRadius: "14px", padding: "14px", border: "1px solid rgba(239,68,68,0.15)" }}>
                            <div style={{ fontSize: "10px", fontWeight: 800, color: "#64748b", letterSpacing: "1px", marginBottom: "8px" }}>PM 2.5 (μg/m³)</div>
                            <SparkLine data={groupReadingsByDay(readings[s._id])} label="pm2p5" color="#ef4444" unit="μg/m³" isDaily={true} thresholds={[
                              { value: 20, color: "#22c55e", label: "Annual Avg (20)" },
                              { value: 40, color: "#ef4444", label: "24-Hr Limit (40)" },
                            ]} />
                          </div>
                          <div style={{ background: "#fff", borderRadius: "14px", padding: "14px", border: "1px solid rgba(59,130,246,0.15)" }}>
                            <div style={{ fontSize: "10px", fontWeight: 800, color: "#64748b", letterSpacing: "1px", marginBottom: "8px" }}>TEMPERATURE (°C)</div>
                            <SparkLine data={groupReadingsByDay(readings[s._id])} label="temperature" color="#3b82f6" unit="°C" isDaily={true} thresholds={[
                              { value: 32, color: "#eab308", label: "Action Level (32°C)" },
                              { value: 37, color: "#ef4444", label: "Max OEL (37°C)" },
                            ]} />
                          </div>
                          <div style={{ background: "#fff", borderRadius: "14px", padding: "14px", border: "1px solid rgba(168,85,247,0.15)" }}>
                            <div style={{ fontSize: "10px", fontWeight: 800, color: "#64748b", letterSpacing: "1px", marginBottom: "8px" }}>NOISE (dBA)</div>
                            <SparkLine data={groupReadingsByDay(readings[s._id])} label="dba" color="#a855f7" unit="dB" isDaily={true} thresholds={[
                              { value: 82, color: "#eab308", label: "Action Level (82dB)" },
                              { value: 85, color: "#ef4444", label: "Max OEL (85dB)" },
                            ]} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
