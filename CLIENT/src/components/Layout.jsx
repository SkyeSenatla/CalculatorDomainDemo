// Layout.jsx — Page Wrapper with Auth-Aware Navigation
// Uses AuthContext to determine whether to show login or logout controls.
// Uses React Router's Link for client-side navigation (no full page reload).

import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Layout({ children, title }) {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="app-container">
      {/* Header with navigation */}
      <header className="main-header">
        <div className="header-content">
          <h1>{title}</h1>
          <nav className="header-nav">
            {isAuthenticated ? (
              <>
                <Link to="/my-calculations" className="nav-link">My Calculations</Link>
                <span className="nav-user">Hi, {user?.username}</span>
                <button onClick={handleLogout} className="nav-logout-btn">
                  Logout
                </button>
              </>
            ) : (
              <Link to="/login" className="nav-link">Sign In</Link>
            )}
          </nav>
        </div>
      </header>

      {/* {children} renders whatever components are nested inside <Layout> */}
      <main className="content">
        {children}
      </main>

      {/* A static footer shared across all pages */}
      <footer className="main-footer">
        <p>&copy; 2026 Calculator Corp</p>
      </footer>
    </div>
  );
}

export default Layout;
