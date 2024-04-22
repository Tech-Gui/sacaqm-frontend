// TempContext.js
import React, { createContext, useState, useEffect } from "react";
import axios from "axios";

const TempContext = createContext();

const TempProvider = ({ children }) => {
  const [nodeData, setTemperatureData] = useState([]);

  useEffect(() => {
    // Fetch temperature data from your backend API using Axios
    const fetchTemperatureData = async () => {
      try {
        const response = await axios.get(
          "https://sacaqm.onrender.com/api/sensors/all"
        );

        // console.log(filteredData);
        setTemperatureData(response.data);
      } catch (error) {
        console.error("Error fetching temperature data:", error);
      }
    };

    fetchTemperatureData();
  }, []);

  return (
    <TempContext.Provider value={{ nodeData }}>{children}</TempContext.Provider>
  );
};

export { TempContext, TempProvider };
