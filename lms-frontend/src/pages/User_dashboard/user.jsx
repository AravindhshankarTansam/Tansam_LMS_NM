// LMS/lms-frontend/src/pages/User_dashboard/DashboardContent.jsx
import React, { useEffect, useState } from "react";
import "./user.css";
import Sidebar from "./Sidebar/sidebar";
import { FaLock, FaCheckCircle, FaArrowLeft, FaArrowRight } from "react-icons/fa";

const DashboardContent = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showMore, setShowMore] = useState(false);
  const [completedChapters, setCompletedChapters] = useState([]);
  const [lockedChapters, setLockedChapters] = useState([]);
  const [progress, setProgress] = useState(0);
  const [dayOffset, setDayOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState(null);
  const [dailyCompletion, setDailyCompletion] = useState({});

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // ✅ Automatically send cookie-based JWT
        const res = await fetch("http://localhost:5000/api/auth/me", {
          method: "GET",
          credentials: "include", // 👈 this is crucial
        });

        if (!res.ok) {
          console.warn("User not authenticated");
          setUserData(null);
          return;
        }

        const data = await res.json();
        setUserData(data.user);
      } catch (err) {
        console.error("Error fetching user:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();

    // Local quiz progress tracking
    const savedScores = JSON.parse(localStorage.getItem("quizScores")) || {};
    const savedDates = JSON.parse(localStorage.getItem("quizDates")) || {};
    const completed = [];
    const locked = [];
    const daily = {};

    for (let i = 1; i <= 50; i++) {
      if (savedScores[i] >= 60) {
        completed.push(`Chapter ${i}`);
        const date = savedDates[i] || new Date().toLocaleDateString();
        daily[date] = (daily[date] || 0) + 1;
      } else {
        locked.push(`Chapter ${i}`);
      }
    }

    const progressPercent = Math.round((completed.length / 50) * 100);
    setCompletedChapters(completed);
    setLockedChapters(locked);
    setProgress(progressPercent);
    setDailyCompletion(daily);
  }, []);

  const profile = userData?.profile || {};

  const handlePrev = () => setDayOffset((prev) => prev - 5);
  const handleNext = () => setDayOffset((prev) => prev + 5);

  const getDisplayedDays = () => {
    const days = [];
    const todayStr = new Date().toLocaleDateString();
    for (let offset = 0; offset < 5; offset++) {
      const dateObj = new Date();
      dateObj.setDate(dateObj.getDate() + dayOffset + offset);
      const dateNum = dateObj.getDate();
      const weekday = dateObj.toLocaleDateString("en-US", { weekday: "long" });
      const month = dateObj.toLocaleDateString("en-US", { month: "long" });
      const dateKey = dateObj.toLocaleDateString();
      const isToday = dateKey === todayStr;
      days.push({ dateNum, weekday, month, dateKey, isToday });
    }
    return days;
  };

  const displayedDays = getDisplayedDays();
  const handleDayClick = (day) => setSelectedDay(day);

  if (loading) return <p>Loading user dashboard...</p>;

  return (
    <div className="dashboard-wrapper">
      <Sidebar />
      <div className="dashboard-content">
        <div className="dashboard1-container">
          {/* ===== Header Section ===== */}
          <div className="header-card">
            <div className="user-info">
              <img
                src={
                  profile.image_path
                    ? `http://localhost:5000/${profile.image_path.replace("\\", "/")}`
                    : "https://i.pravatar.cc/100"
                }
                alt="User"
                className="user-avatar-large"
              />
              <div>
                <h2>{profile.full_name || "Unknown User"} 🎓</h2>
                <p>{profile.custom_id || "N/A"}</p>
                <p style={{ fontSize: "0.9rem" }}>
                  {profile.user_email || userData?.email}
                </p>
              </div>
            </div>

            <div className="stats">
              <div className="stat">
                <h1>0</h1>
                <p>Average Score</p>
              </div>
            </div>
            <div className="all-stats-btn">All Stats</div>
          </div>

          {/* ===== Main Row ===== */}
          <div className="main-row">
            {/* Progress Section */}
            <div className="help-section">
              <h3>Your Course Progress</h3>
              <div className="progress-bar-container">
                <div className="progress-bar-bg">
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <span className="progress-text">{progress}% completed</span>
              </div>
              <div className="progress-summary">
                <p>✅ Completed Chapters: {completedChapters.length}</p>
                <p>🔒 Locked Chapters: {lockedChapters.length}</p>
              </div>

              <button
                className="show-more-btn"
                onClick={() => setShowMore(!showMore)}
              >
                {showMore ? "Show Less" : "Show More"}
              </button>

              {showMore && (
                <div className="overlay-scroll">
                  <h4>Completed Chapters</h4>
                  {completedChapters.length > 0 ? (
                    completedChapters.map((ch, i) => (
                      <div key={i} className="chapter-item completed">
                        <FaCheckCircle className="chapter-icon completed-icon" />
                        <span>{ch}</span>
                      </div>
                    ))
                  ) : (
                    <p>No chapters completed yet.</p>
                  )}

                  <h4 style={{ marginTop: "10px" }}>Locked Chapters</h4>
                  {lockedChapters.length > 0 ? (
                    lockedChapters.map((ch, i) => (
                      <div key={i} className="chapter-item locked">
                        <FaLock className="chapter-icon locked-icon" />
                        <span>{ch}</span>
                      </div>
                    ))
                  ) : (
                    <p>All chapters unlocked!</p>
                  )}
                </div>
              )}
            </div>

            {/* Tests Section */}
            <div className="tests-section">
              <div className="section-header">
                <h3>Tests</h3>
                <span className="duration">40 min</span>
              </div>

              <div className="stats">
                <div className="stat">
                  <h1>0</h1>
                  <p>Average Score</p>
                </div>
                <div className="stat">
                  <div className="attendance-bar"></div>
                  <p>Attendance</p>
                </div>

                <div className="test-card">
                  <h4>Algorithms</h4>
                  <p>40 min theory test</p>
                  <div className="test-icons">
                    <div className="icon-circle">▶</div>
                    <div className="icon-circle group">👥</div>
                  </div>
                </div>
              </div>
              <p className="tests-footer">2 more this week</p>
            </div>

            {/* Completed Questionnaires */}
            <div className="next-classes">
              <div className="section-header">
                <h3>Completed Questionnaires</h3>
                <span className="count">{completedChapters.length}</span>
              </div>

              <div className="overlay-scroll">
                {completedChapters.length > 0 ? (
                  completedChapters.map((chapter, index) => (
                    <div key={index} className="class-card green">
                      <div className="class-icon">✅</div>
                      <div className="class-info">
                        <h4>{chapter} Questionnaire Completed</h4>
                      </div>
                    </div>
                  ))
                ) : (
                  <p style={{ marginTop: "10px", color: "#888" }}>
                    No questionnaires completed yet.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ===== Timetable Section ===== */}
          <div className="timetable-section">
            <div className="timetable-header">
              <h3>Timetable</h3>
            </div>

            <div className="timetable-cards">
              <FaArrowLeft onClick={handlePrev} className="arrow-btn" />

              {displayedDays.map((day, i) => {
                const isActive = selectedDay?.dateKey === day.dateKey;
                const completedCount = dailyCompletion[day.dateKey] || 0;

                return (
                  <div
                    key={i}
                    className={`day-card 
                      ${isActive ? "active" : ""} 
                      ${day.isToday ? "today" : ""}`}
                    onClick={() => handleDayClick(day)}
                  >
                    <h4>{day.dateNum}</h4>
                    <p>
                      {day.month} <br /> {day.weekday}
                    </p>

                    {day.isToday && <span className="today-badge">Today</span>}

                    {isActive && (
                      <div className="day-status">
                        {completedCount > 0
                          ? `You’ve completed ${completedCount} chapters`
                          : "No chapters completed"}
                      </div>
                    )}
                  </div>
                );
              })}

              <FaArrowRight onClick={handleNext} className="arrow-btn" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardContent;
