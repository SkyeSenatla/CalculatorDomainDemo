// apiClient.js — Axios Singleton with Auth Interceptors
// The interceptor injects the Bearer token automatically for ALL requests
// through this client. Since all /api/calculations endpoints require
// [Authorize], every request needs the token.
// The login endpoint itself doesn't need a token (it issues one).

import axios from "axios";

// Singleton Axios instance — one source of truth for all API calls
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 5000,
  headers: {
    "Content-Type": "application/json",
  },
});

// REQUEST INTERCEPTOR — Before every outgoing request:
//   1. Reads the JWT from localStorage
//   2. If it exists, attaches it as a Bearer token in the Authorization header
//   3. If no token, the request goes out without auth (for login, etc.)
// This ensures protected routes always send credentials without
// every API call manually adding the header.
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`>>> Sending ${config.method.toUpperCase()} to ${config.url}`);
    return config;
  },
  (error) => Promise.reject(error)
);

// RESPONSE INTERCEPTOR — 401 Unauthorized Auto-Logout
// After every response, checks for 401 status (expired/invalid JWT).
// When detected, clears token and redirects to /login.
// Acts as a global auth guard at the network level.
apiClient.interceptors.response.use(
  (response) => {
    // Unwrap response.data so callers don't need .data every time
    return response.data;
  },
  (error) => {
    if (error.response?.status === 401) {
      console.warn("<<< 401 Unauthorized — session expired, redirecting to login");
      // Clear auth data from storage
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      // Redirect to login page
      // We use window.location instead of React Router's navigate()
      // because interceptors run outside of React's component tree
      window.location.href = "/login";
    }
    console.error("<<< Global API Error:", error.message);
    return Promise.reject(error);
  }
);

export default apiClient;
