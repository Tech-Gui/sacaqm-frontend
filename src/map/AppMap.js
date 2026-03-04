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

  // 1) Fetch "mine" from /me/sensors and filter the StationContext list
 

  // 3) Keep data refreshed when selected changes
  useEffect(() => {
    if (!selectedSensor) return;
    const st = stations.find((s) => asString(s._id) === asString(selectedSensor));
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

  if (stationsLoading) return <div>Loading map…</div>;
  if (stationsError) return <div>Error: {stationsError?.message || stationsError}</div>;
  if (!stations.length) return <div>No stations for this user.</div>;

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
      {stations.map((marker) => (
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
