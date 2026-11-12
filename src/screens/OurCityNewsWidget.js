// OurCityNewsWidget.js
// SACAQM Air Quality News Widget – complete self-contained screen
// All sub-components defined in this single file.

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";
import {
  Box,
  Typography,
  CircularProgress,
  Slider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  Modal,
  IconButton,
  Chip,
  Divider,
  Snackbar,
  Alert,
  Tooltip as MuiTooltip,
} from "@mui/material";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
const API_BASE = (process.env.REACT_APP_API_BASE || "https://try-again-test-isaiah.app.cern.ch").replace(/\/$/, "");
const NEWS_WIDGET_BASE_URL = (process.env.REACT_APP_WIDGET_BASE_URL || window.location.origin).replace(/\/$/, "");
const WIDGET_TYPES = ["current-aqi", "pollutants", "trend", "alert", "station-info", "station-selector", "worst-stations"];
const WIDGET_OPTIONS = [
  { value: "current-aqi", label: "Current air quality", description: "Latest PM2.5 reading and air quality category." },
  { value: "pollutants", label: "Pollutant breakdown", description: "Latest readings across the available pollutants." },
  { value: "trend", label: "Pollution trend", description: "Historical readings over a selectable time range." },
  { value: "alert", label: "Air quality alert", description: "Shows a notice when PM2.5 exceeds the alert level." },
  { value: "station-info", label: "Station information", description: "Location and details for a monitoring station." },
  { value: "station-selector", label: "Choose a station", description: "Lets readers choose a station and view its latest air quality." },
  { value: "worst-stations", label: "Highest pollution stations", description: "Shows the highest PM2.5 stations and rotates through them automatically." },
];
const TIME_RANGES = ["24h", "7d", "30d"];
const REFRESH_INTERVALS = [60, 120, 300];
const POLLUTANT_QUERY_KEYS = {
  pm2p5: "pm2p5",
  pm10: "pm10p0",
  pm10p0: "pm10p0",
  pm1p0: "pm1p0",
  nox: "nox",
  voc: "voc",
  co2: "co2",
};
const STATION_SLUGS = {
  slovoville: ["slovoville"],
  thulani: ["thulani"],
  "origin-centre": ["origin centre", "origin_centre"],
  "jb-marks": ["jb marks secondary", "j.b. marks secondary"],
  "ithemba-labs": ["ithemba labs", "ithemba labs 1"],
  milpark: ["milpark netcare"],
  lufhereng: ["lufhereng"],
};

function normalizeStationName(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function findStation(stations, identifier) {
  if (!identifier) return stations[0] || null;
  const requested = normalizeStationName(identifier);
  const aliases = (STATION_SLUGS[identifier.toLowerCase()] || []).map(
    normalizeStationName
  );
  return (
    stations.find(
      (station) =>
        String(station._id) === identifier ||
        normalizeStationName(station.slug) === requested ||
        normalizeStationName(station.name) === requested ||
        aliases.includes(normalizeStationName(station.name))
    ) || null
  );
}

function parseWidgetConfig(search) {
  const params = new URLSearchParams(search);
  const requestedWidget = params.get("widget") || "current-aqi";
  const requestedTheme = params.get("theme") || "light";
  const requestedPollutant = (params.get("pollutant") || "pm2p5").toLowerCase();
  const requestedRange = (params.get("timerange") || "24h").toLowerCase();
  const requestedRefresh = Number(params.get("refresh") || 120);
  const warnings = [];

  const widgetType = WIDGET_TYPES.includes(requestedWidget)
    ? requestedWidget
    : "current-aqi";
  if (widgetType !== requestedWidget) {
    warnings.push(`Unsupported widget "${requestedWidget}". Showing Current Air Quality.`);
  }

  const theme = ["light", "dark"].includes(requestedTheme)
    ? requestedTheme
    : "light";
  if (theme !== requestedTheme) {
    warnings.push(`Unsupported theme "${requestedTheme}". Using light theme.`);
  }

  const pollutant = POLLUTANT_QUERY_KEYS[requestedPollutant] || "pm2p5";
  if (!POLLUTANT_QUERY_KEYS[requestedPollutant]) {
    warnings.push(`Unsupported pollutant "${requestedPollutant}". Using PM2.5.`);
  }

  const timeRange = TIME_RANGES.includes(requestedRange)
    ? requestedRange
    : "24h";
  if (timeRange !== requestedRange) {
    warnings.push(`Unsupported time range "${requestedRange}". Using 24h.`);
  }

  const refreshSeconds = REFRESH_INTERVALS.includes(requestedRefresh)
    ? requestedRefresh
    : 120;
  if (refreshSeconds !== requestedRefresh) {
    warnings.push("Refresh must be 60, 120, or 300 seconds. Using 120 seconds.");
  }

  return {
    station: params.get("station"),
    widgetType,
    embed: params.get("embed") === "1",
    theme,
    pollutant,
    timeRange,
    refreshSeconds,
    warnings,
  };
}

const COLORS = {
  navyDark: "#1a1a2e",
  red: "#e63946",
  bg: "#f8f9fa",
  white: "#ffffff",
  widgetBorder: "1px solid #e2e8f0",
  widgetShadow: "0 2px 12px rgba(0,0,0,0.08)",
  bodyText: "#2d3748",
  mutedLabel: "#64748b",
};

const DEMO_SCENARIOS = {
  Good: {
    pm2p5: 12,
    pm10p0: 22,
    pm1p0: 8,
    nox: 15,
    voc: 45,
    co2: 420,
    temperature: 22,
    humidity: 48,
  },
  Moderate: {
    pm2p5: 38,
    pm10p0: 65,
    pm1p0: 25,
    nox: 42,
    voc: 120,
    co2: 680,
    temperature: 26,
    humidity: 55,
  },
  Poor: {
    pm2p5: 72,
    pm10p0: 145,
    pm1p0: 48,
    nox: 87,
    voc: 220,
    co2: 890,
    temperature: 29,
    humidity: 62,
  },
  "Very Poor": {
    pm2p5: 145,
    pm10p0: 280,
    pm1p0: 98,
    nox: 168,
    voc: 380,
    co2: 1100,
    temperature: 31,
    humidity: 68,
  },
};

const DEMO_STATIONS = [
  {
    _id: "demo-slovoville",
    slug: "slovoville",
    name: "Slovoville",
    city: "Soweto",
    province: "Gauteng",
    latitude: -26.218879,
    longitude: 27.763986,
    sensorIds: ["SV-001"],
    lastSeen: new Date().toISOString(),
    visibility: "public",
  },
  {
    _id: "demo-thulani",
    slug: "thulani",
    name: "Thulani",
    city: "Soweto",
    province: "Gauteng",
    latitude: -26.216588,
    longitude: 27.827818,
    sensorIds: ["TH-001"],
    lastSeen: new Date().toISOString(),
    visibility: "public",
  },
  {
    _id: "demo-origin",
    slug: "origin-centre",
    name: "Origin Centre",
    city: "Johannesburg",
    province: "Gauteng",
    latitude: -26.193147,
    longitude: 28.028561,
    sensorIds: ["OC-001"],
    lastSeen: new Date().toISOString(),
    visibility: "public",
  },
  {
    _id: "demo-jbmarks",
    slug: "jb-marks",
    name: "J.B. Marks Secondary",
    city: "Johannesburg",
    province: "Gauteng",
    latitude: -26.204235,
    longitude: 27.858468,
    sensorIds: ["JB-001"],
    lastSeen: new Date().toISOString(),
    visibility: "public",
  },
  {
    _id: "demo-ithemba",
    slug: "ithemba-labs",
    name: "iThemba Labs",
    city: "Johannesburg",
    province: "Gauteng",
    latitude: -26.185896,
    longitude: 28.029644,
    sensorIds: ["IT-001"],
    lastSeen: new Date().toISOString(),
    visibility: "public",
  },
  {
    _id: "demo-milpark",
    slug: "milpark",
    name: "Milpark Netcare",
    city: "Johannesburg",
    province: "Gauteng",
    latitude: -26.181013,
    longitude: 28.017517,
    sensorIds: ["MN-001"],
    lastSeen: new Date().toISOString(),
    visibility: "public",
  },
  {
    _id: "demo-lufhereng",
    slug: "lufhereng",
    name: "Lufhereng",
    city: "Soweto",
    province: "Gauteng",
    latitude: -26.2395,
    longitude: 27.8009,
    sensorIds: ["LF-001"],
    lastSeen: new Date().toISOString(),
    visibility: "public",
  },
];

// ─────────────────────────────────────────────
// 1. classifyAQI
// ─────────────────────────────────────────────
function classifyAQI(pm25) {
  const v = Number(pm25);
  if (pm25 == null || !Number.isFinite(v))
    return {
      label: "Unavailable",
      color: "#94a3b8",
      bgColor: "#f1f5f9",
      textColor: "#475569",
      description: "No PM2.5 reading is available",
    };
  if (v <= 25)
    return {
      label: "Good",
      color: "#22c55e",
      bgColor: "#dcfce7",
      textColor: "#15803d",
      description: "Air quality is satisfactory",
    };
  if (v <= 50)
    return {
      label: "Moderate",
      color: "#eab308",
      bgColor: "#fef9c3",
      textColor: "#a16207",
      description: "Acceptable for most people",
    };
  if (v <= 100)
    return {
      label: "Poor",
      color: "#f97316",
      bgColor: "#ffedd5",
      textColor: "#c2410c",
      description: "Unhealthy for sensitive groups",
    };
  return {
    label: "Very Poor",
    color: "#ef4444",
    bgColor: "#fee2e2",
    textColor: "#b91c1c",
    description: "Unhealthy for all groups",
  };
}

// ─────────────────────────────────────────────
// Generate demo historical trend (24 hours)
// ─────────────────────────────────────────────
function generateDemoHistory(baseValues, field = "pm2p5", points = 24) {
  const base = baseValues[field] ?? baseValues.pm2p5 ?? 20;
  const now = Date.now();
  return Array.from({ length: points }, (_, i) => {
    const jitter = (Math.random() - 0.5) * base * 0.3;
    const sinWave = Math.sin((i / points) * Math.PI) * base * 0.2;
    return {
      timestamp: new Date(now - (points - i) * 3600 * 1000).toISOString(),
      [field]: Math.max(0, parseFloat((base + jitter + sinWave).toFixed(1))),
      pm2p5: Math.max(
        0,
        parseFloat(
          (
            (baseValues.pm2p5 ?? 20) +
            (Math.random() - 0.5) * (baseValues.pm2p5 ?? 20) * 0.3
          ).toFixed(1)
        )
      ),
      pm10p0: Math.max(
        0,
        parseFloat(
          (
            (baseValues.pm10p0 ?? 40) +
            (Math.random() - 0.5) * (baseValues.pm10p0 ?? 40) * 0.3
          ).toFixed(1)
        )
      ),
      nox: Math.max(
        0,
        parseFloat(
          (
            (baseValues.nox ?? 20) +
            (Math.random() - 0.5) * (baseValues.nox ?? 20) * 0.3
          ).toFixed(1)
        )
      ),
      co2: Math.max(
        300,
        parseFloat(
          (
            (baseValues.co2 ?? 420) +
            (Math.random() - 0.5) * 50
          ).toFixed(1)
        )
      ),
    };
  });
}

// ─────────────────────────────────────────────
// 2. useAirQualityData custom hook
// ─────────────────────────────────────────────
function useAirQualityData(
  stationId,
  demoMode,
  demoScenario,
  demoValues,
  timeRange
) {
  const [stations, setStations] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);
  const [latestReading, setLatestReading] = useState(null);
  const [historicalData, setHistoricalData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fetchTick, setFetchTick] = useState(0);

  const refetch = useCallback(() => setFetchTick((t) => t + 1), []);

  // Demo mode
  useEffect(() => {
    if (!demoMode) return;
    const baseScenario = DEMO_SCENARIOS[demoScenario] || DEMO_SCENARIOS.Good;
    const merged = { ...baseScenario, ...demoValues };
    setStations(DEMO_STATIONS);
    const st = findStation(DEMO_STATIONS, stationId);
    setSelectedStation(st);
    setLatestReading({ ...merged, timestamp: new Date().toISOString() });
    const historyPoints =
      timeRange === "30d" ? 720 : timeRange === "7d" ? 168 : 24;
    setHistoricalData(generateDemoHistory(merged, "pm2p5", historyPoints));
    setLoading(false);
    setError(null);
  }, [demoMode, demoScenario, demoValues, stationId, timeRange]);

  // Live mode
  useEffect(() => {
    if (demoMode) return;
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: stList } = await axios.get(`${API_BASE}/api/stations`);
        if (cancelled) return;
        const stationList = Array.isArray(stList) ? stList : stList?.stations;
        const pubStations = Array.isArray(stationList)
          ? stationList.filter((s) => s.visibility === "public" || !s.visibility)
          : [];
        setStations(pubStations);

        if (!pubStations.length) {
          setSelectedStation(null);
          setLatestReading(null);
          setHistoricalData([]);
          setError("No public monitoring stations are currently available.");
          setLoading(false);
          return;
        }

        const target = findStation(pubStations, stationId) || (!stationId ? pubStations[0] : null);
        if (!target) {
          if (stationId) {
            setError(`Station "${stationId}" was not found in the public network.`);
            setSelectedStation(null);
            setLatestReading(null);
            setHistoricalData([]);
          } else {
            setSelectedStation(pubStations[0]);
            setError(null);
          }
          setLoading(false);
          return;
        }
        setSelectedStation(target);

        const sensorId = Array.isArray(target.sensorIds) ? target.sensorIds[0] : null;

        // Fetch latest reading
        let sensorRaw;
        try {
          ({ data: sensorRaw } = await axios.get(
            `${API_BASE}/api/stations/${encodeURIComponent(target._id)}/sensorData?days=1`
          ));
        } catch (readingError) {
          if (sensorId) {
            const end = new Date().toISOString().split("T")[0];
            const { data } = await axios.get(`${API_BASE}/api/nodedata/aggregated`, {
              params: {
                sensor_id: sensorId,
                start: end,
                end,
                resolution: "hourly",
              },
            });
            sensorRaw = Array.isArray(data) ? data : data?.data || [];
          } else {
            throw readingError;
          }
        }
        if (cancelled) return;
        const readings = Array.isArray(sensorRaw) ? sensorRaw : sensorRaw?.data;
        const sorted = Array.isArray(readings)
          ? [...readings].sort(
              (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
            )
          : [];
        setLatestReading(sorted[0] || null);

        // Fetch historical aggregated
        if (sensorId) {
          const end = new Date().toISOString().split("T")[0];
          const days = timeRange === "24h" ? 1 : Number.parseInt(timeRange, 10);
          const startDate = new Date(Date.now() - days * 24 * 3600000)
            .toISOString()
            .split("T")[0];
          try {
            const { data: aggData } = await axios.get(
              `${API_BASE}/api/nodedata/aggregated`,
              { params: { sensor_id: sensorId, start: startDate, end, resolution: "hourly" } }
            );
            if (cancelled) return;
            const history = Array.isArray(aggData) ? aggData : aggData?.data;
            setHistoricalData(Array.isArray(history) ? history : []);
          } catch {
            if (cancelled) return;
            setHistoricalData([]);
          }
        } else {
          setHistoricalData([]);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.message ||
              err.message ||
              "Failed to fetch live air quality data. Please try again."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [demoMode, stationId, fetchTick, timeRange]);

  return {
    stations,
    selectedStation,
    latestReading,
    historicalData,
    loading,
    error,
    refetch,
  };
}

// ─────────────────────────────────────────────
// Skeleton placeholder
// ─────────────────────────────────────────────
function SkeletonBox({ w = "100%", h = 24, mb = 8, radius = 6 }) {
  return (
    <div
      style={{
        width: w,
        height: h,
        marginBottom: mb,
        borderRadius: radius,
        background: "linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.4s infinite",
      }}
    />
  );
}

// ─────────────────────────────────────────────
// Widget wrapper
// ─────────────────────────────────────────────
function WidgetCard({ children, accentColor = "#22c55e", style = {} }) {
  return (
    <div
      className="widget-card"
      style={{
        background: COLORS.white,
        borderRadius: 12,
        padding: "20px",
        boxShadow: COLORS.widgetShadow,
        border: COLORS.widgetBorder,
        borderTop: `3px solid ${accentColor}`,
        ...style,
      }}
    >
      {children}
      <div
        style={{
          marginTop: 12,
          fontSize: "0.68rem",
          color: "#94a3b8",
          textAlign: "right",
        }}
      >
        Powered by SACAQM · South African Clean Air Quality Monitoring
      </div>
    </div>
  );
}

function WidgetLabel({ children }) {
  return (
    <div
      style={{
        fontSize: "0.72rem",
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        color: COLORS.mutedLabel,
        fontFamily: "system-ui, sans-serif",
        marginBottom: 10,
        fontWeight: 600,
      }}
    >
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────
// 3. CurrentAQIWidget
// ─────────────────────────────────────────────
function CurrentAQIWidget({ data, loading, isDemo, station }) {
  const aqi = classifyAQI(data?.pm2p5);
  return (
    <WidgetCard accentColor={aqi.color}>
      <WidgetLabel>Current Air Quality Reading</WidgetLabel>
      {loading ? (
        <>
          <SkeletonBox h={80} mb={8} />
          <SkeletonBox w="60%" h={18} />
        </>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {/* Circle indicator */}
          <div
            style={{
              width: 90,
              height: 90,
              borderRadius: "50%",
              background: aqi.bgColor,
              border: `4px solid ${aqi.color}`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <span
              style={{
                fontSize: "1.5rem",
                fontWeight: 800,
                color: aqi.textColor,
                lineHeight: 1,
              }}
            >
              {Number.isFinite(Number(data?.pm2p5)) ? Number(data.pm2p5).toFixed(1) : "--"}
            </span>
            <span style={{ fontSize: "0.6rem", color: aqi.textColor }}>
              µg/m³
            </span>
          </div>

          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: "1.4rem",
                fontWeight: 700,
                color: aqi.color,
                marginBottom: 2,
              }}
            >
              {aqi.label}
            </div>
            <div
              style={{ fontSize: "0.9rem", color: COLORS.bodyText, marginBottom: 6 }}
            >
              {aqi.description}
            </div>
            <div style={{ fontSize: "0.78rem", color: COLORS.mutedLabel }}>
              📍 {station?.name || "Unknown Station"} ·{" "}
              {station?.city || ""}, {station?.province || ""}
            </div>
            <div style={{ fontSize: "0.74rem", color: "#94a3b8", marginTop: 4 }}>
              Updated:{" "}
              {data?.timestamp
                ? new Date(data.timestamp).toLocaleString()
                : "N/A"}
              {isDemo && (
                <span
                  style={{
                    marginLeft: 8,
                    background: "#fef9c3",
                    color: "#a16207",
                    padding: "1px 6px",
                    borderRadius: 4,
                    fontSize: "0.68rem",
                    fontWeight: 600,
                  }}
                >
                  DEMO
                </span>
              )}
            </div>
          </div>

          {/* Pollutant mini-grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "6px 16px",
            }}
          >
            {[
              { key: "pm1p0", label: "PM1.0", unit: "µg/m³" },
              { key: "pm10p0", label: "PM10", unit: "µg/m³" },
              { key: "nox", label: "NOx", unit: "ppb" },
              { key: "voc", label: "VOC", unit: "ppb" },
              { key: "co2", label: "CO₂", unit: "ppm" },
              { key: "temperature", label: "Temp", unit: "°C" },
            ].map(({ key, label, unit }) => (
              <div key={key}>
                <div
                  style={{ fontSize: "0.68rem", color: COLORS.mutedLabel }}
                >
                  {label}
                </div>
                <div
                  style={{
                    fontSize: "0.95rem",
                    fontWeight: 700,
                    color: COLORS.bodyText,
                  }}
                >
                  {data?.[key] != null ? data[key].toFixed(1) : "--"}
                  <span
                    style={{
                      fontSize: "0.6rem",
                      fontWeight: 400,
                      color: COLORS.mutedLabel,
                      marginLeft: 2,
                    }}
                  >
                    {unit}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </WidgetCard>
  );
}

// ─────────────────────────────────────────────
// 4. PollutantConcentrationsWidget
// ─────────────────────────────────────────────
const POLLUTANT_CONFIGS = [
  { key: "pm2p5", label: "PM2.5", unit: "µg/m³", max: 150, color: "#6366f1" },
  { key: "pm1p0", label: "PM1.0", unit: "µg/m³", max: 100, color: "#8b5cf6" },
  { key: "pm10p0", label: "PM10", unit: "µg/m³", max: 300, color: "#a855f7" },
  { key: "nox", label: "NOx", unit: "ppb", max: 200, color: "#f59e0b" },
  { key: "voc", label: "VOC", unit: "index", max: 500, color: "#10b981" },
  { key: "co2", label: "CO₂", unit: "ppm", max: 2000, color: "#0ea5e9" },
];

function PollutantConcentrationsWidget({
  data,
  loading,
  initialPollutant = "pm2p5",
}) {
  const [selected, setSelected] = useState(initialPollutant);
  useEffect(() => setSelected(initialPollutant), [initialPollutant]);
  const selConf = POLLUTANT_CONFIGS.find((p) => p.key === selected);

  const chartData = useMemo(() => {
    if (!data) return null;
    const vals = POLLUTANT_CONFIGS.map((p) => ({
      label: p.label,
      value: data[p.key] ?? 0,
      pct: Math.min(100, ((data[p.key] ?? 0) / p.max) * 100),
      color: p.color,
    }));
    return vals;
  }, [data]);

  const aqi = classifyAQI(data?.pm2p5);

  return (
    <WidgetCard accentColor={selConf?.color || "#6366f1"}>
      <WidgetLabel>Pollutant Breakdown</WidgetLabel>
      {loading ? (
        Array.from({ length: 6 }).map((_, i) => <SkeletonBox key={i} h={28} mb={10} />)
      ) : (
        <>
          {/* Selector */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 6,
              marginBottom: 16,
            }}
          >
            {POLLUTANT_CONFIGS.map((p) => (
              <button
                key={p.key}
                onClick={() => setSelected(p.key)}
                style={{
                  padding: "4px 10px",
                  borderRadius: 20,
                  border: `1px solid ${p.color}`,
                  background: selected === p.key ? p.color : "transparent",
                  color: selected === p.key ? "#fff" : p.color,
                  cursor: "pointer",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  transition: "all 0.15s",
                }}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Bar chart */}
          {chartData &&
            chartData.map(({ label, value, pct, color }) => (
              <div key={label} style={{ marginBottom: 10 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "0.78rem",
                    marginBottom: 3,
                  }}
                >
                  <span style={{ color: COLORS.bodyText, fontWeight: 600 }}>
                    {label}
                  </span>
                  <span style={{ color: COLORS.mutedLabel }}>
                    {value.toFixed(1)}{" "}
                    {POLLUTANT_CONFIGS.find((p) => p.label === label)?.unit}
                  </span>
                </div>
                <div
                  style={{
                    height: 8,
                    background: "#e2e8f0",
                    borderRadius: 4,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${pct}%`,
                      background: color,
                      borderRadius: 4,
                      transition: "width 0.6s ease",
                    }}
                  />
                </div>
              </div>
            ))}

          <div
            style={{
              marginTop: 10,
              padding: "8px 12px",
              background: aqi.bgColor,
              borderRadius: 8,
              fontSize: "0.78rem",
              color: aqi.textColor,
              fontWeight: 600,
            }}
          >
            Overall Air Quality: {aqi.label} · PM2.5 = {data?.pm2p5?.toFixed(1) ?? "--"} µg/m³
          </div>
        </>
      )}
    </WidgetCard>
  );
}

// ─────────────────────────────────────────────
// 5. AQTrendChart
// ─────────────────────────────────────────────
function AQTrendChart({
  data,
  loading,
  isDemo,
  pollutant,
  onPollutantChange,
  initialTimeRange = "24h",
}) {
  const [timeRange, setTimeRange] = useState(initialTimeRange);
  useEffect(() => setTimeRange(initialTimeRange), [initialTimeRange]);

  const chartPoints = useMemo(() => {
    if (!data || data.length === 0) return { labels: [], values: [] };
    const sorted = [...data].sort(
      (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
    );
    const points = timeRange === "30d" ? 720 : timeRange === "7d" ? 168 : 24;
    const slice = sorted.slice(-points);
    return {
      labels: slice.map((d) => {
        const dt = new Date(d.timestamp);
        return timeRange === "24h"
          ? dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          : dt.toLocaleDateString([], { month: "short", day: "numeric" });
      }),
      values: slice.map((d) => d[pollutant] ?? 0),
    };
  }, [data, timeRange, pollutant]);

  const avgPM = chartPoints.values.length
    ? chartPoints.values.reduce((a, b) => a + b, 0) / chartPoints.values.length
    : 0;
  const aqi = classifyAQI(pollutant === "pm2p5" ? avgPM : undefined);
  const lineColor = pollutant === "pm2p5" ? aqi.color : "#6366f1";

  const chartDataObj = {
    labels: chartPoints.labels,
    datasets: [
      {
        label: POLLUTANT_CONFIGS.find((p) => p.key === pollutant)?.label || pollutant,
        data: chartPoints.values,
        borderColor: lineColor,
        backgroundColor: lineColor + "22",
        fill: true,
        tension: 0.4,
        pointRadius: 2,
        pointHoverRadius: 5,
      },
      // 50 µg/m³ threshold line (only for PM2.5)
      ...(pollutant === "pm2p5"
        ? [
            {
              label: "WHO Threshold (50 µg/m³)",
              data: chartPoints.labels.map(() => 50),
              borderColor: "#ef4444",
              borderDash: [6, 3],
              borderWidth: 1.5,
              pointRadius: 0,
              fill: false,
              tension: 0,
            },
          ]
        : []),
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top", labels: { font: { size: 11 } } },
      tooltip: {
        callbacks: {
          label: (ctx) => ` ${ctx.parsed.y.toFixed(1)} ${POLLUTANT_CONFIGS.find((p) => p.key === pollutant)?.unit || ""}`,
        },
      },
    },
    scales: {
      x: {
        ticks: { font: { size: 10 }, maxRotation: 45 },
        grid: { color: "#f1f5f9" },
      },
      y: {
        ticks: { font: { size: 10 } },
        grid: { color: "#f1f5f9" },
        title: {
          display: true,
          text: POLLUTANT_CONFIGS.find((p) => p.key === pollutant)?.unit || "",
          font: { size: 11 },
        },
      },
    },
  };

  return (
    <WidgetCard accentColor={lineColor}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 8,
          marginBottom: 12,
        }}
      >
        <WidgetLabel>Air Quality Trend</WidgetLabel>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {/* Pollutant selector */}
          <div style={{ display: "flex", gap: 4 }}>
            {POLLUTANT_CONFIGS.map((p) => (
              <button
                key={p.key}
                onClick={() => onPollutantChange(p.key)}
                style={{
                  padding: "3px 8px",
                  borderRadius: 4,
                  border: `1px solid ${p.color}`,
                  background: pollutant === p.key ? p.color : "transparent",
                  color: pollutant === p.key ? "#fff" : p.color,
                  cursor: "pointer",
                  fontSize: "0.7rem",
                  fontWeight: 600,
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
          {/* Time range */}
          {TIME_RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              style={{
                padding: "3px 10px",
                borderRadius: 4,
                border: "1px solid #e2e8f0",
                background: timeRange === r ? COLORS.navyDark : "transparent",
                color: timeRange === r ? "#fff" : COLORS.mutedLabel,
                cursor: "pointer",
                fontSize: "0.75rem",
                fontWeight: 600,
              }}
            >
              {r.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
      {loading ? (
        <SkeletonBox h={220} />
      ) : chartPoints.values.length === 0 ? (
        <div
          style={{
            height: 220,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: COLORS.mutedLabel,
            fontSize: "0.9rem",
          }}
        >
          No trend data available
          {isDemo ? " (demo)" : ""}
        </div>
      ) : (
        <div style={{ height: 220 }}>
          <Line data={chartDataObj} options={options} />
        </div>
      )}
    </WidgetCard>
  );
}

// ─────────────────────────────────────────────
// 6. StationInfoWidget
// ─────────────────────────────────────────────
function StationInfoWidget({ station, loading, isDemo }) {
  const aqi = classifyAQI(undefined);
  return (
    <WidgetCard accentColor="#0ea5e9">
      <WidgetLabel>Station Information</WidgetLabel>
      {loading ? (
        Array.from({ length: 5 }).map((_, i) => (
          <SkeletonBox key={i} h={18} mb={8} />
        ))
      ) : station ? (
        <div style={{ fontSize: "0.85rem", color: COLORS.bodyText }}>
          <div style={{ marginBottom: 6 }}>
            <span style={{ color: COLORS.mutedLabel }}>Name: </span>
            <strong>{station.name}</strong>
          </div>
          <div style={{ marginBottom: 6 }}>
            <span style={{ color: COLORS.mutedLabel }}>City: </span>
            {station.city || "Johannesburg"}
          </div>
          <div style={{ marginBottom: 6 }}>
            <span style={{ color: COLORS.mutedLabel }}>Province: </span>
            {station.province || "Gauteng"}
          </div>
          <div style={{ marginBottom: 6 }}>
            <span style={{ color: COLORS.mutedLabel }}>Coordinates: </span>
            {station.latitude?.toFixed(5)}, {station.longitude?.toFixed(5)}
          </div>
          <div style={{ marginBottom: 6 }}>
            <span style={{ color: COLORS.mutedLabel }}>Sensors: </span>
            {station.sensorIds?.length || 0} active
          </div>
          <div style={{ marginBottom: 6 }}>
            <span style={{ color: COLORS.mutedLabel }}>Last Seen: </span>
            {station.lastSeen
              ? new Date(station.lastSeen).toLocaleString()
              : "N/A"}
          </div>
          <div style={{ marginBottom: 6 }}>
            <span style={{ color: COLORS.mutedLabel }}>Network: </span>
            SACAQM Gauteng Node
          </div>
          {isDemo && (
            <div
              style={{
                marginTop: 8,
                padding: "4px 10px",
                background: "#fef9c3",
                borderRadius: 6,
                color: "#a16207",
                fontSize: "0.72rem",
                fontWeight: 600,
              }}
            >
              ⚠️ Demo Station Data
            </div>
          )}
        </div>
      ) : (
        <div style={{ color: COLORS.mutedLabel, fontSize: "0.85rem" }}>
          No station selected
        </div>
      )}
    </WidgetCard>
  );
}

// ─────────────────────────────────────────────
// 7. AQAlertWidget
// ─────────────────────────────────────────────
function AQAlertWidget({ data, alertActive, isDemo, station }) {
  const pm25 = Number(data?.pm2p5);
  const show = alertActive || (Number.isFinite(pm25) && pm25 > 50);
  if (!show) return null;
  const aqi = classifyAQI(pm25);

  return (
    <div
      style={{
        background: pm25 > 100 ? "#fee2e2" : "#ffedd5",
        border: `1px solid ${pm25 > 100 ? "#fca5a5" : "#fdba74"}`,
        borderLeft: `4px solid ${aqi.color}`,
        borderRadius: 10,
        padding: "16px 20px",
        marginBottom: 20,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <div>
          <div
            style={{
              fontSize: "1rem",
              fontWeight: 700,
              color: aqi.textColor,
              marginBottom: 4,
            }}
          >
            ⚠️ Air Quality Alert — {aqi.label}
          </div>
          <div style={{ fontSize: "0.85rem", color: COLORS.bodyText }}>
            PM2.5 concentration at{" "}
            <strong>
              {station?.name || "Unknown Station"},{" "}
              {station?.city || "Johannesburg"}
            </strong>{" "}
            has reached <strong>{pm25.toFixed(1)} µg/m³</strong>.{" "}
            {aqi.description}. Sensitive groups including the elderly, children,
            and those with respiratory conditions should limit outdoor
            activities.
          </div>
          <div
            style={{ fontSize: "0.75rem", color: COLORS.mutedLabel, marginTop: 6 }}
          >
            Recorded:{" "}
            {data?.timestamp
              ? new Date(data.timestamp).toLocaleString()
              : "N/A"}
          </div>
        </div>
        {isDemo && (
          <span
            style={{
              background: "#fef9c3",
              color: "#a16207",
              padding: "3px 8px",
              borderRadius: 4,
              fontSize: "0.7rem",
              fontWeight: 700,
              whiteSpace: "nowrap",
            }}
          >
            ⚠️ DEMONSTRATION DATA
          </span>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// 8. EmbedCodeModal
// ─────────────────────────────────────────────
function StationSelectorWidget({ stations, station, stationId, onStationChange, data, loading, isDemo }) {
  return (
    <WidgetCard accentColor="#0ea5e9">
      <WidgetLabel>Choose a monitoring station</WidgetLabel>
      <label htmlFor="sacaqm-station-select" style={{ display: "block", fontSize: "0.75rem", color: COLORS.mutedLabel, margin: "10px 0 5px" }}>STATION</label>
      <select id="sacaqm-station-select" value={stationId || station?._id || ""} onChange={(event) => onStationChange(event.target.value)} disabled={!stations.length} style={{ width: "100%", padding: "9px 10px", borderRadius: 7, border: "1px solid #cbd5e1", color: COLORS.bodyText, background: "#fff", marginBottom: 12 }}>
        {stations.map((item) => <option key={item._id} value={item._id}>{item.name}{item.city ? ` · ${item.city}` : ""}</option>)}
      </select>
      <CurrentAQIWidget data={data} loading={loading} isDemo={isDemo} station={station} />
    </WidgetCard>
  );
}

function WorstStationsWidget({ stations, refreshSeconds = 120 }) {
  const [ranked, setRanked] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const loadRankings = async () => {
      if (!stations.length) {
        setRanked([]);
        setLoading(false);
        return;
      }
      try {
        const results = await Promise.allSettled(stations.map(async (station) => {
          const { data: payload } = await axios.get(`${API_BASE}/api/stations/${encodeURIComponent(station._id)}/sensorData?days=1`);
          const entries = Array.isArray(payload) ? payload : payload?.data || [];
          const latest = [...entries].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
          return latest && Number.isFinite(Number(latest.pm2p5)) ? { station, reading: latest, value: Number(latest.pm2p5) } : null;
        }));
        if (cancelled) return;
        const next = results
          .filter((result) => result.status === "fulfilled")
          .map((result) => result.value)
          .filter(Boolean)
          .sort((a, b) => b.value - a.value);
        setRanked(next);
        setSelectedId(next[0]?.station._id || "");
        setError(next.length ? "" : "No current station readings are available.");
      } catch (fetchError) {
        if (!cancelled) setError(fetchError.message || "Could not load station readings.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadRankings();
    const refreshId = window.setInterval(loadRankings, refreshSeconds * 1000);
    return () => { cancelled = true; window.clearInterval(refreshId); };
  }, [stations, refreshSeconds]);

  useEffect(() => {
    if (ranked.length < 2) return undefined;
    const rotationId = window.setInterval(() => {
      setSelectedId((current) => {
        const options = ranked.slice(0, Math.min(5, ranked.length)).filter((item) => item.station._id !== current);
        return options[Math.floor(Math.random() * options.length)]?.station._id || current;
      });
    }, 12000);
    return () => window.clearInterval(rotationId);
  }, [ranked]);

  const selected = ranked.find((item) => item.station._id === selectedId) || ranked[0];
  return (
    <WidgetCard accentColor="#e63946">
      <WidgetLabel>Highest PM2.5 readings</WidgetLabel>
      {loading ? <SkeletonBox h={100} /> : error ? <div role="status" style={{ color: COLORS.mutedLabel, padding: 16 }}>{error}</div> : selected ? (
        <div aria-live="polite" style={{ padding: "12px 2px" }}>
          <div style={{ fontSize: "0.72rem", color: COLORS.mutedLabel, textTransform: "uppercase", letterSpacing: "0.06em" }}>{ranked[0]?.station._id === selected.station._id ? "Currently highest reading" : `Rank #${ranked.findIndex((item) => item.station._id === selected.station._id) + 1} · rotating view`}</div>
          <div style={{ fontSize: "1.2rem", fontWeight: 750, color: COLORS.navyDark, marginTop: 6 }}>{selected.station.name}</div>
          <div style={{ fontSize: "0.82rem", color: COLORS.mutedLabel }}>{selected.station.city || "Gauteng"}</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 7, marginTop: 12 }}><strong style={{ fontSize: "2rem", color: classifyAQI(selected.value).color }}>{selected.value.toFixed(1)}</strong><span style={{ fontSize: "0.8rem", color: COLORS.mutedLabel }}>µg/m³ PM2.5 · {classifyAQI(selected.value).label}</span></div>
          <div style={{ fontSize: "0.72rem", color: COLORS.mutedLabel, marginTop: 8 }}>Automatically rotates among the five highest stations every 12 seconds.</div>
        </div>
      ) : null}
    </WidgetCard>
  );
}

function EmbedCodeModal({ open, onClose, stationId, widgetType = "current-aqi" }) {
  const [copied, setCopied] = useState(null);
  const [copyError, setCopyError] = useState("");
  const [selectedType, setSelectedType] = useState(widgetType);
  useEffect(() => {
    if (open) {
      setSelectedType(widgetType);
      setCopied(null);
      setCopyError("");
    }
  }, [open, widgetType]);
  const heightByWidget = {
    "current-aqi": 320,
    pollutants: 380,
    trend: 300,
    alert: 180,
    "station-info": 280,
    "station-selector": 380,
    "worst-stations": 300,
  };
  const station = stationId || "STATION_ID";
  const type = selectedType;
  const height = heightByWidget[type] || 320;

  const iframeCode = `<iframe
  src="${NEWS_WIDGET_BASE_URL}/#/news-widgets?station=${encodeURIComponent(station)}&widget=${type}&embed=1&theme=light"
  width="100%"
  height="${height}"
  loading="lazy"
  frameborder="0"
  title="SACAQM ${type}">
</iframe>`;

  const jsCode = `<div
  data-sacaqm-widget
  data-widget="${type}"
  data-station="${station}"
  data-theme="light"></div>
<script src="${NEWS_WIDGET_BASE_URL}/sacaqm-widget.js" async></script>`;

  const copyToClipboard = async (text, label) => {
    setCopyError("");
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard access is unavailable in this browser.");
      }
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      setCopyError(error.message || "Could not copy the embed code.");
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <div
        style={{
          position: "fixed",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
        }}
      >
        <div
          style={{
            background: COLORS.white,
            borderRadius: 16,
            padding: 28,
            maxWidth: 620,
            width: "100%",
            maxHeight: "90vh",
            overflowY: "auto",
            boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <h3
              style={{ margin: 0, fontFamily: "Georgia, serif", color: COLORS.navyDark }}
            >
              Embed This Widget
            </h3>
            <button
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                fontSize: "1.4rem",
                cursor: "pointer",
                color: COLORS.mutedLabel,
              }}
            >
              ✕
            </button>
          </div>

          <p style={{ fontSize: "0.875rem", color: COLORS.bodyText, marginBottom: 20 }}>
            Choose one widget. Each snippet embeds that widget only; add more snippets if you want more than one.
          </p>
          <label htmlFor="embed-widget-type" style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: COLORS.mutedLabel, marginBottom: 6 }}>
            WIDGET TYPE
          </label>
          <select
            id="embed-widget-type"
            value={selectedType}
            onChange={(event) => { setSelectedType(event.target.value); setCopied(null); }}
            style={{ width: "100%", padding: "10px 12px", borderRadius: 7, border: "1px solid #cbd5e1", background: "#fff", color: COLORS.bodyText, fontSize: "0.9rem", marginBottom: 8 }}
          >
            {WIDGET_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          <div style={{ fontSize: "0.8rem", color: COLORS.mutedLabel, marginBottom: 18 }}>
            {WIDGET_OPTIONS.find((option) => option.value === type)?.description} Supported types: {WIDGET_TYPES.join(", ")}.
          </div>
          {copyError && (
            <div role="alert" style={{ color: "#b91c1c", marginBottom: 12 }}>
              {copyError}
            </div>
          )}

          {/* iFrame */}
          <div style={{ marginBottom: 20 }}>
            <div
              style={{
                fontSize: "0.78rem",
                fontWeight: 700,
                color: COLORS.mutedLabel,
                textTransform: "uppercase",
                marginBottom: 8,
              }}
            >
              Option 1 — iFrame Embed
            </div>
            <pre
              style={{
                background: "#1e293b",
                color: "#e2e8f0",
                padding: 16,
                borderRadius: 8,
                fontSize: "0.75rem",
                overflowX: "auto",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {iframeCode}
            </pre>
            <button
              onClick={() => copyToClipboard(iframeCode, "iframe")}
              style={{
                marginTop: 8,
                padding: "7px 16px",
                background: copied === "iframe" ? "#22c55e" : COLORS.navyDark,
                color: "#fff",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
                fontSize: "0.8rem",
                fontWeight: 600,
              }}
            >
              {copied === "iframe" ? "✓ Copied!" : "Copy iFrame Code"}
            </button>
          </div>

          {/* JS script */}
          <div>
            <div
              style={{
                fontSize: "0.78rem",
                fontWeight: 700,
                color: COLORS.mutedLabel,
                textTransform: "uppercase",
                marginBottom: 8,
              }}
            >
              Option 2 — JavaScript Widget
            </div>
            <pre
              style={{
                background: "#1e293b",
                color: "#e2e8f0",
                padding: 16,
                borderRadius: 8,
                fontSize: "0.75rem",
                overflowX: "auto",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {jsCode}
            </pre>
            <button
              onClick={() => copyToClipboard(jsCode, "js")}
              style={{
                marginTop: 8,
                padding: "7px 16px",
                background: copied === "js" ? "#22c55e" : COLORS.navyDark,
                color: "#fff",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
                fontSize: "0.8rem",
                fontWeight: 600,
              }}
            >
              {copied === "js" ? "✓ Copied!" : "Copy JS Snippet"}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────
// 9. DemoControlPanel
// ─────────────────────────────────────────────
function DemoControlPanel({
  demoMode,
  onToggleDemo,
  demoScenario,
  onScenarioChange,
  demoValues,
  onDemoValueChange,
  stations,
  selectedStationId,
  onStationChange,
  onTriggerAlert,
  onResetDemo,
  open,
  onToggle,
}) {
  return (
    <>
      {/* Floating button */}
      <button
        onClick={onToggle}
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 1200,
          width: 54,
          height: 54,
          borderRadius: "50%",
          background: demoMode ? "#f59e0b" : COLORS.navyDark,
          color: "#fff",
          border: "none",
          cursor: "pointer",
          fontSize: "1.4rem",
          boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        title="Demo Controls"
      >
        🛠️
      </button>

      {/* Sliding panel */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: open ? 0 : -360,
          width: 340,
          height: "100vh",
          background: COLORS.white,
          boxShadow: "-4px 0 20px rgba(0,0,0,0.15)",
          zIndex: 1100,
          overflowY: "auto",
          transition: "right 0.3s ease",
          padding: "20px",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <h4
            style={{
              margin: 0,
              fontFamily: "system-ui, sans-serif",
              color: COLORS.navyDark,
              fontSize: "1rem",
            }}
          >
            🛠️ Demo Controls
          </h4>
          <button
            onClick={onToggle}
            style={{
              background: "none",
              border: "none",
              fontSize: "1.2rem",
              cursor: "pointer",
              color: COLORS.mutedLabel,
            }}
          >
            ✕
          </button>
        </div>

        {/* Demo warning */}
        {demoMode && (
          <div
            style={{
              background: "#fef3c7",
              border: "1px solid #fcd34d",
              borderRadius: 8,
              padding: "10px 14px",
              fontSize: "0.75rem",
              color: "#92400e",
              fontWeight: 600,
              marginBottom: 16,
            }}
          >
            ⚠️ DEMO DATA — Not real measurements
          </div>
        )}

        {/* Toggle live/demo */}
        <div style={{ marginBottom: 20 }}>
          <FormControlLabel
            control={
              <Switch
                checked={demoMode}
                onChange={(e) => onToggleDemo(e.target.checked)}
                color="warning"
              />
            }
            label={
              <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>
                {demoMode ? "Demo Data" : "Live API"}
              </span>
            }
          />
        </div>

        {demoMode && (
          <>
            {/* Station selector */}
            <div style={{ marginBottom: 18 }}>
              <div
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  color: COLORS.mutedLabel,
                  textTransform: "uppercase",
                  marginBottom: 6,
                }}
              >
                Station
              </div>
              <select
                value={selectedStationId || ""}
                onChange={(e) => onStationChange(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: 6,
                  border: "1px solid #e2e8f0",
                  fontSize: "0.85rem",
                  color: COLORS.bodyText,
                  background: COLORS.white,
                }}
              >
                {stations.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Scenario selector */}
            <div style={{ marginBottom: 18 }}>
              <div
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  color: COLORS.mutedLabel,
                  textTransform: "uppercase",
                  marginBottom: 6,
                }}
              >
                Scenario
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {Object.keys(DEMO_SCENARIOS).map((s) => {
                  const aqi = classifyAQI(DEMO_SCENARIOS[s].pm2p5);
                  return (
                    <button
                      key={s}
                      onClick={() => onScenarioChange(s)}
                      style={{
                        padding: "5px 12px",
                        borderRadius: 20,
                        border: `1px solid ${aqi.color}`,
                        background:
                          demoScenario === s ? aqi.color : "transparent",
                        color: demoScenario === s ? "#fff" : aqi.color,
                        cursor: "pointer",
                        fontSize: "0.78rem",
                        fontWeight: 600,
                      }}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* PM2.5 slider */}
            <div style={{ marginBottom: 14 }}>
              <div
                style={{
                  fontSize: "0.75rem",
                  color: COLORS.mutedLabel,
                  marginBottom: 4,
                  fontWeight: 600,
                }}
              >
                PM2.5: {demoValues.pm2p5 ?? DEMO_SCENARIOS[demoScenario]?.pm2p5 ?? 12} µg/m³
              </div>
              <Slider
                min={0}
                max={300}
                value={demoValues.pm2p5 ?? DEMO_SCENARIOS[demoScenario]?.pm2p5 ?? 12}
                onChange={(_, v) => onDemoValueChange("pm2p5", v)}
                sx={{ color: "#6366f1" }}
                size="small"
              />
            </div>

            {/* PM10 slider */}
            <div style={{ marginBottom: 14 }}>
              <div
                style={{
                  fontSize: "0.75rem",
                  color: COLORS.mutedLabel,
                  marginBottom: 4,
                  fontWeight: 600,
                }}
              >
                PM10: {demoValues.pm10p0 ?? DEMO_SCENARIOS[demoScenario]?.pm10p0 ?? 22} µg/m³
              </div>
              <Slider
                min={0}
                max={400}
                value={demoValues.pm10p0 ?? DEMO_SCENARIOS[demoScenario]?.pm10p0 ?? 22}
                onChange={(_, v) => onDemoValueChange("pm10p0", v)}
                sx={{ color: "#a855f7" }}
                size="small"
              />
            </div>

            {/* NOx slider */}
            <div style={{ marginBottom: 18 }}>
              <div
                style={{
                  fontSize: "0.75rem",
                  color: COLORS.mutedLabel,
                  marginBottom: 4,
                  fontWeight: 600,
                }}
              >
                NOx: {demoValues.nox ?? DEMO_SCENARIOS[demoScenario]?.nox ?? 15} ppb
              </div>
              <Slider
                min={0}
                max={200}
                value={demoValues.nox ?? DEMO_SCENARIOS[demoScenario]?.nox ?? 15}
                onChange={(_, v) => onDemoValueChange("nox", v)}
                sx={{ color: "#f59e0b" }}
                size="small"
              />
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button
                onClick={onTriggerAlert}
                style={{
                  padding: "9px 0",
                  background: "#ef4444",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                }}
              >
                ⚠️ Trigger Pollution Warning
              </button>
              <button
                onClick={onResetDemo}
                style={{
                  padding: "9px 0",
                  background: "#e2e8f0",
                  color: COLORS.bodyText,
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                }}
              >
                ↺ Reset Demo
              </button>
            </div>
          </>
        )}
      </div>

      {/* Overlay when panel open */}
      {open && (
        <div
          onClick={onToggle}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.3)",
            zIndex: 1050,
          }}
        />
      )}
    </>
  );
}

// ─────────────────────────────────────────────
// Related Articles sidebar card
// ─────────────────────────────────────────────
const RELATED_ARTICLES = [
  {
    title: "Vaal Triangle Industries Linked to Renewed Pollution Spike",
    date: "Nov 1, 2026",
    tag: "Environment",
  },
  {
    title: "New Monitoring Stations to Roll Out Across Soweto",
    date: "Oct 28, 2026",
    tag: "News",
  },
  {
    title: "What PM2.5 Means for Your Lungs — A Doctor Explains",
    date: "Oct 24, 2026",
    tag: "Health",
  },
  {
    title: "Gauteng's Air Quality Worse Than Lagos in 2025, Study Finds",
    date: "Oct 19, 2026",
    tag: "Environment",
  },
];

// ─────────────────────────────────────────────
// 10. OurCityNewsLayout (main article layout)
// ─────────────────────────────────────────────
function EmbeddedWidget({
  widgetType,
  theme,
  pollutant,
  timeRange,
  latestReading,
  historicalData,
  loading,
  error,
  selectedStation,
  isDemo,
  alertActive,
  warnings,
  stations,
  stationId,
  onStationChange,
  refreshSeconds,
}) {
  const isDark = theme === "dark";
  const [activePollutant, setActivePollutant] = useState(pollutant);

  useEffect(() => setActivePollutant(pollutant), [pollutant]);

  useEffect(() => {
    if (window.parent === window) return undefined;
    const reportHeight = () => {
      window.parent.postMessage(
        {
          type: "sacaqm:resize",
          height: document.documentElement.scrollHeight,
        },
        "*"
      );
    };
    const observer =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(reportHeight);
    if (observer) {
      observer.observe(document.documentElement);
    } else {
      window.addEventListener("resize", reportHeight);
    }
    reportHeight();
    return () => {
      if (observer) {
        observer.disconnect();
      } else {
        window.removeEventListener("resize", reportHeight);
      }
    };
  }, []);

  let widget;
  switch (widgetType) {
    case "pollutants":
      widget = (
        <PollutantConcentrationsWidget
          data={latestReading}
          loading={loading}
          initialPollutant={pollutant}
        />
      );
      break;
    case "trend":
      widget = (
        <AQTrendChart
          data={historicalData}
          loading={loading}
          isDemo={isDemo}
          pollutant={activePollutant}
          onPollutantChange={setActivePollutant}
          initialTimeRange={timeRange}
        />
      );
      break;
    case "alert":
      widget = (
        <AQAlertWidget
          data={latestReading}
          alertActive={alertActive}
          isDemo={isDemo}
          station={selectedStation}
        />
      );
      break;
    case "station-info":
      widget = (
        <StationInfoWidget
          station={selectedStation}
          loading={loading}
          isDemo={isDemo}
        />
      );
      break;
    case "station-selector":
      widget = (
        <StationSelectorWidget
          stations={stations}
          station={selectedStation}
          stationId={stationId}
          onStationChange={onStationChange}
          data={latestReading}
          loading={loading}
          isDemo={isDemo}
        />
      );
      break;
    case "worst-stations":
      widget = <WorstStationsWidget stations={stations} refreshSeconds={refreshSeconds} />;
      break;
    default:
      widget = (
        <CurrentAQIWidget
          data={latestReading}
          loading={loading}
          isDemo={isDemo}
          station={selectedStation}
        />
      );
  }

  const updatedAt = latestReading?.timestamp
    ? new Date(latestReading.timestamp)
    : null;
  const isStale =
    updatedAt && Date.now() - updatedAt.getTime() > 10 * 60 * 1000;
  const stationOffline =
    selectedStation?.isOnline === false ||
    String(selectedStation?.status || "").toLowerCase() === "offline";

  return (
    <main
      data-theme={theme}
      style={{
        boxSizing: "border-box",
        minHeight: "100vh",
        padding: 12,
        background: isDark ? "#0f172a" : "#f8f9fa",
        color: isDark ? "#e2e8f0" : COLORS.bodyText,
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <style>{`
        html, body, #root { margin: 0; min-height: 100%; }
        [data-theme="dark"] .widget-card { box-shadow: 0 2px 12px rgba(0,0,0,.35); }
      `}</style>
      {warnings.map((warning) => (
        <div
          key={warning}
          role="status"
          style={{
            marginBottom: 8,
            padding: "8px 10px",
            borderRadius: 6,
            background: isDark ? "#422006" : "#fef3c7",
            color: isDark ? "#fde68a" : "#92400e",
            fontSize: "0.78rem",
          }}
        >
          {warning}
        </div>
      ))}
      {error && (
        <div
          role="alert"
          style={{
            marginBottom: 8,
            padding: "8px 10px",
            borderRadius: 6,
            background: "#fee2e2",
            color: "#991b1b",
            fontSize: "0.82rem",
          }}
        >
          {error}
        </div>
      )}
      {stationOffline && latestReading && (
        <div
          role="status"
          style={{
            marginBottom: 8,
            padding: "8px 10px",
            borderRadius: 6,
            background: "#fff7ed",
            color: "#9a3412",
            fontSize: "0.78rem",
          }}
        >
          This station is offline. Showing its last known reading.
        </div>
      )}
      {isStale && !stationOffline && latestReading && (
        <div
          role="status"
          style={{
            marginBottom: 8,
            padding: "8px 10px",
            borderRadius: 6,
            background: "#fff7ed",
            color: "#9a3412",
            fontSize: "0.78rem",
          }}
        >
          This reading is over 10 minutes old; it may be the station's last
          known measurement.
        </div>
      )}
      {widget}
      <div
        style={{
          marginTop: 8,
          textAlign: "right",
          color: isDark ? "#94a3b8" : "#64748b",
          fontSize: "0.72rem",
        }}
      >
        Last updated:{" "}
        {updatedAt && !Number.isNaN(updatedAt.getTime())
          ? updatedAt.toLocaleString()
          : "No reading available"}
        {isDemo && " · DEMONSTRATION DATA"}
      </div>
    </main>
  );
}

function OurCityNewsLayout({
  stations,
  selectedStation,
  latestReading,
  historicalData,
  loading,
  error,
  isDemo,
  alertActive,
  selectedStationId,
  onStationChange,
  onSwitchToDemo,
  onLogout,
}) {
  const [embedOpen, setEmbedOpen] = useState(false);
  const [trendPollutant, setTrendPollutant] = useState("pm2p5");

  const aqi = classifyAQI(latestReading?.pm2p5);
  const today = new Date().toLocaleDateString("en-ZA", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div
      style={{
        background: COLORS.bg,
        minHeight: "100vh",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* ── Global shimmer keyframes ── */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @media (max-width: 768px) {
          .news-layout-grid { flex-direction: column !important; }
          .article-col { width: 100% !important; }
          .sidebar-col { width: 100% !important; }
        }
      `}</style>

      {/* ── Demo banner ── */}
      {isDemo && (
        <div
          style={{
            background: "#fef3c7",
            borderBottom: "2px solid #fcd34d",
            padding: "10px 20px",
            textAlign: "center",
            fontSize: "0.85rem",
            fontWeight: 700,
            color: "#92400e",
            zIndex: 100,
            position: "sticky",
            top: 0,
          }}
        >
          ⚠️ DEMONSTRATION MODE — All readings are simulated. Not real
          environmental data.
        </div>
      )}

      {/* ── Publication Header ── */}
      <header
        style={{
          background: COLORS.navyDark,
          color: "#fff",
          padding: "0 20px",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "14px 0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "Georgia, serif",
                fontSize: "clamp(20px, 4vw, 28px)",
                fontWeight: 700,
                letterSpacing: "-0.5px",
              }}
            >
              Our City News
            </div>
            <div
              style={{
                fontSize: "0.72rem",
                color: "#94a3b8",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              Johannesburg's Independent Voice
            </div>
          </div>
          <div style={{ fontSize: "0.8rem", color: "#94a3b8", textAlign: "right" }}>
            <div>{today}</div>
            <div style={{ color: isDemo ? "#fbbf24" : "#86efac", fontSize: "0.7rem", fontWeight: 700, marginTop: 4 }}>
              {isDemo ? "DEMO DATA" : "LIVE NETWORK DATA"}
            </div>
            <button type="button" onClick={onLogout} style={{ marginTop: 7, padding: "4px 9px", border: "1px solid #64748b", borderRadius: 5, color: "#e2e8f0", background: "transparent", cursor: "pointer", fontSize: ".68rem" }}>Sign out</button>
          </div>
        </div>

        {/* Nav */}
        <nav
          style={{
            borderTop: "1px solid #2d3748",
            maxWidth: 1200,
            margin: "0 auto",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 0,
              overflowX: "auto",
            }}
          >
            {["Home", "News", "Environment", "Health", "Opinion", "Contact"].map(
              (item) => (
                <a
                  key={item}
                  href="#"
                  style={{
                    color: item === "Environment" ? COLORS.red : "#cbd5e1",
                    padding: "10px 16px",
                    fontSize: "0.82rem",
                    textDecoration: "none",
                    fontWeight: item === "Environment" ? 700 : 400,
                    borderBottom:
                      item === "Environment"
                        ? `2px solid ${COLORS.red}`
                        : "2px solid transparent",
                    whiteSpace: "nowrap",
                  }}
                >
                  {item}
                </a>
              )
            )}
          </div>
        </nav>
      </header>

      {/* ── Article + Sidebar ── */}
      <main
        style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 20px 60px" }}
      >
        {/* Breadcrumb */}
        <div
          style={{
            fontSize: "0.78rem",
            color: COLORS.mutedLabel,
            marginBottom: 16,
          }}
        >
          <span>Home</span>
          <span style={{ margin: "0 6px" }}>›</span>
          <span>Environment</span>
          <span style={{ margin: "0 6px" }}>›</span>
          <span style={{ color: COLORS.red, fontWeight: 600 }}>Air Quality</span>
        </div>

        {/* Error state */}
        {error && !isDemo && (
          <div
            style={{
              background: "#fee2e2",
              border: "1px solid #fca5a5",
              borderRadius: 10,
              padding: "16px 20px",
              marginBottom: 20,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 10,
            }}
          >
            <div>
              <div
                style={{ fontWeight: 700, color: "#b91c1c", marginBottom: 4 }}
              >
                ⚠️ Could not connect to live data
              </div>
              <div style={{ fontSize: "0.85rem", color: "#7f1d1d" }}>
                {error}
              </div>
            </div>
            <button
              onClick={onSwitchToDemo}
              style={{
                padding: "8px 18px",
                background: "#fef3c7",
                color: "#92400e",
                border: "1px solid #fcd34d",
                borderRadius: 8,
                cursor: "pointer",
                fontSize: "0.82rem",
                fontWeight: 700,
              }}
            >
              Switch to Demo Mode
            </button>
          </div>
        )}

        <div
          className="news-layout-grid"
          style={{ display: "flex", gap: 32, alignItems: "flex-start" }}
        >
          {/* ── Main article column ── */}
          <article
            className="article-col"
            style={{ flex: "0 0 68%", minWidth: 0 }}
          >
            {/* Category tag */}
            <div
              style={{
                display: "inline-block",
                background: COLORS.red,
                color: "#fff",
                fontSize: "0.68rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                padding: "3px 10px",
                borderRadius: 3,
                marginBottom: 12,
              }}
            >
              Environment · Air Quality
            </div>

            {/* Headline */}
            <h1
              style={{
                fontFamily: "Georgia, serif",
                fontSize: "clamp(1.5rem, 4vw, 2.2rem)",
                fontWeight: 700,
                color: "#0f172a",
                lineHeight: 1.25,
                marginBottom: 12,
              }}
            >
              Johannesburg's Air Quality: Live Readings from Community
              Monitoring Stations
            </h1>

            {/* Sub-headline */}
            <p
              style={{
                fontSize: "1.1rem",
                color: "#475569",
                lineHeight: 1.55,
                marginBottom: 16,
                fontStyle: "italic",
              }}
            >
              Real-time pollution data from the South African Clean Air Quality
              Monitoring network, embedded directly in your news feed
            </p>

            {/* Byline */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                borderTop: "1px solid #e2e8f0",
                borderBottom: "1px solid #e2e8f0",
                padding: "10px 0",
                marginBottom: 20,
                flexWrap: "wrap",
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: `linear-gradient(135deg, ${COLORS.navyDark}, ${COLORS.red})`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                SA
              </div>
              <div>
                <div
                  style={{
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    color: COLORS.bodyText,
                  }}
                >
                  SACAQM Environmental Desk
                </div>
                <div style={{ fontSize: "0.72rem", color: COLORS.mutedLabel }}>
                  Live Data · {today}
                </div>
              </div>
              {/* Station selector inline */}
              {stations.length > 0 && (
                <div style={{ marginLeft: "auto" }}>
                  <select
                    value={selectedStationId || ""}
                    onChange={(e) => onStationChange(e.target.value)}
                    style={{
                      padding: "5px 10px",
                      borderRadius: 6,
                      border: "1px solid #e2e8f0",
                      fontSize: "0.78rem",
                      color: COLORS.bodyText,
                      background: COLORS.white,
                    }}
                  >
                    {stations.map((s) => (
                      <option key={s._id} value={s._id}>
                        📍 {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* ── Article body paragraph 1 ── */}
            <p
              style={{
                fontSize: "1.05rem",
                lineHeight: 1.75,
                color: COLORS.bodyText,
                marginBottom: 20,
              }}
            >
              Air pollution remains one of the most pressing environmental health
              threats facing Gauteng residents. The greater Johannesburg
              metropolitan area — a dense urban basin ringed by industrial
              corridors, informal settlements, and high-traffic arterials — is
              consistently ranked among South Africa's most polluted regions.
              Particulate matter smaller than 2.5 micrometres (PM2.5) is of
              particular concern: fine enough to penetrate deep into lung tissue,
              these particles are linked to cardiovascular disease, asthma, and
              premature death even at concentrations well below current national
              standards.
            </p>

            {/* ── EMBED 1: CurrentAQIWidget ── */}
            <section style={{ marginBottom: 24 }}>
              <div
                style={{
                  fontSize: "0.72rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: COLORS.mutedLabel,
                  borderTop: "2px solid #e2e8f0",
                  paddingTop: 10,
                  marginBottom: 12,
                  fontWeight: 600,
                }}
              >
                📡 Live Sensor Embed · Current Air Quality Reading
              </div>
              <CurrentAQIWidget
                data={latestReading}
                loading={loading}
                isDemo={isDemo}
                station={selectedStation}
              />
            </section>

            {/* ── EMBED 2: AQAlertWidget ── */}
            <section style={{ marginBottom: 24 }}>
              <div style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.1em", color: COLORS.mutedLabel, borderTop: "2px solid #e2e8f0", paddingTop: 10, marginBottom: 12, fontWeight: 600 }}>
                Choose a monitoring station
              </div>
              <StationSelectorWidget
                stations={stations}
                station={selectedStation}
                stationId={selectedStationId}
                onStationChange={onStationChange}
                data={latestReading}
                loading={loading}
                isDemo={isDemo}
              />
            </section>

            <section style={{ marginBottom: 24 }}>
              <div style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.1em", color: COLORS.mutedLabel, borderTop: "2px solid #e2e8f0", paddingTop: 10, marginBottom: 12, fontWeight: 600 }}>
                Stations with the highest PM2.5 readings
              </div>
              <WorstStationsWidget stations={stations} />
            </section>

            <AQAlertWidget
              data={latestReading}
              alertActive={alertActive}
              isDemo={isDemo}
              station={selectedStation}
            />

            {/* ── Article body paragraph 2 ── */}
            <p
              style={{
                fontSize: "1.05rem",
                lineHeight: 1.75,
                color: COLORS.bodyText,
                marginBottom: 20,
              }}
            >
              The South African Clean Air Quality Monitoring (SACAQM) network
              has deployed low-cost IoT sensor nodes across communities in Soweto,
              Johannesburg South, and the broader Vaal corridor. Each station
              continuously transmits readings for PM1.0, PM2.5, PM4.0, PM10,
              volatile organic compounds (VOC), nitrogen oxides (NOx), carbon
              dioxide (CO₂), temperature, and relative humidity. This granular
              data, previously unavailable to community organisations and
              journalists, is now publicly accessible via the SACAQM open API.{" "}
              <em>Our City News</em> is embedding this feed directly into our
              environmental coverage — no PDF, no data request, no delay.
            </p>

            {/* ── EMBED 3: PollutantConcentrationsWidget ── */}
            <section style={{ marginBottom: 24 }}>
              <div
                style={{
                  fontSize: "0.72rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: COLORS.mutedLabel,
                  borderTop: "2px solid #e2e8f0",
                  paddingTop: 10,
                  marginBottom: 12,
                  fontWeight: 600,
                }}
              >
                📊 Live Sensor Embed · Pollutant Breakdown
              </div>
              <PollutantConcentrationsWidget
                data={latestReading}
                loading={loading}
              />
            </section>

            {/* ── Article body paragraph 3 ── */}
            <p
              style={{
                fontSize: "1.05rem",
                lineHeight: 1.75,
                color: COLORS.bodyText,
                marginBottom: 20,
              }}
            >
              Community leaders in areas like Slovoville and Lufhereng have
              long complained of a persistent haze that health authorities
              attributed to seasonal fires. SACAQM sensor data tells a more
              nuanced story: spikes in NOx and VOC concentrations suggest
              additional contributions from heavy-vehicle traffic along the N14
              and N17 corridors, as well as illegal dumping and backyard metal
              smelting. The 24-hour trend chart below reflects how concentrations
              shift through the day — with morning and evening peaks corresponding
              to rush-hour traffic, and overnight dips when industrial activity
              slows.
            </p>

            {/* ── EMBED 4: AQTrendChart ── */}
            <section style={{ marginBottom: 32 }}>
              <div
                style={{
                  fontSize: "0.72rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: COLORS.mutedLabel,
                  borderTop: "2px solid #e2e8f0",
                  paddingTop: 10,
                  marginBottom: 12,
                  fontWeight: 600,
                }}
              >
                📈 Live Sensor Embed · 24-Hour Air Quality Trend
              </div>
              <AQTrendChart
                data={historicalData}
                loading={loading}
                isDemo={isDemo}
                pollutant={trendPollutant}
                onPollutantChange={setTrendPollutant}
                initialTimeRange={"24h"}
              />
            </section>

            {/* Get the Code button */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                flexWrap: "wrap",
                marginBottom: 32,
              }}
            >
              <button
                onClick={() => setEmbedOpen(true)}
                style={{
                  padding: "10px 22px",
                  background: COLORS.navyDark,
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontSize: "0.9rem",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                {"</>"} Get the Embed Code
              </button>
              <span style={{ fontSize: "0.78rem", color: COLORS.mutedLabel }}>
                Free for newsrooms · Creative Commons Attribution
              </span>
            </div>

            {/* Footer note */}
            <div
              style={{
                borderTop: "1px solid #e2e8f0",
                paddingTop: 16,
                fontSize: "0.78rem",
                color: COLORS.mutedLabel,
                lineHeight: 1.6,
              }}
            >
              <strong>Data attribution:</strong> All sensor readings are sourced
              from the SACAQM (South African Clean Air Quality Monitoring)
              open-data network. Data is updated continuously and may reflect a
              15–30 minute transmission lag from sensor nodes. For enquiries
              contact{" "}
              <span style={{ color: COLORS.navyDark }}>
                environmental@ourcitynews.co.za
              </span>
            </div>
          </article>

          {/* ── Right Sidebar ── */}
          <aside
            className="sidebar-col"
            style={{ flex: "0 0 28%", minWidth: 220 }}
          >
            {/* About this data */}
            <div
              style={{
                background: COLORS.white,
                borderRadius: 12,
                padding: 20,
                boxShadow: COLORS.widgetShadow,
                border: COLORS.widgetBorder,
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: COLORS.navyDark,
                  borderBottom: "2px solid #e2e8f0",
                  paddingBottom: 8,
                  marginBottom: 12,
                }}
              >
                About This Data
              </div>
              <p
                style={{
                  fontSize: "0.82rem",
                  color: COLORS.bodyText,
                  lineHeight: 1.65,
                  margin: 0,
                }}
              >
                This widget is powered by the SACAQM open API, integrating
                real-time sensor data from community-deployed IoT nodes across
                Gauteng. Data is updated continuously. PM2.5 thresholds follow
                SANS 1929 and WHO 2021 guidelines.
              </p>
            </div>

            {/* Station info widget in sidebar */}
            <div style={{ marginBottom: 20 }}>
              <StationInfoWidget
                station={selectedStation}
                loading={loading}
                isDemo={isDemo}
              />
            </div>

            {/* Embed on your site */}
            <div
              style={{
                background: COLORS.navyDark,
                borderRadius: 12,
                padding: 20,
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "#94a3b8",
                  marginBottom: 10,
                }}
              >
                Embed on Your Site
              </div>
              <p
                style={{
                  fontSize: "0.8rem",
                  color: "#cbd5e1",
                  lineHeight: 1.6,
                  marginBottom: 14,
                }}
              >
                Add live air quality data to your newsroom, community portal,
                or civic app. Free iFrame and JS widget.
              </p>
              <button
                onClick={() => setEmbedOpen(true)}
                style={{
                  width: "100%",
                  padding: "9px 0",
                  background: COLORS.red,
                  color: "#fff",
                  border: "none",
                  borderRadius: 7,
                  cursor: "pointer",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                }}
              >
                📋 Get Embed Code
              </button>
            </div>

            {/* Related articles */}
            <div
              style={{
                background: COLORS.white,
                borderRadius: 12,
                padding: 20,
                boxShadow: COLORS.widgetShadow,
                border: COLORS.widgetBorder,
              }}
            >
              <div
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: COLORS.navyDark,
                  borderBottom: "2px solid #e2e8f0",
                  paddingBottom: 8,
                  marginBottom: 12,
                }}
              >
                Related Articles
              </div>
              {RELATED_ARTICLES.map((a, i) => (
                <div
                  key={i}
                  style={{
                    paddingBottom: 10,
                    marginBottom: 10,
                    borderBottom:
                      i < RELATED_ARTICLES.length - 1
                        ? "1px solid #f1f5f9"
                        : "none",
                  }}
                >
                  <span
                    style={{
                      display: "inline-block",
                      background: "#f1f5f9",
                      color: COLORS.mutedLabel,
                      fontSize: "0.65rem",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      padding: "1px 6px",
                      borderRadius: 3,
                      marginBottom: 4,
                    }}
                  >
                    {a.tag}
                  </span>
                  <a
                    href="#"
                    style={{
                      display: "block",
                      fontSize: "0.82rem",
                      fontWeight: 600,
                      color: COLORS.navyDark,
                      lineHeight: 1.4,
                      textDecoration: "none",
                      marginBottom: 2,
                    }}
                  >
                    {a.title}
                  </a>
                  <div style={{ fontSize: "0.68rem", color: COLORS.mutedLabel }}>
                    {a.date}
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer
        style={{
          background: COLORS.navyDark,
          color: "#94a3b8",
          textAlign: "center",
          padding: "20px",
          fontSize: "0.8rem",
        }}
      >
        <div style={{ marginBottom: 6 }}>
          <span style={{ color: "#fff", fontFamily: "Georgia, serif", fontWeight: 700 }}>
            Our City News
          </span>{" "}
          · Johannesburg's Independent Voice
        </div>
        <div>
          Powered by{" "}
          <span style={{ color: COLORS.red, fontWeight: 600 }}>SACAQM</span> ·
          Data from the South African Clean Air Quality Monitoring Network
        </div>
      </footer>

      <EmbedCodeModal
        open={embedOpen}
        onClose={() => setEmbedOpen(false)}
        stationId={selectedStation?.slug || selectedStation?._id}
        widgetType="current-aqi"
      />

    </div>
  );
}

// ─────────────────────────────────────────────
// Main exported component: OurCityNewsWidget
// ─────────────────────────────────────────────
export default function OurCityNewsWidget() {
  const location = useLocation();
  const config = useMemo(() => parseWidgetConfig(location.search), [location.search]);
  const [demoMode, setDemoMode] = useState(false);
  const [demoScenario, setDemoScenario] = useState("Good");
  const [demoValues, setDemoValues] = useState({});
  const [selectedStationId, setSelectedStationId] = useState(config.station);
  const [alertActive, setAlertActive] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" });

  useEffect(() => {
    setSelectedStationId(config.station);
  }, [config.station]);

  const handleDemoValueChange = useCallback((field, value) => {
    setDemoValues((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleScenarioChange = useCallback((scenario) => {
    setDemoScenario(scenario);
    setDemoValues({}); // reset custom overrides when scenario changes
    setAlertActive(false);
  }, []);

  const handleTriggerAlert = useCallback(() => {
    setAlertActive(true);
    setDemoValues((prev) => ({ ...prev, pm2p5: 155, pm10p0: 300, nox: 160 }));
    setSnackbar({ open: true, message: "⚠️ Pollution alert triggered!", severity: "warning" });
  }, []);

  const handleResetDemo = useCallback(() => {
    setDemoScenario("Good");
    setDemoValues({});
    setAlertActive(false);
    setSnackbar({ open: true, message: "Demo reset to Good scenario", severity: "success" });
  }, []);

  const handleSwitchToDemo = useCallback(() => {
    setDemoMode(true);
    setSnackbar({ open: true, message: "Switched to demonstration mode", severity: "info" });
  }, []);

  const { stations, selectedStation, latestReading, historicalData, loading, error, refetch } =
    useAirQualityData(
      selectedStationId,
      demoMode,
      demoScenario,
      demoValues,
      config.timeRange
    );

  useEffect(() => {
    if (config.embed || !config.station || !stations.length) return;
    const resolvedStation = findStation(stations, config.station);
    if (resolvedStation && resolvedStation._id !== selectedStationId) {
      setSelectedStationId(resolvedStation._id);
    }
  }, [config.embed, config.station, selectedStationId, stations]);

  useEffect(() => {
    if (demoMode) return undefined;
    const intervalId = window.setInterval(refetch, config.refreshSeconds * 1000);
    return () => window.clearInterval(intervalId);
  }, [config.refreshSeconds, demoMode, refetch]);

  // Auto-select first station when stations load
  useEffect(() => {
    if (!selectedStationId && stations.length > 0) {
      setSelectedStationId(stations[0]._id);
    }
  }, [stations, selectedStationId]);

  // Auto-fallback to demo on API error
  useEffect(() => {
    if (error && !demoMode) {
      setSnackbar({
        open: true,
        message: "Live API unavailable. Click 'Switch to Demo Mode' below.",
        severity: "error",
      });
    }
  }, [error, demoMode]);

  if (config.embed) {
    return (
      <EmbeddedWidget
        widgetType={config.widgetType}
        theme={config.theme}
        pollutant={config.pollutant}
        timeRange={config.timeRange}
        latestReading={latestReading}
        historicalData={historicalData}
        loading={loading}
        error={error}
        selectedStation={selectedStation}
        stations={stations}
        stationId={selectedStation?._id || ""}
        onStationChange={setSelectedStationId}
        refreshSeconds={config.refreshSeconds}
        isDemo={demoMode}
        alertActive={alertActive}
        warnings={config.warnings}
      />
    );
  }

  return (
    <>
      <OurCityNewsLayout
        stations={stations}
        selectedStation={selectedStation}
        latestReading={latestReading}
        historicalData={historicalData}
        loading={loading}
        error={error}
        isDemo={demoMode}
        alertActive={alertActive}
        selectedStationId={selectedStationId}
        onStationChange={setSelectedStationId}
        onSwitchToDemo={handleSwitchToDemo}
        onLogout={() => {
          sessionStorage.removeItem("sacaqmWidgetAccess");
          window.location.hash = "/news-widget-login";
        }}
      />

      <DemoControlPanel
        demoMode={demoMode}
        onToggleDemo={setDemoMode}
        demoScenario={demoScenario}
        onScenarioChange={handleScenarioChange}
        demoValues={demoValues}
        onDemoValueChange={handleDemoValueChange}
        stations={demoMode ? DEMO_STATIONS : stations}
        selectedStationId={selectedStationId}
        onStationChange={setSelectedStationId}
        onTriggerAlert={handleTriggerAlert}
        onResetDemo={handleResetDemo}
        open={panelOpen}
        onToggle={() => setPanelOpen((o) => !o)}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}

