// src/components/AdminProfile.jsx
import React from "react";
import { Pencil } from "lucide-react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import "./AdminProfile.css";
import "./Dashboard.css"; // ✅ sidebar styling

const AdminProfile = () => {
  return (
    <div className="admin-profile-page">
      {/* ✅ Sticky Sidebar */}
      <Sidebar />

      {/* ✅ Main Content Area */}
      <div className="profile-main">
        {/* ✅ Top Header */}
        <Header userName="Admin" />

        {/* ✅ Scrollable Profile Section */}
        <div className="profile-container">
          <h2 className="profile-title">My Profile</h2>

          <div className="profile-header">
            <img
              src="https://i.pravatar.cc/100"
              alt="Profile"
              className="profile-avatar"
            />
            <div className="profile-info">
              <h3>Rafqur Rahman</h3>
              <p>Team Manager</p>
              <p className="location">Leeds, United Kingdom</p>
            </div>
          </div>

          {/* Personal Information */}
          <div className="section-card">
            <div className="section-header">
              <h4>Personal Information</h4>
              <button className="edit-btn">
                <Pencil size={16} /> Edit
              </button>
            </div>
            <div className="section-content">
              <div className="info-row">
                <div>
                  <p className="label">First Name</p>
                  <p className="value">Rafqur</p>
                </div>
                {/* <div>
                  <p className="label">Last Name</p>
                  <p className="value">Rahman</p>
                </div> */}
              </div>
              <div className="info-row">
                <div>
                  <p className="label">Email address</p>
                  <p className="value">rafqurrahman51@gmail.com</p>
                </div>
                {/* <div>
                  <p className="label">Phone</p>
                  <p className="value">+09 345 346 46</p>
                </div> */}
              </div>
              <div className="info-row">
                <div>
                  <p className="label">Phone</p>
                  <p className="value">+09 345 346 46</p>
                </div>
              </div>
            </div>
          </div>

          {/* Address */}
          {/* <div className="section-card">
            <div className="section-header">
              <h4>Address</h4>
              <button className="edit-btn">
                <Pencil size={16} /> Edit
              </button>
            </div>
            <div className="section-content">
              <div className="info-row">
                <div>
                  <p className="label">Country</p>
                  <p className="value">United Kingdom</p>
                </div>
                <div>
                  <p className="label">City/State</p>
                  <p className="value">Leeds, East London</p>
                </div>
              </div>
              <div className="info-row">
                <div>
                  <p className="label">Postal Code</p>
                  <p className="value">ERT 2354</p>
                </div>
                <div>
                  <p className="label">TAX ID</p>
                  <p className="value">AS45645/576</p>
                </div>
              </div>
            </div>
          </div> */}
        </div>
      </div> {/* profile-main */}
    </div>
  );
};

export default AdminProfile;
