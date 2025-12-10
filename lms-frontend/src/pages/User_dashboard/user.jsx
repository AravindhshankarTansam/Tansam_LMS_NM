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
  const [currentPage, setCurrentPage] = useState(1);
const coursesPerPage = 3;

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

        // Merge courses with progress
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

  // Fetch daily completion for a specific date
  const fetchDayData = async (dateKey) => {
    try {
      const custom_id = userData?.profile?.custom_id;
      if (!custom_id || !dateKey) return;

      const res = await fetch(
        `${ADMIN_API}/student/${custom_id}/progress/day?date=${dateKey}`,
        { credentials: "include" }
      );

      const json = await res.json();

      // Store only total_completed_modules
      setDailyCompletion((prev) => ({
        ...prev,
        [dateKey]: {
          total_completed_modules: json.completed_modules || 0,
        },
      }));
    } catch (err) {
      console.error("Error fetching day data:", err);
    }
  };

  // Automatically fetch completion counts for all displayed days (kept as is)
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
  // Pagination logic
const indexOfLastCourse = currentPage * coursesPerPage;
const indexOfFirstCourse = indexOfLastCourse - coursesPerPage;
const currentCourses = coursesProgress.slice(indexOfFirstCourse, indexOfLastCourse);

const totalPages = Math.ceil(coursesProgress.length / coursesPerPage);

// Generate page numbers (e.g., 1 2 3 ... 10)
const getPageNumbers = () => {
  const pages = [];
  const maxVisible = 5;

  if (totalPages <= maxVisible) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    if (currentPage <= 3) {
      for (let i = 1; i <= 4; i++) pages.push(i);
      pages.push("...");
      pages.push(totalPages);
    } else if (currentPage >= totalPages - 2) {
      pages.push(1);
      pages.push("...");
      for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      pages.push("...");
      for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
      pages.push("...");
      pages.push(totalPages);
    }
  }
  return pages;
};

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
) : currentCourses.length === 0 ? (
  <p>No courses on this page.</p>
) : (
  currentCourses.map((course) => {
    const { course_id, course_name, modules = [], progressPercent } = course;

    const totalModules = modules.length;
    const completedModules = modules.filter((m) => m.isCompleted).length;
    const remainingModules = totalModules - completedModules;

    return (
      <div
        className="progress-card"
        key={course_id}
        onClick={() => setActiveCourse(course)}
      >
        <h3>{course_name}</h3>

        <div className="progress-summary">
          <p>Total Modules: {totalModules}</p>
          <p>Completed Modules: {completedModules}</p>
          <p>Remaining Modules: {remainingModules}</p>
        </div>

        <div className="overlay-scroll">
          {modules.length > 0 ? (
            modules.map((mod, i) => (
              <div
                key={i}
                className={`chapter-item ${mod.isCompleted ? "completed" : "locked"}`}
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
                style={{ width: `${progressPercent || 0}%` }}
              ></div>
            </div>
            <span className="progress-text">{progressPercent || 0}% completed</span>
          </div>

          <button
            className="start-learning-btn"
            onClick={(e) => {
              e.stopPropagation(); // prevent card click
              navigate(`/mycourse/${course_id}`);
            }}
          >
            Start Learning
          </button>
        </div>
      </div>
    );
  })
)}
          </div>
        {coursesProgress.length > coursesPerPage && (
  <div className="pagination">
    <button
      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
      disabled={currentPage === 1}
      className="pagination-btn"
    >
      Prev
    </button>

    {getPageNumbers().map((page, index) =>
      page === "..." ? (
        <span key={index} className="pagination-dots">...</span>
      ) : (
        <button
          key={index}
          onClick={() => setCurrentPage(page)}
          className={`page-box ${currentPage === page ? "active" : ""}`}
        >
          {page}
        </button>
      )
    )}

    <button
      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
      disabled={currentPage === totalPages}
      className="pagination-btn"
    >
      Next
    </button>
  </div>
)}

          {/* Timetable */}
          <div className="timetable-section">
            <div className="timetable-header">
              <h3>Timetable</h3>
            </div>

            <div className="timetable-cards">
              <FaArrowLeft onClick={handlePrev} className="arrow-btn" />

              {displayedDays.map((day, i) => {
                const isActive = selectedDay?.dateKey === day.dateKey;

                return (
                  <div
                    key={i}
                    className={`day-card ${isActive ? "active" : ""} ${day.isToday ? "today" : ""}`}
                    onClick={() => handleDayClick(day)}
                  >
                    <h4>{day.dateNum}</h4>
                    <p>
                      {day.month} <br /> {day.weekday}
                    </p>
                    {day.isToday && <span className="today-badge">Today</span>}

                    {/* Mini completion count: only for selected day */}
                    {isActive && (
                      <div className="day-status-mini">
                        {dailyCompletion[day.dateKey]?.total_completed_modules > 0 ? (
                          <span className="text-green-400 font-bold">
                            {dailyCompletion[day.dateKey].total_completed_modules} module
                            {dailyCompletion[day.dateKey].total_completed_modules > 1 ? "s" : ""} completed
                          </span>
                        ) : (
                          "0 completed"
                        )}
                      </div>
                    )}

                    {/* Expanded completion view */}
                    {isActive && (
                      <div className="day-status-expanded mt-4">
                        {dailyCompletion[day.dateKey]?.total_completed_modules > 0 ? (
                          <div className="text-center">
                            <div className="text-2xl mb-3 animate-bounce inline-block">🏆</div>
                            <div className="text-lg font-bold text-yellow-300">Congratulations!</div>
                            <div className="text-xl mt-2 text-green-300">
                              You completed {dailyCompletion[day.dateKey].total_completed_modules} module
                              {dailyCompletion[day.dateKey].total_completed_modules > 1 ? "s" : ""} today!
                            </div>
                          </div>
                        ) : (
                          <div className="text-center text-gray-400">No modules completed today</div>
                        )}
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
