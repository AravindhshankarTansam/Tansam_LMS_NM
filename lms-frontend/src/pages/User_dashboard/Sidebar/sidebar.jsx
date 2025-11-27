import React from "react";
import {
  FaBook,
  FaChartBar,
  FaUsers,
  FaBookOpen,
  FaSignOutAlt,
} from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";
import "./sidebar.css";
import herologo from "../../../assets/tansamoldlogo.png";

const Sidebar = ({ activeCourse }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    navigate("/"); // Redirect to landing page
  };

  const handleCourseClick = () => {
    if (activeCourse) {
      navigate(`/mycourse/${activeCourse.course_id}`);
    }
  };

  // Helper to check active state
  const isActive = (path) => {
    if (path === "/mycourse") {
      return location.pathname.startsWith("/mycourse");
    }
    return location.pathname === path;
  };

  return (
    <div className="sidebar-container">
      {/* ===== Logo ===== */}
      <div className="sidebar-logo">
        <div className="logo-circle">
          <img src={herologo} alt="Logo" className="logo-img" />
        </div>
      </div>

      {/* ===== Menu ===== */}
      <div className="sidebar-menu">
        <div
          className={`menu-item ${isActive("/userdashboard") ? "active" : ""}`}
          onClick={() => navigate("/userdashboard")}
          title="Dashboard"
        >
          <FaBook />
        </div>

        <div
          className={`menu-item ${
            location.pathname.startsWith("/course-player") ? "active" : ""
          }`}
          onClick={() => navigate("/course-player")}
          title="Courses"
        >
          <FaUsers />
        </div>

        {/* Optional quiz icon (commented for now) */}
        {/* <div
          className={`menu-item ${isActive("/quiz") ? "active" : ""}`}
          onClick={() => navigate("/quiz")}
          title="Quiz"
        >
          <FaChartBar />
        </div> */}

        {/* MyCourse icon - only shows when a course is selected */}
        {activeCourse && (
          <div
            className={`menu-item ${isActive("/mycourse") ? "active" : ""}`}
            onClick={handleCourseClick}
            title={activeCourse.course_name}
          >
            <FaBookOpen />
          </div>
        )}
      </div>

      {/* ===== Bottom Section ===== */}
      <div className="sidebar-bottom">
        <button className="logout-btn" onClick={handleLogout} title="Logout">
          <FaSignOutAlt />
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
