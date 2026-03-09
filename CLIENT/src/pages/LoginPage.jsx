// LoginPage.jsx — Captures the JWT from a POST /login call and persists
// it to localStorage for session continuity.
//
// Flow:
//   1. User enters username + password
//   2. We POST to /api/auth/login
//   3. Server validates credentials and returns { token: "jwt..." }
//   4. We call auth.login(token, username) to persist it
//   5. React Router redirects to the protected page

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { loginUser } from "../services/api";

function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // The Login Handshake: POST credentials, receive JWT
      const data = await loginUser(username, password);
      // Persist the token and user info via AuthContext
      login(data.token, username);
      // Redirect to the protected calculator page
      navigate("/my-calculations");
    } catch (err) {
      // Show the error message from the API (e.g., "Invalid credentials")
      if (err.response?.data) {
        setError(err.response.data.message || err.response.data || "Login failed");
      } else {
        setError(err.message || "Login failed");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h2>Sign In</h2>
        <p className="login-subtitle">Enter your credentials to access the calculator</p>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-field">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              required
              autoFocus
            />
          </div>

          <div className="login-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
            />
          </div>

          {error && <p className="login-error">{String(error)}</p>}

          <button type="submit" className="login-button" disabled={isSubmitting}>
            {isSubmitting ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="login-hint">
          <p><strong>Demo accounts:</strong></p>
          <p>Admin: Skye / Skye123!</p>
          <p>Manager: Manager1 / Manager123!</p>
          <p>User: User1 / User123!</p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
