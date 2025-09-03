// src/contextProviders/AuthContext.js
import React, { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("authToken"));
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("authUser");
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const isAuthed = !!token;

  const login = (jwt, userData) => {
    localStorage.setItem("authToken", jwt);
    localStorage.setItem("authUser", JSON.stringify(userData)); // Example user data
    setToken(jwt);
    setUser(userData);
  };
  const logout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("authUser");
    setUser(null);
    setToken(null);
  };

  useEffect(() => {
    const onStorage = () => {
      const currentToken = localStorage.getItem("authToken");
      const currentUser = localStorage.getItem("authUser");
      setToken(currentToken);
      setUser(currentUser ? JSON.parse(currentUser) : null);
    };

 window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthed, token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
