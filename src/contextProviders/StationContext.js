import React, { createContext, useState, useEffect } from "react";
import axios from "axios";
import { formatLastSeen } from "../components/dateFormatter"; // Adjust the path as needed

export const StationContext = createContext();

export const StationProvider = ({ children }) => {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStations = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        "https://try-again-test-isaiah.app.cern.ch/api/stations"
      );
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
  }, []);

  return (
    <StationContext.Provider
      value={{ stations, loading, error, fetchStations }}>
      {children}
    </StationContext.Provider>
  );
};

export default StationProvider;
