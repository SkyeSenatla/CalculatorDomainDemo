// ================================================================
// STEP 0A: FIX THE EXISTING BUG IN apiClient.js
// ================================================================
// Key changes:
//   1. Variable name is now consistently "apiClient" everywhere
//   2. Removed "withcredentials: true" (we use JWT Bearer tokens, not cookies)
//   3. Added automatic token injection in the request interceptor
// ================================================================

import axios from "axios";

// Singleton Axios instance — one source of truth for all API calls
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 5000,
  headers: {
    "Content-Type": "application/json",
  },
});

// REQUEST INTERCEPTOR — runs before every outgoing request
apiClient.interceptors.request.use(
  (config) => {
    // Attach JWT token if it exists in localStorage
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`>>> Sending ${config.method.toUpperCase()} to ${config.url}`);
    return config;
  },
  (error) => Promise.reject(error)
);

// RESPONSE INTERCEPTOR — runs after every response comes back
apiClient.interceptors.response.use(
  (response) => {
    // Unwrap response.data so callers don't need .data every time
    return response.data;
  },
  (error) => {
    console.error("<<< Global API Error:", error.message);
    return Promise.reject(error);
  }
);

export default apiClient;
