import React, { useState, useEffect, useContext } from "react";
import {
  FormControl, Select, MenuItem, InputLabel, Button, Popover,
  TextField, CircularProgress, Alert
} from "@mui/material";
import { Grid, Box, Typography, Paper, Container } from "@mui/material";
import axios from "axios";
import sacaqmLogo from '../assets/sacaqm_logo.png';
import airsynqLogo from '../assets/airsynq.png';
import { StationContext } from "../contextProviders/StationContext";
import PMWidget from "../components/envDashboard/PMWidget";
import NoiseGauge from "../components/envDashboard/NoiseGauge";
import NoiseWidget from "../components/envDashboard/NoiseWidget";
import TempWidget from "../components/envDashboard/TempWidget";
import ParameterWidget from "../components/envDashboard/ParameterWidget";
import ExceedancesOverTimeChart from "../components/envDashboard/ExceedancesOverTimeChart";
import ExceedancesTable from "../components/envDashboard/ExceedancesTable";
import ExceedancesSeverityChart from "../components/envDashboard/ExceedancesSeverityChart";
import StationMap from "../components/envDashboard/StationMap";
const BASE = process.env.REACT_APP_API_BASE;

function formatDate(d) {
  return (
    d.getFullYear() + "-" +
    (d.getMonth() + 1 < 10 ? "0" : "") + (d.getMonth() + 1) + "-" +
    (d.getDate() < 10 ? "0" : "") + d.getDate()
  );
}

function calcTrend(curr, prev) {
  if (!prev || prev.length === 0) return 0;
  const cAvg = curr.reduce((s, v) => s + v, 0) / curr.length;
  const pAvg = prev.reduce((s, v) => s + v, 0) / prev.length;
  if (pAvg === 0) return 0;
  return Math.round(((cAvg - pAvg) / pAvg) * 100);
}

function getPrevPeriod(start, end) {
  const s = new Date(start);
  const e = new Date(end);
  const days = Math.ceil(Math.abs(e - s) / 86400000);
  const pe = new Date(s); pe.setDate(pe.getDate() - 1);
  const ps = new Date(pe); ps.setDate(ps.getDate() - days);
  return { start: formatDate(ps), end: formatDate(pe) };
}

// SA AQI 4-colour bands: Green / Yellow / Orange / Red
const AQI_BANDS = {
  pm25: [ // PM1, PM2.5, PM4 — NAAQS = 103 µg/m³
    { max: 103, status: "Green"  },
    { max: 128, status: "Yellow" },  // Moderate AQI
    { max: 178, status: "Orange" },  // High AQI
    { max: Infinity, status: "Red" },// Very High / Hazardous
  ],
  pm10: [ // NAAQS = 190 µg/m³
    { max: 190, status: "Green"  },
    { max: 240, status: "Yellow" },
    { max: 290, status: "Orange" },
    { max: Infinity, status: "Red" },
  ],
  noise: [ // NIOSH / dB scale
    { max: 70,       status: "Green"  },  // Safe
    { max: 90,       status: "Yellow" },  // Moderate
    { max: 120,      status: "Orange" },  // Very Loud
    { max: Infinity, status: "Red"    },  // Dangerous
  ],
};

function statusFor(val, threshold, paramKey) {
  if (threshold === null || threshold === undefined) return "—";
  const bands = AQI_BANDS[paramKey];
  if (bands) {
    for (const band of bands) { if (val <= band.max) return band.status; }
  }
  if (val <= threshold) return "Green";
  if (val <= threshold * 1.2) return "Yellow";
  if (val <= threshold * 1.5) return "Orange";
  return "Red";
}

const avgField = (arr, key) =>
  arr.length ? Math.round(arr.reduce((s, d) => s + (d[key] || 0), 0) / arr.length) : 0;

const safeMin = (arr) => arr?.length ? Math.round(Math.min(...arr.map((d) => d.min ?? 0))) : 0;
const safeMax = (arr) => arr?.length ? Math.round(Math.max(...arr.map((d) => d.max ?? 0))) : 0;

const THRESHOLDS = {
  pm1:  103,   // SA NAAQS — using PM2.5 limit
  pm25: 103,   // SA NAAQS PM2.5 = 103 µg/m³
  pm5:  103,   // SA NAAQS — using PM2.5 limit
  pm10: 190,   // SA NAAQS PM10 = 190 µg/m³
  noise: 70,   // NIOSH safe hearing threshold
  temperature: 32,
  humidity: 80,
  co2: 1000,
  nox: null,
  voc: null
};

const filterBarSx = {
  background: 'rgba(255, 255, 255, 0.7)',
  backdropFilter: 'blur(20px) saturate(180%)',
  border: '1px solid rgba(59, 130, 246, 0.2)',
  p: 3, 
  borderRadius: 4, 
  mb: 3,
  boxShadow: '0 8px 32px rgba(59, 130, 246, 0.1)',
  position: 'relative',
  zIndex: 10,
  overflow: 'hidden',
  '&::after': {
    content: '""', 
    position: 'absolute', 
    bottom: 0, 
    left: 0, 
    right: 0, 
    height: '3px',
    background: 'linear-gradient(90deg, #3b82f6, #6366f1, #0ea5e9)',
  },
};

const selectSx = {
  bgcolor: "white", borderRadius: 2.5,
  "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(59, 130, 246, 0.2)", borderWidth: 2 },
  "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#3b82f6" },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#3b82f6", borderWidth: 2 },
  fontSize: "0.95rem", fontWeight: 500, transition: "all 0.2s ease",
  boxShadow: "0 2px 8px rgba(59, 130, 246, 0.08)",
  "&:hover": { boxShadow: "0 4px 12px rgba(59, 130, 246, 0.15)" },
};

const presetSx = {
  px: 2, py: 0.5, fontSize: "0.75rem", fontWeight: 600, textTransform: "none",
  borderRadius: 2, border: "2px solid transparent",
  bgcolor: "rgba(59, 130, 246, 0.1)", color: "#3b82f6", transition: "all 0.2s ease",
  "&:hover": { bgcolor: "#3b82f6", color: "white" },
};

const labelSx = { fontSize: "0.75rem", fontWeight: 700, color: "#64748b", letterSpacing: "0.5px", textTransform: "uppercase" };

const fadeIn = (delay) => ({
  animation: `fadeInUp 0.6s ease-out ${delay}s`, animationFillMode: "backwards",
  "@keyframes fadeInUp": {
    from: { opacity: 0, transform: "translateY(30px)" },
    to: { opacity: 1, transform: "translateY(0)" },
  },
});

export default function EnvComplianceDashboard() {
  const { stations, loading: stationsLoading } = useContext(StationContext);

  const [sensorId, setSensorId] = useState("");
  const [startDate, setStartDate] = useState(() => {
    const d = new Date(); d.setDate(1); return formatDate(d);
  });
  const [endDate, setEndDate] = useState(() => formatDate(new Date()));
  const [dateLabel, setDateLabel] = useState(() => {
    const d = new Date();
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    const sm = start.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const em = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return `${sm} – ${em}, ${d.getFullYear()}`;
  });
  const [resolution, setResolution] = useState("daily");
  const [dashData, setDashData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [anchor, setAnchor] = useState(null);
  const [showForecast, setShowForecast] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [realtimeNoise, setRealtimeNoise] = useState(null);

  const sensorOptions = (stations || []).flatMap((station) =>
    (station.sensorIds || []).map((sid) => ({
      id: sid,
      label: station.sensorIds.length === 1
        ? station.name
        : `${station.name} – ${sid}`,
    }))
  );

  useEffect(() => {
    if (sensorOptions.length > 0 && !sensorId) {
      console.log("✅ Sensor options:", sensorOptions);
      setSensorId(sensorOptions[0].id);
    }
  }, [stations]);

  useEffect(() => {
    if (sensorId) fetchDashboard();
  }, [sensorId, startDate, endDate, resolution]);

  // Fetch latest real-time noise reading (most recent hourly value today)
  useEffect(() => {
    if (!sensorId) return;
    const fetchRealtime = async () => {
      try {
        const today = formatDate(new Date());
        const res = await axios.get(`${BASE}/api/nodedata/aggregated`, {
          params: { sensor_id: sensorId, start: today, end: today, resolution: 'hourly' },
        });
        const records = res.data || [];
        // Walk backwards to find the most recent non-zero dba reading
        for (let i = records.length - 1; i >= 0; i--) {
          if ((records[i].dba || 0) > 0) {
            setRealtimeNoise(Math.round(records[i].dba));
            return;
          }
        }
        setRealtimeNoise(null); // no reading today yet
      } catch {
        setRealtimeNoise(null);
      }
    };
    fetchRealtime();
    // Refresh every 5 minutes
    const interval = setInterval(fetchRealtime, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [sensorId]);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);

    console.log("📡 Fetching:", `${BASE}/api/nodedata/aggregated`, { sensor_id: sensorId, start: startDate, end: endDate, resolution });

    try {
      const prev = getPrevPeriod(startDate, endDate);

      // Fixed last-7-days range — matches exactly the "Last 7 Days" preset (today-7 to today)
      const fEnd   = formatDate(new Date());
      const fStart = (() => { const d = new Date(); d.setDate(d.getDate() - 7); return formatDate(d); })();

      const [currRes, hourlyRes, prevRes, fCurrRes, fHourlyRes] = await Promise.all([
        axios.get(`${BASE}/api/nodedata/aggregated`, {
          params: { sensor_id: sensorId, start: startDate, end: endDate, resolution },
        }),
        axios.get(`${BASE}/api/nodedata/aggregated`, {
          params: { sensor_id: sensorId, start: startDate, end: endDate, resolution: 'hourly' },
        }),
        axios.get(`${BASE}/api/nodedata/aggregated`, {
          params: { sensor_id: sensorId, start: prev.start, end: prev.end, resolution },
        }).catch(() => ({ data: [] })),
        // Forecast: always fetch last 7 days daily aggregated — independent of selected period
        axios.get(`${BASE}/api/nodedata/aggregated`, {
          params: { sensor_id: sensorId, start: fStart, end: fEnd, resolution: 'daily' },
        }).catch(() => ({ data: [] })),
        // Forecast: always fetch last 7 days hourly — independent of selected period
        axios.get(`${BASE}/api/nodedata/aggregated`, {
          params: { sensor_id: sensorId, start: fStart, end: fEnd, resolution: 'hourly' },
        }).catch(() => ({ data: [] })),
      ]);

      const curr = currRes.data || [];
      const hourly = hourlyRes.data || [];
      const prevData = prevRes.data || [];
      const fCurr = fCurrRes.data || [];
      const fHourly = fHourlyRes.data || [];

      // Remove the slice-based last7 — use fHourly directly (it IS last 7 days)
      const last7Hourly = fHourly;

      console.log("✅ Display data:", curr.length, "records | Hourly data:", hourly.length, "hours");
      console.log("Sample display record:", curr[0]);
      console.log("Sample hourly record:", hourly[0]);

      if (curr.length === 0) {
        setError(`No data found for sensor "${sensorId}" between ${startDate} and ${endDate}. Try a wider date range.`);
        setDashData(null);
        setLoading(false);
        return;
      }

      const mmFields = ["pm1p0", "pm2p5", "pm4p0", "pm10p0", "dba", "temperature", "humidity", "co2", "nox", "voc"];
      const mmResults = await Promise.allSettled(
        mmFields.map((field) =>
          axios.get(`${BASE}/api/nodedata/daily-trend-minmax`, {
            params: { sensor_id: sensorId, start: startDate, end: endDate, field },
          })
        )
      );
      const [mm1, mm25, mm4, mm10, mmNoise, mmTemp, mmHum, mmCO2, mmNOx, mmVOC] = mmResults.map((r) =>
        r.status === "fulfilled" ? r.value.data || [] : []
      );

      const labels = curr.map((item) =>
        new Date(item.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" })
      );

      const pmData = {
        pm1:  { title: "PM1.0", labels, values: curr.map((d) => Math.round(d.pm1p0  || 0)), current: avgField(curr, "pm1p0"),  trend: calcTrend(curr.map((d) => d.pm1p0  || 0), prevData.map((d) => d.pm1p0  || 0)), min: safeMin(mm1),  max: safeMax(mm1) },
        pm25: { title: "PM2.5", labels, values: curr.map((d) => Math.round(d.pm2p5  || 0)), current: avgField(curr, "pm2p5"),  trend: calcTrend(curr.map((d) => d.pm2p5  || 0), prevData.map((d) => d.pm2p5  || 0)), min: safeMin(mm25), max: safeMax(mm25) },
        pm5:  { title: "PM4.0", labels, values: curr.map((d) => Math.round(d.pm4p0  || 0)), current: avgField(curr, "pm4p0"),  trend: calcTrend(curr.map((d) => d.pm4p0  || 0), prevData.map((d) => d.pm4p0  || 0)), min: safeMin(mm4),  max: safeMax(mm4) },
        pm10: { title: "PM10",  labels, values: curr.map((d) => Math.round(d.pm10p0 || 0)), current: avgField(curr, "pm10p0"), trend: calcTrend(curr.map((d) => d.pm10p0 || 0), prevData.map((d) => d.pm10p0 || 0)), min: safeMin(mm10), max: safeMax(mm10) },
      };

      const noiseData = { current: avgField(curr, "dba"), labels, values: curr.map((d) => Math.round(d.dba || 0)) };
      const tempData  = { labels, values: curr.map((d) => Math.round(d.temperature || 0)), current: avgField(curr, "temperature"), trend: calcTrend(curr.map((d) => d.temperature || 0), prevData.map((d) => d.temperature || 0)) };
      
      const humidityData = { labels, values: curr.map((d) => Math.round(d.humidity || 0)), current: avgField(curr, "humidity"), trend: calcTrend(curr.map((d) => d.humidity || 0), prevData.map((d) => d.humidity || 0)) };
      const co2Data = { labels, values: curr.map((d) => Math.round(d.co2 || 0)), current: avgField(curr, "co2"), trend: calcTrend(curr.map((d) => d.co2 || 0), prevData.map((d) => d.co2 || 0)) };
      const noxData = { labels, values: curr.map((d) => Math.round(d.nox || 0)), current: avgField(curr, "nox"), trend: calcTrend(curr.map((d) => d.nox || 0), prevData.map((d) => d.nox || 0)) };
      const vocData = { labels, values: curr.map((d) => Math.round(d.voc || 0)), current: avgField(curr, "voc"), trend: calcTrend(curr.map((d) => d.voc || 0), prevData.map((d) => d.voc || 0)) };

      const statuses = {
        pm1:   statusFor(pmData.pm1.current,   THRESHOLDS.pm1,  "pm25"),
        pm25:  statusFor(pmData.pm25.current,  THRESHOLDS.pm25, "pm25"),
        pm5:   statusFor(pmData.pm5.current,   THRESHOLDS.pm5,  "pm25"),
        pm10:  statusFor(pmData.pm10.current,  THRESHOLDS.pm10, "pm10"),
        noise: statusFor(noiseData.current,    THRESHOLDS.noise, "noise"),
        temp:  statusFor(tempData.current,     THRESHOLDS.temperature),
        humidity: statusFor(humidityData.current, THRESHOLDS.humidity),
        co2:   statusFor(co2Data.current,      THRESHOLDS.co2),
        nox:   statusFor(noxData.current,      THRESHOLDS.nox),
        voc:   statusFor(vocData.current,      THRESHOLDS.voc),
      };

      const fLabels = fCurr.map((item) =>
        new Date(item.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" })
      );
      const forecastPmData = {
        pm1:  { title: "PM1.0", labels: fLabels, values: fCurr.map((d) => Math.round(d.pm1p0  || 0)), current: avgField(fCurr, "pm1p0") },
        pm25: { title: "PM2.5", labels: fLabels, values: fCurr.map((d) => Math.round(d.pm2p5  || 0)), current: avgField(fCurr, "pm2p5") },
        pm5:  { title: "PM4.0", labels: fLabels, values: fCurr.map((d) => Math.round(d.pm4p0  || 0)), current: avgField(fCurr, "pm4p0") },
        pm10: { title: "PM10",  labels: fLabels, values: fCurr.map((d) => Math.round(d.pm10p0 || 0)), current: avgField(fCurr, "pm10p0") },
      };
      const forecastNoiseData  = { labels: fLabels, values: fCurr.map((d) => Math.round(d.dba         || 0)), current: avgField(fCurr, "dba") };
      const forecastTempData   = { labels: fLabels, values: fCurr.map((d) => Math.round(d.temperature || 0)), current: avgField(fCurr, "temperature") };
      const forecastHumData    = { labels: fLabels, values: fCurr.map((d) => Math.round(d.humidity    || 0)), current: avgField(fCurr, "humidity") };
      const forecastCo2Data    = { labels: fLabels, values: fCurr.map((d) => Math.round(d.co2         || 0)), current: avgField(fCurr, "co2") };
      const forecastNoxData    = { labels: fLabels, values: fCurr.map((d) => Math.round(d.nox         || 0)), current: avgField(fCurr, "nox") };
      const forecastVocData    = { labels: fLabels, values: fCurr.map((d) => Math.round(d.voc         || 0)), current: avgField(fCurr, "voc") };

      setDashData({
        pmData, noiseData, tempData, humidityData, co2Data, noxData, vocData,
        forecastPmData, forecastNoiseData, forecastTempData, forecastHumData, forecastCo2Data, forecastNoxData, forecastVocData,
        hourlyData: hourly,
        last7HourlyData: last7Hourly,
        summary: {
          compliant:    Object.values(statuses).filter((s) => s === "Green").length,
          warnings:     Object.values(statuses).filter((s) => s === "Yellow" || s === "Orange").length,
          nonCompliant: Object.values(statuses).filter((s) => s === "Red").length,
        },
        table: [
          { parameter: "PM1.0", status: statuses.pm1,   exceedances: hourly.filter((d) => (d.pm1p0  || 0) > THRESHOLDS.pm1).length },
          { parameter: "PM2.5", status: statuses.pm25,  exceedances: hourly.filter((d) => (d.pm2p5  || 0) > THRESHOLDS.pm25).length },
          { parameter: "PM4.0", status: statuses.pm5,   exceedances: hourly.filter((d) => (d.pm4p0  || 0) > THRESHOLDS.pm5).length },
          { parameter: "PM10",  status: statuses.pm10,  exceedances: hourly.filter((d) => (d.pm10p0 || 0) > THRESHOLDS.pm10).length },
          { parameter: "Noise", status: statuses.noise, exceedances: hourly.filter((d) => (d.dba    || 0) > THRESHOLDS.noise).length },
          { parameter: "Humidity", status: statuses.humidity, exceedances: hourly.filter((d) => (d.humidity || 0) > THRESHOLDS.humidity).length },
          ...(hourly.some((d) => (d.co2 || 0) > 0) ? [{ parameter: "CO2", status: statuses.co2, exceedances: hourly.filter((d) => (d.co2 || 0) > THRESHOLDS.co2).length }] : []),
          { parameter: "NOx",   status: statuses.nox,   exceedances: THRESHOLDS.nox !== null ? hourly.filter((d) => (d.nox || 0) > THRESHOLDS.nox).length : "—" },
          { parameter: "VOC",   status: statuses.voc,   exceedances: THRESHOLDS.voc !== null ? hourly.filter((d) => (d.voc || 0) > THRESHOLDS.voc).length : "—" },
        ],
      });

    } catch (err) {
      console.error("❌ Fetch error:", err.response?.status, err.message);
      if (err.response?.status === 404) {
        setError(`404: Endpoint not found. The URL "${BASE}/api/nodedata/aggregated" doesn't exist — check your backend routes.`);
      } else if (err.response?.status === 401) {
        setError("401: Unauthorized — try logging in again.");
      } else if (err.code === "ERR_NETWORK") {
        setError("Network error — backend is unreachable.");
      } else {
        setError(`Error ${err.response?.status || ""}: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const applyPreset = (preset) => {
    const today = new Date();
    let s, e, label;
    switch (preset) {
      case "today":   s = e = formatDate(today); label = "Today"; break;
      case "week":    { const w = new Date(today); w.setDate(w.getDate() - 7); s = formatDate(w); e = formatDate(today); label = "Last 7 Days"; break; }
      case "month":   s = formatDate(new Date(today.getFullYear(), today.getMonth(), 1)); e = formatDate(new Date(today.getFullYear(), today.getMonth() + 1, 0)); label = "This Month"; break;
      case "quarter": { const q = Math.floor(today.getMonth() / 3); s = formatDate(new Date(today.getFullYear(), q * 3, 1)); e = formatDate(new Date(today.getFullYear(), q * 3 + 3, 0)); label = "This Quarter"; break; }
      case "year":    s = formatDate(new Date(today.getFullYear(), 0, 1)); e = formatDate(new Date(today.getFullYear(), 11, 31)); label = "This Year"; break;
      default: return;
    }
    setStartDate(s); setEndDate(e); setDateLabel(label); setAnchor(null);
  };

  const handleDownloadReport = () => {
    setDownloadLoading(true);
    // Dummy — backend will be wired later
    setTimeout(() => setDownloadLoading(false), 1500);
  };

  // Generate next 7 days starting from tomorrow
  const getNextWeekDates = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(tomorrow);
      d.setDate(tomorrow.getDate() + i);
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    });
  };

  const forecastWeekLabels = getNextWeekDates();
  const forecastWeekRange = (() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const end = new Date(tomorrow);
    end.setDate(tomorrow.getDate() + 6);
    const fmt = (d) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return `${fmt(tomorrow)} – ${fmt(end)}, ${end.getFullYear()}`;
  })();

  // Forecast always uses the dedicated last-7-days fetch — never depends on selected period
  const forecastHourlyData = dashData?.last7HourlyData || [];

  // Forecast noise avg — from dedicated fCurr last-7-days fetch
  const forecastNoiseAvg = dashData?.forecastNoiseData?.values?.length
    ? Math.round(dashData.forecastNoiseData.values.reduce((s, v) => s + v, 0) / dashData.forecastNoiseData.values.length)
    : 0;

  // Build forecast exceedance data (projected next-week hourly-like rows)
  const getForecastExceedanceData = (hourlyData) => {
    if (!hourlyData || hourlyData.length === 0) return [];
    const sample = hourlyData.slice(-24);
    const fields = ["pm1p0","pm2p5","pm4p0","pm10p0","dba","humidity","co2"];
    const nullThresholdFields = ["nox","voc"];
    return forecastWeekLabels.flatMap((dayLabel) =>
      Array.from({ length: 24 }, (_, h) => {
        const base = sample[h % sample.length] || {};
        const row = { timestamp: `Forecast ${dayLabel} ${String(h).padStart(2,'0')}:00` };
        fields.forEach((f) => { row[f] = Math.round(base[f] || 0); });
        nullThresholdFields.forEach((f) => { row[f] = 0; });
        return row;
      })
    );
  };

  const applyCustomRange = () => {
    const s = new Date(startDate); 
    const e = new Date(endDate);
    const sm = s.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const em = e.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const sy = s.getFullYear(); 
    const ey = e.getFullYear();
    
    if (sy === ey) {
      setDateLabel(`${sm} - ${em}, ${sy}`);
    } else {
      setDateLabel(`${sm}, ${sy} - ${em}, ${ey}`);
    }
    setAnchor(null);
  };

  return (
    <Box
      onMouseMove={(e) => {
        e.currentTarget.style.setProperty('--mouse-x', `${e.clientX}px`);
        e.currentTarget.style.setProperty('--mouse-y', `${e.clientY}px`);
      }}
      sx={{
        minHeight: "100vh",
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #e0f2fe 0%, #dbeafe 50%, #e0e7ff 100%)',
        p: { xs: 2, md: 3 },
        '--mouse-x': '50%',
        '--mouse-y': '50%',
      }}>

      {/* Multi-layer mouse spotlight */}
      <Box
        sx={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          zIndex: 0,
          pointerEvents: 'none',
          background: `
            radial-gradient(280px circle at var(--mouse-x, 50%) var(--mouse-y, 50%),
              rgba(59, 130, 246, 0.22),
              transparent 70%),
            radial-gradient(500px circle at var(--mouse-x, 50%) var(--mouse-y, 50%),
              rgba(99, 102, 241, 0.12),
              transparent 70%),
            radial-gradient(800px circle at var(--mouse-x, 50%) var(--mouse-y, 50%),
              rgba(14, 165, 233, 0.07),
              transparent 70%)
          `,
          transition: 'background 0.08s ease',
        }}
      />

      {/* Animated floating orbs */}
      <Box sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0,
        '@keyframes float': {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(30px, -30px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
        },
        '& > div': {
          position: 'absolute',
          borderRadius: '50%',
          filter: 'blur(80px)',
          opacity: 0.3,
          animation: 'float 20s ease-in-out infinite',
        },
        '& > div:nth-of-type(1)': {
          width: '400px',
          height: '400px',
          background: 'rgba(59, 130, 246, 0.4)',
          top: '10%',
          left: '10%',
        },
        '& > div:nth-of-type(2)': {
          width: '350px',
          height: '350px',
          background: 'rgba(99, 102, 241, 0.3)',
          top: '60%',
          right: '10%',
          animationDelay: '7s',
        },
        '& > div:nth-of-type(3)': {
          width: '300px',
          height: '300px',
          background: 'rgba(14, 165, 233, 0.3)',
          bottom: '10%',
          left: '40%',
          animationDelay: '14s',
        },
      }}>
        <div></div>
        <div></div>
        <div></div>
      </Box>

      {/* Subtle grid pattern */}
      <Box sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `
          linear-gradient(rgba(59, 130, 246, 0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(59, 130, 246, 0.03) 1px, transparent 1px)
        `,
        backgroundSize: '50px 50px',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1 }}>

        {/* Filter Bar */}
        <Paper sx={filterBarSx}>
          <Grid container spacing={3} alignItems="center">

            {/* Sensor Selector */}
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel sx={labelSx}>Sensor</InputLabel>
                <Select value={sensorId} label="Sensor" onChange={(e) => setSensorId(e.target.value)} sx={selectSx} disabled={loading || stationsLoading}>
                  {stationsLoading
                    ? <MenuItem disabled>Loading sensors...</MenuItem>
                    : sensorOptions.map((opt) => (
                        <MenuItem key={opt.id} value={opt.id}>{opt.label}</MenuItem>
                      ))
                  }
                </Select>
              </FormControl>
            </Grid>

            {/* Date Range Picker */}
            <Grid item xs={12} sm={6} md={3}>
              <Box
                onClick={loading ? undefined : (e) => setAnchor(e.currentTarget)}
                sx={{
                  bgcolor: loading ? '#cbd5e1' : '#667eea',
                  color: 'white',
                  borderRadius: 3,
                  px: 2.5,
                  py: 1,
                  border: `2px solid ${loading ? '#cbd5e1' : '#667eea'}`,
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                  cursor: loading ? 'default' : 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  width: '100%',
                  '&:hover': loading ? {} : { 
                    bgcolor: '#5568d3', 
                    borderColor: '#5568d3',
                    boxShadow: '0 6px 16px rgba(102, 126, 234, 0.4)',
                    transform: 'translateY(-2px)'
                  },
                }}
              >
                <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', opacity: 0.8, lineHeight: 1 }}>
                  📅 Click to Select Dates
                </Typography>
                <Typography sx={{ fontSize: '0.88rem', fontWeight: 600, mt: 0.4, lineHeight: 1.2 }}>
                  {dateLabel}
                </Typography>
              </Box>
            </Grid>

            {/* Logo Space */}
            <Grid item xs={12} md={4}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                gap: 3,
                height: '100%'
              }}>
                <Box 
                  component="img"
                  src={sacaqmLogo}
                  alt="SACAQM AIR Logo"
                  sx={{
                    height: 50,
                    objectFit: 'contain',
                    filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.1))'
                  }}
                />
                
                <Box sx={{ 
                  width: 2, 
                  height: 40, 
                  bgcolor: 'rgba(59, 130, 246, 0.3)',
                  borderRadius: 1
                }} />
                
                <Box 
                  component="img"
                  src={airsynqLogo}
                  alt="AirSynQ Systems Logo"
                  sx={{
                    height: 40,
                    objectFit: 'contain',
                    filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.1))'
                  }}
                />
              </Box>
            </Grid>

            {/* Download & Forecast Buttons */}
            <Grid item xs={12} md={2}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {/* Download Report */}
                <Button
                  fullWidth
                  onClick={handleDownloadReport}
                  disabled={downloadLoading || !dashData}
                  startIcon={downloadLoading ? <CircularProgress size={14} sx={{ color: 'white' }} /> : <span>⬇️</span>}
                  sx={{
                    bgcolor: '#0ea5e9',
                    color: 'white',
                    borderRadius: 3,
                    py: 1,
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    textTransform: 'none',
                    boxShadow: '0 4px 12px rgba(14, 165, 233, 0.3)',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: '#0284c7',
                      boxShadow: '0 6px 16px rgba(14, 165, 233, 0.4)',
                      transform: 'translateY(-2px)'
                    },
                    '&:disabled': { bgcolor: '#cbd5e1', color: 'white' }
                  }}
                >
                  {downloadLoading ? 'Generating...' : 'Download Report'}
                </Button>

                {/* Forecast Toggle */}
                <Button
                  fullWidth
                  onClick={() => setShowForecast((prev) => !prev)}
                  disabled={!dashData}
                  startIcon={<span>🔮</span>}
                  sx={{
                    bgcolor: showForecast ? '#8b5cf6' : 'white',
                    color: showForecast ? 'white' : '#8b5cf6',
                    borderRadius: 3,
                    py: 1,
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    textTransform: 'none',
                    border: '2px solid #8b5cf6',
                    boxShadow: showForecast ? '0 4px 12px rgba(139, 92, 246, 0.4)' : '0 2px 8px rgba(139, 92, 246, 0.1)',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: showForecast ? '#7c3aed' : 'rgba(139, 92, 246, 0.08)',
                      boxShadow: '0 6px 16px rgba(139, 92, 246, 0.3)',
                      transform: 'translateY(-2px)'
                    },
                    '&:disabled': { bgcolor: '#f1f5f9', borderColor: '#e2e8f0', color: '#94a3b8' }
                  }}
                >
                  {showForecast ? 'Hide Forecast' : 'Show Forecast'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Date Range Popover */}
        <Popover open={Boolean(anchor)} anchorEl={anchor} onClose={() => setAnchor(null)}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
          sx={{ "& .MuiPaper-root": { borderRadius: 3, boxShadow: "0 12px 40px rgba(0,0,0,0.15)", p: 3, mt: 1 } }}>
          <Box sx={{ minWidth: 450 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, color: "#1e293b", fontSize: '1.1rem' }}>
              📅 Select Date Range
            </Typography>
            
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', mb: 1, textTransform: 'uppercase' }}>
              Quick Selection
            </Typography>
            <Box sx={{ display: "flex", gap: 1, mb: 3, flexWrap: "wrap" }}>
              <Button size="small" onClick={() => applyPreset('today')} sx={{...presetSx, minWidth: 80}}>Today</Button>
              <Button size="small" onClick={() => applyPreset('week')} sx={{...presetSx, minWidth: 80}}>Last 7 Days</Button>
              <Button size="small" onClick={() => applyPreset('month')} sx={{...presetSx, minWidth: 80}}>This Month</Button>
              <Button size="small" onClick={() => applyPreset('quarter')} sx={{...presetSx, minWidth: 80}}>This Quarter</Button>
              <Button size="small" onClick={() => applyPreset('year')} sx={{...presetSx, minWidth: 80}}>This Year</Button>
            </Box>
            
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', mb: 1, textTransform: 'uppercase' }}>
              Custom Range
            </Typography>
            <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
              <TextField 
                label="Start Date" 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)} 
                fullWidth 
                size="small" 
                InputLabelProps={{ shrink: true }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#667eea' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#667eea' }
                  }
                }}
              />
              <TextField 
                label="End Date" 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)} 
                inputProps={{ min: startDate }} 
                fullWidth 
                size="small" 
                InputLabelProps={{ shrink: true }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#667eea' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#667eea' }
                  }
                }}
              />
            </Box>
            
            <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
              <Button 
                onClick={() => setAnchor(null)} 
                sx={{ 
                  textTransform: "none", 
                  color: '#64748b',
                  '&:hover': { bgcolor: '#f1f5f9' }
                }}
              >
                Cancel
              </Button>
              <Button 
                variant="contained" 
                onClick={applyCustomRange} 
                sx={{ 
                  bgcolor: "#667eea", 
                  textTransform: "none", 
                  px: 4, 
                  fontWeight: 600,
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                  "&:hover": { 
                    bgcolor: "#5568d3",
                    boxShadow: '0 6px 16px rgba(102, 126, 234, 0.4)'
                  } 
                }}
              >
                Apply
              </Button>
            </Box>
          </Box>
        </Popover>

        {/* Loading */}
        {loading && (
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", my: 8 }}>
            <CircularProgress size={60} sx={{ color: "#3b82f6" }} />
            <Typography sx={{ mt: 2, color: "#3b82f6", fontWeight: 600 }}>Loading dashboard data...</Typography>
          </Box>
        )}

        {/* Error */}
        {error && !loading && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Dashboard Content */}
        {!loading && dashData && (
          <>
            {/* Forecast Banner */}
            {showForecast && (
              <Box sx={{
                mb: 3, p: 2.5, borderRadius: 3,
                background: 'linear-gradient(135deg, rgba(139,92,246,0.14), rgba(99,102,241,0.1))',
                border: '1.5px solid rgba(139,92,246,0.35)',
                display: 'flex', alignItems: 'center', gap: 2,
                boxShadow: '0 4px 20px rgba(139,92,246,0.12)',
              }}>
                <span style={{ fontSize: '1.8rem' }}>🤖</span>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                    <Typography sx={{ fontWeight: 800, fontSize: '1.15rem', color: '#5b21b6', letterSpacing: '0.2px' }}>
                      AI Forecast Mode Active
                    </Typography>
                    <Box sx={{
                      px: 1.5, py: 0.25, borderRadius: 10,
                      background: 'linear-gradient(90deg, #7c3aed, #6366f1)',
                      display: 'inline-flex', alignItems: 'center', gap: 0.5,
                    }}>
                      <span style={{ fontSize: '0.7rem' }}>✦</span>
                      <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: 'white', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                        Powered by AI
                      </Typography>
                    </Box>
                  </Box>
                  <Typography sx={{ fontSize: '0.95rem', color: '#6d28d9', mt: 0.4 }}>
                    Showing AI-generated forecasts for next week&nbsp;
                    <Box component="span" sx={{ fontWeight: 700, color: '#5b21b6' }}>
                      ({forecastWeekRange})
                    </Box>
                  </Typography>
                </Box>
              </Box>
            )}

              <Box sx={{ mb: 3 }}>
                <StationMap />
              </Box>

            {/* ROW 1: Exceedances by Parameter & Severity */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12}>
                <Box sx={fadeIn(0)}>
                  <ExceedancesTable 
                    hourlyData={showForecast ? forecastHourlyData : dashData.hourlyData}
                    thresholds={THRESHOLDS}
                    isForecast={showForecast}
                    forecastWeekLabels={forecastWeekLabels}
                  />
                </Box>
              </Grid>
            </Grid>
            
            {/* ROW 2: Exceedances Over Time Chart */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12}>
                <Box sx={fadeIn(0.1)}>
                  <ExceedancesOverTimeChart 
                    hourlyData={showForecast ? forecastHourlyData : dashData.hourlyData}
                    thresholds={THRESHOLDS}
                    isForecast={showForecast}
                    forecastWeekLabels={forecastWeekLabels}
                    forecastWeekRange={showForecast ? forecastWeekRange : null}
                  />
                </Box>
              </Grid>
            </Grid>

            {/* ROW 3: Severity Breakdown Charts */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} md={4}>
                <Box sx={fadeIn(0.15)}>
                  <ExceedancesSeverityChart 
                    hourlyData={showForecast ? forecastHourlyData : dashData.hourlyData}
                    thresholds={THRESHOLDS}
                    severity="moderate"
                    title={showForecast ? "Moderate Exceedances (Forecast)" : "Moderate Exceedances"}
                    color="#fbbf24"
                    isForecast={showForecast}
                    forecastWeekLabels={forecastWeekLabels}
                  />
                </Box>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Box sx={fadeIn(0.16)}>
                  <ExceedancesSeverityChart 
                    hourlyData={showForecast ? forecastHourlyData : dashData.hourlyData}
                    thresholds={THRESHOLDS}
                    severity="high"
                    title={showForecast ? "High Exceedances (Forecast)" : "High Exceedances"}
                    color="#fb923c"
                    isForecast={showForecast}
                    forecastWeekLabels={forecastWeekLabels}
                  />
                </Box>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Box sx={fadeIn(0.17)}>
                  <ExceedancesSeverityChart 
                    hourlyData={showForecast ? forecastHourlyData : dashData.hourlyData}
                    thresholds={THRESHOLDS}
                    severity="veryHigh"
                    title={showForecast ? "Very High Exceedances (Forecast)" : "Very High Exceedances"}
                    color="#ef4444"
                    isForecast={showForecast}
                    forecastWeekLabels={forecastWeekLabels}
                  />
                </Box>
              </Grid>
            </Grid>

            {/* ROW 4: PM Widgets */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              {Object.entries(dashData.pmData).map(([key, widget], idx) => {
                const fWidget = dashData.forecastPmData?.[key];
                const display = showForecast && fWidget
                  ? { ...fWidget, labels: forecastWeekLabels.slice(0, fWidget.labels.length) }
                  : widget;
                return (
                  <Grid item xs={12} sm={6} lg={3} key={key}>
                    <Box sx={fadeIn(0.2 + idx * 0.1)}>
                      <PMWidget 
                        title={showForecast ? `${widget.title} (Forecast)` : widget.title}
                        labels={display.labels} 
                        dataPoints={display.values} 
                        threshold={THRESHOLDS[key]}
                        paramKey={key === 'pm10' ? 'pm10' : 'pm25'}
                        trend={widget.trend} 
                      />
                    </Box>
                  </Grid>
                );
              })}
            </Grid>

            {/* ROW 5: Noise */}
            <Grid container spacing={3} sx={{ mb: 3, alignItems: 'stretch' }}>
              <Grid item xs={12} md={4} sx={{ display: 'flex' }}>
                <Box sx={{ ...fadeIn(0.6), display: 'flex', flex: 1, width: '100%' }}>
                  <NoiseGauge 
                    value={showForecast ? forecastNoiseAvg : (realtimeNoise ?? dashData.noiseData.current)}
                    subLabel={showForecast ? "Forecast Period Average" : "Daily Average"}
                  />
                </Box>
              </Grid>
              <Grid item xs={12} md={8} sx={{ display: 'flex' }}>
                <Box sx={{ ...fadeIn(0.65), display: 'flex', flex: 1, width: '100%' }}>
                  {(() => { const nd = showForecast && dashData.forecastNoiseData ? {...dashData.forecastNoiseData, labels: forecastWeekLabels.slice(0, dashData.forecastNoiseData.labels.length)} : dashData.noiseData; return (
                  <NoiseWidget 
                    title={showForecast ? "Noise Levels (Forecast)" : "Noise Levels Over Time"}
                    labels={nd.labels}
                    data={nd.values}
                    threshold={THRESHOLDS.noise}
                  />
                  ); })()}
                </Box>
              </Grid>
            </Grid>

            {/* ROW 6: Environmental Parameters */}
            <Grid container spacing={3} sx={{ mb: 3 }}>              
              <Grid item xs={12} md={dashData.co2Data.values.some(v => v > 0) ? 4 : 6}>
                <Box sx={fadeIn(0.7)}>
                  {(() => { const d = showForecast && dashData.forecastTempData ? {...dashData.forecastTempData, labels: forecastWeekLabels.slice(0, dashData.forecastTempData.labels.length)} : dashData.tempData; return (
                  <TempWidget 
                    title={showForecast ? "Temperature (Forecast)" : "Temperature"}
                    labels={d.labels} 
                    data={d.values} 
                    threshold={THRESHOLDS.temperature} 
                  />
                  ); })()}
                </Box>
              </Grid>
              
              <Grid item xs={12} md={dashData.co2Data.values.some(v => v > 0) ? 4 : 6}>
                <Box sx={fadeIn(0.8)}>
                  {(() => { const d = showForecast && dashData.forecastHumData ? {...dashData.forecastHumData, labels: forecastWeekLabels.slice(0, dashData.forecastHumData.labels.length)} : dashData.humidityData; return (
                  <ParameterWidget 
                    title={showForecast ? "Humidity (Forecast)" : "Humidity"}
                    labels={d.labels} 
                    data={d.values} 
                    threshold={THRESHOLDS.humidity}
                    unit="%" 
                  />
                  ); })()}
                </Box>
              </Grid>

              {dashData.co2Data.values.some(v => v > 0) && (
                <Grid item xs={12} md={4}>
                  <Box sx={fadeIn(0.9)}>
                    {(() => { const d = showForecast && dashData.forecastCo2Data ? {...dashData.forecastCo2Data, labels: forecastWeekLabels.slice(0, dashData.forecastCo2Data.labels.length)} : dashData.co2Data; return (
                    <ParameterWidget 
                      title={showForecast ? "CO2 (Forecast)" : "CO2"}
                      labels={d.labels} 
                      data={d.values} 
                      threshold={THRESHOLDS.co2}
                      unit=" ppm" 
                    />
                    ); })()}
                  </Box>
                </Grid>
              )}
            </Grid>

            {/* ROW 7: NOx, VOC */}
            <Grid container spacing={3}>              
              <Grid item xs={12} md={6}>
                <Box sx={fadeIn(1.0)}>
                  {(() => { const d = showForecast && dashData.forecastNoxData ? {...dashData.forecastNoxData, labels: forecastWeekLabels.slice(0, dashData.forecastNoxData.labels.length)} : dashData.noxData; return (
                  <ParameterWidget 
                    title={showForecast ? "NOx (Forecast)" : "NOx"}
                    labels={d.labels} 
                    data={d.values} 
                    threshold={THRESHOLDS.nox}
                    unit=""
                  />
                  ); })()}
                </Box>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Box sx={fadeIn(1.1)}>
                  {(() => { const d = showForecast && dashData.forecastVocData ? {...dashData.forecastVocData, labels: forecastWeekLabels.slice(0, dashData.forecastVocData.labels.length)} : dashData.vocData; return (
                  <ParameterWidget 
                    title={showForecast ? "VOC (Forecast)" : "VOC"}
                    labels={d.labels} 
                    data={d.values} 
                    threshold={THRESHOLDS.voc}
                    unit=""
                  />
                  ); })()}
                </Box>
              </Grid>
            </Grid>
          </>
        )}
      </Container>
    </Box>
  );
}