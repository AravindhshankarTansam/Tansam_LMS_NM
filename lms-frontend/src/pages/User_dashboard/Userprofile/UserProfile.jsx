// LMS/lms-frontend/src/pages/User_dashboard/UserProfile.jsx
import React, { useState, useEffect } from "react";
import "./UserProfile.css";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import { MapPin, FileText, ClipboardList, FolderOpen } from "lucide-react";
import Sidebar from "../Sidebar/sidebar";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const UserProfile = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  // Editable temporary states
  const [tempName, setTempName] = useState("");
  const [tempStudentId, setTempStudentId] = useState("");
  const [tempEmail, setTempEmail] = useState("");

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.warn("No token found");
          setLoading(false);
          return;
        }

        const res = await fetch("http://localhost:5000/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Failed to fetch user profile");

        const data = await res.json();
        setUserData(data.user);
        setTempName(data.user.profile?.full_name || "");
        setTempStudentId(data.user.profile?.custom_id || "");
        setTempEmail(data.user.profile?.user_email || data.user.email || "");
      } catch (err) {
        console.error("❌ Error fetching user:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleEdit = () => setEditing(true);
  const handleCancel = () => setEditing(false);

  const handleSave = () => {
    // This is local-only for now
    setUserData((prev) => ({
      ...prev,
      profile: {
        ...prev.profile,
        full_name: tempName,
        custom_id: tempStudentId,
        user_email: tempEmail,
      },
    }));
    setEditing(false);
  };

  // Mock attendance chart
  const courseData = [
    { name: "Dental", attendance: [75, 100, 75, 30, 30] },
    { name: "MBBS", attendance: [80, 85, 90, 95, 100] },
    { name: "B.Sc. Nursing", attendance: [60, 70, 65, 80, 75] },
  ];

  const chartData = {
    labels: ["01-01-2021", "08-01-2021", "15-01-2021", "22-01-2021", "29-01-2021"],
    datasets: [
      {
        label: "Attendance %",
        data: courseData[1].attendance,
        backgroundColor: courseData[1].attendance.map((val) =>
          val < 50 ? "#FF6B6B" : "#4B9EFF"
        ),
        borderRadius: 8,
      },
    ],
  };

  const chartOptions = {
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, ticks: { stepSize: 20 } },
      x: { grid: { display: false } },
    },
  };

  if (loading) return <p>Loading user profile...</p>;
  if (!userData) return <p>No user found.</p>;

  const profile = userData.profile || {};

  return (
    <div className="main-layout">
      <Sidebar />
      <div className="dashboard2-container">
        <header className="dashboard-header">
          <div>
            <h2>Student Details</h2>
            <p>
              Course: <b>MBBS (Bachelor of Medicine and Bachelor of Surgery)</b> | Semester:{" "}
              <b>Final Semester</b> | College: <b>Madras Medical College</b>
            </p>
          </div>
        </header>

        <div className="main-grid">
          <div className="left-section">
            <div className="chart-card">
              <div className="attendance-header">
                <h3>Attendance</h3>
              </div>

              <p>
                Weekly Class Hours: 40 | Current:{" "}
                {courseData[1].attendance[courseData[1].attendance.length - 1]}% | Projected: 80%
              </p>
              <Bar data={chartData} options={chartOptions} />
            </div>
          </div>

          <aside className="profile-section">
            <div className="profile-card">
              <img
                src={
                  profile.image_path
                    ? `http://localhost:5000/${profile.image_path.replace("\\", "/")}`
                    : "https://i.pravatar.cc/100"
                }
                alt="student"
                className="profile-img"
              />
              <h3>{profile.full_name || "Student"}</h3>
              <p>Student ID: {profile.custom_id || "N/A"}</p>
              <p>Email: {profile.user_email || userData.email}</p>
              <p>
                <MapPin size={14} /> Harrisburg, Pennsylvania, USA
              </p>
            </div>

            <div className="info-list">
              <p>
                <FileText size={14} /> OSHC: 2 Months Left
              </p>
              <p>
                <ClipboardList size={14} /> Documents Checklist: 19 Files
              </p>
              <p>
                <FolderOpen size={14} /> Claim Tracking: $0
              </p>
              <button className="edit-btn" onClick={handleEdit}>
                Edit Profile
              </button>
            </div>

            {/* Popup Modal */}
            {editing && (
              <div className="modal-overlay">
                <div className="modal-content">
                  <h3>Edit Profile</h3>
                  <table className="edit-table">
                    <tbody>
                      <tr>
                        <td className="label">Name</td>
                        <td>
                          <input
                            type="text"
                            value={tempName}
                            onChange={(e) => setTempName(e.target.value)}
                          />
                        </td>
                      </tr>
                      <tr>
                        <td className="label">Student ID</td>
                        <td>
                          <input
                            type="text"
                            value={tempStudentId}
                            onChange={(e) => setTempStudentId(e.target.value)}
                          />
                        </td>
                      </tr>
                      <tr>
                        <td className="label">Email</td>
                        <td>
                          <input
                            type="email"
                            value={tempEmail}
                            onChange={(e) => setTempEmail(e.target.value)}
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <div className="edit-actions">
                    <button onClick={handleCancel}>Cancel</button>
                    <button onClick={handleSave}>Save</button>
                  </div>
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
