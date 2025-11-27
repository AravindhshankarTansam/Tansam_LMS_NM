// LMS/lms-frontend/src/pages/User_dashboard/DashboardContent.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./user.css";
import Sidebar from "./Sidebar/sidebar";
import { FaLock, FaCheckCircle, FaArrowLeft, FaArrowRight } from "react-icons/fa";
import { AUTH_API, ADMIN_API } from "../../config/apiConfig";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const UPLOADS_BASE = import.meta.env.VITE_UPLOADS_BASE;
const ITEMS_PER_PAGE = 5;

const DashboardContent = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [coursesProgress, setCoursesProgress] = useState([]);
  const [chapterPages, setChapterPages] = useState({});
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

        const resCourses = await fetch(`${API_BASE}/dashboard/chapters/progress/${custom_id}`);
        const jsonCourses = await resCourses.json();

        if (jsonCourses.success) {
          setCoursesProgress(jsonCourses.data || []);
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

      const res = await fetch(`${ADMIN_API}/student/${custom_id}/progress/day?date=${dateKey}`);
      const json = await res.json();
      const completedList = json.completed_chapters || [];

      setDailyCompletion((prev) => ({
        ...prev,
        [dateKey]: completedList.length,
      }));
    } catch (err) {
      console.error("Error fetching day data:", err);
    }
  };

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

  const handleChapterPage = (courseId, direction) => {
    setChapterPages((prev) => {
      const currentPage = prev[courseId] || 0;
      const watchedChapters = coursesProgress.find(c => c.course_id === courseId)?.watchedChapters || 0;
      const maxPage = Math.ceil(watchedChapters / ITEMS_PER_PAGE) - 1;
      const newPage = direction === "prev" ? Math.max(currentPage - 1, 0) : Math.min(currentPage + 1, maxPage);
      return { ...prev, [courseId]: newPage };
    });
  };

  if (loading) return <p>Loading user dashboard...</p>;

  const profile = userData?.profile || {};
  const fullName = profile.full_name || "User";
  const initial = fullName.charAt(0).toUpperCase();
  const imageUrl = profile.image_path
    ? `${UPLOADS_BASE}/${profile.image_path.replace(/\\/g, "/").replace(/^uploads\//, "")}`
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
                <p style={{ fontSize: "0.9rem" }}>{profile.user_email || userData?.email}</p>
              </div>
            </div>
            <div className="stats">
              {/* <div className="stat">
                <h1>0</h1>
                <p>Average Score</p>
              </div> */}
            </div>
            {/* <div className="all-stats-btn">All Stats</div> */}
          </div>

          {/* Courses Progress */}
          <div className="main-cards">
            {coursesProgress.length === 0 ? (
              <p>No enrolled courses found.</p>
            ) : (
              coursesProgress.map((course) => {
                const {
                  course_id,
                  course_name,
                  totalChapters = 0,
                  watchedChapters = 0,
                  remainingChapters = 0,
                  completedChapters = [],  // Array of chapter names from backend
                  lockedChapters = []      // Array of remaining chapter names
                } = course;

                const progressPercent = totalChapters ? Math.round((watchedChapters / totalChapters) * 100) : 0;
                const chapterPage = chapterPages[course_id] || 0;

                return (
                  <div
                    className="progress-card"
                    key={course_id}
                    onClick={() => setActiveCourse(course)}
                  >
                    <h3>{course_name}</h3>

                    {/* Stats */}
                    <div className="progress-summary">
                      <p>📘 Total Chapters: {totalChapters}</p>
                      <p>✅ Completed Chapters: {watchedChapters}</p>
                      <p>🔒 Remaining Chapters: {remainingChapters}</p>
                    </div>

                    {/* Completed / Locked Chapters */}
                    <div className="overlay-scroll">
                      <h4>Completed Chapters</h4>
                      {completedChapters.length > 0 ? (
                        completedChapters
                          .slice(chapterPage * ITEMS_PER_PAGE, (chapterPage + 1) * ITEMS_PER_PAGE)
                          .map((ch, i) => (
                            <div key={i} className="chapter-item completed">
                              <FaCheckCircle className="chapter-icon completed-icon" />
                              <span>{ch}</span>
                            </div>
                          ))
                      ) : (
                        <p>No chapters completed yet.</p>
                      )}

                      {completedChapters.length > ITEMS_PER_PAGE && (
                        <div className="pagination-controls">
                          <button onClick={() => handleChapterPage(course_id, "prev")} disabled={chapterPage === 0}>◀</button>
                          <span>Page {chapterPage + 1} of {Math.ceil(completedChapters.length / ITEMS_PER_PAGE)}</span>
                          <button onClick={() => handleChapterPage(course_id, "next")} disabled={chapterPage >= Math.ceil(completedChapters.length / ITEMS_PER_PAGE) - 1}>▶</button>
                        </div>
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

                    {/* Horizontal Progress + Start Button at the bottom */}
                    <div className="card-bottom-row">
                      <div className="progress-bar-container-horizontal">
                        <div className="progress-bar-bg">
                          <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }}></div>
                        </div>
                        <span className="progress-text">{progressPercent}% completed</span>
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
            <div className="timetable-header"><h3>Timetable</h3></div>
            <div className="timetable-cards">
              <FaArrowLeft onClick={handlePrev} className="arrow-btn" />
              {displayedDays.map((day, i) => {
                const isActive = selectedDay?.dateKey === day.dateKey;
                const completedCount = dailyCompletion[day.dateKey] || 0;
                return (
                  <div key={i} className={`day-card ${isActive ? "active" : ""} ${day.isToday ? "today" : ""}`} onClick={() => handleDayClick(day)}>
                    <h4>{day.dateNum}</h4>
                    <p>{day.month} <br /> {day.weekday}</p>
                    {day.isToday && <span className="today-badge">Today</span>}
                    {isActive && (
                      <div className="day-status">
                        {completedCount > 0 ? `You’ve completed ${completedCount} chapters` : "No chapters completed"}
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
