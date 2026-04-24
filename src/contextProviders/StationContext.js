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
  const location = useLocation(); // gives you the current URL path

  const fetchStations = async() => {
    try{ 
      setLoading(true); 
      //const path = location.pathname.toLowerCase();
      const path = (location.hash || location.pathname || "").toLowerCase();

      const publicUrl = `${API_BASE}/api/stations`;

      const privateUrl = `${API_BASE}/api/stations/private`;


      let stationsData = []; 
      if(path.includes("/env-dashboard")){
        const res = await axios.get(publicUrl);
        stationsData = res.data;
      } else if (path.includes("/minedashboard")) {
      const token = localStorage.getItem("authToken");

      const res = await axios.get(`${API_BASE}/api/users_sensors/me/stations`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      stationsData = res.data;
    }
    else {
      const res = await axios.get(publicUrl);
      stationsData = res.data;
    }
      const uniqueStations = Object.values(
      stationsData.reduce((acc, station) => {
        acc[station._id] = station;
        return acc;
      }, {})
    );
     uniqueStations.sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    setStations(uniqueStations);
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