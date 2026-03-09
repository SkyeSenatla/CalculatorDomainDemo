// App.jsx — Top-Level Orchestrator with Routing
// BrowserRouter wraps the entire app for client-side navigation.
// AuthProvider wraps routes so all components can access auth state.
// ProtectedRoute guards private pages — redirects to login if no token.

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import LoginPage from "./pages/LoginPage";
import MyCalculations from "./pages/MyCalculations";
import ProtectedRoute from "./components/ProtectedRoute";

// Sends users to the right place based on auth status
function RootRedirect() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated
    ? <Navigate to="/my-calculations" replace />
    : <Navigate to="/login" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Layout title="Advanced Calculator">
          <Routes>
            {/* Public route: Login page */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected route: My Calculations (requires authentication) */}
            <Route
              path="/my-calculations"
              element={
                <ProtectedRoute>
                  <MyCalculations />
                </ProtectedRoute>
              }
            />

            {/* Default route: redirect based on auth status */}
            <Route path="*" element={<RootRedirect />} />
          </Routes>
        </Layout>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
