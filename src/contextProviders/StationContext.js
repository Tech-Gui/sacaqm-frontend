import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import { formatLastSeen } from '../components/dateFormatter'; // Adjust the path as needed

export const StationContext = createContext();

export const StationProvider = ({ children }) => {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLastSeen = async (stationId) => {
    try {
      const response = await axios.get(`https://try-again-test-isaiah.app.cern.ch/api/stations/${stationId}/sensorData`);
      const sensorData = response.data.reverse();
      if (sensorData.length > 0) {
        return formatLastSeen(sensorData[sensorData.length - 1].timestamp);
      }
      return 'No data';
    } catch (err) {
      console.error(`Error fetching sensor data for station ${stationId}:`, err);
      return 'Error';
    }
  };

  const fetchStations = async () => {
    try {
      setLoading(true);
      const response = await axios.get('https://try-again-test-isaiah.app.cern.ch/api/stations');
      const stationsData = response.data;

      // Fetch last seen timestamp for each station
      const stationsWithLastSeen = await Promise.all(stationsData.map(async (station) => {
        const lastSeen = await fetchLastSeen(station._id);
        return { ...station, lastSeen };
      }));

      setStations(stationsWithLastSeen);
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
    <StationContext.Provider value={{ stations, loading, error, fetchStations }}>
      {children}
    </StationContext.Provider>
  );
};
