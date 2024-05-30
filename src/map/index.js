import React, { useCallback, useContext, useEffect, useState } from "react";
import ReactMapGL, {
  Layer,
  Marker,
  NavigationControl,
  Popup,
  Source,
} from "react-map-gl";
import { TOKEN } from "./Geocoder";
import "mapbox-gl/dist/mapbox-gl.css";

import { MdOutlineSensors } from "react-icons/md";
import { useSensorData } from "../contextProviders/sensorDataContext";
import { StationContext } from "../contextProviders/StationContext";
import { DataContext } from "../contextProviders/DataContext";
import { isToday, parseISO, format, parse } from "date-fns";

const AppMap = ({ mapRef, polygonCord, layerColor }) => {
  const [newPlace, setNewPlace] = useState(null);
  const [viewPort, setViewPort] = useState({
    latitude: -26.1895,
    longitude: 28.0304,
    zoom: 11,
  });

  const [activeSensor, setActiveSensor] = useState("");

  const [selectedMarker, setSelectedMarker] = useState(null);

  const {
    data,
    selectedSensor,
    selectedPeriod,
    setSelectedSensor,
    setSelectedPeriod,
    fetchData,
  } = useSensorData();

  const { nodeData, setNodeData, fetchNodeData } = useContext(DataContext);

  useEffect(() => {
    const station = stations.find(
      (station) => station["_id"] === selectedSensor
    );

    if (station) {
      fetchNodeData(station._id);
      console.log("station found baba");
    } else {
      console.log("station not found");
    }
  }, [selectedSensor]);

  const { stations, loading, error } = useContext(StationContext);

  const parseLastSeen = (lastSeen) => {
    if (lastSeen === "No data") return null;

    try {
      const today = new Date();
      const timeFormat = /^(?:\d{1,2}:\d{2} (?:AM|PM))$/;
      const dayTimeFormat = /^(?:\w+ \d{1,2}:\d{2} (?:AM|PM))$/;

      if (timeFormat.test(lastSeen)) {
        return parse(lastSeen, "h:mm a", today);
      } else if (dayTimeFormat.test(lastSeen)) {
        return parse(lastSeen, "EEEE h:mm a", today);
      }

      return parse(lastSeen, "dd/MM/yyyy", new Date());
    } catch (error) {
      console.error("Error parsing lastSeen:", error);
      return null;
    }
  };

  const getBackgroundColor = (lastSeen) => {
    const date = parseLastSeen(lastSeen);
    return date && isToday(date) ? "#00FF00" : "#ccc8c8";
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!stations || stations.length === 0)
    return <div>No stations available</div>;

  return (
    <ReactMapGL
      ref={mapRef}
      mapboxAccessToken={TOKEN}
      initialViewState={viewPort}
      onViewportChange={(viewport) => setViewPort(viewport)}
      mapStyle="mapbox://styles/mapbox/light-v11"
      transitionDuration="200"
      attributionControl={false}>
      {/* Static markers */}
      {stations.map((marker, index) => (
        <Marker
          key={index}
          latitude={marker.latitude} // Corrected latitude and longitude properties
          longitude={marker.longitude}>
          <div
            onClick={() => {
              console.log(marker._id);

              setSelectedSensor(marker._id);

              setViewPort((prevViewPort) => ({
                ...prevViewPort,
                latitude: marker["latitude"],
                longitude: marker["longitude"],
                zoom: 30,
              }));
              console.log(viewPort);
            }}
            onMouseOver={() => setSelectedMarker(marker)}
            onMouseOut={() => setSelectedMarker(null)}
            style={{
              cursor: "pointer",
              background: getBackgroundColor(marker.lastSeen),

              // background: "#00FF00",
              paddingLeft: "0.25rem",
              paddingRight: "0.25rem",
              borderRadius: "50%",
            }}>
            <MdOutlineSensors />
          </div>
        </Marker>
      ))}

      {selectedMarker && (
        <Popup
          latitude={selectedMarker.latitude}
          longitude={selectedMarker.longitude}
          onClose={() => setSelectedMarker(null)}
          closeButton={false}>
          <div style={{ textAlign: "left" }}>
            <strong>Station Name:</strong> {selectedMarker.name} <br />
            <strong>Description:</strong> {selectedMarker.description} <br />
            <strong>Province:</strong> {selectedMarker.province} <br />
            <strong>City:</strong> {selectedMarker.city} <br />
            <strong>Last Seen: </strong> {selectedMarker.lastSeen} <br />
            <strong>Latitude: </strong> {selectedMarker.latitude} <br />
            <strong>Longitude: </strong> {selectedMarker.longitude}
          </div>
        </Popup>
      )}

      {/* <NavigationControl position="bottom-right" /> */}
    </ReactMapGL>
  );
};
export default AppMap;
