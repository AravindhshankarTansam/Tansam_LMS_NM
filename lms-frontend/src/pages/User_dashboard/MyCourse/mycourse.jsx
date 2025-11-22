import React, { useState, useRef, useEffect } from "react";
import "./mycourse.css";
import Sidebar from "../Sidebar/sidebar";
import { useNavigate, useParams } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { useLocation } from "react-router-dom";
import {
  CheckCircle,
  Circle,
  ChevronDown,
  ChevronUp,
  FileText,
  Image as ImageIcon,
  FileType
} from "lucide-react";
import { Worker, Viewer } from "@react-pdf-viewer/core";
import "@react-pdf-viewer/core/lib/styles/index.css";
import mammoth from "mammoth";

import certificateImg from "../../../assets/certificate.jpeg";
import {
  COURSE_API,
  MODULE_API,
  CHAPTER_API,
  QUIZ_API,
  PROGRESS_API,
} from "../../../config/apiConfig";

const MyCourse = () => {
  const navigate = useNavigate();
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [chapters, setChapters] = useState({});
  const [quizzes, setQuizzes] = useState({});
  const [lessons, setLessons] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [completed, setCompleted] = useState(new Set());
  const [enabledLessons, setEnabledLessons] = useState(new Set());
  const [activeLesson, setActiveLesson] = useState("");
  const [loading, setLoading] = useState(true);
  const [showCertificate, setShowCertificate] = useState(false);
  const videoRef = useRef(null);
  const [pptSlides, setPptSlides] = useState([]);
  const [docHtml, setDocHtml] = useState("");
  const [customId, setCustomId] = useState("");
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("overview");


  /** Fetch course info */
const fetchCourse = async () => {
  try {
    const res = await fetch("http://localhost:5000/api/dashboard/courses", {
      credentials: "include",
    });
    const data = await res.json();

    if (res.ok && Array.isArray(data)) {
      const selectedCourse = data.find((c) => c.course_id === Number(courseId));
      if (selectedCourse) {
        setCourse(selectedCourse);
      } else {
        toast.error("Course not found");
      }
    } else {
      toast.error("Failed to load courses");
    }
  } catch (err) {
    console.error("Fetch course error:", err);
    toast.error("Failed to load courses");
  }
};

  /** Fetch modules */
  const fetchModules = async () => {
    try {
      const res = await fetch(`${MODULE_API}/${courseId}`, { credentials: "include" });
      const data = await res.json();
      setModules(data);

      const expandedMap = {};
      data.forEach((m) => {
        expandedMap[`module${m.module_id}`] = true;
        fetchChapters(m.module_id);
      });
      setExpanded(expandedMap);
    } catch (err) {
      console.error(err);
    }
  };

  /** Fetch chapters */
  const fetchChapters = async (moduleId) => {
    try {
      const res = await fetch(`${CHAPTER_API}/${moduleId}`, { credentials: "include" });
      const data = await res.json();
      const mappedData = data.map((chap) => ({
        ...chap,
        materials_json: chap.materials || []
      }));
      setChapters((prev) => ({ ...prev, [moduleId]: mappedData }));
      mappedData.forEach((chap) => fetchQuizzes(chap.chapter_id));
    } catch (err) {
      console.error(err);
    }
  };

  /** Fetch quizzes */
  const fetchQuizzes = async (chapterId) => {
    try {
      const res = await fetch(`${QUIZ_API}/${chapterId}`, { credentials: "include" });
      const data = await res.json();
      setQuizzes((prev) => ({ ...prev, [chapterId]: data }));
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCustomId = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/auth/me", {
        credentials: "include"
      });
      const data = await res.json();
      if (res.ok && data?.user?.profile?.custom_id) {
        setCustomId(data.user.profile.custom_id);
      }
    } catch (err) {
      console.error("Failed to fetch custom_id", err);
    }
  };

  /** Fetch progress from server and set completed set */
  /** Fetch progress from server and set completed set */
const fetchProgress = async () => {
  if (!customId || lessons.length === 0) return;

  try {
    const res = await fetch(`${PROGRESS_API}/${customId}`, {
      credentials: "include",
    });
    const data = await res.json();

    // Find progress for this specific course
    const courseProgressEntry = Array.isArray(data)
      ? data.find((p) => p.course_id === Number(courseId))
      : null;
    const courseProgress = courseProgressEntry?.progress_percent || 0;

    // Filter lessons that count toward progress (non-quiz and quiz)
    const progressLessons = lessons.filter((l) => l.countForProgress);
    const total = progressLessons.length;

    // Calculate completed count using Math.round for better accuracy
    const completedCount = Math.round((courseProgress / 100) * total);

    // Mark the first completedCount as completed (sequential assumption)
    const completedSet = new Set();
    for (let i = 0; i < Math.min(completedCount, total); i++) {
      completedSet.add(progressLessons[i].key);
    }
    setCompleted(completedSet);

    // Enable up to the next lesson (or all if complete)
    const enableCount = completedCount < total ? completedCount + 1 : total;
    const enabledSet = new Set();
    for (let i = 0; i < enableCount; i++) {
      enabledSet.add(progressLessons[i].key);
    }
    setEnabledLessons(enabledSet);
  } catch (err) {
    console.error("Failed to fetch progress", err);
    toast.error("Failed to fetch progress");
  }
};

  /** Build lessons list */
  const buildLessons = () => {
    const list = [];
    modules.forEach((mod) => {
      const modChaps = chapters[mod.module_id] || [];
      modChaps.forEach((chap) => {
        chap.materials_json.forEach((mat, idx) => {
          list.push({
            key: `${chap.chapter_id}_mat${idx}`,
            title: `${mat.material_type?.toUpperCase() || ""}: ${chap.chapter_name}`,
            type: mat.material_type,
            src: mat.file_path,
            module_id: mod.module_id,
            chapter_id: chap.chapter_id,
            countForProgress: ["video", "pdf", "ppt", "doc", "image"].includes(mat.material_type)
          });
        });

        const chapQuizzes = quizzes[chap.chapter_id] || [];
        if (chapQuizzes.length) {
          list.push({
            key: `${chap.chapter_id}_quiz`,
            title: "Quiz",
            type: "quiz",
            module_id: mod.module_id,
            chapter_id: chap.chapter_id,
            countForProgress: true
          });
        }
      });
    });

    setLessons(list);
    if (list.length > 0) {
      // keep previously enabled lessons if any, otherwise enable first
      setEnabledLessons((prev) => {
        if (prev && prev.size > 0) return prev;
        return new Set([list[0].key]);
      });
    }
  };

  /** Mark lesson complete (fixed: compute newCompleted before using it) */
  const markLessonComplete = async (lessonKey) => {
    const lesson = lessons.find((l) => l.key === lessonKey);
    if (!lesson) return;
    if (!customId) return;

    // Build new completed set synchronously
    const newCompleted = new Set(Array.from(completed));
    newCompleted.add(lessonKey);
    setCompleted(newCompleted);

    // enable next lesson
    const idx = lessons.findIndex((l) => l.key === lessonKey);
    if (idx + 1 < lessons.length) {
      setEnabledLessons((prev) => new Set([...Array.from(prev || []), lessons[idx + 1].key]));
    }

    const progressLessons = lessons.filter((l) => l.countForProgress);
    // compute completed count from newCompleted
    const completedCount = Array.from(newCompleted).filter((c) =>
      progressLessons.some((l) => l.key === c)
    ).length;
    // percent based on actual completed items
    const progressPercent = progressLessons.length > 0
      ? Math.round((completedCount / progressLessons.length) * 100)
      : 0;

    try {
      await fetch(`${PROGRESS_API}/${customId}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          custom_id: customId,
          course_id: courseId,
          module_id: lesson.module_id,
          chapter_id: lesson.chapter_id,
          progress_percent: progressPercent
        })
      });
    } catch (err) {
      console.error("Failed to update progress", err);
    }
  };

  /** Handle lesson click */
  const handleLessonClick = (lessonKey, type) => {
    if (!enabledLessons.has(lessonKey)) return;

    const lesson = lessons.find((l) => l.key === lessonKey);
    if (!lesson) return;

    if (type === "quiz") {
      // navigate to quiz — pass courseId and chapterId
      navigate(`/quiz/${lesson.chapter_id}`, { state: { courseId, chapterId: lesson.chapter_id } });
      return;
    }

    setActiveLesson(lessonKey);
  };

  /** Load all data */
  useEffect(() => {
    fetchCustomId();
  }, []);

  useEffect(() => {
    if (!customId) return; // wait until custom ID is ready

    const loadData = async () => {
      setLoading(true);
      await fetchCourse();
      await fetchModules();
      // fetchProgress will be called after lessons built (see next effect)
      setLoading(false);
    };

    loadData();
  }, [customId, courseId]);

  // when modules/chapters/quizzes change -> build lessons
  useEffect(() => {
    if (modules.length > 0 && Object.keys(chapters).length > 0) {
      buildLessons();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modules, chapters, quizzes]);

  // AFTER lessons are built and customId available, fetch progress from server
  useEffect(() => {
    if (customId && lessons.length > 0) {
      fetchProgress();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customId, lessons]);

  /** Load PPT/DocX/PDF content */
  useEffect(() => {
    const lesson = lessons.find((l) => l.key === activeLesson);
    if (!lesson) return;

    const fileUrl = `http://localhost:5000/${lesson.src}`;
    const fileExt = lesson.src?.split(".").pop().toLowerCase();

    if (lesson.type === "ppt" && fileExt === "pptx") {
      setPptSlides([`Preview of ${lesson.title}`]);
      setTimeout(() => markLessonComplete(activeLesson), 5000);
    }

    if (lesson.type === "doc" && fileExt === "docx") {
      const loadDoc = async () => {
        try {
          const response = await fetch(fileUrl);
          const arrayBuffer = await response.arrayBuffer();
          const result = await mammoth.extractRawText({ arrayBuffer });
          setDocHtml(result.value);
          setTimeout(() => markLessonComplete(activeLesson), 5000);
        } catch (err) {
          console.error("Failed to load DOC:", err);
        }
      };
      loadDoc();
    }

    if (lesson.type === "pdf" && fileExt === "pdf") {
      setTimeout(() => markLessonComplete(activeLesson), 5000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLesson, lessons]);

  /** Auto mark quiz complete if redirected from quiz page
   *  Accept both patterns:
   *   - { fromQuizSubmit: true, chapterId: ... }
   *   - { chapterUnlocked: ... } (used by your Quiz.jsx)
   */
  useEffect(() => {
    const fromQuizSubmit = location.state?.fromQuizSubmit;
    const chapterIdFromState = location.state?.chapterId || location.state?.chapterUnlocked;

    if (!chapterIdFromState) return;
    if (lessons.length === 0) return; // wait until lessons exist

    const quizLesson = lessons.find(
      (l) => l.type === "quiz" && l.chapter_id === Number(chapterIdFromState)
    );

    if (quizLesson && !completed.has(quizLesson.key)) {
      markLessonComplete(quizLesson.key);
    }
    // optional: clear history state so repeated mount doesn't re-trigger
    // window.history.replaceState({}, document.title);
  }, [location.state, lessons, completed, customId]);

  /** Render lesson content */
  const renderLessonContent = () => {
    const lesson = lessons.find((l) => l.key === activeLesson);
    if (!lesson) return <p>Select a lesson to start learning.</p>;

    const fileUrl = `http://localhost:5000/${lesson.src}`;

    switch (lesson.type) {
      case "video":
        return (
          <video
            ref={videoRef}
            width="100%"
            height="520"
            src={fileUrl}
            controls
            controlsList="nodownload noremoteplayback"
            onContextMenu={(e) => e.preventDefault()}
            onEnded={() => markLessonComplete(activeLesson)}
          />
        );
      case "ppt":
        return (
          <div style={{ padding: "20px" }}>
            {pptSlides.map((slide, idx) => (
              <div
                key={idx}
                style={{
                  height: "480px",
                  width: "100%",
                  marginBottom: "10px",
                  backgroundColor: "#f3f3f3",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "12px",
                  fontSize: "20px",
                }}
              >
                {slide}
              </div>
            ))}
          </div>
        );
      case "doc":
        return (
          <div
            style={{
              height: "520px",
              overflowY: "auto",
              padding: "15px",
              border: "1px solid #ccc",
              borderRadius: "12px",
              backgroundColor: "#f9f9f9",
            }}
          >
            {docHtml || "Loading document..."}
          </div>
        );
      case "pdf":
        return (
          <div style={{ height: "520px", width: "100%" }}>
            <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
              <Viewer fileUrl={fileUrl} />
            </Worker>
          </div>
        );
      case "image":
        return (
          <img
            src={fileUrl}
            alt={lesson.title}
            style={{ width: "100%", height: "520px", objectFit: "contain", borderRadius: "12px" }}
          />
        );
      default:
        return <p>Select a lesson to start learning.</p>;
    }
  };

  const progressLessons = lessons.filter((l) => l.countForProgress);
  const progressPercent = progressLessons.length
    ? Math.round((completed.size / progressLessons.length) * 100)
    : 0;

  if (loading) return <p>Loading course...</p>;

  return (
    <>
      <Sidebar />
      <ToastContainer />
      <div className="mycourse-container">
        <div className="mycourse-grid">
          <div className="left-section">
            <h1 className="course-title">{course?.course_name}</h1>
            <div className="video-player">{renderLessonContent()}</div>
             {/* ---- Add this OVERVIEW BLOCK below the video player ---- */}
{/* ---- Udemy-like OVERVIEW SECTION ---- */}
{/* ---- TAB NAVIGATION OVERVIEW + DESCRIPTION ---- */}
{course && (
  <div className="course-tabs-container">
    {/* TAB HEADERS */}
    <div className="tabs-header">
      <div
        className={`tab-item ${activeTab === "overview" ? "active" : ""}`}
        onClick={() => setActiveTab("overview")}
      >
        Course Overview
      </div>

      <div
        className={`tab-item ${activeTab === "description" ? "active" : ""}`}
        onClick={() => setActiveTab("description")}
      >
        Description
      </div>
    </div>

    {/* DIVIDER LINE */}
    <div className="tabs-divider"></div>

    {/* CONTENT */}
    <div className="tabs-content">
  <div key={activeTab} className="tab-animation">
    {activeTab === "overview" && (
      <p>{course.overview || "No overview available."}</p>
    )}

    {activeTab === "description" && (
      <p>{course.description || "No description available."}</p>
    )}
  </div>
</div>

  </div>
)}


          </div>

          <div className="right-section">
            <div className="progress-card">
              <h3>Your Progress</h3>
              <div className="progress-bar-container">
                <div className="progress-bar-bg">
                  <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }}></div>
                </div>
                <span className="progress-text">{progressPercent}%</span>
              </div>
            </div>

            <div className="lessons-list">
              <div className="course-name">{course?.course_name}</div>
              {modules.map((mod) => {
                const modChaps = chapters[mod.module_id] || [];

                // per-module counts
                let totalMaterialsInModule = 0;
                let completedMaterialsInModule = 0;

                modChaps.forEach((chap) => {
                  const materialLessons = lessons.filter(
                    (l) => l.chapter_id === chap.chapter_id && l.countForProgress && l.type !== "quiz"
                  );
                  totalMaterialsInModule += materialLessons.length;
                  completedMaterialsInModule += materialLessons.filter((l) => completed.has(l.key)).length;
                });

                return (
                  <div key={mod.module_id} className="lesson-group">
                    <div
                      className="lesson-header"
                      onClick={() =>
                        setExpanded((prev) => ({
                          ...prev,
                          [`module${mod.module_id}`]: !prev[`module${mod.module_id}`],
                        }))
                      }
                    >
                      <span>{mod.module_name}</span>

                      <span style={{ marginLeft: "auto", marginRight: "10px", fontSize: "13px", color: "#555" }}>
                        ({completedMaterialsInModule}/{totalMaterialsInModule})
                      </span>

                      {expanded[`module${mod.module_id}`] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>

                    {expanded[`module${mod.module_id}`] && (
                      <div className="sub-lessons open">
                        {modChaps.map((chap) => {
                          const chapterLessons = lessons.filter((l) => l.chapter_id === chap.chapter_id);
                          const materialLessons = chapterLessons.filter((l) => l.countForProgress && l.type !== "quiz");
                          const totalMaterials = materialLessons.length;
                          const completedMaterials = materialLessons.filter((l) => completed.has(l.key)).length;

                          return (
                            <div key={chap.chapter_id} className="chapter-block">
                              {chapterLessons.map((lesson) => (
                                <div
                                  key={lesson.key}
                                  className={`sub-lesson ${completed.has(lesson.key) ? "completed" : ""} ${!enabledLessons.has(lesson.key) ? "disabled" : ""}`}
                                  onClick={() => handleLessonClick(lesson.key, lesson.type)}
                                >
                                  {lesson.countForProgress ? (
                                    completed.has(lesson.key) ? (
                                      <CheckCircle size={16} />
                                    ) : (
                                      <Circle size={16} />
                                    )
                                  ) : lesson.type === "ppt" ? (
                                    <FileType size={16} color="#f59e0b" />
                                  ) : lesson.type === "doc" ? (
                                    <FileText size={16} color="#3b82f6" />
                                  ) : lesson.type === "image" ? (
                                    <ImageIcon size={16} color="#10b981" />
                                  ) : null}
                                  <span>{lesson.title}</span>
                                </div>
                              ))}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {showCertificate && (
          <div className="popup-overlay">
            <div className="popup-content">
              <h2>🎉 Congratulations!</h2>
              <p>You’ve completed all chapters successfully!</p>
              <img src={certificateImg} alt="Certificate" style={{ width: "100%", borderRadius: "12px" }} />
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default MyCourse;
