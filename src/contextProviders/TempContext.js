// TempContext.js
import React, { createContext, useState, useEffect } from "react";
import axios from "axios";

const TempContext = createContext();

const TempProvider = ({ children }) => {
  const [nodeData, setNodeData] = useState([]);

  useEffect(() => {
    // Fetch temperature data from your backend API using Axios
    const fetchTemperatureData = async () => {
      try {
        const response = await axios.get(
          "https://try-again-test-isaiah.app.cern.ch/api/stations/664b2e399280a4a69cfb9ddb/sensorData"
        );

        console.log(response.data);
        setNodeData(response.data);
      } catch (error) {
        console.error("Error fetching temperature data:", error);
      }
    };

    fetchTemperatureData();
  }, []);

  return (
    <TempContext.Provider value={{ nodeData, setNodeData }}>
      {children}
    </TempContext.Provider>
  );
};

export { TempContext, TempProvider };
