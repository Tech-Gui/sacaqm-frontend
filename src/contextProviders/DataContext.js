// DataContext.js
import React, { createContext, useState, useEffect } from "react";
import axios from "axios";

const DataContext = createContext();

const DataProvider = ({ children }) => {
  const [nodeData, setNodeData] = useState([]);

  // Fetch temperature data from your backend API using Axios
  const fetchNodeData = async (stationId) => {
    try {
      const response = await axios.get(
        `https://try-again-test-isaiah.app.cern.ch/api/stations/${stationId}/sensorData`
      );

      setNodeData(response.data);
    } catch (error) {
      console.error("Error fetching temperature data:", error);
    }
  };

  useEffect(() => {
    fetchNodeData("664b2e399280a4a69cfb9ddb");
  }, []);

  return (
    <DataContext.Provider value={{ nodeData, setNodeData, fetchNodeData }}>
      {children}
    </DataContext.Provider>
  );
};

export { DataContext, DataProvider };
