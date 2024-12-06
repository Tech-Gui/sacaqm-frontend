import React, { createContext, useState, useEffect } from "react";
import axios from "axios";

const DataContext = createContext();

const DataProvider = ({ children }) => {
  const [nodeData, setNodeData] = useState([]);
  const [nodeData2, setNodeData2] = useState([]);

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

  // Fetch temperature data from your backend API using Axios
  const fetchNodeData2 = async (stationId, days = 1) => {
    console.log("Fetching data...");
    try {
      const response = await axios.get(
        `https://try-again-test-isaiah.app.cern.ch/api/stations/${stationId}/sensorData?days=${days}`
      );

      // Reverse the data order
      const reversedData = response.data.reverse();

      setNodeData2(reversedData);
    } catch (error) {
      console.error("Error fetching data for station 2 :", error);
    }
  };

  // Fetch data for nodeData on component mount
  useEffect(() => {
    fetchNodeData("66503777099ab1a7fbcfbd32", 1); // Replace with actual stationId for station 1
  }, []);

  // Fetch data for nodeData2 on component mount
  useEffect(() => {
    fetchNodeData2("66503777099ab1a7fbcfbd32", 1); // Replace with actual stationId for station 2
  }, []);

  return (
    <DataContext.Provider value={{ nodeData, setNodeData, nodeData2, setNodeData2, fetchNodeData, fetchNodeData2 }}>
      {children}
    </DataContext.Provider>
  );
};

export { DataContext, DataProvider };