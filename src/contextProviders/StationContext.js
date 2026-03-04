import React, { createContext, useState, useEffect } from "react";
import axios from "axios";
import { useLocation } from "react-router-dom";
import { formatLastSeen } from "../components/dateFormatter"; 

export const StationContext = createContext();

const API_BASE = process.env.REACT_APP_API_BASE;

export const StationProvider = ({ children }) => {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const location = useLocation(); 

  const fetchStations = async () => {
    try {
      setLoading(true);

      let url = `${API_BASE}/api/stations`;

      if (location.pathname.includes("mineDashboard")) {
        url = `${API_BASE}/api/stations/private`;
      }

      const response = await axios.get(url);
      //const authToken = localStorage.getItem("authToken");
      /*const response = await axios.get(url, {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      });*/
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
