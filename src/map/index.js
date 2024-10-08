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
import { formatLastSeen } from "../components/dateFormatter";

const AppMap = ({ mapRef, polygonCord, layerColor }) => {
  const [newPlace, setNewPlace] = useState(null);
  const [viewPort, setViewPort] = useState({
    latitude: -26.19333,
    longitude: 27.826879,
    zoom: 9,
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

    setSelectedPeriod("7 Days");
    // setFilteredData([]);

    if (station) {
      fetchNodeData(station._id);
      console.log("station found baba");
    } else {
      console.log("station not found");
    }
  }, [selectedSensor]);

  const { stations, loading, error } = useContext(StationContext);

  const getBackgroundColor = (lastSeen) => {
    const date = lastSeen;
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
              setSelectedSensor(marker._id);

              setViewPort((prevViewPort) => ({
                ...prevViewPort,
                latitude: marker["latitude"],
                longitude: marker["longitude"],
                zoom: 30,
              }));
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
            <strong>Last Seen: </strong>{" "}
            {selectedMarker.lastSeen
              ? formatLastSeen(selectedMarker.lastSeen)
              : "No data"}{" "}
            <br />
            <strong>Latitude: </strong> {selectedMarker.latitude} <br />
            <strong>Longitude: </strong> {selectedMarker.longitude}
          </div>
        </Popup>
      )}

      {/* <NavigationControl position="bottom-right" /> */}
      <div style={{ position: "absolute", right: 10, top: 10 }}>
        <NavigationControl />
      </div>
    </ReactMapGL>
  );
};
export default AppMap;
