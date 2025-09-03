// src/routes/RequireAuth.jsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contextProviders/AuthContext";

export default function RequireAuth({ children }) {
  const location = useLocation();
  // Check for auth token directly
  const authToken = localStorage.getItem("authToken");

  // If no token found, redirect to login
  if (!authToken) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}
