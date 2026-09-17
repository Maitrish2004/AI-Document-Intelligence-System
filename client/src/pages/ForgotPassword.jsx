import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import "./Auth.css";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    setErrorMessage("");

    if (!email || !newPassword || !confirmPassword) {
      setErrorMessage("Please fill in all fields.");
      return;
    }

    const passwordRegex =
      /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

    if (!passwordRegex.test(newPassword)) {
      setErrorMessage(
        "Password must be at least 8 characters and include uppercase, lowercase, number, and special character."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      await axios.post(
        "http://localhost:5000/api/auth/reset-password",
        {
          email,
          newPassword,
          confirmPassword,
        }
      );

      navigate("/login", {
        state: {
          resetEmail: email,
          resetSuccess: true,
        },
      });
   } catch (error) {
  console.log("RESET PASSWORD ERROR:", error);
  console.log("STATUS:", error.response?.status);
  console.log("DATA:", error.response?.data);
  console.log("MESSAGE:", error.message);

  setErrorMessage(
    error.response?.data?.message ||
      "Password reset failed. Please try again."
  );
}
     finally {
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
            <h2>Forgot Password?</h2>
            <p>
              Enter your email and create a new password.
            </p>
          </div>
        </div>

        {/* Error */}
        {errorMessage && (
          <div className="auth-error">
            {errorMessage}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="auth-form">

          {/* Email */}
          <div className="input-group">
            <label>Email Address</label>

            <input
              type="email"
              placeholder="Enter your registered email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* New Password */}
          <div className="input-group">
            <label>New Password</label>

            <div className="password-input-wrapper">
              <input
                type={showNewPassword ? "text" : "password"}
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={loading}
              />

              <button
                type="button"
                className="show-password-btn"
                onClick={() =>
                  setShowNewPassword(!showNewPassword)
                }
                disabled={loading}
              >
                {showNewPassword ? "Hide" : "Show"}
              </button>
            </div>

            <small className="password-info">
              Minimum 8 characters with uppercase, lowercase, number,
              and special character.
            </small>
          </div>

          {/* Confirm Password */}
          <div className="input-group">
            <label>Confirm Password</label>

            <div className="password-input-wrapper">
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) =>
                  setConfirmPassword(e.target.value)
                }
                disabled={loading}
              />

              <button
                type="button"
                className="show-password-btn"
                onClick={() =>
                  setShowConfirmPassword(!showConfirmPassword)
                }
                disabled={loading}
              >
                {showConfirmPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {/* Reset Password */}
          <button
            type="submit"
            className="auth-submit-btn"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Resetting Password...
              </>
            ) : (
              "Reset Password"
            )}
          </button>

        </form>

        {/* Back to Login */}
        <div className="auth-footer">
          <span>Remember your password?</span>

          <Link to="/login">
            Back to Login
          </Link>
        </div>

      </div>
    </div>
  );
};

export default ForgotPassword;
