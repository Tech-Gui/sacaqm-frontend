import React, { createContext, useContext, useState, useEffect } from "react";
import { sendData } from "../components/getRealData";
import { useNavigate } from "react-router-dom";

// Step 1: Create a context
const SensorDataContext = createContext();

// Step 2: Create the context provider component
const SensorDataProvider = ({ children }) => {
  const [data, setData] = useState(null);
  const [selectedSensor, setSelectedSensor] = useState("350457790740896");
  const [selectedSensor2, setSelectedSensor2] = useState("No Station 2 Selected");
  const [selectedPeriod, setSelectedPeriod] = useState("Today");
  const navigate = useNavigate();
  const fetchData = async () => {
    try {
      const { dates, Pm1p0, Pm2p5, Pm4p0, Pm10p0, Temperature, Humidity, Co2, Dba } =
        selectedSensor !== null
          ? await sendData(selectedSensor, selectedPeriod)
          : await sendData("350457790740896", selectedPeriod);

      setData({
        dates,
        Pm1p0,
        Pm2p5,
        Pm4p0,
        Pm10p0,
        Temperature,
        Humidity,
        Co2,
        Dba
      });
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedSensor, selectedSensor2,selectedPeriod]);

  // Step 3: Provide the state and functions through the context
  const contextValue = {
    data,
    selectedSensor,
    selectedSensor2,
    selectedPeriod,
    setSelectedSensor,
    setSelectedSensor2,
    setSelectedPeriod,
    fetchData,
  };

  return (
    <SensorDataContext.Provider value={contextValue}>
      {children}
    </SensorDataContext.Provider>
  );
};

// Create a custom hook to use the context
const useSensorData = () => {
  const context = useContext(SensorDataContext);
  if (!context) {
    throw new Error("useSensorData must be used within a SensorDataProvider");
  }
  return context;
};

export { SensorDataProvider, useSensorData };
