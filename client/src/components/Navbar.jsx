import React from "react";
import { Link, useNavigate } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");

    alert("Logged out successfully");

    navigate("/register");
  };

  return (
    <nav className="navbar">
      <div className="logo">
        <h2>AI Document Intelligence</h2>
      </div>

      <ul className="nav-links">
        <li>
          <Link to="/dashboard">Dashboard</Link>
        </li>

        <li>
          <Link to="/upload">Upload</Link>
        </li>

        <li>
          <Link to="/search">Search</Link>
        </li>

        <li>
          <Link to="/ask-ai">Ask AI</Link>
        </li>

        <li>
          <Link to="/profile">Profile</Link>
        </li>

        <li>
          <button
            type="button"
            onClick={handleLogout}
            className="logout-button"
          >
            Logout
          </button>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;
