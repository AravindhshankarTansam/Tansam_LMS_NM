// LMS/lms-frontend/src/pages/User_dashboard/DashboardContent.jsx
import React, { useEffect, useState } from "react";
import "./user.css";
import Sidebar from "./Sidebar/sidebar";
import { FaLock, FaCheckCircle, FaArrowLeft, FaArrowRight } from "react-icons/fa";

const DashboardContent = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completedChapters, setCompletedChapters] = useState([]);
  const [lockedChapters, setLockedChapters] = useState([]);
  const [progress, setProgress] = useState(0);
  const [dayOffset, setDayOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState(null);
  const [dailyCompletion, setDailyCompletion] = useState({});

  const ITEMS_PER_PAGE = 5;
  const [chapterPage, setChapterPage] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1️⃣ Fetch user session
        const resUser = await fetch("http://localhost:5000/api/auth/me", {
          method: "GET",
          credentials: "include",
        });

        const userJson = await resUser.json();
        setUserData(userJson.user);

        const custom_id = userJson?.user?.profile?.custom_id;
        const course_id = userJson?.user?.course_id || 1; // fallback
        console.log("Custom ID:", custom_id, "Course ID:", course_id);

        if (!custom_id) return;

        // 2️⃣ Fetch remaining chapters from API
        const remRes = await fetch(
          `http://localhost:5000/api/admin/student/${custom_id}/remaining-chapters?course_id=${course_id}`
        );
        const remJson = await remRes.json();
        const remainingChaptersList = remJson.remaining_chapters || [];
        const remainingNames = remainingChaptersList.map(
          (ch) => `Chapter ${ch.chapter_id} - ${ch.chapter_name}`
        );
        setLockedChapters(remainingNames);

        // 3️⃣ Fetch all chapters for this course (assume API or static list)
        // If you have an API to fetch all course chapters, replace below static list
        const totalChaptersList = [
          ...remainingChaptersList, // include remaining chapters
          // Add previously completed chapters manually or via API
          { chapter_id: 3, chapter_name: "Intro" } // example
        ];

        // 4️⃣ Compute completed chapters = total - remaining
        const completedList = totalChaptersList.filter(
          (ch) => !remainingChaptersList.some((r) => r.chapter_id === ch.chapter_id)
        );
        const completedNames = completedList.map(
          (ch) => `Chapter ${ch.chapter_id} - ${ch.chapter_name}`
        );
        setCompletedChapters(completedNames);

        // 5️⃣ Compute progress
        const totalChaptersCount = totalChaptersList.length;
        const progressPercent =
          totalChaptersCount > 0
            ? Math.round((completedNames.length / totalChaptersCount) * 100)
            : 0;
        setProgress(progressPercent);

        // 6️⃣ Compute daily completion from completed chapters
        const daily = {};
        completedList.forEach((ch) => {
          // Use attempted_date if available; otherwise skip
          if (ch.attempted_date) {
            const localDate = new Date(ch.attempted_date).toLocaleDateString("en-CA");
            daily[localDate] = (daily[localDate] || 0) + 1;
          }
        });
        setDailyCompletion(daily);
      } catch (err) {
        console.error("Error fetching user dashboard:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const fetchDayData = async (dateKey) => {
    try {
      const custom_id = userData?.profile?.custom_id;
      const course_id = userData?.course_id || 1;
      if (!custom_id) return;

      const res = await fetch(
        `http://localhost:5000/api/admin/student/${custom_id}/progress/day?date=${dateKey}`
      );
      const json = await res.json();
      const completedList = json.completed_chapters || [];

      setDailyCompletion((prev) => ({
        ...prev,
        [dateKey]: completedList.length,
      }));
    } catch (error) {
      console.error("Error fetching day data:", error);
    }
  };

  const profile = userData?.profile || {};
  const handlePrev = () => setDayOffset((prev) => prev - 5);
  const handleNext = () => setDayOffset((prev) => prev + 5);

  const getDisplayedDays = () => {
    const days = [];
    const todayStr = new Date().toLocaleDateString("en-CA");
    for (let offset = 0; offset < 5; offset++) {
      const dateObj = new Date();
      dateObj.setDate(dateObj.getDate() + dayOffset + offset);
      const dateNum = dateObj.getDate();
      const weekday = dateObj.toLocaleDateString("en-US", { weekday: "long" });
      const month = dateObj.toLocaleDateString("en-US", { month: "long" });
      const dateKey = dateObj.toLocaleDateString("en-CA");
      const isToday = dateKey === todayStr;
      days.push({ dateNum, weekday, month, dateKey, isToday });
    }
    return days;
  };

  const displayedDays = getDisplayedDays();
  const handleDayClick = (day) => {
    setSelectedDay(day);
    fetchDayData(day.dateKey);
  };

  if (loading) return <p>Loading user dashboard...</p>;

  return (
    <div className="dashboard-wrapper">
      <Sidebar />
      <div className="dashboard-content">
        <div className="dashboard1-container">
          {/* Header */}
          <div className="header-card">
            <div className="user-infos">
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
                <p style={{ fontSize: "0.9rem" }}>{profile.user_email || userData?.email}</p>
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

          {/* Progress Cards */}
          <div className="main-cards">
            <div className="progress-card">
              <h3>Your Course Progress</h3>
              <div className="progress-bar-container">
                <div className="progress-bar-bg">
                  <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
                </div>
                <span className="progress-text">{progress}% completed</span>
              </div>
              <div className="progress-summary">
                <p>✅ Completed Chapters: {completedChapters.length}</p>
                <p>🔒 Locked Chapters: {lockedChapters.length}</p>
              </div>
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
                    <button
                      onClick={() => setChapterPage((prev) => Math.max(prev - 1, 0))}
                      disabled={chapterPage === 0}
                    >
                      ◀
                    </button>
                    <span>
                      Page {chapterPage + 1} of {Math.ceil(completedChapters.length / ITEMS_PER_PAGE)}
                    </span>
                    <button
                      onClick={() =>
                        setChapterPage((prev) =>
                          Math.min(prev + 1, Math.ceil(completedChapters.length / ITEMS_PER_PAGE) - 1)
                        )
                      }
                      disabled={chapterPage >= Math.ceil(completedChapters.length / ITEMS_PER_PAGE) - 1}
                    >
                      ▶
                    </button>
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
            </div>
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
                    className={`day-card ${isActive ? "active" : ""} ${day.isToday ? "today" : ""}`}
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
