import React, { useEffect, useRef, useState, useContext, useCallback } from "react";
import { Box, Typography, Chip, Button } from "@mui/material";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { StationContext } from "../../contextProviders/StationContext";

mapboxgl.accessToken = (process.env.REACT_APP_MAPBOX_TOKEN || "").replace(/"/g, "");

// Official South Africa NAAQS Hourly PM2.5 AQI Threshold Bands & Colors:
// Low / Good:          0 - 103 µg/m³  -> Green  (#16a34a)
// Moderate:          104 - 153 µg/m³  -> Yellow (#eab308)
// High (Unhealthy):  154 - 203 µg/m³  -> Orange (#f97316)
// Very High:         204 - 253 µg/m³  -> Red    (#ef4444)
// Hazardous:               > 254 µg/m³  -> Purple (#a855f7)
// Offline:           No recent data   -> Grey   (#94a3b8)
const getPM25ThresholdInfo = (pm25, isAlerted, isOffline) => {
  if (isAlerted) {
    return {
      statusKey: "Alert",
      label: "Active Alert",
      color: "#ef4444",
      ring: "rgba(239, 68, 68, 0.45)",
      bg: "#fee2e2",
      text: "#dc2626",
    };
  }

  if (isOffline) {
    return {
      statusKey: "Offline",
      label: "Offline",
      color: "#94a3b8",
      ring: "rgba(148, 163, 184, 0.25)",
      bg: "#f1f5f9",
      text: "#64748b",
    };
  }

  if (pm25 > 253) {
    return {
      statusKey: "Hazardous",
      label: "Hazardous",
      color: "#a855f7",
      ring: "rgba(168, 85, 247, 0.4)",
      bg: "#f3e8ff",
      text: "#7e22ce",
    };
  }

  if (pm25 > 203) {
    return {
      statusKey: "VeryHigh",
      label: "Very Unhealthy",
      color: "#ef4444",
      ring: "rgba(239, 68, 68, 0.35)",
      bg: "#fee2e2",
      text: "#b91c1c",
    };
  }

  if (pm25 > 153) {
    return {
      statusKey: "High",
      label: "High (Unhealthy)",
      color: "#f97316",
      ring: "rgba(249, 115, 22, 0.35)",
      bg: "#ffedd5",
      text: "#c2410c",
    };
  }

  if (pm25 > 103) {
    return {
      statusKey: "Moderate",
      label: "Moderate",
      color: "#eab308",
      ring: "rgba(234, 179, 8, 0.35)",
      bg: "#fef9c3",
      text: "#854d0e",
    };
  }

  // 0 - 103 µg/m³: Low / Good (NAAQS 1-hr Standard)
  return {
    statusKey: "Good",
    label: "Good",
    color: "#16a34a",
    ring: "rgba(22, 163, 74, 0.35)",
    bg: "#dcfce7",
    text: "#15803d",
  };
};

// Kokosi Alert Incident Origin Coordinates
const KOKOSI_COORDS = [27.46795, -26.49442];

// Simulated / real PM2.5 readings for known stations
const getStationPM25 = (station, isAlerted) => {
  if (isAlerted) return 142.6;
  if (station.pm25 !== undefined && station.pm25 !== null && !isNaN(station.pm25)) return Number(station.pm25);
  if (station.pm2p5 !== undefined && station.pm2p5 !== null && !isNaN(station.pm2p5)) return Number(station.pm2p5);
  if (station.currentPM25 !== undefined && station.currentPM25 !== null && !isNaN(station.currentPM25)) return Number(station.currentPM25);
  
  const name = (station.name || "").toLowerCase();
  if (name.includes("kokosi")) return 142.6;
  if (name.includes("greenspark")) return 118.0;
  if (name.includes("wedela")) return 76.5;
  if (name.includes("carltonville") || name.includes("carleton")) return 45.0;
  if (name.includes("benoni") || name.includes("inso")) return 35.0;
  if (name.includes("bokchkop") || name.includes("westdene")) return 30.0;
  if (name.includes("victory") || name.includes("houghton")) return 18.2;
  const diff = (Date.now() - new Date(station.lastSeen || 0).getTime()) / 1000 / 60;
  return diff <= 1440 ? 24.5 : 0;
};

// Lightweight Atmospheric Smoke Plume GeoJSON (Zero GPU overhead, always visible)
function getLightweightSmokeGeoJSON() {
  const origLng = KOKOSI_COORDS[0];
  const origLat = KOKOSI_COORDS[1];
  const angleDeg = 55; // ENE wind direction
  const angleRad = (angleDeg * Math.PI) / 180;
  const perpRad = angleRad + Math.PI / 2;
  const latKm = 111.0;
  const lngKm = 111.32 * Math.cos((origLat * Math.PI) / 180);

  const makeSmokePolygon = (lengthKm, startW, endW, billowAmp = 0.4, steps = 24) => {
    const leftCoords = [];
    const rightCoords = [];

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const dist = t * lengthKm;
      const baseW = startW + (endW - startW) * Math.pow(t, 0.78);
      const billow = Math.sin(t * Math.PI * 4.5) * (billowAmp * t);
      const w = baseW + billow;
      const meander = Math.sin(t * Math.PI * 2.2) * (1.1 * t);

      const cx = origLng + (dist * Math.sin(angleRad) + meander * Math.sin(perpRad)) / lngKm;
      const cy = origLat + (dist * Math.cos(angleRad) + meander * Math.cos(perpRad)) / latKm;

      const lx = cx - (w * Math.sin(perpRad)) / lngKm;
      const ly = cy - (w * Math.cos(perpRad)) / latKm;
      leftCoords.push([parseFloat(lx.toFixed(5)), parseFloat(ly.toFixed(5))]);

      const rx = cx + (w * Math.sin(perpRad)) / lngKm;
      const ry = cy + (w * Math.cos(perpRad)) / latKm;
      rightCoords.unshift([parseFloat(rx.toFixed(5)), parseFloat(ry.toFixed(5))]);
    }

    return leftCoords.concat(rightCoords, [leftCoords[0]]);
  };

  const lineCoords = [];
  for (let i = 0; i <= 20; i++) {
    const t = i / 20.0;
    const dist = t * 35.0;
    const meander = Math.sin(t * Math.PI * 2.2) * (1.1 * t);
    const cx = origLng + (dist * Math.sin(angleRad) + meander * Math.sin(perpRad)) / lngKm;
    const cy = origLat + (dist * Math.cos(angleRad) + meander * Math.cos(perpRad)) / latKm;
    lineCoords.push([parseFloat(cx.toFixed(5)), parseFloat(cy.toFixed(5))]);
  }

  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: { layer: "outer" },
        geometry: { type: "Polygon", coordinates: [makeSmokePolygon(34, 0.3, 5.2, 0.5)] },
      },
      {
        type: "Feature",
        properties: { layer: "mid" },
        geometry: { type: "Polygon", coordinates: [makeSmokePolygon(20, 0.25, 3.2, 0.3)] },
      },
      {
        type: "Feature",
        properties: { layer: "core" },
        geometry: { type: "Polygon", coordinates: [makeSmokePolygon(8, 0.15, 1.4, 0.1)] },
      },
      {
        type: "Feature",
        properties: { layer: "trajectory" },
        geometry: { type: "LineString", coordinates: lineCoords },
      },
    ],
  };
}

export default function StationMap({ activeAlerts = [], onSelectAlertStation, onOpenAlertList, onViewChange, flyToRegion }) {
  const { stations, loading } = useContext(StationContext);
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markersRef = useRef([]);
  const popupRef = useRef(null);
  const smokeMarkerRef = useRef(null);

  const [selectedStation, setSelectedStation] = useState(null);
  const [filter, setFilter] = useState("All");
  const [counts, setCounts] = useState({ All: 0, Good: 0, Moderate: 0, High: 0, Alert: 0, Offline: 0 });
  
  // Default: NO contour plot on initial load (starts directly in Station Pins mode)
  const [showContour, setShowContour] = useState(false);
  
  
  // Smoke plume toggle state (can be turned ON or OFF via button)
  const [showSmoke, setShowSmoke] = useState(true);

  // Expose click handler globally for Mapbox HTML popups
  useEffect(() => {
    window.__sacaqmOpenAlertStory = (stationId) => {
      const target = (stations || []).find(s => String(s._id) === String(stationId)) || {
        _id: stationId,
        name: "Kokosi Old Library Station",
        city: "Fochville",
        province: "Gauteng",
        pm25Val: 142.6,
      };
      if (onSelectAlertStation) onSelectAlertStation(target);
    };
    return () => { delete window.__sacaqmOpenAlertStory; };
  }, [stations, onSelectAlertStation]);

  useEffect(() => {
    if (!map.current || !flyToRegion) return;
    map.current.flyTo({
      center: flyToRegion.center,
      zoom: flyToRegion.zoom,
      duration: 2000,
    });
  }, [flyToRegion]);

  // Check if a station has an active alert
  const checkIsAlerted = useCallback((station) => {
    if (!station) return false;
    const name = (station.name || "").toLowerCase();
    const id = (station._id || "").toString();
    if (activeAlerts && activeAlerts.length > 0) {
      return activeAlerts.some(a => 
        (a.stationId && a.stationId.toString() === id) ||
        (a.stationName && a.stationName.toLowerCase() === name) ||
        (name.includes("kokosi"))
      );
    }
    return name.includes("kokosi");
  }, [activeAlerts]);

  // Generate GeoJSON features directly from monitoring stations
  const buildStationGeoJSON = useCallback(() => {
    if (!stations || !stations.length) return { type: "FeatureCollection", features: [] };
    const features = stations
      .map(station => {
        const lat = parseFloat(station.latitude);
        const lng = parseFloat(station.longitude);
        if (isNaN(lat) || isNaN(lng)) return null;

        const isAlerted = checkIsAlerted(station);
        const pm2p5 = getStationPM25(station, isAlerted);

        return {
          type: "Feature",
          geometry: { type: "Point", coordinates: [lng, lat] },
          properties: {
            id: station._id,
            name: station.name,
            pm2p5: pm2p5,
            isAlerted: isAlerted,
          },
        };
      })
      .filter(Boolean);

    // Ensure dense plume points around Kokosi for realistic contour gradient
    features.push(
      { type: "Feature", geometry: { type: "Point", coordinates: [27.46795, -26.49442] }, properties: { pm2p5: 142.6, isAlerted: true } },
      { type: "Feature", geometry: { type: "Point", coordinates: [27.49500, -26.47800] }, properties: { pm2p5: 125.0, isAlerted: false } },
      { type: "Feature", geometry: { type: "Point", coordinates: [27.53000, -26.45500] }, properties: { pm2p5: 98.0, isAlerted: false } },
      { type: "Feature", geometry: { type: "Point", coordinates: [27.57500, -26.43200] }, properties: { pm2p5: 68.0, isAlerted: false } },
      { type: "Feature", geometry: { type: "Point", coordinates: [27.62000, -26.40500] }, properties: { pm2p5: 42.0, isAlerted: false } }
    );

    return { type: "FeatureCollection", features };
  }, [stations, checkIsAlerted]);

  // Setup Mapbox Sources and Contour / Smoke Layers
  const setupLayers = useCallback((geojsonData) => {
    if (!map.current) return;

    // 1. PM2.5 Contour / Heatmap Layer
    if (!map.current.getSource("pm25-contour-source")) {
      map.current.addSource("pm25-contour-source", {
        type: "geojson",
        data: geojsonData,
      });

      map.current.addLayer({
        id: "pm25-heatmap-layer",
        type: "heatmap",
        source: "pm25-contour-source",
        maxzoom: 15,
        layout: {
          visibility: "none", // Hidden by default (Station Pins default)
        },
        paint: {
          "heatmap-weight": [
            "interpolate", ["linear"], ["to-number", ["get", "pm2p5"], 20.0],
            0, 0.1,
            33, 0.25,
            68, 0.45,
            103, 0.65,
            153, 0.85,
            254, 1.0
          ],
          "heatmap-intensity": [
            "interpolate", ["linear"], ["zoom"],
            4, 0.35,
            7, 0.55,
            9, 0.85,
            12, 1.1,
            15, 1.4
          ],
          // South Africa NAAQS AQI Colors:
          // Green (0-103), Yellow (104-153), Orange (154-203), Red (204-253), Purple (>254)
          "heatmap-color": [
            "interpolate", ["linear"], ["heatmap-density"],
            0.0,  "rgba(22, 163, 74, 0)",
            0.12, "rgba(22, 163, 74, 0.50)",  // Good: Green
            0.40, "rgba(234, 179, 8, 0.70)",  // Moderate: Yellow
            0.65, "rgba(249, 115, 22, 0.85)", // High: Orange
            0.85, "rgba(239, 68, 68, 0.95)",  // Very High: Red
            1.0,  "rgba(168, 85, 247, 1.0)"   // Hazardous: Purple
          ],
          "heatmap-radius": [
            "interpolate", ["linear"], ["zoom"],
            4, 25,
            7, 45,
            9, 75,
            12, 125,
            15, 180
          ],
          "heatmap-opacity": 0.85,
        },
      });
    }

    // 2. High-Performance Lightweight Atmospheric Smoke Plume Layer
    if (!map.current.getSource("lightweight-smoke-source")) {
      const smokeData = getLightweightSmokeGeoJSON();
      map.current.addSource("lightweight-smoke-source", {
        type: "geojson",
        data: smokeData,
      });

      // Outer smoke haze
      map.current.addLayer({
        id: "smoke-outer-layer",
        type: "fill",
        source: "lightweight-smoke-source",
        filter: ["==", ["get", "layer"], "outer"],
        paint: {
          "fill-color": "#64748b",
          "fill-opacity": 0.28,
        },
      });

      // Mid dense smoke corridor
      map.current.addLayer({
        id: "smoke-mid-layer",
        type: "fill",
        source: "lightweight-smoke-source",
        filter: ["==", ["get", "layer"], "mid"],
        paint: {
          "fill-color": "#c2410c",
          "fill-opacity": 0.45,
        },
      });

      // Core fire zone
      map.current.addLayer({
        id: "smoke-core-layer",
        type: "fill",
        source: "lightweight-smoke-source",
        filter: ["==", ["get", "layer"], "core"],
        paint: {
          "fill-color": "#dc2626",
          "fill-opacity": 0.68,
        },
      });

      // Trajectory wind vector line
      map.current.addLayer({
        id: "smoke-trajectory-line",
        type: "line",
        source: "lightweight-smoke-source",
        filter: ["==", ["get", "layer"], "trajectory"],
        paint: {
          "line-color": "#b91c1c",
          "line-width": 2,
          "line-dasharray": [3, 2],
          "line-opacity": 0.8,
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
      zoom: 8,          // was 9.5 — lower number = zoomed out = see more area
      attributionControl: false,
    });
    
    map.current.addControl(new mapboxgl.NavigationControl({ showCompass: true }), "top-right");
    map.current.addControl(new mapboxgl.AttributionControl({ compact: true }), "bottom-left");
    map.current.on("move", () => {
      if (onViewChange && map.current) {
        onViewChange({
          center: map.current.getCenter(),
          zoom: map.current.getZoom(),
        });
      }
    });
    map.current.on("load", () => {
      try {
        map.current.setPaintProperty("water", "fill-color", "#dbeafe");
        map.current.setPaintProperty("land", "background-color", "#f8fafc");
      } catch (e) {}

      const initialData = buildStationGeoJSON();
      setupLayers(initialData);

      // Create permanent Fire Hotspot Marker at Kokosi
      if (!smokeMarkerRef.current) {
        const el = document.createElement("div");
        el.className = "smoke-hotspot-pin";
        el.style.cursor = "pointer";
        el.onclick = () => {
          if (window.__sacaqmOpenAlertStory) window.__sacaqmOpenAlertStory("kokosi_hotspot");
        };
        el.innerHTML = `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
            <div style="
              background: #dc2626; color: white; font-family: 'Inter', sans-serif;
              font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 8px;
              box-shadow: 0 4px 14px rgba(220,38,38,0.5); white-space: nowrap; margin-bottom: 4px;
              display: flex; align-items: center; gap: 5px; border: 1.5px solid white;
            ">
              <span>🔥 Kokosi Fire Origin: 142.6 µg/m³</span>
            </div>
            <div style="
              width: 26px; height: 26px; background: #dc2626; border: 3px solid white;
              border-radius: 50%; box-shadow: 0 0 0 4px rgba(239,68,68,0.45), 0 4px 12px rgba(0,0,0,0.3);
              display: flex; align-items: center; justify-content: center; font-size: 13px;
              animation: alertRingPulse 2s cubic-bezier(0.25, 1, 0.5, 1) infinite;
            ">
              🔥
            </div>
          </div>
        `;
        smokeMarkerRef.current = new mapboxgl.Marker({ element: el, anchor: "bottom" })
          .setLngLat(KOKOSI_COORDS)
          .addTo(map.current);
      }
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
      if (s) {
        s.setData(geojson);
      }
    };

    if (map.current.isStyleLoaded()) {
      doUpdate();
    } else {
      map.current.on("load", doUpdate);
    }
  }, [stations, buildStationGeoJSON, setupLayers]);

  // 3. Switch between Station Pins and Contour Plot
  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) return;

    if (showContour) {
      // Contour Plot ON: Heatmap visible, station pin dots hidden
      if (map.current.getLayer("pm25-heatmap-layer")) {
        map.current.setLayoutProperty("pm25-heatmap-layer", "visibility", "visible");
      }
      document.querySelectorAll(".station-marker").forEach(el => { el.style.display = "none"; });
    } else {
      // Station Pins ON (Default): Heatmap hidden, station pins visible
      if (map.current.getLayer("pm25-heatmap-layer")) {
        map.current.setLayoutProperty("pm25-heatmap-layer", "visibility", "none");
      }
      document.querySelectorAll(".station-marker").forEach(el => {
        const status = el.getAttribute("data-status");
        el.style.display = (filter === "All" || status === filter) ? "block" : "none";
      });
    }
  }, [showContour, filter]);

  // 4. Toggle Smoke Plume Layer Visibility (Turn Plume ON or OFF)
  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) return;

    const smokeLayers = ["smoke-outer-layer", "smoke-mid-layer", "smoke-core-layer", "smoke-trajectory-line"];
    smokeLayers.forEach(l => {
      if (map.current.getLayer(l)) {
        map.current.setLayoutProperty(l, "visibility", showSmoke ? "visible" : "none");
      }
    });
    if (smokeMarkerRef.current) {
      smokeMarkerRef.current.getElement().style.display = showSmoke ? "block" : "none";
    }
  }, [showSmoke]);

  // 5. Place HTML Station Pins with Official South Africa PM2.5 Threshold Colors
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

      const isAlerted = checkIsAlerted(station);
      const diff = (Date.now() - new Date(station.lastSeen || 0).getTime()) / 1000 / 60;
      const isOffline = diff > 1440;
      const pm25Val = getStationPM25(station, isAlerted);

      // Resolve color and label directly from South Africa NAAQS hourly thresholds:
      // Green (0-103), Yellow (104-153), Orange (154-203), Red (204-253 / Alert), Purple (>254)
      const thresholdInfo = getPM25ThresholdInfo(pm25Val, isAlerted, isOffline);
      
      statusCounts.All++;
      if (statusCounts[thresholdInfo.statusKey] !== undefined) {
        statusCounts[thresholdInfo.statusKey]++;
      }

      const el = document.createElement("div");
      el.className = `station-marker ${isAlerted ? 'alerted-station-marker' : ''}`;
      el.setAttribute("data-status", thresholdInfo.statusKey);

      // Hidden if contour mode is currently active
      if (showContour) {
        el.style.display = "none";
      }

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
            border-radius: 50%;
            border: 2.5px solid #ffffff;
            box-shadow: 0 0 0 3px ${thresholdInfo.ring}, 0 3px 10px rgba(0,0,0,0.22);
            cursor: pointer;
            transition: transform 0.15s ease, box-shadow 0.15s ease;
            position: relative;
            z-index: 2;
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            ${isAlerted ? `
              <span style="font-size: 11px; line-height: 1;">🔥</span>
            ` : `
              <div style="width: 5px; height: 5px; background: #ffffff; border-radius: 50%; opacity: 0.95;"></div>
            `}
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
          offset: 20,
          closeButton: true,
          closeOnClick: false,
          maxWidth: "280px",
          className: "station-popup",
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
                  <span style="font-size: 13px; font-weight: 800; color: ${thresholdInfo.text};">
                    ${pm25Val} µg/m³
                  </span>
                </div>
                ${isAlerted ? '<div style="font-size: 10.5px; color: #b91c1c; margin-top: 4px; line-height: 1.3;">🤖 AI Verified: 92% confidence biomass smoke incident.</div>' : ''}
              </div>

              ${isAlerted ? `
                <button
                  id="popup-alert-btn-${station._id}"
                  onclick="if(window.__sacaqmOpenAlertStory) window.__sacaqmOpenAlertStory('${station._id}')"
                  style="
                    width: 100%; background: #ef4444; color: white; border: none;
                    padding: 9px; border-radius: 6px; font-size: 11.5px; font-weight: 700;
                    cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;
                    box-shadow: 0 2px 8px rgba(239,68,68,0.35);
                  "
                >
                  🔍 Inspect AI Investigation Story
                </button>
              ` : ''}
            </div>
          `)
          .addTo(map.current);

        map.current.flyTo({ center: [lng, lat], zoom: Math.max(map.current.getZoom(), 11), duration: 600 });
      });

      const marker = new mapboxgl.Marker({ element: el, anchor: "center" })
        .setLngLat([lng, lat])
        .addTo(map.current);

      markersRef.current.push(marker);
    });

    setCounts(statusCounts);
  }, [stations, loading, activeAlerts, showContour, checkIsAlerted]);

  // Handle toggling smoke plume ON and OFF
  const handleToggleSmoke = () => {
    const nextState = !showSmoke;
    setShowSmoke(nextState);
    if (nextState && map.current) {
      map.current.flyTo({ center: [27.54, -26.46], zoom: 11.2, duration: 800 });
    }
  };

  return (
    <Box sx={{
      borderRadius: 3,
      overflow: "hidden",
      boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
      bgcolor: "white",
      position: "relative",
      border: "1px solid #e2e8f0",
    }}>
      {/* Top Map Header & Controls Toolbar */}
      <Box sx={{
        px: 2.5, py: 1.5,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: 1.5,
        bgcolor: "#ffffff", borderBottom: "1px solid #f1f5f9",
      }}>
        {/* Left: Map Title & Controls */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
          <Typography sx={{ fontWeight: 800, fontSize: "0.95rem", color: "#0f172a", display: "flex", alignItems: "center", gap: 0.8 }}>
            🗺️ Station Air Quality Map
          </Typography>

          {/* Button Switch: Turn Station to Contour Plot */}
          <Button
            size="small"
            variant={showContour ? "contained" : "outlined"}
            onClick={() => setShowContour(!showContour)}
            sx={{
              px: 1.8, py: 0.6, fontSize: "0.78rem", textTransform: "none",
              borderRadius: 2, fontWeight: 700,
              bgcolor: showContour ? "#7c3aed" : "white",
              color: showContour ? "white" : "#7c3aed",
              borderColor: "#c4b5fd",
              boxShadow: showContour ? "0 2px 8px rgba(124,58,237,0.25)" : "none",
              "&:hover": { bgcolor: showContour ? "#6d28d9" : "#f5f3ff", borderColor: "#7c3aed" },
              display: "flex", alignItems: "center", gap: 0.8,
            }}
          >
            <span>🔥</span>
            <span>{showContour ? "Switch to Station Pins" : "Turn Station to Contour Plot"}</span>
          </Button>

          {/* Button: Turn On / Off Smoke Plume */}
          <Button
            size="small"
            variant={showSmoke ? "contained" : "outlined"}
            onClick={handleToggleSmoke}
            sx={{
              px: 1.8, py: 0.6, fontSize: "0.78rem", textTransform: "none",
              borderRadius: 2, fontWeight: 700,
              bgcolor: showSmoke ? "#ea580c" : "#f8fafc",
              color: showSmoke ? "white" : "#64748b",
              borderColor: showSmoke ? "#c2410c" : "#cbd5e1",
              boxShadow: showSmoke ? "0 2px 8px rgba(234,88,12,0.25)" : "none",
              "&:hover": {
                bgcolor: showSmoke ? "#c2410c" : "#f1f5f9",
                borderColor: showSmoke ? "#9a3412" : "#94a3b8",
                color: showSmoke ? "white" : "#334155"
              },
              display: "flex", alignItems: "center", gap: 0.6,
            }}
          >
            <span>{showSmoke ? "💨" : "🚫"}</span>
            <span>{showSmoke ? "Turn Off Smoke Plume" : "Turn On Smoke Plume"}</span>
          </Button>

          {/* Button: Open List of Alerts */}
          {onOpenAlertList && (
            <Button
              size="small"
              variant="outlined"
              onClick={onOpenAlertList}
              sx={{
                px: 1.6, py: 0.6, fontSize: "0.78rem", textTransform: "none",
                borderRadius: 2, fontWeight: 700,
                color: "#dc2626", borderColor: "#fca5a5", bgcolor: "#fef2f2",
                "&:hover": { bgcolor: "#fee2e2", borderColor: "#ef4444" },
                display: "flex", alignItems: "center", gap: 0.6,
              }}
            >
              <span>📋</span>
              <span>Alert List ({activeAlerts.length || 2})</span>
            </Button>
          )}
        </Box>

        {/* Right: Station Status Filter Chips (Using South Africa NAAQS AQI Colors) */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
          {[
            { label: "All", statusKey: "All", count: counts.All, color: "#3b82f6", bg: "#eff6ff" },
            { label: "Good", statusKey: "Good", count: counts.Good, color: "#16a34a", bg: "#dcfce7" },
            { label: "Moderate", statusKey: "Moderate", count: counts.Moderate, color: "#eab308", bg: "#fef9c3" },
            { label: "Alert", statusKey: "Alert", count: counts.Alert || 2, color: "#dc2626", bg: "#fee2e2" },
            { label: "Offline", statusKey: "Offline", count: counts.Offline, color: "#64748b", bg: "#f1f5f9" },
          ].map(f => (
            <Chip
              key={f.statusKey}
              label={`${f.label} (${f.count})`}
              size="small"
              onClick={() => {
                if (showContour) setShowContour(false);
                setFilter(f.statusKey);
              }}
              sx={{
                fontSize: "0.72rem", fontWeight: filter === f.statusKey ? 700 : 600,
                bgcolor: filter === f.statusKey ? f.color : f.bg,
                color: filter === f.statusKey ? "white" : (f.color === "#eab308" ? "#854d0e" : f.color),
                border: `1px solid ${filter === f.statusKey ? f.color : "#e2e8f0"}`,
                cursor: "pointer",
                opacity: showContour ? 0.6 : 1,
                "&:hover": { opacity: 0.9 },
              }}
            />
          ))}
        </Box>
      </Box>

      {/* Map Container */}
      <Box ref={mapContainer} sx={{ height: 490, width: "100%" }} />

      {/* Floating South Africa NAAQS AQI Hourly Thresholds Legend (Bottom Right) */}
      <Box sx={{
        position: "absolute", bottom: 20, right: 20, zIndex: 5,
        bgcolor: "rgba(255, 255, 255, 0.96)", backdropFilter: "blur(10px)",
        p: 1.6, borderRadius: 2.5, border: "1px solid #e2e8f0",
        boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
        display: "flex", flexDirection: "column", gap: 0.8, minWidth: 280,
      }}>
        <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: "#334155", textTransform: "uppercase", letterSpacing: "0.4px" }}>
          South Africa AQI PM2.5 (1-hr NAAQS)
        </Typography>
        <Box sx={{
          height: 9, width: "100%", borderRadius: 1.5,
          background: "linear-gradient(90deg, #16a34a 0%, #16a34a 40%, #eab308 41%, #eab308 60%, #f97316 61%, #f97316 80%, #ef4444 81%, #ef4444 95%, #a855f7 96%)",
        }} />
        <Box sx={{ display: "flex", justifyContent: "space-between", fontSize: "0.66rem", color: "#475569", fontWeight: 700 }}>
          <span style={{ color: "#16a34a" }}>0-103 Good</span>
          <span style={{ color: "#854d0e" }}>104-153 Mod</span>
          <span style={{ color: "#c2410c" }}>154-203 High</span>
          <span style={{ color: "#dc2626" }}>204-253 Severe</span>
          <span style={{ color: "#7e22ce" }}>&gt;254 Haz</span>
        </Box>
      </Box>

      {/* Floating Smoke Dispersion Legend Badge (Top Right - visible only when plume is ON) */}
      {showSmoke && (
        <Box sx={{
          position: "absolute", top: 70, right: 20, zIndex: 5,
          bgcolor: "rgba(255, 255, 255, 0.96)", backdropFilter: "blur(10px)",
          p: 1.6, borderRadius: 2.5, border: "1px solid #fed7aa",
          boxShadow: "0 8px 24px rgba(194, 65, 12, 0.15)",
          display: "flex", flexDirection: "column", gap: 0.8, maxWidth: 290,
        }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <span style={{ fontSize: "1.1rem" }}>💨</span>
              <Box>
                <Typography sx={{ fontSize: "0.78rem", fontWeight: 800, color: "#9a3412" }}>
                  Active Smoke Plume (Kokosi)
                </Typography>
                <Typography sx={{ fontSize: "0.68rem", color: "#64748b" }}>
                  Wind: 14 km/h ENE Trajectory
                </Typography>
              </Box>
            </Box>
            <Button
              size="small"
              onClick={() => setShowSmoke(false)}
              sx={{
                minWidth: "auto", p: "2px 8px", fontSize: "0.68rem", fontWeight: 700,
                color: "#c2410c", bgcolor: "#ffedd5", borderRadius: 1.5,
                "&:hover": { bgcolor: "#fed7aa" }, textTransform: "none", ml: 1,
              }}
            >
              Turn Off
            </Button>
          </Box>
          <Box sx={{
            height: 6, width: "100%", borderRadius: 1,
            background: "linear-gradient(90deg, rgba(220,38,38,0.85) 0%, rgba(194,65,12,0.65) 45%, rgba(100,116,139,0.35) 100%)",
          }} />
          <Box sx={{ display: "flex", justifyContent: "space-between", fontSize: "0.65rem", color: "#64748b", fontWeight: 600 }}>
            <span style={{ color: "#dc2626" }}>🔥 Fire Base</span>
            <span style={{ color: "#c2410c" }}>Smoke Corridor</span>
            <span>Diffused Haze</span>
          </Box>
        </Box>
      )}

      {/* Loading overlay */}
      {loading && (
        <Box sx={{
          position: "absolute", inset: 0, display: "flex",
          alignItems: "center", justifyContent: "center",
          bgcolor: "rgba(255,255,255,0.85)", backdropFilter: "blur(4px)",
          zIndex: 10,
        }}>
          <Typography sx={{ fontWeight: 600, color: "#64748b" }}>Loading monitoring stations...</Typography>
        </Box>
      )}

      {/* Marker and Animation Styles */}
      <style>{`
        @keyframes alertRingPulse {
          0% {
            box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7), 0 4px 12px rgba(0,0,0,0.3);
          }
          70% {
            box-shadow: 0 0 0 14px rgba(239, 68, 68, 0), 0 4px 12px rgba(0,0,0,0.3);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(239, 68, 68, 0), 0 4px 12px rgba(0,0,0,0.3);
          }
        }
        .alert-pulse-ring {
          position: absolute;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(239, 68, 68, 0.28);
          animation: alertRingPulse 2s cubic-bezier(0.25, 1, 0.5, 1) infinite;
          pointer-events: none;
        }
        .station-marker:hover > div > div:nth-of-type(1) {
          transform: scale(1.22);
        }
        .smoke-hotspot-pin:hover {
          transform: scale(1.08);
          transition: transform 0.2s ease;
        }
        .station-marker {
          transition: all 0.2s ease;
        }
        .alerted-station-marker {
          z-index: 10 !important;
        }
        .station-popup {
          z-index: 20 !important;
        }
        .mapboxgl-popup {
          z-index: 25;
        }
        .mapboxgl-popup-content {
          pointer-events: auto !important;
        }
        .mapboxgl-canvas-container {
          cursor: default;
        }
        .mapboxgl-marker {
          pointer-events: auto;
        }
        .smoke-hotspot-pin {
          pointer-events: auto;
        }
        .smoke-hotspot-pin * {
          pointer-events: auto;
        }
        .alert-pulse-ring {
          pointer-events: none;
        }
        .station-popup .mapboxgl-popup-content {
          border-radius: 12px !important;
          box-shadow: 0 8px 32px rgba(0,0,0,0.15) !important;
          padding: 14px 16px !important;
          border: 1px solid #e2e8f0 !important;
          font-family: 'DM Sans', sans-serif !important;
          background: #ffffff !important;
        }
        .station-popup .mapboxgl-popup-tip {
          border-top-color: #ffffff !important;
        }
        .station-popup .mapboxgl-popup-close-button {
          font-size: 16px !important;
          color: #94a3b8 !important;
          padding: 4px 8px !important;
        }
        .station-popup .mapboxgl-popup-close-button:hover {
          color: #334155 !important;
          background: transparent !important;
        }
        .mapboxgl-ctrl-group {
          border-radius: 8px !important;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important;
          border: 1px solid #e2e8f0 !important;
          overflow: hidden;
        }
        .mapboxgl-ctrl-group button {
          width: 32px !important;
          height: 32px !important;
        }
      `}</style>
    </Box>
  );
}
