// import React, { useState, useEffect, useContext } from "react";
// import {
//   FormControl, Select, MenuItem, InputLabel, Button,
//   CircularProgress, Alert
// } from "@mui/material";
// import { Grid, Box, Typography, Paper, Container } from "@mui/material";
// import axios from "axios";

// import { StationContext } from "../contextProviders/StationContext";
// import PMWidget from "../components/envDashboard/PMWidget";
// import NoiseGauge from "../components/envDashboard/NoiseGauge";
// import TempWidget from "../components/envDashboard/TempWidget";
// import ParameterWidget from "../components/envDashboard/ParameterWidget";
// import ComplianceTable from "../components/envDashboard/ComplianceTable";
// import ComplianceSummaryStrip from "../components/envDashboard/ComplianceSummary";
// import ExceedancesOverTimeChart from "../components/envDashboard/ExceedancesOverTimeChart";
// import ExceedancesTable from "../components/envDashboard/ExceedancesTable";

// // ─── Use environment variable for API base URL ────────────────────────────────
// const BASE = process.env.REACT_APP_API_BASE ;

// // ─── Helpers ──────────────────────────────────────────────────────────────────
// function formatDate(d) {
//   return (
//     d.getFullYear() + "-" +
//     (d.getMonth() + 1 < 10 ? "0" : "") + (d.getMonth() + 1) + "-" +
//     (d.getDate() < 10 ? "0" : "") + d.getDate()
//   );
// }

// function calcTrend(curr, prev) {
//   if (!prev || prev.length === 0) return 0;
//   const cAvg = curr.reduce((s, v) => s + v, 0) / curr.length;
//   const pAvg = prev.reduce((s, v) => s + v, 0) / prev.length;
//   if (pAvg === 0) return 0;
//   return Math.round(((cAvg - pAvg) / pAvg) * 100);
// }

// function getPrevPeriod(start, end) {
//   const s = new Date(start);
//   const e = new Date(end);
//   const days = Math.ceil(Math.abs(e - s) / 86400000);
//   const pe = new Date(s); pe.setDate(pe.getDate() - 1);
//   const ps = new Date(pe); ps.setDate(ps.getDate() - days);
//   return { start: formatDate(ps), end: formatDate(pe) };
// }

// function statusFor(val, threshold) {
//   if (val <= threshold) return "Green";
//   if (val <= threshold * 1.2) return "Amber";
//   return "Red";
// }

// const avgField = (arr, key) =>
//   arr.length ? Math.round(arr.reduce((s, d) => s + (d[key] || 0), 0) / arr.length) : 0;

// const safeMin = (arr) => arr?.length ? Math.round(Math.min(...arr.map((d) => d.min ?? 0))) : 0;
// const safeMax = (arr) => arr?.length ? Math.round(Math.max(...arr.map((d) => d.max ?? 0))) : 0;

// // ✅ SAAQIS AQI Thresholds (South African Government Standards)
// // Based on transition from AQI Band 3 (Good/Green) to Band 4 (Moderate/Yellow)
// // Source: SAAQIS Air Quality Index for General Public - DEFF
// const THRESHOLDS = { 
//   pm1: 40,      // Estimated (no official standard, using PM2.5 as reference)
//   pm25: 40,     // PM2.5: 40 µg/m³ (hourly) - SAAQIS Band 3→4 transition
//   pm5: 60,      // Estimated (no official standard, between PM2.5 and PM10)
//   pm10: 75,     // PM10: 75 µg/m³ (hourly) - SAAQIS Band 3→4 transition
//   noise: 70,    // dB (not in SAAQIS, using typical occupational health standard)
//   temperature: 32, // °C (not in SAAQIS, using health comfort standard)
//   humidity: 80,    // % (not in SAAQIS, using comfort standard)
//   co2: 1000,       // ppm (not in SAAQIS, using indoor air quality standard)
//   nox: 106,        // NO2: 106 ppb (hourly) - SAAQIS Band 3→4 transition
//   voc: 500         // No official SAAQIS standard, using typical indoor air quality guideline
// };

// // ─── Styles ───────────────────────────────────────────────────────────────────
// const filterBarSx = {
//   bgcolor: "rgba(255,255,255,0.95)", backdropFilter: "blur(20px)",
//   p: 3, borderRadius: 4, mb: 3,
//   border: "1px solid rgba(255,255,255,0.6)",
//   boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
//   position: "relative", overflow: "hidden",
//   "&::before": {
//     content: '""', position: "absolute", top: 0, left: 0, right: 0, height: "3px",
//     background: "linear-gradient(90deg,#667eea,#764ba2,#f093fb)",
//     backgroundSize: "200% 100%", animation: "shimmer 3s infinite linear",
//   },
//   "@keyframes shimmer": { "0%": { backgroundPosition: "0% 0%" }, "100%": { backgroundPosition: "200% 0%" } },
// };
// const selectSx = {
//   bgcolor: "white", borderRadius: 2.5,
//   "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(0,0,0,0.08)", borderWidth: 2 },
//   "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#667eea" },
//   "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#667eea", borderWidth: 2 },
//   fontSize: "0.95rem", fontWeight: 500, transition: "all 0.2s ease",
//   boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
//   "&:hover": { boxShadow: "0 4px 12px rgba(102,126,234,0.15)" },
// };
// const dateButtonSx = {
//   bgcolor: "white", color: "#64748b", borderRadius: 2.5, px: 2.5, py: 1.2,
//   fontSize: "0.95rem", fontWeight: 500, textTransform: "none",
//   border: "2px solid rgba(0,0,0,0.08)", boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
//   transition: "all 0.2s ease",
//   "&:hover": { bgcolor: "white", borderColor: "#667eea", color: "#667eea" },
// };
// const presetSx = {
//   px: 2, py: 0.5, fontSize: "0.75rem", fontWeight: 600, textTransform: "none",
//   borderRadius: 2, border: "2px solid transparent",
//   bgcolor: "rgba(102,126,234,0.08)", color: "#667eea", transition: "all 0.2s ease",
//   "&:hover": { bgcolor: "#667eea", color: "white" },
// };
// const labelSx = { fontSize: "0.75rem", fontWeight: 700, color: "#64748b", letterSpacing: "0.5px", textTransform: "uppercase" };
// const fadeIn = (delay) => ({
//   animation: `fadeInUp 0.6s ease-out ${delay}s`, animationFillMode: "backwards",
//   "@keyframes fadeInUp": {
//     from: { opacity: 0, transform: "translateY(30px)" },
//     to: { opacity: 1, transform: "translateY(0)" },
//   },
// });

// // ─── Main Component ───────────────────────────────────────────────────────────
// export default function EnvComplianceDashboard() {
//   const { stations, loading: stationsLoading } = useContext(StationContext);

//   const [sensorId, setSensorId] = useState("");
//   const [startDate, setStartDate] = useState(() => {
//     const d = new Date(); d.setDate(1); return formatDate(d);
//   });
//   const [endDate, setEndDate] = useState(() => formatDate(new Date()));
//   const [dateLabel, setDateLabel] = useState("This Month");
//   const [resolution, setResolution] = useState("daily");
//   const [dashData, setDashData] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);

//   // ─── Build flat list of { sensorId, label } from all stations ───────────
//   // Station schema: { name, sensorIds: [String], ... }
//   // sensorIds is an ARRAY — one station can have multiple sensors
//   const sensorOptions = (stations || []).flatMap((station) =>
//     (station.sensorIds || []).map((sid) => ({
//       id: sid,
//       // Label: "Station Name" if only 1 sensor, "Station Name – sid" if multiple
//       label: station.sensorIds.length === 1
//         ? station.name
//         : `${station.name} – ${sid}`,
//     }))
//   );

//   // Auto-select first sensor once stations load
//   useEffect(() => {
//     if (sensorOptions.length > 0 && !sensorId) {
//       console.log("✅ Sensor options:", sensorOptions);
//       setSensorId(sensorOptions[0].id);
//     }
//   }, [stations]);

//   useEffect(() => {
//     if (sensorId) fetchDashboard();
//   }, [sensorId, startDate, endDate, resolution]);

//   const fetchDashboard = async () => {
//     setLoading(true);
//     setError(null);

//     console.log("📡 Fetching:", `${BASE}/api/nodedata/aggregated`, { sensor_id: sensorId, start: startDate, end: endDate, resolution });

//     try {
//       const prev = getPrevPeriod(startDate, endDate);

//       // ✅ Fetch data in THREE resolutions:
//       // 1. Current period - user's selected resolution (for display charts)
//       // 2. Current period - HOURLY resolution (for exceedance counting)
//       // 3. Previous period (for trend calculation)
      
//       const [currRes, hourlyRes, prevRes] = await Promise.all([
//         axios.get(`${BASE}/api/nodedata/aggregated`, {
//           params: { sensor_id: sensorId, start: startDate, end: endDate, resolution },
//         }),
//         axios.get(`${BASE}/api/nodedata/aggregated`, {
//           params: { sensor_id: sensorId, start: startDate, end: endDate, resolution: 'hourly' },
//         }),
//         axios.get(`${BASE}/api/nodedata/aggregated`, {
//           params: { sensor_id: sensorId, start: prev.start, end: prev.end, resolution },
//         }).catch(() => ({ data: [] })),
//       ]);

//       const curr = currRes.data || [];
//       const hourly = hourlyRes.data || []; // ✅ Hourly data for exceedance counting
//       const prevData = prevRes.data || [];

//       console.log("✅ Display data:", curr.length, "records | Hourly data:", hourly.length, "hours");
//       console.log("Sample display record:", curr[0]);
//       console.log("Sample hourly record:", hourly[0]);

//       if (curr.length === 0) {
//         setError(`No data found for sensor "${sensorId}" between ${startDate} and ${endDate}. Try a wider date range.`);
//         setDashData(null);
//         setLoading(false);
//         return;
//       }

//       // Min/max — non-critical, won't break dashboard if endpoint fails
//       const mmFields = ["pm1p0", "pm2p5", "pm4p0", "pm10p0", "dba", "temperature", "humidity", "co2", "nox", "voc"];
//       const mmResults = await Promise.allSettled(
//         mmFields.map((field) =>
//           axios.get(`${BASE}/api/nodedata/daily-trend-minmax`, {
//             params: { sensor_id: sensorId, start: startDate, end: endDate, field },
//           })
//         )
//       );
//       const [mm1, mm25, mm4, mm10, mmNoise, mmTemp, mmHum, mmCO2, mmNOx, mmVOC] = mmResults.map((r) =>
//         r.status === "fulfilled" ? r.value.data || [] : []
//       );

//       const labels = curr.map((item) =>
//         new Date(item.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" })
//       );

//       const pmData = {
//         pm1:  { title: "PM1.0", labels, values: curr.map((d) => Math.round(d.pm1p0  || 0)), current: avgField(curr, "pm1p0"),  trend: calcTrend(curr.map((d) => d.pm1p0  || 0), prevData.map((d) => d.pm1p0  || 0)), min: safeMin(mm1),  max: safeMax(mm1) },
//         pm25: { title: "PM2.5", labels, values: curr.map((d) => Math.round(d.pm2p5  || 0)), current: avgField(curr, "pm2p5"),  trend: calcTrend(curr.map((d) => d.pm2p5  || 0), prevData.map((d) => d.pm2p5  || 0)), min: safeMin(mm25), max: safeMax(mm25) },
//         pm5:  { title: "PM4.0", labels, values: curr.map((d) => Math.round(d.pm4p0  || 0)), current: avgField(curr, "pm4p0"),  trend: calcTrend(curr.map((d) => d.pm4p0  || 0), prevData.map((d) => d.pm4p0  || 0)), min: safeMin(mm4),  max: safeMax(mm4) },
//         pm10: { title: "PM10",  labels, values: curr.map((d) => Math.round(d.pm10p0 || 0)), current: avgField(curr, "pm10p0"), trend: calcTrend(curr.map((d) => d.pm10p0 || 0), prevData.map((d) => d.pm10p0 || 0)), min: safeMin(mm10), max: safeMax(mm10) },
//       };

//       const noiseData = { current: avgField(curr, "dba"), labels, values: curr.map((d) => Math.round(d.dba || 0)) };
//       const tempData  = { labels, values: curr.map((d) => Math.round(d.temperature || 0)), current: avgField(curr, "temperature"), trend: calcTrend(curr.map((d) => d.temperature || 0), prevData.map((d) => d.temperature || 0)) };
      
//       const humidityData = { labels, values: curr.map((d) => Math.round(d.humidity || 0)), current: avgField(curr, "humidity"), trend: calcTrend(curr.map((d) => d.humidity || 0), prevData.map((d) => d.humidity || 0)) };
//       const co2Data = { labels, values: curr.map((d) => Math.round(d.co2 || 0)), current: avgField(curr, "co2"), trend: calcTrend(curr.map((d) => d.co2 || 0), prevData.map((d) => d.co2 || 0)) };
//       const noxData = { labels, values: curr.map((d) => Math.round(d.nox || 0)), current: avgField(curr, "nox"), trend: calcTrend(curr.map((d) => d.nox || 0), prevData.map((d) => d.nox || 0)) };
//       const vocData = { labels, values: curr.map((d) => Math.round(d.voc || 0)), current: avgField(curr, "voc"), trend: calcTrend(curr.map((d) => d.voc || 0), prevData.map((d) => d.voc || 0)) };

//       const statuses = {
//         pm1:   statusFor(pmData.pm1.current,   THRESHOLDS.pm1),
//         pm25:  statusFor(pmData.pm25.current,  THRESHOLDS.pm25),
//         pm5:   statusFor(pmData.pm5.current,   THRESHOLDS.pm5),
//         pm10:  statusFor(pmData.pm10.current,  THRESHOLDS.pm10),
//         noise: statusFor(noiseData.current,    THRESHOLDS.noise),
//         temp:  statusFor(tempData.current,     THRESHOLDS.temperature),
//         humidity: statusFor(humidityData.current, THRESHOLDS.humidity),
//         co2:   statusFor(co2Data.current,      THRESHOLDS.co2),
//         nox:   statusFor(noxData.current,      THRESHOLDS.nox),
//         voc:   statusFor(vocData.current,      THRESHOLDS.voc),
//       };

//       setDashData({
//         pmData, noiseData, tempData, humidityData, co2Data, noxData, vocData,
//         hourlyData: hourly, // ✅ Pass hourly data for exceedances chart
//         summary: {
//           compliant:    Object.values(statuses).filter((s) => s === "Green").length,
//           warnings:     Object.values(statuses).filter((s) => s === "Amber").length,
//           nonCompliant: Object.values(statuses).filter((s) => s === "Red").length,
//         },
//         table: [
//           { parameter: "PM1.0", status: statuses.pm1,   exceedances: hourly.filter((d) => (d.pm1p0       || 0) > THRESHOLDS.pm1).length },
//           { parameter: "PM2.5", status: statuses.pm25,  exceedances: hourly.filter((d) => (d.pm2p5       || 0) > THRESHOLDS.pm25).length },
//           { parameter: "PM4.0", status: statuses.pm5,   exceedances: hourly.filter((d) => (d.pm4p0       || 0) > THRESHOLDS.pm5).length },
//           { parameter: "PM10",  status: statuses.pm10,  exceedances: hourly.filter((d) => (d.pm10p0      || 0) > THRESHOLDS.pm10).length },
//           { parameter: "Noise", status: statuses.noise, exceedances: hourly.filter((d) => (d.dba         || 0) > THRESHOLDS.noise).length },
//           { parameter: "Humidity", status: statuses.humidity, exceedances: hourly.filter((d) => (d.humidity || 0) > THRESHOLDS.humidity).length },
//           // Only add CO2 if sensor has data
//           ...(hourly.some((d) => (d.co2 || 0) > 0) ? [{ parameter: "CO2", status: statuses.co2, exceedances: hourly.filter((d) => (d.co2 || 0) > THRESHOLDS.co2).length }] : []),
//           { parameter: "NOx",   status: statuses.nox,   exceedances: hourly.filter((d) => (d.nox         || 0) > THRESHOLDS.nox).length },
//           { parameter: "VOC",   status: statuses.voc,   exceedances: hourly.filter((d) => (d.voc         || 0) > THRESHOLDS.voc).length },
//         ],
//       });

//     } catch (err) {
//       console.error("❌ Fetch error:", err.response?.status, err.message);
//       if (err.response?.status === 404) {
//         setError(`404: Endpoint not found. The URL "${BASE}/api/nodedata/aggregated" doesn't exist — check your backend routes.`);
//       } else if (err.response?.status === 401) {
//         setError("401: Unauthorized — try logging in again.");
//       } else if (err.code === "ERR_NETWORK") {
//         setError("Network error — backend is unreachable.");
//       } else {
//         setError(`Error ${err.response?.status || ""}: ${err.message}`);
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ── Date helpers ──────────────────────────────────────────────────────────
//   const applyPreset = (preset) => {
//     const today = new Date();
//     let s, e, label;
//     switch (preset) {
//       case "today":   s = e = formatDate(today); label = "Today"; break;
//       case "week":    { const w = new Date(today); w.setDate(w.getDate() - 7); s = formatDate(w); e = formatDate(today); label = "Last 7 Days"; break; }
//       case "month":   s = formatDate(new Date(today.getFullYear(), today.getMonth(), 1)); e = formatDate(new Date(today.getFullYear(), today.getMonth() + 1, 0)); label = "This Month"; break;
//       case "quarter": { const q = Math.floor(today.getMonth() / 3); s = formatDate(new Date(today.getFullYear(), q * 3, 1)); e = formatDate(new Date(today.getFullYear(), q * 3 + 3, 0)); label = "This Quarter"; break; }
//       case "year":    s = formatDate(new Date(today.getFullYear(), 0, 1)); e = formatDate(new Date(today.getFullYear(), 11, 31)); label = "This Year"; break;
//       case "all":     s = "2020-01-01"; e = formatDate(today); label = "All Time"; break;
//       default: return;
//     }
//     setStartDate(s); setEndDate(e); setDateLabel(label);
//   };

//   // ── Render ────────────────────────────────────────────────────────────────
//   return (
//     <Box sx={{
//       minHeight: "100vh",
//       background: "linear-gradient(135deg,#667eea 0%,#764ba2 50%,#f093fb 100%)",
//       backgroundSize: "400% 400%", animation: "gradientShift 15s ease infinite",
//       "@keyframes gradientShift": { "0%": { backgroundPosition: "0% 50%" }, "50%": { backgroundPosition: "100% 50%" }, "100%": { backgroundPosition: "0% 50%" } },
//       p: { xs: 2, md: 3 },
//     }}>
//       <Container maxWidth="xl">

//         {/* Filter Bar */}
//         <Paper sx={filterBarSx}>
//           <Grid container spacing={2} alignItems="center">

//             {/* Sensor — built from station.sensorIds[] array */}
//             <Grid item xs={12} sm={6} md={2.5}>
//               <FormControl fullWidth size="small">
//                 <InputLabel sx={labelSx}>Sensor</InputLabel>
//                 <Select value={sensorId} label="Sensor" onChange={(e) => setSensorId(e.target.value)} sx={selectSx} disabled={loading || stationsLoading}>
//                   {stationsLoading
//                     ? <MenuItem disabled>Loading sensors...</MenuItem>
//                     : sensorOptions.map((opt) => (
//                         <MenuItem key={opt.id} value={opt.id}>{opt.label}</MenuItem>
//                       ))
//                   }
//                 </Select>
//               </FormControl>
//             </Grid>

//             {/* Quick Presets - Removed custom date range */}
//             <Grid item xs={12} sm={6} md={5}>
//               <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", justifyContent: 'flex-end' }}>
//                 <Button size="small" onClick={() => applyPreset('today')} sx={presetSx} disabled={loading}>Today</Button>
//                 <Button size="small" onClick={() => applyPreset('week')} sx={presetSx} disabled={loading}>Week</Button>
//                 <Button size="small" onClick={() => applyPreset('month')} sx={presetSx} disabled={loading}>Month</Button>
//                 <Button size="small" onClick={() => applyPreset('quarter')} sx={presetSx} disabled={loading}>Quarter</Button>
//                 <Button size="small" onClick={() => applyPreset('year')} sx={presetSx} disabled={loading}>Year</Button>
//               </Box>
//             </Grid>
//           </Grid>
//         </Paper>

//         {/* Loading */}
//         {loading && (
//           <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", my: 8 }}>
//             <CircularProgress size={60} sx={{ color: "white" }} />
//             <Typography sx={{ mt: 2, color: "white", fontWeight: 600 }}>Loading dashboard data...</Typography>
//           </Box>
//         )}

//         {/* Error */}
//         {error && !loading && (
//           <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError(null)}>
//             {error}
//           </Alert>
//         )}

//         {/* Dashboard Content */}
//         {!loading && dashData && (
//           <>
//             {/* ROW 1: Compliance Summary & Table */}
//             <Grid container spacing={3} sx={{ mb: 3 }}>
//               <Grid item xs={12} md={4}>
//                 <Box sx={fadeIn(0)}>
//                   <ComplianceSummaryStrip 
//                     compliant={dashData.summary.compliant} 
//                     warnings={dashData.summary.warnings} 
//                     nonCompliant={dashData.summary.nonCompliant} 
//                   />
//                 </Box>
                
//                 {/* Noise Gauge - below compliance */}
//                 <Box sx={{ ...fadeIn(0.1), mt: 3 }}>
//                   <NoiseGauge value={dashData.noiseData.current} />
//                 </Box>
//               </Grid>
//               <Grid item xs={12} md={8}>
//                 <Box sx={fadeIn(0.1)}>
//                   <ComplianceTable data={dashData.table} />
//                 </Box>
//               </Grid>
//             </Grid>

//             {/* ROW 1.5: Exceedances Over Time */}
//             <Grid container spacing={3} sx={{ mb: 3 }}>
//               <Grid item xs={12} md={6}>
//                 <Box sx={fadeIn(0.15)}>
//                   <ExceedancesOverTimeChart 
//                     hourlyData={dashData.hourlyData}
//                     thresholds={THRESHOLDS}
//                   />
//                 </Box>
//               </Grid>
              
//               <Grid item xs={12} md={6}>
//                 <Box sx={fadeIn(0.16)}>
//                   <ExceedancesTable 
//                     hourlyData={dashData.hourlyData}
//                     thresholds={THRESHOLDS}
//                   />
//                 </Box>
//               </Grid>
//             </Grid>

//             {/* ROW 2: PM Widgets */}
//             <Grid container spacing={3} sx={{ mb: 3 }}>
//               {Object.entries(dashData.pmData).map(([key, widget], idx) => (
//                 <Grid item xs={12} sm={6} lg={3} key={key}>
//                   <Box sx={fadeIn(0.2 + idx * 0.1)}>
//                     <PMWidget 
//                       title={widget.title} 
//                       labels={widget.labels} 
//                       dataPoints={widget.values} 
//                       threshold={THRESHOLDS[key]} 
//                       trend={widget.trend} 
//                     />
//                   </Box>
//                 </Grid>
//               ))}
//             </Grid>

//             {/* ROW 3: Environmental Parameters */}
//             <Grid container spacing={3} sx={{ mb: 3 }}>              
//               <Grid item xs={12} md={dashData.co2Data.values.some(v => v > 0) ? 4 : 6}>
//                 <Box sx={fadeIn(0.7)}>
//                   <TempWidget 
//                     title="Temperature" 
//                     labels={dashData.tempData.labels} 
//                     data={dashData.tempData.values} 
//                     threshold={THRESHOLDS.temperature} 
//                   />
//                 </Box>
//               </Grid>
              
//               <Grid item xs={12} md={dashData.co2Data.values.some(v => v > 0) ? 4 : 6}>
//                 <Box sx={fadeIn(0.8)}>
//                   <ParameterWidget 
//                     title="Humidity" 
//                     labels={dashData.humidityData.labels} 
//                     data={dashData.humidityData.values} 
//                     threshold={THRESHOLDS.humidity}
//                     unit="%" 
//                   />
//                 </Box>
//               </Grid>

//               {/* Only show CO2 if present */}
//               {dashData.co2Data.values.some(v => v > 0) && (
//                 <Grid item xs={12} md={4}>
//                   <Box sx={fadeIn(0.9)}>
//                     <ParameterWidget 
//                       title="CO2" 
//                       labels={dashData.co2Data.labels} 
//                       data={dashData.co2Data.values} 
//                       threshold={THRESHOLDS.co2}
//                       unit=" ppm" 
//                     />
//                   </Box>
//                 </Grid>
//               )}
//             </Grid>

//             {/* ROW 4: NOx, VOC */}
//             <Grid container spacing={3}>              
//               <Grid item xs={12} md={6}>
//                 <Box sx={fadeIn(1.0)}>
//                   <ParameterWidget 
//                     title="NOx" 
//                     labels={dashData.noxData.labels} 
//                     data={dashData.noxData.values} 
//                     threshold={THRESHOLDS.nox}
//                     unit=""
//                   />
//                 </Box>
//               </Grid>
              
//               <Grid item xs={12} md={6}>
//                 <Box sx={fadeIn(1.1)}>
//                   <ParameterWidget 
//                     title="VOC" 
//                     labels={dashData.vocData.labels} 
//                     data={dashData.vocData.values} 
//                     threshold={THRESHOLDS.voc}
//                     unit=""
//                   />
//                 </Box>
//               </Grid>
//             </Grid>
//           </>
//         )}
//       </Container>
//     </Box>
//   );
// }
import React, { useState, useEffect, useContext } from "react";
import {
  FormControl, Select, MenuItem, InputLabel, Button, Popover,
  TextField, CircularProgress, Alert
} from "@mui/material";
import { Grid, Box, Typography, Paper, Container } from "@mui/material";
import axios from "axios";

import { StationContext } from "../contextProviders/StationContext";
import PMWidget from "../components/envDashboard/PMWidget";
import NoiseGauge from "../components/envDashboard/NoiseGauge";
import NoiseWidget from "../components/envDashboard/NoiseWidget";
import TempWidget from "../components/envDashboard/TempWidget";
import ParameterWidget from "../components/envDashboard/ParameterWidget";
import ComplianceTable from "../components/envDashboard/ComplianceTable";
import ComplianceSummaryStrip from "../components/envDashboard/ComplianceSummary";
import ExceedancesOverTimeChart from "../components/envDashboard/ExceedancesOverTimeChart";
import ExceedancesTable from "../components/envDashboard/ExceedancesTable";
import ExceedancesSeverityChart from "../components/envDashboard/ExceedancesSeverityChart";

// ─── Use environment variable for API base URL ────────────────────────────────
const BASE = process.env.REACT_APP_API_BASE || "https://try-again-test-isaiah.app.cern.ch/api";

// ─── Helpers ──────────────────────────────────────────────────────────────────
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

function statusFor(val, threshold) {
  if (val <= threshold) return "Green";
  if (val <= threshold * 1.2) return "Amber";
  return "Red";
}

const avgField = (arr, key) =>
  arr.length ? Math.round(arr.reduce((s, d) => s + (d[key] || 0), 0) / arr.length) : 0;

const safeMin = (arr) => arr?.length ? Math.round(Math.min(...arr.map((d) => d.min ?? 0))) : 0;
const safeMax = (arr) => arr?.length ? Math.round(Math.max(...arr.map((d) => d.max ?? 0))) : 0;

// SAAQIS AQI Thresholds (South African Government Standards)
// Based on transition from AQI Band 3 (Good/Green) to Band 4 (Moderate/Yellow)
// Source: SAAQIS Air Quality Index for General Public - DEFF
const THRESHOLDS = { 
  pm1: 40,      // Estimated (no official standard, using PM2.5 as reference)
  pm25: 40,     // PM2.5: 40 µg/m³ (hourly) - SAAQIS Band 3→4 transition
  pm5: 60,      // Estimated (no official standard, between PM2.5 and PM10)
  pm10: 75,     // PM10: 75 µg/m³ (hourly) - SAAQIS Band 3→4 transition
  noise: 70,    // dB (not in SAAQIS, using typical occupational health standard)
  temperature: 32, // °C (not in SAAQIS, using health comfort standard)
  humidity: 80,    // % (not in SAAQIS, using comfort standard)
  co2: 1000,       // ppm (not in SAAQIS, using indoor air quality standard)
  nox: 106,        // NO2: 106 ppb (hourly) - SAAQIS Band 3→4 transition
  voc: 500         // No official SAAQIS standard, using typical indoor air quality guideline
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const filterBarSx = {
  bgcolor: "rgba(255,255,255,0.95)", backdropFilter: "blur(20px)",
  p: 3, borderRadius: 4, mb: 3,
  border: "1px solid rgba(255,255,255,0.6)",
  boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
  position: "relative", overflow: "hidden",
  "&::before": {
    content: '""', position: "absolute", top: 0, left: 0, right: 0, height: "3px",
    background: "linear-gradient(90deg,#667eea,#764ba2,#f093fb)",
    backgroundSize: "200% 100%", animation: "shimmer 3s infinite linear",
  },
  "@keyframes shimmer": { "0%": { backgroundPosition: "0% 0%" }, "100%": { backgroundPosition: "200% 0%" } },
};
const selectSx = {
  bgcolor: "white", borderRadius: 2.5,
  "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(0,0,0,0.08)", borderWidth: 2 },
  "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#667eea" },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#667eea", borderWidth: 2 },
  fontSize: "0.95rem", fontWeight: 500, transition: "all 0.2s ease",
  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
  "&:hover": { boxShadow: "0 4px 12px rgba(102,126,234,0.15)" },
};
const dateButtonSx = {
  bgcolor: "white", color: "#64748b", borderRadius: 2.5, px: 2.5, py: 1.2,
  fontSize: "0.95rem", fontWeight: 500, textTransform: "none",
  border: "2px solid rgba(0,0,0,0.08)", boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
  transition: "all 0.2s ease",
  "&:hover": { bgcolor: "white", borderColor: "#667eea", color: "#667eea" },
};
const presetSx = {
  px: 2, py: 0.5, fontSize: "0.75rem", fontWeight: 600, textTransform: "none",
  borderRadius: 2, border: "2px solid transparent",
  bgcolor: "rgba(102,126,234,0.08)", color: "#667eea", transition: "all 0.2s ease",
  "&:hover": { bgcolor: "#667eea", color: "white" },
};
const labelSx = { fontSize: "0.75rem", fontWeight: 700, color: "#64748b", letterSpacing: "0.5px", textTransform: "uppercase" };
const fadeIn = (delay) => ({
  animation: `fadeInUp 0.6s ease-out ${delay}s`, animationFillMode: "backwards",
  "@keyframes fadeInUp": {
    from: { opacity: 0, transform: "translateY(30px)" },
    to: { opacity: 1, transform: "translateY(0)" },
  },
});

// ─── Main Component ───────────────────────────────────────────────────────────
export default function EnvComplianceDashboard() {
  const { stations, loading: stationsLoading } = useContext(StationContext);

  const [sensorId, setSensorId] = useState("");
  const [startDate, setStartDate] = useState(() => {
    const d = new Date(); d.setDate(1); return formatDate(d);
  });
  const [endDate, setEndDate] = useState(() => formatDate(new Date()));
  const [dateLabel, setDateLabel] = useState("This Month");
  const [resolution, setResolution] = useState("daily");
  const [dashData, setDashData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [anchor, setAnchor] = useState(null);

  // ─── Build flat list of { sensorId, label } from all stations ───────────
  // Station schema: { name, sensorIds: [String], ... }
  // sensorIds is an ARRAY — one station can have multiple sensors
  const sensorOptions = (stations || []).flatMap((station) =>
    (station.sensorIds || []).map((sid) => ({
      id: sid,
      // Label: "Station Name" if only 1 sensor, "Station Name – sid" if multiple
      label: station.sensorIds.length === 1
        ? station.name
        : `${station.name} – ${sid}`,
    }))
  );

  // Auto-select first sensor once stations load
  useEffect(() => {
    if (sensorOptions.length > 0 && !sensorId) {
      console.log(" Sensor options:", sensorOptions);
      setSensorId(sensorOptions[0].id);
    }
  }, [stations]);

  useEffect(() => {
    if (sensorId) fetchDashboard();
  }, [sensorId, startDate, endDate, resolution]);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);

    console.log("📡 Fetching:", `${BASE}/api/nodedata/aggregated`, { sensor_id: sensorId, start: startDate, end: endDate, resolution });

    try {
      const prev = getPrevPeriod(startDate, endDate);

      // Fetch data in THREE resolutions:
      // 1. Current period - user's selected resolution (for display charts)
      // 2. Current period - HOURLY resolution (for exceedance counting)
      // 3. Previous period (for trend calculation)
      
      const [currRes, hourlyRes, prevRes] = await Promise.all([
        axios.get(`${BASE}/api/nodedata/aggregated`, {
          params: { sensor_id: sensorId, start: startDate, end: endDate, resolution },
        }),
        axios.get(`${BASE}/api/nodedata/aggregated`, {
          params: { sensor_id: sensorId, start: startDate, end: endDate, resolution: 'hourly' },
        }),
        axios.get(`${BASE}/api/nodedata/aggregated`, {
          params: { sensor_id: sensorId, start: prev.start, end: prev.end, resolution },
        }).catch(() => ({ data: [] })),
      ]);

      const curr = currRes.data || [];
      const hourly = hourlyRes.data || []; // Hourly data for exceedance counting
      const prevData = prevRes.data || [];

      console.log("Display data:", curr.length, "records | Hourly data:", hourly.length, "hours");
      console.log("Sample display record:", curr[0]);
      console.log("Sample hourly record:", hourly[0]);

      if (curr.length === 0) {
        setError(`No data found for sensor "${sensorId}" between ${startDate} and ${endDate}. Try a wider date range.`);
        setDashData(null);
        setLoading(false);
        return;
      }

      // Min/max — non-critical, won't break dashboard if endpoint fails
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
        pm1:   statusFor(pmData.pm1.current,   THRESHOLDS.pm1),
        pm25:  statusFor(pmData.pm25.current,  THRESHOLDS.pm25),
        pm5:   statusFor(pmData.pm5.current,   THRESHOLDS.pm5),
        pm10:  statusFor(pmData.pm10.current,  THRESHOLDS.pm10),
        noise: statusFor(noiseData.current,    THRESHOLDS.noise),
        temp:  statusFor(tempData.current,     THRESHOLDS.temperature),
        humidity: statusFor(humidityData.current, THRESHOLDS.humidity),
        co2:   statusFor(co2Data.current,      THRESHOLDS.co2),
        nox:   statusFor(noxData.current,      THRESHOLDS.nox),
        voc:   statusFor(vocData.current,      THRESHOLDS.voc),
      };

      setDashData({
        pmData, noiseData, tempData, humidityData, co2Data, noxData, vocData,
        hourlyData: hourly, //  Pass hourly data for exceedances chart
        summary: {
          compliant:    Object.values(statuses).filter((s) => s === "Green").length,
          warnings:     Object.values(statuses).filter((s) => s === "Amber").length,
          nonCompliant: Object.values(statuses).filter((s) => s === "Red").length,
        },
        table: [
          { parameter: "PM1.0", status: statuses.pm1,   exceedances: hourly.filter((d) => (d.pm1p0       || 0) > THRESHOLDS.pm1).length },
          { parameter: "PM2.5", status: statuses.pm25,  exceedances: hourly.filter((d) => (d.pm2p5       || 0) > THRESHOLDS.pm25).length },
          { parameter: "PM4.0", status: statuses.pm5,   exceedances: hourly.filter((d) => (d.pm4p0       || 0) > THRESHOLDS.pm5).length },
          { parameter: "PM10",  status: statuses.pm10,  exceedances: hourly.filter((d) => (d.pm10p0      || 0) > THRESHOLDS.pm10).length },
          { parameter: "Noise", status: statuses.noise, exceedances: hourly.filter((d) => (d.dba         || 0) > THRESHOLDS.noise).length },
          { parameter: "Humidity", status: statuses.humidity, exceedances: hourly.filter((d) => (d.humidity || 0) > THRESHOLDS.humidity).length },
          // Only add CO2 if sensor has data
          ...(hourly.some((d) => (d.co2 || 0) > 0) ? [{ parameter: "CO2", status: statuses.co2, exceedances: hourly.filter((d) => (d.co2 || 0) > THRESHOLDS.co2).length }] : []),
          { parameter: "NOx",   status: statuses.nox,   exceedances: hourly.filter((d) => (d.nox         || 0) > THRESHOLDS.nox).length },
          { parameter: "VOC",   status: statuses.voc,   exceedances: hourly.filter((d) => (d.voc         || 0) > THRESHOLDS.voc).length },
        ],
      });

    } catch (err) {
      console.error(" Fetch error:", err.response?.status, err.message);
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

  // ── Date helpers ──────────────────────────────────────────────────────────
  const applyPreset = (preset) => {
    const today = new Date();
    let s, e, label;
    switch (preset) {
      case "today":   s = e = formatDate(today); label = "Today"; break;
      case "week":    { const w = new Date(today); w.setDate(w.getDate() - 7); s = formatDate(w); e = formatDate(today); label = "Last 7 Days"; break; }
      case "month":   s = formatDate(new Date(today.getFullYear(), today.getMonth(), 1)); e = formatDate(new Date(today.getFullYear(), today.getMonth() + 1, 0)); label = "This Month"; break;
      case "quarter": { const q = Math.floor(today.getMonth() / 3); s = formatDate(new Date(today.getFullYear(), q * 3, 1)); e = formatDate(new Date(today.getFullYear(), q * 3 + 3, 0)); label = "This Quarter"; break; }
      case "year":    s = formatDate(new Date(today.getFullYear(), 0, 1)); e = formatDate(new Date(today.getFullYear(), 11, 31)); label = "This Year"; break;
      case "all":     s = "2020-01-01"; e = formatDate(today); label = "All Time"; break;
      default: return;
    }
    setStartDate(s); setEndDate(e); setDateLabel(label); setAnchor(null);
  };

  const applyCustomRange = () => {
    const s = new Date(startDate); const e = new Date(endDate);
    const sm = s.toLocaleDateString("en-US", { month: "short" });
    const em = e.toLocaleDateString("en-US", { month: "short" });
    const sy = s.getFullYear(); const ey = e.getFullYear();
    if (sy === ey && sm === em) setDateLabel(`${sm} ${sy}`);
    else if (sy === ey) setDateLabel(`${sm} - ${em} ${sy}`);
    else setDateLabel(`${sm} ${sy} - ${em} ${ey}`);
    setAnchor(null);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Box sx={{
      minHeight: "100vh",
      background: "linear-gradient(135deg,#667eea 0%,#764ba2 50%,#f093fb 100%)",
      backgroundSize: "400% 400%", animation: "gradientShift 15s ease infinite",
      "@keyframes gradientShift": { "0%": { backgroundPosition: "0% 50%" }, "50%": { backgroundPosition: "100% 50%" }, "100%": { backgroundPosition: "0% 50%" } },
      p: { xs: 2, md: 3 },
    }}>
      <Container maxWidth="xl">

        {/* Filter Bar */}
        <Paper sx={filterBarSx}>
          <Grid container spacing={2} alignItems="center">

            {/* Sensor — built from station.sensorIds[] array */}
            <Grid item xs={12} sm={6} md={2.5}>
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

            {/* Date Range Button */}
            <Grid item xs={12} sm={6} md={3}>
              <Button fullWidth onClick={(e) => setAnchor(e.currentTarget)} sx={dateButtonSx} disabled={loading}>
                📅 {dateLabel}
              </Button>
            </Grid>

            {/* Quick Presets */}
            <Grid item xs={12} sm={6} md={4.5}>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", justifyContent: 'flex-end' }}>
                <Button size="small" onClick={() => applyPreset('today')} sx={presetSx} disabled={loading}>Today</Button>
                <Button size="small" onClick={() => applyPreset('week')} sx={presetSx} disabled={loading}>Week</Button>
                <Button size="small" onClick={() => applyPreset('month')} sx={presetSx} disabled={loading}>Month</Button>
                <Button size="small" onClick={() => applyPreset('quarter')} sx={presetSx} disabled={loading}>Quarter</Button>
                <Button size="small" onClick={() => applyPreset('year')} sx={presetSx} disabled={loading}>Year</Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Date Range Popover */}
        <Popover open={Boolean(anchor)} anchorEl={anchor} onClose={() => setAnchor(null)}
          anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
          transformOrigin={{ vertical: "top", horizontal: "left" }}
          sx={{ "& .MuiPaper-root": { borderRadius: 3, boxShadow: "0 12px 40px rgba(0,0,0,0.15)", p: 3, mt: 1 } }}>
          <Box sx={{ minWidth: 420 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, color: "#1e293b" }}>Select Date Range</Typography>
            <Box sx={{ display: "flex", gap: 1, mb: 3, flexWrap: "wrap" }}>
              {["today","week","month","quarter","year"].map((p) => (
                <Button key={p} size="small" onClick={() => applyPreset(p)} sx={presetSx}>
                  {p==="today"&&"Today"}{p==="week"&&"Last 7 Days"}{p==="month"&&"This Month"}
                  {p==="quarter"&&"This Quarter"}{p==="year"&&"This Year"}
                </Button>
              ))}
            </Box>
            <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
              <TextField label="Start Date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} fullWidth size="small" InputLabelProps={{ shrink: true }} />
              <TextField label="End Date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} inputProps={{ min: startDate }} fullWidth size="small" InputLabelProps={{ shrink: true }} />
            </Box>
            <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
              <Button onClick={() => setAnchor(null)} sx={{ textTransform: "none" }}>Cancel</Button>
              <Button variant="contained" onClick={applyCustomRange} sx={{ bgcolor: "#667eea", textTransform: "none", px: 3, "&:hover": { bgcolor: "#5568d3" } }}>Apply</Button>
            </Box>
          </Box>
        </Popover>

        {/* Loading */}
        {loading && (
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", my: 8 }}>
            <CircularProgress size={60} sx={{ color: "white" }} />
            <Typography sx={{ mt: 2, color: "white", fontWeight: 600 }}>Loading dashboard data...</Typography>
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
            {/* ROW 1: Exceedances by Parameter & Severity - AT TOP */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12}>
                <Box sx={fadeIn(0)}>
                  <ExceedancesTable 
                    hourlyData={dashData.hourlyData}
                    thresholds={THRESHOLDS}
                  />
                </Box>
              </Grid>
            </Grid>

            {/* ROW 2: Exceedances Over Time Chart */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12}>
                <Box sx={fadeIn(0.1)}>
                  <ExceedancesOverTimeChart 
                    hourlyData={dashData.hourlyData}
                    thresholds={THRESHOLDS}
                  />
                </Box>
              </Grid>
            </Grid>

            {/* ROW 3: Severity Breakdown Charts (Moderate, High, Very High) */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} md={4}>
                <Box sx={fadeIn(0.15)}>
                  <ExceedancesSeverityChart 
                    hourlyData={dashData.hourlyData}
                    thresholds={THRESHOLDS}
                    severity="moderate"
                    title="Moderate Exceedances"
                    color="#fbbf24"
                  />
                </Box>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Box sx={fadeIn(0.16)}>
                  <ExceedancesSeverityChart 
                    hourlyData={dashData.hourlyData}
                    thresholds={THRESHOLDS}
                    severity="high"
                    title="High Exceedances"
                    color="#fb923c"
                  />
                </Box>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Box sx={fadeIn(0.17)}>
                  <ExceedancesSeverityChart 
                    hourlyData={dashData.hourlyData}
                    thresholds={THRESHOLDS}
                    severity="veryHigh"
                    title="Very High Exceedances"
                    color="#ef4444"
                  />
                </Box>
              </Grid>
            </Grid>

            {/* ROW 4: PM Widgets */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              {Object.entries(dashData.pmData).map(([key, widget], idx) => (
                <Grid item xs={12} sm={6} lg={3} key={key}>
                  <Box sx={fadeIn(0.2 + idx * 0.1)}>
                    <PMWidget 
                      title={widget.title} 
                      labels={widget.labels} 
                      dataPoints={widget.values} 
                      threshold={THRESHOLDS[key]} 
                      trend={widget.trend} 
                    />
                  </Box>
                </Grid>
              ))}
            </Grid>

            {/* ROW 5: Noise (Gauge + Chart) */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} md={4}>
                <Box sx={fadeIn(0.6)}>
                  <NoiseGauge value={dashData.noiseData.current} />
                </Box>
              </Grid>
              <Grid item xs={12} md={8}>
                <Box sx={fadeIn(0.65)}>
                  <NoiseWidget 
                    title="Noise Levels Over Time"
                    labels={dashData.noiseData.labels}
                    data={dashData.noiseData.values}
                    threshold={THRESHOLDS.noise}
                  />
                </Box>
              </Grid>
            </Grid>

            {/* ROW 6: Environmental Parameters */}
            <Grid container spacing={3} sx={{ mb: 3 }}>              
              <Grid item xs={12} md={dashData.co2Data.values.some(v => v > 0) ? 4 : 6}>
                <Box sx={fadeIn(0.7)}>
                  <TempWidget 
                    title="Temperature" 
                    labels={dashData.tempData.labels} 
                    data={dashData.tempData.values} 
                    threshold={THRESHOLDS.temperature} 
                  />
                </Box>
              </Grid>
              
              <Grid item xs={12} md={dashData.co2Data.values.some(v => v > 0) ? 4 : 6}>
                <Box sx={fadeIn(0.8)}>
                  <ParameterWidget 
                    title="Humidity" 
                    labels={dashData.humidityData.labels} 
                    data={dashData.humidityData.values} 
                    threshold={THRESHOLDS.humidity}
                    unit="%" 
                  />
                </Box>
              </Grid>

              {/* Only show CO2 if present */}
              {dashData.co2Data.values.some(v => v > 0) && (
                <Grid item xs={12} md={4}>
                  <Box sx={fadeIn(0.9)}>
                    <ParameterWidget 
                      title="CO2" 
                      labels={dashData.co2Data.labels} 
                      data={dashData.co2Data.values} 
                      threshold={THRESHOLDS.co2}
                      unit=" ppm" 
                    />
                  </Box>
                </Grid>
              )}
            </Grid>

            {/* ROW 7: NOx, VOC */}
            <Grid container spacing={3}>              
              <Grid item xs={12} md={6}>
                <Box sx={fadeIn(1.0)}>
                  <ParameterWidget 
                    title="NOx" 
                    labels={dashData.noxData.labels} 
                    data={dashData.noxData.values} 
                    threshold={THRESHOLDS.nox}
                    unit=""
                  />
                </Box>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Box sx={fadeIn(1.1)}>
                  <ParameterWidget 
                    title="VOC" 
                    labels={dashData.vocData.labels} 
                    data={dashData.vocData.values} 
                    threshold={THRESHOLDS.voc}
                    unit=""
                  />
                </Box>
              </Grid>
            </Grid>
          </>
        )}
      </Container>
    </Box>
  );
}