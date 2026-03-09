// AuthContext.jsx — Global Authentication State
// Manages the JWT lifecycle: reads token from localStorage on mount,
// provides login()/logout(), and listens for cross-tab storage events.
//
// Security Trade-off: We use localStorage for simplicity.
// In production, HttpOnly cookies are more secure against XSS because
// JavaScript cannot read them — but they require server-side CSRF protection.
// localStorage is vulnerable to XSS but simpler for SPAs with JWT.

import { createContext, useContext, useState, useEffect, useCallback } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Initialize from localStorage so a page refresh preserves the session
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });

  // Capture the JWT from the API response and persist it
  const login = useCallback((jwt, username) => {
    localStorage.setItem("token", jwt);
    localStorage.setItem("user", JSON.stringify({ username }));
    setToken(jwt);
    setUser({ username });
  }, []);

  // Clear the token and user data from storage and state
  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  }, []);

  // If the user opens DevTools and manually deletes the "token" key,
  // the "storage" event fires in all tabs. We listen for it here so
  // the UI reacts immediately — blocking access to private pages.
  // Note: The "storage" event only fires in OTHER tabs/windows.
  // For same-tab detection, we also check the token in ProtectedRoute.
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "token") {
        if (!e.newValue) {
          // Token was removed — log out
          setToken(null);
          setUser(null);
        } else {
          // Token was updated (e.g., refresh token rotation)
          setToken(e.newValue);
        }
      }
      if (e.key === "user") {
        if (!e.newValue) {
          setUser(null);
        } else {
          setUser(JSON.parse(e.newValue));
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Derived state: is the user currently authenticated?
  const isAuthenticated = !!token;

  return (
    <AuthContext.Provider value={{ token, user, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook for consuming auth state — avoids repeating useContext everywhere
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
