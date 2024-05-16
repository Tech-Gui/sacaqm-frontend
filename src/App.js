import React, { useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import Dashboard from "./screens/Dashboard";
import Information from "./screens/Information";
// import InvoiceDataProvider from "./contextProviders/invoiceContextProvider";

import AppMap from "./map/index";
import AnalyticsScreen from "./screens/Analytics";
import { DataTypeProvider } from "./contextProviders/dataTypeContext";
import {
  SensorDataProvider,
  useSensorData,
} from "./contextProviders/sensorDataContext";
import Stations from "./screens/Stations";
import { TempProvider } from "./contextProviders/TempContext";
import { StationProvider } from "./contextProviders/StationContext";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <DataTypeProvider>
          <SensorDataProvider>
            <TempProvider>
            <StationProvider>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/test" element={<AppMap />} />

                <Route path="/analytics" element={<AnalyticsScreen />} />
                <Route path="/stations" element={<Stations />} />
                <Route path="/information" element={<Information />} />
              </Routes>
              </StationProvider>
            </TempProvider>
          </SensorDataProvider>
        </DataTypeProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
