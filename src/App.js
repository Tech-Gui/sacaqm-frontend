import React, { useEffect } from "react";
import "./App.css";
import { HashRouter, Routes, Route, Outlet } from "react-router-dom"; // Changed from BrowserRouter to HashRouter
import Dashboard from "./screens/Dashboard";
import Information from "./screens/Information";
import AppMap from "./map/index";
import AnalyticsScreen from "./screens/Analytics";
import { DataTypeProvider } from "./contextProviders/dataTypeContext";
import {
  SensorDataProvider,
  useSensorData,
} from "./contextProviders/sensorDataContext";
import Stations from "./screens/Stations";
import { DataProvider } from "./contextProviders/DataContext";
import { StationProvider } from "./contextProviders/StationContext";
import 'font-awesome/css/font-awesome.min.css';
import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
  return (
    <div className="App">
      <HashRouter>
        {" "}
        {/* Changed from BrowserRouter to HashRouter */}
        <DataTypeProvider>
          <SensorDataProvider>
            <DataProvider>
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
            </DataProvider>
          </SensorDataProvider>
        </DataTypeProvider>
      </HashRouter>{" "}
      {/* Changed from BrowserRouter to HashRouter */}
    </div>
  );
}

export default App;
