import React, { useState, useRef, useEffect } from "react";
import "./mycourse.css";
import Sidebar from "../Sidebar/sidebar";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import DOMPurify from "dompurify";
import { FileText, Image as ImageIcon, FileType } from "lucide-react";
import { Worker, Viewer } from "@react-pdf-viewer/core";
import "@react-pdf-viewer/core/lib/styles/index.css";
import mammoth from "mammoth";
import {
  COURSE_API,
  MODULE_API,
  CHAPTER_API,
  QUIZ_API,
  PROGRESS_API,
} from "../../../config/apiConfig";

import IconButton from "@mui/material/IconButton";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import FullscreenExitIcon from "@mui/icons-material/FullscreenExit";
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';


const FILE_BASE = import.meta.env.VITE_UPLOADS_BASE;
const API_BASE = import.meta.env.VITE_API_BASE_URL;

const MyCourse = () => {
  const navigate = useNavigate();
  const { courseId } = useParams();
  const location = useLocation();

  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [chapters, setChapters] = useState({});
  const [quizzes, setQuizzes] = useState({});
  const [lessons, setLessons] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [activeLesson, setActiveLesson] = useState("");
  const [loading, setLoading] = useState(true);
  const [customId, setCustomId] = useState("");
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [zoom, setZoom] = useState(1);

  const lessonContentRef = useRef(null);
  const lessonDisplayRef = useRef(null);
  const videoRef = useRef(null);

  // NEW: Expand/collapse modules
  const [moduleOpen, setModuleOpen] = useState({});

  const toggleModule = (moduleId) => {
    setModuleOpen((prev) => ({
      ...prev,
      [moduleId]: !prev[moduleId],
    }));
  };

  /** Fullscreen toggle */
  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullScreen(true));
    } else {
      document.exitFullscreen().then(() => setIsFullScreen(false));
    }
  };


  // Disable right-click on the entire page
  useEffect(() => {
    const disableContextMenu = (e) => e.preventDefault();
    document.addEventListener("contextmenu", disableContextMenu);

    return () => {
      document.removeEventListener("contextmenu", disableContextMenu);
    };
  }, []);


  /** Zoom controls */
  const zoomIn = () => setZoom((prev) => Math.min(prev + 0.2, 3));
  const zoomOut = () => setZoom((prev) => Math.max(prev - 0.2, 0.5));

  const getFileUrl = (src) => {
    if (!src) return "";
    let cleanSrc = src.replace(/\\/g, "/").replace(/^(\/?uploads\/)+/, "");
    const base = FILE_BASE.endsWith("/") ? FILE_BASE.slice(0, -1) : FILE_BASE;
    return `${base}/${cleanSrc}`;
  };

  const fetchCustomId = async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, { credentials: "include" });
      const data = await res.json();
      if (res.ok && data?.user?.profile?.custom_id)
        setCustomId(data.user.profile.custom_id);
    } catch (err) {
      console.error("Failed to fetch custom_id", err);
    }
  };

  const fetchCourse = async () => {
    try {
      const res = await fetch(`${COURSE_API}/${courseId}`, { credentials: "include" });
      const data = await res.json();
      if (res.ok) setCourse(data);
      else toast.error("Failed to load course info");
    } catch (err) {
      console.error(err);
      toast.error("Failed to load course info");
    }
  };

  const fetchModules = async () => {
    try {
      const res = await fetch(`${MODULE_API}/${courseId}`, { credentials: "include" });
      const data = await res.json();
      setModules(data || []);
      (data || []).forEach((m) => fetchChapters(m.module_id));
    } catch (err) {
      console.error(err);
    }
  };

  const fetchChapters = async (moduleId) => {
    try {
      const res = await fetch(`${CHAPTER_API}/${moduleId}`, { credentials: "include" });
      const data = await res.json();
      const mappedData = (data || []).map((chap) => ({
        ...chap,
        materials: chap.materials || [],
      }));
      setChapters((prev) => ({ ...prev, [moduleId]: mappedData }));

      mappedData.forEach((chap) => fetchQuizzes(chap.chapter_id));
    } catch (err) {
      console.error(err);
    }
  };

  const fetchQuizzes = async (chapterId) => {
    try {
      const res = await fetch(`${QUIZ_API}/${chapterId}`, { credentials: "include" });
      const data = await res.json();
      setQuizzes((prev) => ({ ...prev, [chapterId]: data || [] }));
    } catch (err) {
      console.error(err);
    }
  };

  const buildLessons = () => {
    const list = [];

    modules.forEach((mod) => {
      const modChaps = chapters[mod.module_id] || [];

      modChaps.forEach((chap) => {
        (chap.materials || []).forEach((mat) => {
          list.push({
            key: `${chap.chapter_id}_mat${mat.material_id}`,
            material_id: mat.material_id,
            title: mat.file_name.replace(/\.[^/.]+$/, ""),
            type: mat.material_type,
            src: mat.file_path,
            module_id: mod.module_id,
            chapter_id: chap.chapter_id,
            countForProgress: ["video", "pdf", "ppt", "doc", "image"].includes(
              mat.material_type
            ),
          });
        });

        if ((quizzes[chap.chapter_id] || []).length > 0) {
          list.push({
            key: `${chap.chapter_id}_quiz`,
            title: "Quiz",
            type: "quiz",
            module_id: mod.module_id,
            chapter_id: chap.chapter_id,
            material_id: null,
            countForProgress: true,
          });
        }
      });
    });

    setLessons(list);
  };

  const markLessonComplete = async (lesson, extra = {}) => {
    if (!lesson || !customId) return;

    const body = {
      course_id: Number(courseId),
      module_id: lesson.module_id ?? null,
      chapter_id: lesson.chapter_id ?? null,
      material_id: lesson.material_id ?? null,
      is_quiz: lesson.type === "quiz",
      quiz_passed: extra.quiz_passed || false,
    };

    try {
      const response = await fetch(`${PROGRESS_API}/${customId}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) throw new Error();
      toast.success("Lesson completed!");
    } catch (err) {
      console.error("Failed to save progress:", err);
      toast.error("Failed to save progress. Try again.");
    }
  };

  const handleLessonClick = (lessonKey, type) => {
    const lesson = lessons.find((l) => l.key === lessonKey);
    if (!lesson) return;

    if (type === "quiz") {
      navigate(`/quiz/${lesson.chapter_id}`, {
        state: { courseId, chapterId: lesson.chapter_id },
        replace: true,
      });
      return;
    }

    setActiveLesson(lessonKey);
  };

  const handleVideoEnded = () => {
    const lesson = lessons.find((l) => l.key === activeLesson);
    if (lesson) markLessonComplete(lesson);
  };

  const renderLessonContent = () => {
    const lesson = lessons.find((l) => l.key === activeLesson);
    if (!lesson) return <p>Select a lesson to start learning.</p>;

    const fileUrl = getFileUrl(lesson.src);

    const fullscreenStyle = isFullScreen
      ? { position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", zIndex: 9999, backgroundColor: "#000" }
      : {};

    const commonStyle = {
      transform: `scale(${zoom})`,
      transformOrigin: "top left",
      transition: "transform 0.2s ease",
      width: "100%",
      height: "100%",
    };

    switch (lesson.type) {
      case "video":
        return (
          <video
            ref={videoRef}
            src={fileUrl}
            controls
            controlsList="nodownload"
            onEnded={handleVideoEnded}
            style={{
              ...commonStyle,
              maxHeight: isFullScreen ? "100vh" : "520px",
              ...fullscreenStyle,
            }}
            onContextMenu={(e) => e.preventDefault()}
          />


        );

      case "ppt":
      case "pptx":
      case "doc":
      case "docx":
        return (
          <iframe
            src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(
              fileUrl
            )}`}
            style={{
              width: "100%",
              height: isFullScreen ? "100vh" : "520px",
              border: "none",
              borderRadius: "12px",
              ...commonStyle,
              ...fullscreenStyle,
            }}
          />
        );

      case "pdf":
        return (
          <div
            ref={lessonContentRef}
            style={{
              height: isFullScreen ? "100vh" : "520px",
              width: "100%",
              overflow: "auto",
              ...fullscreenStyle,
            }}
          >
            <div style={{ transform: `scale(${zoom})`, transformOrigin: "top left", width: `${100 / zoom}%` }}>
              <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
                <Viewer fileUrl={fileUrl} />
              </Worker>
            </div>
          </div>
        );

      case "image":
        return (
          <img
            src={fileUrl}
            alt={lesson.title}
            style={{
              width: "100%",
              height: isFullScreen ? "100vh" : "520px",
              objectFit: "contain",
              borderRadius: "12px",
              ...commonStyle,
              ...fullscreenStyle,
            }}
            onContextMenu={(e) => e.preventDefault()}
          />
        );

      default:
        return <p>Select a lesson to start learning.</p>;
    }
  };

  useEffect(() => {
    fetchCustomId();
  }, []);

  useEffect(() => {
    if (customId && courseId) {
      setLoading(true);
      Promise.all([fetchCourse(), fetchModules()]).finally(() =>
        setLoading(false)
      );
    }
  }, [customId, courseId]);

  useEffect(() => {
    if (
      modules.length > 0 &&
      Object.keys(chapters).length > 0 &&
      Object.keys(quizzes).length > 0
    )
      buildLessons();
  }, [modules, chapters, quizzes]);

  if (loading) return <p>Loading course...</p>;

  return (
    <>
      <Sidebar />
      <ToastContainer />

      <div className="mycourse-container">
        <div className="mycourse-grid">

          {/* LEFT SECTION */}
          <div className="left-section">
            <h1 className="course-title">{course?.course_name}</h1>

            <div
              className="video-player"
              ref={lessonDisplayRef}
              style={{ position: "relative" }}
            >
              {renderLessonContent()}

              {/* Zoom + Fullscreen */}
              <div
                style={{
                  position: isFullScreen ? "fixed" : "absolute",
                  top: "10px",
                  right: "10px",
                  display: "flex",
                  gap: "10px",
                  backgroundColor: "rgba(0,0,0,0.7)",
                  padding: "8px",
                  borderRadius: "8px",
                  zIndex: 10000,
                }}
              >
                <IconButton onClick={zoomIn} sx={{ color: "#fff" }} size="small">
                  <ZoomInIcon />
                </IconButton>

                <IconButton onClick={zoomOut} sx={{ color: "#fff" }} size="small">
                  <ZoomOutIcon />
                </IconButton>

                <IconButton onClick={toggleFullScreen} sx={{ color: "#fff" }} size="small">
                  {isFullScreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
                </IconButton>
              </div>
            </div>

            {/* Course Overview */}
            {course && !isFullScreen && (
              <div className="course-tabs-container">
                {/* Tabs header */}
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

                <div className="tabs-divider"></div>

                {/* Tabs content */}
                <div className="tabs-content">
                  <div key={activeTab} className="tab-animation">
                    {activeTab === "overview" ? (
                      <p>{course.overview || "No overview available."}</p>
                    ) : (
                      <div
                        dangerouslySetInnerHTML={{
                          __html: DOMPurify.sanitize(
                            course.description || "No description available."
                          ),
                        }}
                      />
                    )}
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* RIGHT SECTION - FULL UPDATED CODE */}
          {!isFullScreen && (
            <div className="right-section">
              <div className="lessons-list">

                {/* COURSE NAME */}
                <div className="course-name">{course?.course_name}</div>

                {/* MODULES LIST */}
                {modules.map((mod) => {
                  const modChaps = chapters[mod.module_id] || [];

                  // ✅ COUNT ALL LESSONS (materials + quizzes) inside this module
                  const modLessons = lessons.filter((l) => l.module_id === mod.module_id);
                  const lessonCount = modLessons.length;

                  return (
                    <div key={mod.module_id} className="lesson-group">

                      {/* MODULE HEADER */}
                      <div
                        className="lesson-header"
                        onClick={() => toggleModule(mod.module_id)}
                        style={{
                          cursor: "pointer",
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <span>{mod.module_name}</span>
                        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          ({lessonCount} Lessons)
                          {moduleOpen[mod.module_id] ? (
                            <KeyboardArrowUpIcon style={{ fontSize: "20px" }} />
                          ) : (
                            <KeyboardArrowDownIcon style={{ fontSize: "20px" }} />
                          )}
                        </span>
                      </div>

                      {/* EXPANDED MODULE CONTENT */}
                      {moduleOpen[mod.module_id] && (
                        <div className="sub-lessons open">

                          {modChaps.map((chap) => {
                            const chapterLessons = lessons.filter(
                              (l) => l.chapter_id === chap.chapter_id
                            );

                            return (
                              <div key={chap.chapter_id} className="chapter-block">

                                {/* CHAPTER TITLE */}
                                <div className="chapter-title">
                                  {/* {chap.chapter_name} */}
                                </div>

                                {/* CHAPTER LESSONS */}
                                {chapterLessons.map((lesson) => (
                                  <div
                                    key={lesson.key}
                                    className={`sub-lesson ${activeLesson === lesson.key ? "active-lesson" : ""}`}
                                    onClick={() => handleLessonClick(lesson.key, lesson.type)}
                                  >
                                    {/* CIRCLE INDICATOR */}
                                    <span className="lesson-circle">
                                      <span className="lesson-tick">✓</span>
                                    </span>


                                    {/* TYPE ICON */}
                                    {lesson.type === "video" ? (
                                      <i className="ri-video-line lesson-icon"></i>
                                    ) : lesson.type === "pdf" ? (
                                      <i className="ri-file-pdf-2-line lesson-icon"></i>
                                    ) : lesson.type === "ppt" || lesson.type === "pptx" ? (
                                      <i className="ri-slideshow-2-line lesson-icon"></i>
                                    ) : lesson.type === "doc" || lesson.type === "docx" ? (
                                      <i className="ri-file-text-line lesson-icon"></i>
                                    ) : lesson.type === "image" ? (
                                      <i className="ri-image-line lesson-icon"></i>
                                    ) : lesson.type === "quiz" ? (
                                      <i className="ri-questionnaire-line lesson-icon"></i>
                                    ) : null}

                                    {/* TITLE */}
                                    <span className="lesson-title">{lesson.title}</span>
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
          )}

        </div>
      </div>
    </>
  );
};

export default MyCourse;
