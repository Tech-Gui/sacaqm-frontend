// src/contextProviders/AuthContext.js
import React, { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("authToken"));
  const isAuthed = !!token;

  const login = (jwt) => {
    localStorage.setItem("authToken", jwt);
    setToken(jwt);
  };
  const logout = () => {
    localStorage.removeItem("authToken");
    setToken(null);
  };

  useEffect(() => {
    const onStorage = () => setToken(localStorage.getItem("authToken"));
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthed, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
