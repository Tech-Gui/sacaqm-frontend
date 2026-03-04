import React, { createContext, useState, useEffect } from "react";
import axios from "axios";
import { useLocation } from "react-router-dom";
import { formatLastSeen } from "../components/dateFormatter"; // Adjust path as needed

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
      setError(null);

      const path = location.pathname.toLowerCase();

      const publicUrl = `${API_BASE}/api/stations`;
      const privateUrl = `${API_BASE}/api/stations/private`;
      const myStationsUrl = `${API_BASE}/api/users_sensors/me/stations`;

      const token = localStorage.getItem("authToken");
      const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

      let stationsData = [];

      // ENV dashboard: merge public + private (private may require auth)
      if (path.includes("/env-dashboard")) {
        const [publicRes, privateRes] = await Promise.all([
          axios.get(publicUrl),
          axios.get(privateUrl, { headers: authHeaders }).catch(() => ({ data: [] })),
        ]);

        stationsData = [...(publicRes.data || []), ...(privateRes.data || [])];
      }

      else if (path.includes("/minedashboard")) {
        if (!token) {
          // No token = not logged in => return empty list (or you can keep public)
          stationsData = [];
        } else {
          const res = await axios.get(myStationsUrl, { headers: authHeaders });
          stationsData = res.data || [];
        }
      }

      
      else {
        const res = await axios.get(publicUrl);
        stationsData = res.data || [];
      }

      // Remove duplicates by _id
      const uniqueStations = Object.values(
        (stationsData || []).reduce((acc, station) => {
          if (station?._id) acc[station._id] = station;
          return acc;
        }, {})
      );

      // Sort alphabetically by name (safe)
      uniqueStations.sort((a, b) => (a?.name || "").localeCompare(b?.name || ""));

      setStations(uniqueStations);
    } catch (err) {
      setError(err);
      setStations([]);
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