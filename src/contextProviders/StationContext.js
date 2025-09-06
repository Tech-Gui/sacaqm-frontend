import React, { createContext, useState, useEffect } from "react";
import axios from "axios";
import { useLocation } from "react-router-dom";
import { formatLastSeen } from "../components/dateFormatter"; // Adjust path as needed

export const StationContext = createContext();

export const StationProvider = ({ children }) => {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const location = useLocation(); // gives you the current URL path

  const fetchStations = async () => {
    try {
      setLoading(true);

      let url = "https://try-again-test-isaiah.app.cern.ch/api/stations";

      if (location.pathname.includes("mineDashboard")) {
        url = "https://try-again-test-isaiah.app.cern.ch/api/stations/private";
      }

      const response = await axios.get(url);
      const stationsData = response.data;

      // Sort stations alphabetically by name
      const sortedStations = stationsData.sort((a, b) =>
        a.name.localeCompare(b.name)
      );

      setStations(sortedStations);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStations();
  }, [location.pathname]); // re-run when the page changes

  return (
    <StationContext.Provider value={{ stations, loading, error, fetchStations }}>
      {children}
    </StationContext.Provider>
  );
};

export default StationProvider;
