import React from "react";
import "./App.css";
import { HashRouter, Routes, Route } from "react-router-dom"; // keep HashRouter OR move to index.js (but not both)

import Dashboard from "./screens/Dashboard";
import Information from "./screens/Information";
import AppMap from "./map/index";
import AnalyticsScreen from "./screens/Analytics";
import MineLogin from "./screens/mine";
import MineDashboard from "./screens/mineDashboard";
import Stations from "./screens/Stations";

import RequireAuth from "./routes/RequireAuth";
import { AuthProvider } from "./contextProviders/AuthContext";
import { DataTypeProvider } from "./contextProviders/dataTypeContext";
import { SensorDataProvider } from "./contextProviders/sensorDataContext";
import { DataProvider } from "./contextProviders/DataContext";
import { StationProvider } from "./contextProviders/StationContext";

function App() {
  return (
    <div className="App">
      {/* Use exactly one router in the entire app.
         If you keep HashRouter here, DO NOT also wrap with BrowserRouter in index.js */}
      <HashRouter>
        <AuthProvider>
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

                    {/* Login (public) */}
                    <Route path="/login" element={<MineLogin />} />

                    {/* Private dashboard (protected) */}
                    <Route
                      path="/mineDashboard"
                      element={
                        <RequireAuth>
                          <MineDashboard />
                        </RequireAuth>
                      }
                    />
                  </Routes>
                </StationProvider>
              </DataProvider>
            </SensorDataProvider>
          </DataTypeProvider>
        </AuthProvider>
      </HashRouter>
    </div>
  );
}

export default App;
