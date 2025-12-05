// LMS/lms-frontend/src/pages/User_dashboard/DashboardContent.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./user.css";
import Sidebar from "./Sidebar/sidebar";
import { FaLock, FaCheckCircle, FaArrowLeft, FaArrowRight } from "react-icons/fa";
import { AUTH_API, ADMIN_API, DASHBOARD_API } from "../../config/apiConfig";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const UPLOADS_BASE = import.meta.env.VITE_UPLOADS_BASE;

const DashboardContent = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [coursesProgress, setCoursesProgress] = useState([]);
  const [dayOffset, setDayOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState(null);
  const [dailyCompletion, setDailyCompletion] = useState({});
  const [activeCourse, setActiveCourse] = useState(null);

  // Fetch user + courses progress
  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const resUser = await fetch(`${AUTH_API}/me`, { credentials: "include" });
        const userJson = await resUser.json();
        setUserData(userJson.user);

        const custom_id = userJson?.user?.profile?.custom_id;
        if (!custom_id) return;

        // Fetch course chapters progress
        const resCourses = await fetch(
          `${DASHBOARD_API}/chapters/progress/${custom_id}`,
          { credentials: "include" }
        );
        const jsonCourses = await resCourses.json();

        console.log("RAW COURSES RESPONSE:", jsonCourses);

        // Fetch backend progress (percentage)
        const resProgress = await fetch(
          `${DASHBOARD_API}/progress/${custom_id}`,
          { credentials: "include" }
        );
        const jsonProgress = await resProgress.json();

        // Create map: { course_id → progressPercent }
        const progressMap = {};
        if (Array.isArray(jsonProgress)) {
          jsonProgress.forEach((p) => {
            progressMap[Number(p.course_id)] = Number(p.progressPercent) || 0;
          });
        }

        // FIXED: Match backend output
        if (Array.isArray(jsonCourses.courses)) {
          const mergedCourses = (jsonCourses.courses || []).map((course) => ({
            ...course,
            progressPercent: progressMap[Number(course.course_id)] ?? 0,
            modules: (course.modules || []).map((m) => ({
              ...m,
              isCompleted: m.is_completed, // convert snake_case → camelCase
            })),
          }));

          setCoursesProgress(mergedCourses);
        }
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  // Fetch daily completion
  const fetchDayData = async (dateKey) => {
    try {
      const custom_id = userData?.profile?.custom_id;
      if (!custom_id) return;

      const res = await fetch(
        `${ADMIN_API}/student/${custom_id}/progress/day?date=${dateKey}`
      );
      const json = await res.json();
   const completedCount = Number(json.completed_chapters) || 0;

setDailyCompletion((prev) => ({
  ...prev,
  [dateKey]: completedCount,
}));

    } catch (err) {
      console.error("Error fetching day data:", err);
    }
  };

  // Automatically fetch completion counts for all displayed days
  useEffect(() => {
    if (!userData?.profile?.custom_id) return;

    displayedDays.forEach((day) => {
      if (dailyCompletion[day.dateKey] === undefined) {
        fetchDayData(day.dateKey);
      }
    });
  }, [userData, dayOffset]);

  // Timetable handlers
  const handlePrev = () => setDayOffset((prev) => prev - 5);
  const handleNext = () => setDayOffset((prev) => prev + 5);

  const getDisplayedDays = () => {
    const days = [];
    const todayStr = new Date().toLocaleDateString("en-CA");

    for (let offset = 0; offset < 5; offset++) {
      const dateObj = new Date();
      dateObj.setDate(dateObj.getDate() + dayOffset + offset);
      const dateKey = dateObj.toLocaleDateString("en-CA");
      days.push({
        dateNum: dateObj.getDate(),
        weekday: dateObj.toLocaleDateString("en-US", { weekday: "long" }),
        month: dateObj.toLocaleDateString("en-US", { month: "long" }),
        dateKey,
        isToday: dateKey === todayStr,
      });
    }
    return days;
  };

  const displayedDays = getDisplayedDays();

  const handleDayClick = (day) => {
    setSelectedDay(day);
    fetchDayData(day.dateKey);
  };

  if (loading) return <p>Loading user dashboard...</p>;

  const profile = userData?.profile || {};
  const fullName = profile.full_name || "User";
  const initial = fullName.charAt(0).toUpperCase();
  const imageUrl = profile.image_path
    ? `${UPLOADS_BASE}/${profile.image_path
        .replace(/\\/g, "/")
        .replace(/^uploads\//, "")}`
    : null;

  return (
    <div className="dashboard-wrapper">
      <Sidebar activeCourse={activeCourse} />
      <div className="dashboard-content">
        <div className="dashboard1-container">
          {/* Header */}
          <div className="header-card">
            <div className="user-infos">
              {imageUrl ? (
                <img src={imageUrl} alt="User" className="user-avatar-large" />
              ) : (
                <div className="user-avatar-initial">{initial}</div>
              )}
              <div>
                <h2>{fullName} 🎓</h2>
                <p style={{ fontSize: "0.9rem" }}>
                  {profile.user_email || userData?.email}
                </p>
              </div>
            </div>
          </div>

          {/* Courses Progress */}
          <div className="main-cards">
            {coursesProgress.length === 0 ? (
              <p>No enrolled courses found.</p>
            ) : (
              coursesProgress.map((course) => {
                const { course_id, course_name, modules = [], progressPercent } =
                  course;

                const totalModules = modules.length;
                const completedModules = modules.filter(
                  (m) => m.isCompleted
                ).length;
                const remainingModules = totalModules - completedModules;
                const moduleProgressPercent = progressPercent || 0;

                return (
                  <div
                    className="progress-card"
                    key={course_id}
                    onClick={() => setActiveCourse(course)}
                  >
                    <h3>{course_name}</h3>

                    <div className="progress-summary">
                      <p>📚 Total Modules: {totalModules}</p>
                      <p>✅ Completed Modules: {completedModules}</p>
                      <p>🔒 Remaining Modules: {remainingModules}</p>
                    </div>

                    <div className="overlay-scroll">
                      {modules.length > 0 ? (
                        modules.map((mod, i) => (
                          <div
                            key={i}
                            className={`chapter-item ${
                              mod.isCompleted ? "completed" : "locked"
                            }`}
                          >
                            {mod.isCompleted ? (
                              <FaCheckCircle className="chapter-icon completed-icon" />
                            ) : (
                              <FaLock className="chapter-icon locked-icon" />
                            )}
                            <span>{mod.module_name}</span>
                          </div>
                        ))
                      ) : (
                        <p>No modules found</p>
                      )}
                    </div>

                    <div className="card-bottom-row">
                      <div className="progress-bar-container-horizontal">
                        <div className="progress-bar-bg">
                          <div
                            className="progress-bar-fill"
                            style={{ width: `${moduleProgressPercent}%` }}
                          ></div>
                        </div>
                        <span className="progress-text">
                          {moduleProgressPercent}% completed
                        </span>
                      </div>

                      <button
                        className="start-learning-btn"
                        onClick={() => navigate(`/mycourse/${course_id}`)}
                      >
                        Start Learning
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Timetable */}
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
                    className={`day-card ${
                      isActive ? "active" : ""
                    } ${day.isToday ? "today" : ""}`}
                    onClick={() => handleDayClick(day)}
                  >
                    <h4>{day.dateNum}</h4>
                    <p>
                      {day.month} <br /> {day.weekday}
                    </p>
                    {day.isToday && (
                      <span className="today-badge">Today</span>
                    )}

                    <div className="day-status-mini">
                      {completedCount > 0
                        ? `${completedCount} completed`
                        : `0 completed`}
                    </div>

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
