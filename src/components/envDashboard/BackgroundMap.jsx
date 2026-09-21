import React, { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const ZOOM_OFFSET = 3.5; // background stays this much more zoomed-out than the rectangle

export default function BackgroundMap({ view }) {
  const container = useRef(null);
  const map = useRef(null);

  useEffect(() => {
    if (map.current || !container.current) return;
    map.current = new mapboxgl.Map({
      container: container.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [27.7, -26.4],
      zoom: 9.5 - ZOOM_OFFSET,
      interactive: false,
      attributionControl: false,
    });
    return () => { if (map.current) { map.current.remove(); map.current = null; } };
  }, []);

  // Follow the rectangle map whenever its view changes
  useEffect(() => {
    if (!map.current || !view) return;
    map.current.jumpTo({
      center: view.center,
      zoom: view.zoom - ZOOM_OFFSET,
    });
  }, [view]);

  return <div ref={container} style={{ width: "100%", height: "100%" }} />;
}