import React, { useState } from "react";
import axios from "axios";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "./Auth.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const navigate = useNavigate();
  const location = useLocation();

  // Registration successful হলে Register page থেকে email আসবে
  React.useEffect(() => {
    if (location.state?.registeredEmail) {
      setEmail(location.state.registeredEmail);
    }
  }, [location.state]);

  const handleLogin = async (e) => {
    e.preventDefault();

    setErrorMessage("");

    if (!email || !password) {
      setErrorMessage("Please enter email and password.");
      return;
    }

    try {
      setLoading(true);

      const res = await axios.post(
        "http://localhost:5000/api/auth/login",
        {
          email,
          password,
        }
      );

      localStorage.setItem("token", res.data.token);

      // Login successful → Dashboard
      navigate("/dashboard");
    } catch (error) {
      console.log(error);

      if (error.response?.status === 404) {
        setErrorMessage("User not found. Please register first.");
      } else if (error.response?.status === 401) {
        setErrorMessage("Invalid email or password.");
      } else {
        setErrorMessage("Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">

        {/* Brand */}
        <div className="auth-brand">
          <div className="brand-icon">AI</div>

          <div>
            <h1>AI Document Intelligence</h1>
            <p>Smart Document Analysis System</p>
          </div>
        </div>

        {/* Header */}
        <div className="auth-header">
          <div>
            <h2>Welcome Back</h2>
            <p>Login to access your documents</p>
          </div>

          {/* Only Register button on Login */}
          <Link to="/register" className="top-register-btn">
            Register
          </Link>
        </div>

        {/* Error */}
        {errorMessage && (
          <div className="auth-error">
            {errorMessage}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="auth-form">

          <div className="input-group">
            <label>Email Address</label>

            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="input-group">
            <div className="password-label-row">
              <label>Password</label>

              <Link to="/forgot-password" className="forgot-link">
                Forgot Password?
              </Link>
            </div>

            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />

              <button
                type="button"
                className="show-password-btn"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            className="auth-submit-btn"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Logging in...
              </>
            ) : (
              "Login"
            )}
          </button>

        </form>

        
        {/* Footer */}
        <div className="auth-footer">
          <span>Don't have an account?</span>

          <Link to="/register">
            Create Account
          </Link>
        </div>

      </div>
    </div>
  );
};

export default Login;
