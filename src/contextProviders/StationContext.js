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

  const fetchStations = async() => {
    try{ 
      setLoading(true); 
      const path = location.pathname.toLowerCase();

      const publicUrl = "https://try-again-test-isaiah.app.cern.ch/api/stations";

      const privateUrl = "https://try-again-test-isaiah.app.cern.ch/api/stations/private";

      let stationsData = []; 
      if(path.includes("/env-dashboard")){
            const [publicRes, privateRes] = await Promise.all([
        axios.get(publicUrl),
        axios.get(privateUrl).catch(() => ({ data: [] })) // prevents crash if unauthorized
      ]);
           stationsData = [
        ...(publicRes.data || []),
        ...(privateRes.data || [])
      ];
    }
     else if (path.includes("/minedashboard")) {
      const res = await axios.get(privateUrl);
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
 
  // const fetchStations = async () => {
  //   try {
  //     setLoading(true);

  //     let url = "https://try-again-test-isaiah.app.cern.ch/api/stations";

 
  //     if (location.pathname.includes("mineDashboard") || location.pathname.includes("env-dashboard")) 
  //       {
  //       url = "https://try-again-test-isaiah.app.cern.ch/api/stations/private";
  //     }
  //     if (location.pathname.includes("env-dashboard")) {
  //       let url = "https://try-again-test-isaiah.app.cern.ch/api/stations";
  //     }

  //     const response = await axios.get(url);
  //     const stationsData = response.data;

  //     // Sort stations alphabetically by name
  //     const sortedStations = stationsData.sort((a, b) =>
  //       a.name.localeCompare(b.name)
  //     );

  //     setStations(sortedStations);
  //   } catch (err) {
  //     setError(err);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

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
