// DataContext.js
import React, { createContext, useState, useEffect } from "react";
import axios from "axios";

const DataContext = createContext();

const DataProvider = ({ children }) => {
  const [nodeData, setNodeData] = useState([]);

  // Fetch temperature data from your backend API using Axios
  const fetchNodeData = async (stationId, days = 1) => {
    console.log("Fetching data...");
    try {
      const response = await axios.get(
        `https://try-again-test-isaiah.app.cern.ch/api/stations/${stationId}/sensorData?days=${days}`
      );

      // Reverse the data order
      const reversedData = response.data.reverse();

      setNodeData(reversedData);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchNodeData("66503777099ab1a7fbcfbd32", 7); // Fetch data for the last 7 days
  }, []);

  return (
    <DataContext.Provider value={{ nodeData, setNodeData, fetchNodeData }}>
      {children}
    </DataContext.Provider>
  );
};

export { DataContext, DataProvider };
