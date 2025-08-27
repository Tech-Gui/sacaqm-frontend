// src/routes/RequireAuth.jsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contextProviders/AuthContext";

export default function RequireAuth({ children }) {
  const { isAuthed } = useAuth();
  const location = useLocation();
  if (!isAuthed) {
    // remember where user was trying to go
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return children;
}
