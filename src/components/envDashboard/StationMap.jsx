import React, { useEffect, useRef, useState, useContext } from "react";
import { Box, Typography, Chip } from "@mui/material";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { StationContext } from "../../contextProviders/StationContext";

mapboxgl.accessToken = (process.env.REACT_APP_MAPBOX_TOKEN || "").replace(/"/g, "");

const getStationStatus = (lastSeen) => {
  if (!lastSeen) return { label: "Offline", color: "#64748b", bg: "#f1f5f9", dot: "#94a3b8" };
  const diff = (Date.now() - new Date(lastSeen).getTime()) / 1000 / 60; // minutes
  if (diff <= 60)   return { label: "Online",  color: "#16a34a", bg: "#dcfce7", dot: "#22c55e" };
  return               { label: "Offline", color: "#64748b", bg: "#f1f5f9", dot: "#94a3b8" };
};

const formatLastSeen = (lastSeen) => {
  if (!lastSeen) return "Never";
  const diff = Math.floor((Date.now() - new Date(lastSeen).getTime()) / 1000);
  if (diff < 120)   return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const STATUS_COLORS = {
  Online:  { marker: "#22c55e", ring: "#bbf7d0" },
  Offline: { marker: "#94a3b8", ring: "#e2e8f0" },
};

export default function StationMap() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markersRef = useRef([]);
  const popupRef = useRef(null);

  const { stations, loading } = useContext(StationContext);
  const [selectedStation, setSelectedStation] = useState(null);
  const [filter, setFilter] = useState("All");
  const [counts, setCounts] = useState({ All: 0, Online: 0, Offline: 0 });

  // Init map
  useEffect(() => {
    if (map.current) return;
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [28.03, -26.2],
      zoom: 9,
      attributionControl: false,
    });

    map.current.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");
    map.current.addControl(new mapboxgl.AttributionControl({ compact: true }), "bottom-left");

    // Custom map style tweaks after load
    map.current.on("load", () => {
      map.current.setPaintProperty("water", "fill-color", "#dbeafe");
      map.current.setPaintProperty("land", "background-color", "#f8fafc");
    });
  }, []);

  // Place markers when stations load
  useEffect(() => {
    if (!map.current || loading || !stations.length) return;

    // Clear old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    if (popupRef.current) { popupRef.current.remove(); popupRef.current = null; }

    const statusCounts = { All: 0, Online: 0, Offline: 0 };

    stations.forEach((station) => {
      const lat = parseFloat(station.latitude);
      const lng = parseFloat(station.longitude);
      if (isNaN(lat) || isNaN(lng)) return;

      const status = getStationStatus(station.lastSeen);
      statusCounts.All++;
      statusCounts[status.label] = (statusCounts[status.label] || 0) + 1;

      const colors = STATUS_COLORS[status.label] || STATUS_COLORS.Offline;

      // Custom marker element
      const el = document.createElement("div");
      el.className = "station-marker";
      el.setAttribute("data-status", status.label);
      el.innerHTML = `
        <div style="
          width: 18px; height: 18px;
          background: ${colors.marker};
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 0 0 3px ${colors.ring}, 0 4px 12px rgba(0,0,0,0.2);
          cursor: pointer;
          transition: transform 0.15s ease;
          position: relative;
        ">
          <div style="
            position: absolute;
            width: 6px; height: 6px;
            background: white;
            border-radius: 50%;
            top: 50%; left: 50%;
            transform: translate(-50%, -50%);
            opacity: 0.7;
          "></div>
        </div>
      `;

      el.addEventListener("mouseenter", () => {
        el.querySelector("div").style.transform = "scale(1.4)";
      });
      el.addEventListener("mouseleave", () => {
        el.querySelector("div").style.transform = "scale(1)";
      });

      el.addEventListener("click", () => {
        setSelectedStation({ ...station, status });

        if (popupRef.current) popupRef.current.remove();

        popupRef.current = new mapboxgl.Popup({
          offset: 18,
          closeButton: true,
          closeOnClick: false,
          maxWidth: "260px",
          className: "station-popup",
        })
          .setLngLat([lng, lat])
          .setHTML(`
            <div style="
              font-family: 'DM Sans', sans-serif;
              padding: 4px 2px;
            ">
              <div style="
                display: flex; align-items: center; gap: 8px; margin-bottom: 10px;
              ">
                <div style="
                  width: 10px; height: 10px; border-radius: 50%;
                  background: ${colors.marker};
                  box-shadow: 0 0 0 3px ${colors.ring};
                  flex-shrink: 0;
                "></div>
                <span style="
                  font-weight: 700; font-size: 13px; color: #0f172a;
                  line-height: 1.3;
                ">${station.name}</span>
              </div>
              <div style="
                background: #f8fafc; border-radius: 8px; padding: 8px 10px;
                margin-bottom: 8px;
              ">
                <div style="font-size: 11px; color: #64748b; margin-bottom: 2px; text-transform: uppercase; letter-spacing: 0.4px; font-weight: 600;">Location</div>
                <div style="font-size: 12px; color: #334155; font-weight: 500;">${station.city}, ${station.province}</div>
              </div>
              <div style="display: flex; gap: 8px;">
                <div style="
                  flex: 1; background: ${status.bg}; border-radius: 8px;
                  padding: 8px 10px;
                ">
                  <div style="font-size: 11px; color: ${status.color}; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px; margin-bottom: 2px;">Status</div>
                  <div style="font-size: 12px; color: ${status.color}; font-weight: 600;">${status.label}</div>
                </div>
                <div style="
                  flex: 1; background: #f8fafc; border-radius: 8px;
                  padding: 8px 10px;
                ">
                  <div style="font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.4px; margin-bottom: 2px;">Last Seen</div>
                  <div style="font-size: 12px; color: #334155; font-weight: 600;">${formatLastSeen(station.lastSeen)}</div>
                </div>
              </div>
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
  }, [stations, loading]);

  // Filter markers by status
  useEffect(() => {
    document.querySelectorAll(".station-marker").forEach((el) => {
      const status = el.getAttribute("data-status");
      el.style.display = filter === "All" || status === filter ? "block" : "none";
    });
  }, [filter]);

  const filterOptions = [
    { label: "All", color: "#3b82f6" },
    { label: "Online", color: "#22c55e" },
    { label: "Offline", color: "#94a3b8" },
  ];

  return (
    <Box sx={{
      borderRadius: 3,
      overflow: "hidden",
      boxShadow: "0 4px 24px rgba(0,0,0,0.1)",
      bgcolor: "white",
      position: "relative",
    }}>


      {/* Map */}
      <Box ref={mapContainer} sx={{ height: 480, width: "100%" }} />

      {/* Loading overlay */}
      {loading && (
        <Box sx={{
          position: "absolute", inset: 0, display: "flex",
          alignItems: "center", justifyContent: "center",
          bgcolor: "rgba(255,255,255,0.8)", backdropFilter: "blur(4px)",
          zIndex: 10,
        }}>
          <Typography sx={{ color: "#3b82f6", fontWeight: 600 }}>Loading stations...</Typography>
        </Box>
      )}

      {/* Custom popup styles */}
      <style>{`
        .station-popup .mapboxgl-popup-content {
          border-radius: 12px !important;
          box-shadow: 0 8px 32px rgba(0,0,0,0.15) !important;
          padding: 14px 16px !important;
          border: 1px solid #e2e8f0 !important;
          font-family: 'DM Sans', sans-serif !important;
        }
        .station-popup .mapboxgl-popup-tip {
          border-top-color: white !important;
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