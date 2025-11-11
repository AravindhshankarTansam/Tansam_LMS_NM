import React from "react";
import {
  FaBook,
  FaChartBar,
  FaUsers,
  FaBookOpen,
  FaSignOutAlt, // ✅ Logout icon
} from "react-icons/fa";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "./sidebar.css";

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    // Clear user session data if needed
    navigate("/"); // Redirect to landing page
  };

  return (
    <div className="sidebar-container">
      {/* ===== Logo ===== */}
      <div className="sidebar-logo">
        <div className="logo-circle">
          <span role="img" aria-label="logo">
            🦉
          </span>
        </div>
      </div>

      {/* ===== Menu ===== */}
      <div className="sidebar-menu">
        <Link
          to="/userdashboard"
          className={`menu-item ${
            location.pathname === "/userdashboard" ? "active" : ""
          }`}
        >
          <FaBook />
        </Link>

        <Link
          to="/course-player"
          className={`menu-item ${
            location.pathname === "/course-player" ? "active" : ""
          }`}
        >
          <FaUsers />
        </Link>

        <Link
          to="/quiz"
          className={`menu-item ${
            location.pathname === "/quiz" ? "active" : ""
          }`}
        >
          <FaChartBar />
        </Link>

        <Link
          to="/mycourse"
          className={`menu-item ${
            location.pathname === "/mycourse" ? "active" : ""
          }`}
        >
          <FaBookOpen />
        </Link>
      </div>

      {/* ===== Bottom Section (Logout + User Avatar) ===== */}
      <div className="sidebar-bottom">
        <button className="logout-btn" onClick={handleLogout} title="Logout">
          <FaSignOutAlt />
        </button>

        <img
          src="https://i.pravatar.cc/60?img=5"
          alt="user"
          className="user-avatar"
          onClick={() => navigate("/userprofile")}
          title="Profile"
        />
      </div>
    </div>
  );
};

export default Sidebar;
