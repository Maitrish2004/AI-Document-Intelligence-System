import React, { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
const Profile = () => {
const [user, setUser] = useState({});
useEffect(() => {
    getProfile();
  }, []);
const getProfile = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get(
        "http://localhost:5000/api/auth/profile",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setUser(res.data);
    } catch (error) {
      console.log(error);
    }
  };

  // First letter of user's name
  const userInitial = user.name
    ? user.name.charAt(0).toUpperCase()
    : "U";

  // Format joined date and time
  const joinedDate = user.created_at
    ? new Date(user.created_at).toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    : "—";

  return (
    <div>
      <Navbar />

      <div style={{ display: "flex" }}>
        <Sidebar />

        <div className="profile-page">

          <div className="profile-card">

            {/* Profile Header */}
            <div className="profile-header">

              <div className="profile-avatar">
                {userInitial}
              </div>

              <div className="profile-heading">

                {/* User Name */}
                <h2>
                  {user.name || "—"}
                </h2>

                {/* User Email */}
                <p>
                  {user.email || "—"}
                </p>

              </div>

            </div>

            <div className="profile-line"></div>

            {/* Profile Details */}
            <div className="profile-details">

              {/* Name */}
              <div className="profile-row">

                <span className="profile-label">
                  Name
                </span>

                <span className="profile-value">
                  {user.name || "—"}
                </span>

              </div>

              {/* Email */}
              <div className="profile-row">

                <span className="profile-label">
                  Email
                </span>

                <span className="profile-value">
                  {user.email || "—"}
                </span>

              </div>

              {/* Joined Date */}
              <div className="profile-row">

                <span className="profile-label">
                  Joined Date
                </span>

                <span className="profile-value">
                  {joinedDate}
                </span>

              </div>

            </div>

          </div>

        </div>
      </div>
    </div>
  );
};

export default Profile;
