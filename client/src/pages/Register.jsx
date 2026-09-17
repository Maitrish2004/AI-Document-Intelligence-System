import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import "./Auth.css";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
   const navigate = useNavigate();
  const handleRegister = async (e) => {
    e.preventDefault();

    setErrorMessage("");

    if (!name || !email || !password) {
      setErrorMessage("Please fill in all fields.");
      return;
    }
const passwordRegex =
  /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

if (!passwordRegex.test(password)) {
  setErrorMessage(
    "Password must be at least 8 characters and include uppercase, lowercase, number, and special character."
  );
  return;
}
try {
      setLoading(true);

      await axios.post(
        "http://localhost:5000/api/auth/register",
        {
          name,
          email,
          password,
        }
      );

      /*
        Registration successful হলে
        Login page-এ email automatically filled থাকবে.
      */
      navigate("/login", {
        state: {
          registeredEmail: email,
        },
      });

    } catch (error) {
      console.log(error);

      // MySQL duplicate email error
      if (
        error.response?.status === 409 ||
        error.response?.data?.error?.includes("Duplicate") ||
        error.response?.data?.message?.includes("already")
      ) {
        setErrorMessage(
          "Email already registered. Please login."
        );
      } else {
        setErrorMessage(
          error.response?.data?.message ||
          "Registration failed. Please try again."
        );
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
            <h2>Create Account</h2>
            <p>Start managing your documents intelligently</p>
          </div>

          {/* Login button */}
          <Link to="/login" className="top-register-btn">
            Login
          </Link>
        </div>

        {/* Error */}
        {errorMessage && (
          <div className="auth-error">
            {errorMessage}
          </div>
        )}

        {/* Register Form */}
        <form onSubmit={handleRegister} className="auth-form">

          {/* Name */}
          <div className="input-group">
            <label>Full Name</label>

            <input
              type="text"
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Email */}
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

          {/* Password */}
          <div className="input-group">
            <label>Password</label>

            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Create a password"
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

           <small className="password-info">
  Minimum 8 characters with uppercase, lowercase, number, and special character.
</small>
          </div>

          {/* Register Button */}
          <button
            type="submit"
            className="auth-submit-btn"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Creating Account...
              </>
            ) : (
              "Create Account"
            )}
          </button>

        </form>

        

        {/* Footer */}
        <div className="auth-footer">
          <span>Already have an account?</span>

          <Link to="/login">
            Login
          </Link>
        </div>

      </div>
    </div>
  );
};

export default Register;
