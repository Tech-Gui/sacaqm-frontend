// src/map/AppMap.jsx
import React, { useContext, useEffect, useState } from "react";
import ReactMapGL, { Marker, NavigationControl, Popup } from "react-map-gl";
import { TOKEN } from "./Geocoder";
import "mapbox-gl/dist/mapbox-gl.css";
import { MdOutlineSensors } from "react-icons/md";
import { isToday } from "date-fns";
import axios from "axios";

import { useSensorData } from "../contextProviders/sensorDataContext";
import { DataContext } from "../contextProviders/DataContext";
import { StationContext } from "../contextProviders/StationContext";
import { formatLastSeen } from "../components/dateFormatter";

const API_BASE = process.env.REACT_APP_API_BASE;

function toNum(n) {
  const x = typeof n === "string" ? parseFloat(n) : n;
  return Number.isFinite(x) ? x : null;
}
const asString = (v) => (v == null ? "" : String(v));

const AppMap = ({ mapRef }) => {
  // View and UI state
  const [viewState, setViewState] = useState({
    latitude: -26.19333,
    longitude: 27.826879,
    zoom: 9,
  });
  const [selectedMarker, setSelectedMarker] = useState(null);

  // Contexts
  const { stations, loading: stationsLoading, error: stationsError } = useContext(StationContext);
  const { setSelectedSensor, setSelectedPeriod, selectedSensor } = useSensorData();
  const { fetchNodeData } = useContext(DataContext);

  // My membership
  const [myStations, setMyStations] = useState([]);
  const [mineLoading, setMineLoading] = useState(true);
  const [mineError, setMineError] = useState(null);

  // 1) Fetch "mine" from /me/sensors and filter the StationContext list
  useEffect(() => {
    (async () => {
      try {
        setMineLoading(true);
        setMineError(null);

        const token = localStorage.getItem("authToken");
        if (!token) throw new Error('No auth token found in localStorage as "authToken".');

        const { data } = await axios.get(`${API_BASE}/api/users_sensors/me/sensors`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Build filters
        let allowedStationIds = new Set();
        let mySensorIds = new Set();

        // Case A: array of stations
        if (Array.isArray(data) && data.length && (data[0]?._id || data[0]?.latitude !== undefined)) {
          for (const st of data) allowedStationIds.add(asString(st._id));
        }
        // Case B: { stations:[...] }
        else if (Array.isArray(data?.stations)) {
          for (const st of data.stations) allowedStationIds.add(asString(st?._id));
        }
        // Case C: { sensorIds:[...] }
        else if (Array.isArray(data?.sensorIds)) {
          for (const sid of data.sensorIds) mySensorIds.add(asString(sid));
        } else {
          console.warn("[AppMap] Unrecognized /me/sensors shape:", data);
        }

        // Filter the StationContext list
        const list = (Array.isArray(stations) ? stations : [])
          .map((s) => ({
            ...s,
            latitude: toNum(s?.latitude),
            longitude: toNum(s?.longitude),
          }))
          .filter((s) => Number.isFinite(s.latitude) && Number.isFinite(s.longitude))
          .filter((s) => {
            // If we have station IDs from API, use them
            if (allowedStationIds.size > 0) {
              return allowedStationIds.has(asString(s._id));
            }
            // Otherwise, intersect sensorIds with mine
            if (mySensorIds.size > 0 && Array.isArray(s.sensorIds)) {
              return s.sensorIds.some((sid) => mySensorIds.has(asString(sid)));
            }
            // If API gave us nothing to filter with, hide all (private map)
            return false;
          });

        setMyStations(list);

        // Auto-select first
        if (list.length > 0) {
          const first = list[0];
          setSelectedSensor(first._id);
          setSelectedPeriod("Today");
          fetchNodeData(first._id, 1);
        }
      } catch (e) {
        setMineError(e?.response?.data?.message || e.message || "Failed to load your stations");
        setMyStations([]);
      } finally {
        setMineLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stations]); // re-run when StationContext stations load

  // 2) Fit to bounds once we know myStations
  useEffect(() => {
    if (!myStations.length) return;
    const lats = myStations.map((s) => s.latitude);
    const lons = myStations.map((s) => s.longitude);
    const minLat = Math.min(...lats), maxLat = Math.max(...lats);
    const minLon = Math.min(...lons), maxLon = Math.max(...lons);

    if (minLat === maxLat && minLon === maxLon) {
      setViewState((v) => ({ ...v, latitude: minLat, longitude: minLon, zoom: 13 }));
    } else {
      setViewState((v) => ({
        ...v,
        latitude: (minLat + maxLat) / 2,
        longitude: (minLon + maxLon) / 2,
        zoom: 10,
      }));
    }
  }, [myStations]);

  // 3) Keep data refreshed when selected changes
  useEffect(() => {
    if (!selectedSensor) return;
    const st = myStations.find((s) => asString(s._id) === asString(selectedSensor));
    setSelectedPeriod("Today");
    if (st) fetchNodeData(st._id, 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSensor]);

  const getBackgroundColor = (lastSeen) => {
    if (!lastSeen) return "#ccc8c8";
    try {
      const dt = new Date(lastSeen);
      return isToday(dt) ? "#00FF00" : "#ccc8c8";
    } catch {
      return "#ccc8c8";
    }
  };

  if (stationsLoading || mineLoading) return <div>Loading map…</div>;
  if (stationsError) return <div>Error: {stationsError?.message || stationsError}</div>;
  if (mineError) return <div>Error: {mineError}</div>;
  if (!myStations.length) return <div>No stations for this user.</div>;

  return (
    <ReactMapGL
      ref={mapRef}
      mapboxAccessToken={TOKEN}
      initialViewState={viewState}
      onMove={(evt) => setViewState(evt.viewState)}
      mapStyle="mapbox://styles/mapbox/light-v11"
      transitionDuration={200}
      attributionControl={false}
    >
      {myStations.map((marker) => (
        <Marker key={asString(marker._id)} latitude={marker.latitude} longitude={marker.longitude}>
          <div
            onClick={() => {
              setSelectedSensor(marker._id);
              setViewState((prev) => ({
                ...prev,
                latitude: marker.latitude,
                longitude: marker.longitude,
                zoom: 14,
              }));
            }}
            onMouseOver={() => setSelectedMarker(marker)}
            onMouseOut={() => setSelectedMarker(null)}
            style={{
              cursor: "pointer",
              background: getBackgroundColor(marker.lastSeen),
              paddingLeft: "0.25rem",
              paddingRight: "0.25rem",
              borderRadius: "50%",
            }}
            title={marker.name || "Station"}
          >
            <MdOutlineSensors />
          </div>
        </Marker>
      ))}

      {selectedMarker && (
        <Popup
          latitude={selectedMarker.latitude}
          longitude={selectedMarker.longitude}
          onClose={() => setSelectedMarker(null)}
          closeButton={false}
        >
          <div style={{ textAlign: "left" }}>
            <strong>Station Name:</strong> {selectedMarker.name || "—"} <br />
            <strong>Description:</strong> {selectedMarker.description || "—"} <br />
            <strong>Province:</strong> {selectedMarker.province || "—"} <br />
            <strong>City:</strong> {selectedMarker.city || "—"} <br />
            <strong>Last Seen:</strong>{" "}
            {selectedMarker.lastSeen ? formatLastSeen(selectedMarker.lastSeen) : "No data"} <br />
            <strong>Latitude:</strong> {selectedMarker.latitude} <br />
            <strong>Longitude:</strong> {selectedMarker.longitude}
          </div>
        </Popup>
      )}

      <div style={{ position: "absolute", right: 10, top: 10 }}>
        <NavigationControl />
      </div>
    </ReactMapGL>
  );
};

export default AppMap;
