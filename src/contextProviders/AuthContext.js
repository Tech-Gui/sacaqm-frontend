import React, { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

// ---------- helper: SAFE JSON PARSE ----------
const safeParse = (value) => {
  try {
    if (!value || value === "undefined") return null;
    return JSON.parse(value);
  } catch {
    return null;
  }
};

export function AuthProvider({ children }) {
  // ---------- state ----------
  const [token, setToken] = useState(() =>
    localStorage.getItem("authToken")
  );

  const [user, setUser] = useState(() =>
    safeParse(localStorage.getItem("authUser"))
  );

  const isAuthed = Boolean(token);

  // ---------- login ----------
  const login = (jwt, userData) => {
    localStorage.setItem("authToken", jwt);

    if (userData) {
      localStorage.setItem("authUser", JSON.stringify(userData));
    } else {
      localStorage.removeItem("authUser");
    }

    setToken(jwt);
    setUser(userData ?? null);
  };

  // ---------- logout ----------
  const logout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("authUser");
    setToken(null);
    setUser(null);
  };

  // ---------- auto-clean corrupted storage (one-time) ----------
  useEffect(() => {
    const rawUser = localStorage.getItem("authUser");
    if (rawUser === "undefined") {
      localStorage.removeItem("authUser");
      localStorage.removeItem("authToken");
    }
  }, []);

  // ---------- sync across tabs ----------
  useEffect(() => {
    const onStorage = () => {
      setToken(localStorage.getItem("authToken"));
      setUser(safeParse(localStorage.getItem("authUser")));
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthed,
        token,
        user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
