import React, { useEffect, useRef, useState, useContext, useCallback } from "react";
import { Box, Typography, Chip, Button, Tooltip } from "@mui/material";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { StationContext } from "../../contextProviders/StationContext";

mapboxgl.accessToken = (process.env.REACT_APP_MAPBOX_TOKEN || "").replace(/"/g, "");

// South Africa NAAQS Hourly PM2.5 AQI Threshold Bands & Colors
const getPM25ThresholdInfo = (pm25, isAlerted, isOffline) => {
  if (isAlerted) {
    return { statusKey: "Alert", label: "Active Alert", color: "#ef4444", ring: "rgba(239, 68, 68, 0.45)", bg: "#fee2e2", text: "#dc2626" };
  }
  if (isOffline) {
    return { statusKey: "Offline", label: "Offline", color: "#94a3b8", ring: "rgba(148, 163, 184, 0.25)", bg: "#f1f5f9", text: "#64748b" };
  }
  if (pm25 > 253) return { statusKey: "Hazardous", label: "Hazardous", color: "#a855f7", ring: "rgba(168, 85, 247, 0.4)", bg: "#f3e8ff", text: "#7e22ce" };
  if (pm25 > 203) return { statusKey: "VeryHigh", label: "Very Unhealthy", color: "#ef4444", ring: "rgba(239, 68, 68, 0.35)", bg: "#fee2e2", text: "#b91c1c" };
  if (pm25 > 153) return { statusKey: "High", label: "High (Unhealthy)", color: "#f97316", ring: "rgba(249, 115, 22, 0.35)", bg: "#ffedd5", text: "#c2410c" };
  if (pm25 > 103) return { statusKey: "Moderate", label: "Moderate", color: "#eab308", ring: "rgba(234, 179, 8, 0.35)", bg: "#fef9c3", text: "#854d0e" };
  return { statusKey: "Good", label: "Good", color: "#16a34a", ring: "rgba(22, 163, 74, 0.35)", bg: "#dcfce7", text: "#15803d" };
};

// Get the real PM2.5 value for a station from the active agent alerts,
// falling back to the station's own live reading if present.
const getStationPM25 = (station, matchedAlert) => {
  if (matchedAlert && matchedAlert.value != null) return Number(matchedAlert.value);
  if (station.pm25 != null && !isNaN(station.pm25)) return Number(station.pm25);
  if (station.pm2p5 != null && !isNaN(station.pm2p5)) return Number(station.pm2p5);
  if (station.currentPM25 != null && !isNaN(station.currentPM25)) return Number(station.currentPM25);
  return 0;
};

export default function StationMap({ activeAlerts = [], onSelectAlertStation, onOpenAlertList, onViewChange, flyToRegion }) {
  const { stations, loading } = useContext(StationContext);
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markersRef = useRef([]);
  const popupRef = useRef(null);

  const [selectedStation, setSelectedStation] = useState(null);
  const [filter, setFilter] = useState("All");
  const [counts, setCounts] = useState({ All: 0, Good: 0, Moderate: 0, High: 0, Alert: 0, Offline: 0 });
  const [showContour, setShowContour] = useState(false);

  // Find the real agent alert matching this station (or null)
  const findAlert = useCallback((station) => {
    if (!station || !activeAlerts || activeAlerts.length === 0) return null;
    const name = (station.name || "").toLowerCase();
    const id = (station._id || "").toString();
    const found = activeAlerts.find(a =>
      (a.stationId && a.stationId.toString() === id) ||
      (a.stationName && a.stationName.toLowerCase() === name)
    ) || null;
    if (found) console.log("MATCH:", station.name, "→ value:", found.value, found);
    return found;
  }, [activeAlerts]);
  // Expose click handler globally for Mapbox HTML popups
  useEffect(() => {
    window.__sacaqmOpenAlertStory = (stationId) => {
      const target = (stations || []).find(s => String(s._id) === String(stationId));
      if (target && onSelectAlertStation) onSelectAlertStation(target);
    };
    return () => { delete window.__sacaqmOpenAlertStory; };
  }, [stations, onSelectAlertStation]);

  useEffect(() => {
    if (!map.current || !flyToRegion) return;
    map.current.flyTo({ center: flyToRegion.center, zoom: flyToRegion.zoom, duration: 2000 });
  }, [flyToRegion]);

  // Generate GeoJSON features directly from monitoring stations
  const buildStationGeoJSON = useCallback(() => {
    if (!stations || !stations.length) return { type: "FeatureCollection", features: [] };
    const features = stations
      .map(station => {
        const lat = parseFloat(station.latitude);
        const lng = parseFloat(station.longitude);
        if (isNaN(lat) || isNaN(lng)) return null;

        const matchedAlert = findAlert(station);
        const isAlerted = !!matchedAlert;
        const pm2p5 = getStationPM25(station, matchedAlert);

        return {
          type: "Feature",
          geometry: { type: "Point", coordinates: [lng, lat] },
          properties: { id: station._id, name: station.name, pm2p5, isAlerted },
        };
      })
      .filter(Boolean);

    return { type: "FeatureCollection", features };
  }, [stations, findAlert]);

  // Setup Mapbox Sources and Contour Layer
  const setupLayers = useCallback((geojsonData) => {
    if (!map.current) return;

    if (!map.current.getSource("pm25-contour-source")) {
      map.current.addSource("pm25-contour-source", { type: "geojson", data: geojsonData });

      map.current.addLayer({
        id: "pm25-heatmap-layer",
        type: "heatmap",
        source: "pm25-contour-source",
        maxzoom: 15,
        layout: { visibility: "none" },
        paint: {
          "heatmap-weight": [
            "interpolate", ["linear"], ["to-number", ["get", "pm2p5"], 20.0],
            0, 0.1, 33, 0.25, 68, 0.45, 103, 0.65, 153, 0.85, 254, 1.0
          ],
          "heatmap-intensity": [
            "interpolate", ["linear"], ["zoom"],
            4, 0.35, 7, 0.55, 9, 0.85, 12, 1.1, 15, 1.4
          ],
          "heatmap-color": [
            "interpolate", ["linear"], ["heatmap-density"],
            0.0, "rgba(22, 163, 74, 0)",
            0.12, "rgba(22, 163, 74, 0.50)",
            0.40, "rgba(234, 179, 8, 0.70)",
            0.65, "rgba(249, 115, 22, 0.85)",
            0.85, "rgba(239, 68, 68, 0.95)",
            1.0, "rgba(168, 85, 247, 1.0)"
          ],
          "heatmap-radius": [
            "interpolate", ["linear"], ["zoom"],
            4, 25, 7, 45, 9, 75, 12, 125, 15, 180
          ],
          "heatmap-opacity": 0.85,
        },
      });
    }
  }, []);

  // 1. Initialize Mapbox Map
  useEffect(() => {
    if (map.current) return;
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [27.7, -26.4],
      zoom: 8,
      attributionControl: false,
    });

    map.current.addControl(new mapboxgl.NavigationControl({ showCompass: true }), "top-right");
    map.current.addControl(new mapboxgl.AttributionControl({ compact: true }), "bottom-left");
    map.current.on("move", () => {
      if (onViewChange && map.current) {
        onViewChange({ center: map.current.getCenter(), zoom: map.current.getZoom() });
      }
    });
    map.current.on("load", () => {
      try {
        map.current.setPaintProperty("water", "fill-color", "#dbeafe");
        map.current.setPaintProperty("land", "background-color", "#f8fafc");
      } catch (e) { }
      const initialData = buildStationGeoJSON();
      setupLayers(initialData);
    });
  }, [buildStationGeoJSON, setupLayers]);

  // 2. Update Contour GeoJSON Data when stations change
  useEffect(() => {
    if (!map.current || !stations.length) return;
    const geojson = buildStationGeoJSON();
    const doUpdate = () => {
      if (!map.current || !map.current.isStyleLoaded()) return;
      setupLayers(geojson);
      const s = map.current.getSource("pm25-contour-source");
      if (s) s.setData(geojson);
    };
    if (map.current.isStyleLoaded()) doUpdate();
    else map.current.on("load", doUpdate);
  }, [stations, buildStationGeoJSON, setupLayers]);

  // 3. Switch between Station Pins and Contour Plot
  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) return;
    if (showContour) {
      if (map.current.getLayer("pm25-heatmap-layer")) {
        map.current.setLayoutProperty("pm25-heatmap-layer", "visibility", "visible");
      }
      document.querySelectorAll(".station-marker").forEach(el => { el.style.display = "none"; });
    } else {
      if (map.current.getLayer("pm25-heatmap-layer")) {
        map.current.setLayoutProperty("pm25-heatmap-layer", "visibility", "none");
      }
      document.querySelectorAll(".station-marker").forEach(el => {
        const status = el.getAttribute("data-status");
        el.style.display = (filter === "All" || status === filter) ? "block" : "none";
      });
    }
  }, [showContour, filter]);

  // 4. Place HTML Station Pins with real PM2.5 values
  useEffect(() => {
    if (!map.current || loading || !stations.length) return;

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
    if (popupRef.current) { popupRef.current.remove(); popupRef.current = null; }

    const statusCounts = { All: 0, Good: 0, Moderate: 0, High: 0, Alert: 0, Offline: 0 };

    stations.forEach(station => {
      const lat = parseFloat(station.latitude);
      const lng = parseFloat(station.longitude);
      if (isNaN(lat) || isNaN(lng)) return;

      const matchedAlert = findAlert(station);
      const isAlerted = !!matchedAlert;
      const diff = (Date.now() - new Date(station.lastSeen || 0).getTime()) / 1000 / 60;
      const isOffline = diff > 1440;
      const pm25Val = getStationPM25(station, matchedAlert);

      const thresholdInfo = getPM25ThresholdInfo(pm25Val, isAlerted, isOffline);

      statusCounts.All++;
      if (statusCounts[thresholdInfo.statusKey] !== undefined) statusCounts[thresholdInfo.statusKey]++;

      const el = document.createElement("div");
      el.className = `station-marker ${isAlerted ? 'alerted-station-marker' : ''}`;
      el.setAttribute("data-status", thresholdInfo.statusKey);
      if (showContour) el.style.display = "none";

      el.innerHTML = `
        <div style="position: relative; display: flex; align-items: center; justify-content: center;">
          ${isAlerted ? `
            <div class="alert-pulse-ring"></div>
            <div class="alert-pulse-ring" style="animation-delay: 0.8s;"></div>
          ` : ''}
          <div style="
            width: ${isAlerted ? '24px' : '18px'};
            height: ${isAlerted ? '24px' : '18px'};
            background: ${thresholdInfo.color};
            border-radius: 50%; border: 2.5px solid #ffffff;
            box-shadow: 0 0 0 3px ${thresholdInfo.ring}, 0 3px 10px rgba(0,0,0,0.22);
            cursor: pointer; transition: transform 0.15s ease; position: relative; z-index: 2;
            display: flex; align-items: center; justify-content: center;
          ">
            ${isAlerted ? `<span style="font-size: 11px; line-height: 1;">🔥</span>`
              : `<div style="width: 5px; height: 5px; background: #ffffff; border-radius: 50%; opacity: 0.95;"></div>`}
          </div>
          ${isAlerted ? `
            <div style="
              position: absolute; top: -24px; background: #dc2626; color: white;
              font-family: 'Inter', sans-serif; font-size: 10px; font-weight: 800;
              padding: 2px 7px; border-radius: 6px; box-shadow: 0 4px 12px rgba(220,38,38,0.45);
              white-space: nowrap; z-index: 3; pointer-events: none;
            ">🔥 ${station.name}: ${pm25Val} µg/m³</div>
          ` : ''}
        </div>
      `;

      el.addEventListener("click", () => {
        setSelectedStation({ ...station, status: thresholdInfo, pm25Val, isAlerted });
        if (popupRef.current) popupRef.current.remove();

        popupRef.current = new mapboxgl.Popup({
          offset: 20, closeButton: true, closeOnClick: false, maxWidth: "280px", className: "station-popup",
        })
          .setLngLat([lng, lat])
          .setHTML(`
            <div style="font-family: 'DM Sans', sans-serif; padding: 4px 2px;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <div style="width: 12px; height: 12px; border-radius: 50%; background: ${thresholdInfo.color}; border: 1.5px solid #fff; box-shadow: 0 0 0 2px ${thresholdInfo.ring};"></div>
                  <span style="font-weight: 700; font-size: 13px; color: #0f172a; line-height: 1.3;">${station.name}</span>
                </div>
                <span style="background:${thresholdInfo.bg};color:${thresholdInfo.text};font-size:10px;font-weight:800;padding:2px 6px;border-radius:4px;">
                  ${thresholdInfo.label.toUpperCase()}
                </span>
              </div>
              <div style="background: ${thresholdInfo.bg}; border: 1px solid ${thresholdInfo.color}40; border-radius: 8px; padding: 8px 10px; margin-bottom: 8px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-size: 11px; color: #475569; font-weight: 600;">Hourly PM2.5</span>
                  <span style="font-size: 13px; font-weight: 800; color: ${thresholdInfo.text};">${pm25Val} µg/m³</span>
                </div>
                ${isAlerted && matchedAlert && matchedAlert.confidence != null ? `<div style="font-size: 10.5px; color: #b91c1c; margin-top: 4px; line-height: 1.3;">🤖 AI Verified: ${matchedAlert.confidence}% confidence.</div>` : ''}
              </div>
              ${isAlerted ? `
                <button onclick="if(window.__sacaqmOpenAlertStory) window.__sacaqmOpenAlertStory('${station._id}')"
                  style="width: 100%; background: #ef4444; color: white; border: none; padding: 9px; border-radius: 6px; font-size: 11.5px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; box-shadow: 0 2px 8px rgba(239,68,68,0.35);">
                  🔍 Inspect AI Investigation Story
                </button>
              ` : ''}
            </div>
          `)
          .addTo(map.current);

        map.current.flyTo({ center: [lng, lat], zoom: Math.max(map.current.getZoom(), 11), duration: 600 });
      });

      const marker = new mapboxgl.Marker({ element: el, anchor: "center" }).setLngLat([lng, lat]).addTo(map.current);
      markersRef.current.push(marker);
    });

    setCounts(statusCounts);
  }, [stations, loading, activeAlerts, showContour, findAlert]);

  return (
    <Box sx={{ borderRadius: 3, overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.08)", bgcolor: "white", position: "relative", border: "1px solid #e2e8f0" }}>
      {/* Top Map Header & Controls Toolbar */}
      <Box sx={{ px: 2.5, py: 1.5, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1.5, bgcolor: "#ffffff", borderBottom: "1px solid #f1f5f9" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
          <Typography sx={{ fontWeight: 800, fontSize: "0.95rem", color: "#0f172a", display: "flex", alignItems: "center", gap: 0.8 }}>
            🗺️ Station Air Quality Map
          </Typography>
          <Button size="small" variant={showContour ? "contained" : "outlined"} onClick={() => setShowContour(!showContour)}
            sx={{ px: 1.8, py: 0.6, fontSize: "0.78rem", textTransform: "none", borderRadius: 2, fontWeight: 700, bgcolor: showContour ? "#7c3aed" : "white", color: showContour ? "white" : "#7c3aed", borderColor: "#c4b5fd", boxShadow: showContour ? "0 2px 8px rgba(124,58,237,0.25)" : "none", "&:hover": { bgcolor: showContour ? "#6d28d9" : "#f5f3ff", borderColor: "#7c3aed" }, display: "flex", alignItems: "center", gap: 0.8 }}>
            <span>🔥</span>
            <span>{showContour ? "Switch to Station Pins" : "Turn Station to Contour Plot"}</span>
          </Button>
          {onOpenAlertList && (
            <Button size="small" variant="outlined" onClick={onOpenAlertList}
              sx={{ px: 1.6, py: 0.6, fontSize: "0.78rem", textTransform: "none", borderRadius: 2, fontWeight: 700, color: "#dc2626", borderColor: "#fca5a5", bgcolor: "#fef2f2", "&:hover": { bgcolor: "#fee2e2", borderColor: "#ef4444" }, display: "flex", alignItems: "center", gap: 0.6 }}>
              <span>📋</span>
              <span>Alert List ({activeAlerts.length})</span>
            </Button>
          )}
        </Box>

        {/* Right: Status Badges - real counts only */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
          {[
            { tooltip: "Moderate: 104-153 µg/m³", statusKey: "Moderate", count: counts.Moderate, color: "#eab308", bg: "#fef9c3", text: "#854d0e" },
            { tooltip: "Alerts (Threshold Exceeded)", statusKey: "Alert", count: counts.Alert, color: "#ef4444", bg: "#fee2e2", text: "#b91c1c" },
          ].map(f => (
            <Tooltip key={f.statusKey} title={f.tooltip} arrow>
              <Chip
                icon={<span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: filter === f.statusKey ? "white" : f.color, marginLeft: 6, marginRight: -4 }} />}
                label={`${f.count}`}
                size="small"
                onClick={() => { if (showContour) setShowContour(false); setFilter(filter === f.statusKey ? "All" : f.statusKey); }}
                sx={{ fontSize: "0.8rem", fontWeight: 800, bgcolor: filter === f.statusKey ? f.color : f.bg, color: filter === f.statusKey ? "white" : f.text, border: `1.5px solid ${filter === f.statusKey ? f.color : f.color + "55"}`, cursor: "pointer", minWidth: 46, borderRadius: 2, boxShadow: filter === f.statusKey ? `0 2px 8px ${f.color}44` : "none", transition: "all 0.15s ease", "&:hover": { transform: "translateY(-1px)", boxShadow: `0 3px 8px ${f.color}33` } }}
              />
            </Tooltip>
          ))}
        </Box>
      </Box>

      {/* Map Container */}
      <Box ref={mapContainer} sx={{ height: 490, width: "100%" }} />

      {/* Floating NAAQS Legend */}
      <Box sx={{ position: "absolute", bottom: 20, right: 20, zIndex: 5, bgcolor: "rgba(255, 255, 255, 0.96)", backdropFilter: "blur(10px)", p: 1.6, borderRadius: 2.5, border: "1px solid #e2e8f0", boxShadow: "0 8px 24px rgba(0,0,0,0.12)", display: "flex", flexDirection: "column", gap: 0.8, minWidth: 290 }}>
        <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: "#334155", textTransform: "uppercase", letterSpacing: "0.4px" }}>
          South Africa AQI PM2.5 (1-hr NAAQS)
        </Typography>
        <Box sx={{ display: "flex", width: "100%", height: 10, borderRadius: 1.5, overflow: "hidden" }}>
          <Box sx={{ flex: 1, bgcolor: "#16a34a", borderRight: "1.5px solid #fff" }} />
          <Box sx={{ flex: 1, bgcolor: "#eab308", borderRight: "1.5px solid #fff" }} />
          <Box sx={{ flex: 1, bgcolor: "#f97316", borderRight: "1.5px solid #fff" }} />
          <Box sx={{ flex: 1, bgcolor: "#ef4444", borderRight: "1.5px solid #fff" }} />
          <Box sx={{ flex: 1, bgcolor: "#a855f7" }} />
        </Box>
        <Box sx={{ display: "flex", width: "100%", mt: 0.2, fontSize: "0.72rem", fontWeight: 800 }}>
          <Box sx={{ flex: 1, textAlign: "center", color: "#16a34a" }}>0–103</Box>
          <Box sx={{ flex: 1, textAlign: "center", color: "#ca8a04" }}>104–153</Box>
          <Box sx={{ flex: 1, textAlign: "center", color: "#ea580c" }}>154–203</Box>
          <Box sx={{ flex: 1, textAlign: "center", color: "#dc2626" }}>204–253</Box>
          <Box sx={{ flex: 1, textAlign: "center", color: "#7e22ce" }}>&gt;254</Box>
        </Box>
      </Box>

      {/* Loading overlay */}
      {loading && (
        <Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "rgba(255,255,255,0.85)", backdropFilter: "blur(4px)", zIndex: 10 }}>
          <Typography sx={{ fontWeight: 600, color: "#64748b" }}>Loading monitoring stations...</Typography>
        </Box>
      )}

      {/* Marker Styles */}
      <style>{`
        @keyframes alertRingPulse {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7), 0 4px 12px rgba(0,0,0,0.3); }
          70% { box-shadow: 0 0 0 14px rgba(239, 68, 68, 0), 0 4px 12px rgba(0,0,0,0.3); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0), 0 4px 12px rgba(0,0,0,0.3); }
        }
        .alert-pulse-ring { position: absolute; width: 32px; height: 32px; border-radius: 50%; background: rgba(239, 68, 68, 0.28); animation: alertRingPulse 2s cubic-bezier(0.25, 1, 0.5, 1) infinite; pointer-events: none; }
        .station-marker:hover > div > div:nth-of-type(1) { transform: scale(1.22); }
        .station-marker { transition: all 0.2s ease; }
        .alerted-station-marker { z-index: 10 !important; }
        .station-popup { z-index: 20 !important; }
        .mapboxgl-popup { z-index: 25; }
        .mapboxgl-popup-content { pointer-events: auto !important; }
        .mapboxgl-canvas-container { cursor: default; }
        .mapboxgl-marker { pointer-events: auto; }
        .alert-pulse-ring { pointer-events: none; }
        .station-popup .mapboxgl-popup-content { border-radius: 12px !important; box-shadow: 0 8px 32px rgba(0,0,0,0.15) !important; padding: 14px 16px !important; border: 1px solid #e2e8f0 !important; font-family: 'DM Sans', sans-serif !important; background: #ffffff !important; }
        .station-popup .mapboxgl-popup-tip { border-top-color: #ffffff !important; }
        .station-popup .mapboxgl-popup-close-button { font-size: 16px !important; color: #94a3b8 !important; padding: 4px 8px !important; }
        .station-popup .mapboxgl-popup-close-button:hover { color: #334155 !important; background: transparent !important; }
        .mapboxgl-ctrl-group { border-radius: 8px !important; box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important; border: 1px solid #e2e8f0 !important; overflow: hidden; }
        .mapboxgl-ctrl-group button { width: 32px !important; height: 32px !important; }
      `}</style>
    </Box>
  );
}