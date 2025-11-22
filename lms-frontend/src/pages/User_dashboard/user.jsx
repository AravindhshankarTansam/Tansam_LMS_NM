// LMS/lms-frontend/src/pages/User_dashboard/DashboardContent.jsx
import React, { useEffect, useState } from "react";
import "./user.css";
import Sidebar from "./Sidebar/sidebar";
import { FaLock, FaCheckCircle, FaArrowLeft, FaArrowRight } from "react-icons/fa";
// ✅ Import PDF
// import InstructionsPDF from "../../assets/Instructions_for_Doctors_LMS.pdf";
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


  const ITEMS_PER_PAGE = 5;
const [chapterPage, setChapterPage] = useState(0);
const [questionnairePage, setQuestionnairePage] = useState(0);


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
      const course_id = 1; // ⭐ If dynamic, replace with actual course_id

      if (!custom_id) return;

     

      // -------------------------------------------------------------------------------------
      // ⭐⭐⭐ FETCH LIVE PROGRESS FROM BACKEND — REPLACE LOCALSTORAGE ⭐⭐⭐
      // -------------------------------------------------------------------------------------

      const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

      // 2️⃣ Completed chapters for today
      // const completedRes = await fetch(
      //   `http://localhost:5000/api/admin/student/${custom_id}/progress/day?date=${today}`
      // );
      const completedJson = await completedRes.json();

      const completedChaptersList = completedJson.completed_chapters || [];

      // Extract completed chapter names for UI
      const completedNames = completedChaptersList.map(
        (ch) => `Chapter ${ch.chapter_id} - ${ch.chapter_name}`
      );

      setCompletedChapters(completedNames);

      // 3️⃣ Remaining chapters
      // const remRes = await fetch(
      //   `http://localhost:5000/api/admin/student/${custom_id}/remaining-chapters?course_id=${course_id}`
      // );
      const remJson = await remRes.json();

      const remainingChaptersList = remJson.remaining_chapters || [];

      const remainingNames = remainingChaptersList.map(
        (ch) => `Chapter ${ch.chapter_id} - ${ch.chapter_name}`
      );

      setLockedChapters(remainingNames);

      // 4️⃣ Set progress percentage (dynamic)
      const totalChapters = completedNames.length + remainingNames.length;
      const progressPercent =
        totalChapters > 0
          ? Math.round((completedNames.length / totalChapters) * 100)
          : 0;

      setProgress(progressPercent);

      // 5️⃣ Day-wise completion count (for timetable)
      const daily = {};
completedChaptersList.forEach((ch) => {
  const localDate = new Date(ch.attempted_date)
    .toLocaleDateString("en-CA"); // YYYY-MM-DD (correct local date)

  daily[localDate] = (daily[localDate] || 0) + 1;
});

setDailyCompletion(daily);


    } catch (err) {
      console.error("Error fetching user dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  fetchData();


    // Local quiz progress tracking
    // const savedScores = JSON.parse(localStorage.getItem("quizScores")) || {};
    // const savedDates = JSON.parse(localStorage.getItem("quizDates")) || {};
    // const completed = [];
    // const locked = [];
    // const daily = {};

    // for (let i = 1; i <= 50; i++) {
    //   if (savedScores[i] >= 60) {
    //     completed.push(`Chapter ${i}`);
    //     const date = savedDates[i] || new Date().toLocaleDateString();
    //     daily[date] = (daily[date] || 0) + 1;
    //   } else {
    //     locked.push(`Chapter ${i}`);
    //   }
    // }

    // const progressPercent = Math.round((completed.length / 50) * 100);
    // setCompletedChapters(completed);
    // setLockedChapters(locked);
    // setProgress(progressPercent);
    // setDailyCompletion(daily);
  }, []);
  const fetchDayData = async (dateKey) => {
  try {
    const custom_id = userData?.profile?.custom_id;
    if (!custom_id) return;

    // const res = await fetch(
    //   `http://localhost:5000/api/admin/student/${custom_id}/progress/day?date=${dateKey}`
    // );

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
  const todayStr = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD
  for (let offset = 0; offset < 5; offset++) {
    const dateObj = new Date();
    dateObj.setDate(dateObj.getDate() + dayOffset + offset);
    const dateNum = dateObj.getDate();
    const weekday = dateObj.toLocaleDateString("en-US", { weekday: "long" });
    const month = dateObj.toLocaleDateString("en-US", { month: "long" });
    const dateKey = dateObj.toLocaleDateString("en-CA"); // use YYYY-MM-DD
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
             {/* ===== Notification Section ===== */}

          {/* ===== Header Section ===== */}
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
                {/* ✅ Updated to show names */}
             
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
       {/* ===== Main Row ===== */}
{/* ===== Main Cards ===== */}
<div className="main-cards">
  {/* ===== Your Course Progress Card ===== */}
  <div className="progress-card">
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

{/* Pagination Controls */}
{completedChapters.length > ITEMS_PER_PAGE && (
  <div className="pagination-controls">
    <button onClick={() => setChapterPage(prev => Math.max(prev - 1, 0))} disabled={chapterPage === 0}>◀</button>
    <span>Page {chapterPage + 1} of {Math.ceil(completedChapters.length / ITEMS_PER_PAGE)}</span>
    <button onClick={() => setChapterPage(prev => Math.min(prev + 1, Math.ceil(completedChapters.length / ITEMS_PER_PAGE) - 1))} disabled={chapterPage >= Math.ceil(completedChapters.length / ITEMS_PER_PAGE) - 1}>▶</button>
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

  {/* ===== Completed Questionnaires Card ===== */}
  {/* <div className="questionnaire-card">
    <h3>Completed Questionnaires</h3>
    <p style={{ marginBottom: "10px", color: "#444", fontSize: "14px" }}>
      Total quizzes completed: {completedChapters.length}
    </p>

    <div className="overlay-scroll">
     {completedChapters.length > 0 ? (
  completedChapters
    .slice(questionnairePage * ITEMS_PER_PAGE, (questionnairePage + 1) * ITEMS_PER_PAGE)
    .map((chapter, index) => (
      <div key={index} className="chapter-item completed-questionnaire">
        <FaCheckCircle className="chapter-icon completed-icon" />
        <span>{chapter} Questionnaire Completed</span>
      </div>
    ))
) : (
  <p>No questionnaires completed yet.</p>
)}


{completedChapters.length > ITEMS_PER_PAGE && (
  <div className="pagination-controls">
    <button onClick={() => setQuestionnairePage(prev => Math.max(prev - 1, 0))} disabled={questionnairePage === 0}>◀</button>
    <span>Page {questionnairePage + 1} of {Math.ceil(completedChapters.length / ITEMS_PER_PAGE)}</span>
    <button onClick={() => setQuestionnairePage(prev => Math.min(prev + 1, Math.ceil(completedChapters.length / ITEMS_PER_PAGE) - 1))} disabled={questionnairePage >= Math.ceil(completedChapters.length / ITEMS_PER_PAGE) - 1}>▶</button>
  </div>
)}

    </div>
  </div> */}
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