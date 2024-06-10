// DataContext.js
import React, { createContext, useState, useEffect } from "react";
import axios from "axios";

const DataContext = createContext();

const DataProvider = ({ children }) => {
  const [nodeData, setNodeData] = useState([]);

  // Fetch temperature data from your backend API using Axios
  const fetchNodeData = async (stationId) => {
    console.log("I am called to carry out so fetching baba");
    try {
      const response = await axios.get(
        `https://try-again-test-isaiah.app.cern.ch/api/stations/${stationId}/sensorData`
      );

      // Reverse the data order
      const reversedData = response.data.reverse();

      setNodeData(reversedData);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchNodeData("665033ff099ab1a7fbcfbd26");
  }, []);

  return (
    <DataContext.Provider value={{ nodeData, setNodeData, fetchNodeData }}>
      {children}
    </DataContext.Provider>
  );
};

export { DataContext, DataProvider };
