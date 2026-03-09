// ProtectedRoute.jsx — Auth Guard for private routes.
// If the user is not authenticated (no token), they are redirected to login.
// Also checks localStorage directly on each render to catch same-tab token
// deletion. Combined with the "storage" event listener in AuthContext
// (cross-tab), this provides full coverage.

import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();

  // Additional same-tab check: verify the token still exists in storage
  // This catches the case where a user deletes the token in the same tab's DevTools
  const tokenInStorage = localStorage.getItem("token");

  if (!isAuthenticated || !tokenInStorage) {
    // Redirect to login — Replace prevents the user from navigating "back" to the protected page
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;
