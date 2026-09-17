import React from "react";
import { Link } from "react-router-dom";

const Sidebar = () => {
  return (
    <div className="sidebar">

      <h3>Menu</h3>

      <ul>

        <li>
          <Link to="/dashboard">
            Dashboard
          </Link>
        </li>

        <li>
          <Link to="/upload">
            Upload Document
          </Link>
        </li>

        <li>
          <Link to="/search">
            Search Documents
          </Link>
        </li>

        <li>
          <Link to="/ask-ai">
            Ask AI
          </Link>
        </li>

        <li>
          <Link to="/profile">
            My Profile
          </Link>
        </li>

        <li>
          <Link to="/">
            Logout
          </Link>
        </li>

      </ul>

    </div>
  );
};

export default Sidebar;
