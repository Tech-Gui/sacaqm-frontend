import React, { useCallback, useEffect, useState } from "react";
import ReactMapGL, {
  Layer,
  Marker,
  NavigationControl,
  Popup,
  Source,
} from "react-map-gl";
import { TOKEN } from "./Geocoder";
import "mapbox-gl/dist/mapbox-gl.css";
import sensorData from "../dummyData/SensorData";
import { MdOutlineSensors } from "react-icons/md";
import { useSensorData } from "../contextProviders/sensorDataContext";

const AppMap = ({ mapRef, polygonCord, layerColor }) => {
  const [newPlace, setNewPlace] = useState(null);
  const [viewPort, setViewPort] = useState({
    latitude: -26.193330,
    longitude: 27.826879,
    zoom: 11,
  });

  const [activeSensor, setActiveSensor] = useState("");

  const [selectedMarker, setSelectedMarker] = useState(null);
  const geojson = {
    type: "Feature",
    geometry: {
      type: "Polygon",
      coordinates: [polygonCord],
    },
  };

  const layerStyle = {
    id: "maine",
    type: "fill",
    source: "maine", // reference the data source
    layout: {},
    paint: {
      "fill-color": layerColor || "#0080ff", // blue color fill
      "fill-opacity": 0.5,
    },
  };

  // Add a black outline around the polygon.
  const layerOutlineStyle = {
    id: "outline",
    type: "line",
    source: "maine",
    layout: {},
    paint: {
      "line-color": "#000",
      "line-width": 3,
    },
  };

  const {
    data,
    selectedSensor,
    selectedPeriod,
    setSelectedSensor,
    setSelectedPeriod,
    fetchData,
  } = useSensorData();

  useEffect(() => {
    fetchData();
  }, [selectedPeriod]);

  return (
    <ReactMapGL
      ref={mapRef}
      mapboxAccessToken={TOKEN}
      initialViewState={viewPort}
      onViewportChange={(viewport) => setViewPort(viewport)}
      mapStyle="mapbox://styles/mapbox/light-v11"
      transitionDuration="200"
      attributionControl={false}>
      {/* Your map content */}

      {/* Static markers */}
      {sensorData.map((marker, index) => (
        <Marker
          key={index}
          latitude={marker.Longitude}
          longitude={marker.Latitude}>
          <div
            onClick={() => {
              console.log(marker["Sensor ID"]);

              setSelectedSensor(marker["Sensor ID"]);

              setViewPort((prevViewPort) => ({
                ...prevViewPort,
                latitude: marker["Latitude"],
                longitude: marker["Longitude"],
                zoom: 30,
              }));
            }}
            onMouseOver={() => setSelectedMarker(marker)}
            onMouseOut={() => setSelectedMarker(null)}
            style={{
              cursor: "pointer",
              background: marker.isActive ? "#00FF00" : "#c9d1c9",

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
          latitude={selectedMarker.Longitude || 0} // Replace 0 with a default value if needed
          longitude={selectedMarker.Latitude || 0} // Replace 0 with a default value if needed
          onClose={() => setSelectedMarker(null)}
          closeButton={false}>
          <div>
            {/* Your popup content */}
            Sensor ID: {selectedMarker["Sensor ID"]} <br />
            Station Name: {selectedMarker["Station Name"]} <br />
            Online?: {selectedMarker.isActive ? "Yes" : "No"} <br />
            Latitude: {selectedMarker.Latitude || "N/A"} <br />
            Longitude: {selectedMarker.Longitude || "N/A"}
          </div>
        </Popup>
      )}

      {/* <NavigationControl position="bottom-right" /> */}
    </ReactMapGL>
  );
};

export default AppMap;
