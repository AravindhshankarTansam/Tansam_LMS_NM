// src/components/Sidebar.jsx
import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  FaHome,
  FaUserPlus,
  FaBook,
  FaTags,
  FaSignOutAlt,
  FaStream, 
  FaLayerGroup
} from "react-icons/fa";
import "./sidebar.css";

export default function Sidebar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate("/"); // Redirect to landing page
  };

  return (
    <aside className="leftbar">
      <nav className="leftnav">
        <NavLink
          to="/dashboard"
          className={({ isActive }) => (isActive ? "lnk active" : "lnk")}
          title="Dashboard"
        >
          <FaHome />
        </NavLink>

        <NavLink
          to="/add-user"
          className={({ isActive }) => (isActive ? "lnk active" : "lnk")}
          title="Add User"
        >
          <FaUserPlus />
        </NavLink>

        <NavLink
          to="/create-course"
          className={({ isActive }) => (isActive ? "lnk active" : "lnk")}
          title="Create Course"
        >
          <FaBook />
        </NavLink>

        <NavLink
          to="/add-category"
          className={({ isActive }) => (isActive ? "lnk active" : "lnk")}
          title="Add Category"
        >
          <FaTags />
        </NavLink>
        <NavLink
          to="/add-mainstream"
          className={({ isActive }) => (isActive ? "lnk active" : "lnk")}
          title="Mainstream Master"
        >
          <FaStream />
        </NavLink>

        <NavLink
          to="/add-substream"
          className={({ isActive }) => (isActive ? "lnk active" : "lnk")}
          title="Substream Master"
        >
          <FaLayerGroup />
        </NavLink>
      </nav>

      {/* ===== Bottom Section ===== */}
      <div className="left-bottom-section">
        <button
          className="lnk logout-btn"
          onClick={handleLogout}
          title="Logout"
        >
          <FaSignOutAlt />
        </button>
      </div>
    </aside>
  );
}
