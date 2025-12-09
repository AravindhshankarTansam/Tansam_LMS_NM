import React, { useState, useRef, useEffect } from "react";
import "./mycourse.css";
import Sidebar from "../Sidebar/sidebar";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import DOMPurify from "dompurify";
import {
  CheckCircle,
  Circle,
  ChevronDown,
  ChevronUp,
  FileText,
  Image as ImageIcon,
  FileType,
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



import IconButton from "@mui/material/IconButton";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import FullscreenExitIcon from "@mui/icons-material/FullscreenExit";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const FILE_BASE = import.meta.env.VITE_UPLOADS_BASE;

const MyCourse = () => {
  const navigate = useNavigate();
  const { courseId } = useParams();
  const location = useLocation();

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
  const lessonContentRef = useRef(null);
  const lessonDisplayRef = useRef(null);
  const [pptSlides, setPptSlides] = useState([]);
  const [docHtml, setDocHtml] = useState("");
  const [customId, setCustomId] = useState("");
  const [backendProgress, setBackendProgress] = useState(0);
  const [activeTab, setActiveTab] = useState("overview");
  const [nextQuizToastShown, setNextQuizToastShown] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [zoom, setZoom] = useState(1);

  /** Prevent duplicate progress calls */
  const completedMaterialsRef = useRef(new Set());

  /** FIXED: Full-screen toggle for lesson content - targets document.body for true fullscreen */
  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      // Use document.documentElement for true fullscreen across entire viewport
      document.documentElement.requestFullscreen().then(() => {
        setIsFullScreen(true);
      }).catch(err => {
        console.error("Fullscreen failed:", err);
        // Fallback to lessonDisplayRef if document fullscreen not supported
        lessonDisplayRef.current?.requestFullscreen();
        setIsFullScreen(true);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullScreen(false);
      }).catch(err => {
        console.error("Exit fullscreen failed:", err);
      });
    }
  };

  /** Zoom in/out */
  const zoomIn = () => setZoom((prev) => Math.min(prev + 0.2, 3));
  const zoomOut = () => setZoom((prev) => Math.max(prev - 0.2, 0.5));

  const getFileUrl = (src) => {
    if (!src) return "";

    // Normalize path: replace backslashes with forward slashes
    let cleanSrc = src.replace(/\\/g, "/");

    // Remove any leading "uploads/" (one or more times)
    cleanSrc = cleanSrc.replace(/^(\/?uploads\/)+/, "");

    // Ensure no double slash in base
    const base = FILE_BASE.endsWith("/") ? FILE_BASE.slice(0, -1) : FILE_BASE;

    return `${base}/${cleanSrc}`;
  };

  const fetchCustomId = async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok && data?.user?.profile?.custom_id) {
        setCustomId(data.user.profile.custom_id);
      }
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

      const expandedMap = {};
      (data || []).forEach((m) => {
        expandedMap[`module${m.module_id}`] = true;
        fetchChapters(m.module_id);
      });
      setExpanded(expandedMap);
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

  const fetchProgress = async () => {
    if (!customId || lessons.length === 0) return;

    try {
      const res = await fetch(`${PROGRESS_API}/${customId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Progress fetch returned not ok");

      const data = await res.json();
      const entry = Array.isArray(data)
        ? data.find((p) => p.course_id === Number(courseId))
        : data;

      if (!entry) {
        setBackendProgress(0);
        setCompleted(new Set());
        setEnabledLessons(new Set(lessons[0] ? [lessons[0].key] : []));
        return;
      }

      setBackendProgress(Number(entry.progressPercent || 0));

      const completedSet = new Set();
      const enabledSet = new Set();
      const countable = lessons.filter((l) => l.countForProgress);
      const completedCount = Number(entry.completedItems || 0);

      countable.forEach((lesson, i) => {
        if (i < completedCount) completedSet.add(lesson.key);
        if (i <= completedCount) enabledSet.add(lesson.key);
      });

      if (completedCount === 0 && countable[0]) {
        enabledSet.add(countable[0].key);
      }

      setCompleted(completedSet);
      setEnabledLessons(enabledSet);

      if (Number(entry.progressPercent) === 100) {
        setShowCertificate(true);
      }
    } catch (err) {
      console.error("Progress fetch failed:", err);
    }
  };

const getFileNameWithoutExt = (fileName) => {
  if (!fileName) return "";
  return fileName.replace(/\.[^/.]+$/, ""); // removes .pdf, .pptx, .docx, etc.
};



  const buildLessons = () => {
    const list = [];

    modules.forEach((mod) => {
      const modChaps = chapters[mod.module_id] || [];

      modChaps.forEach((chap) => {
        if (!chap || !chap.chapter_id) return;

        // Materials
        (chap.materials || []).forEach((mat) => {
          if (!mat || !mat.material_id) return;

          list.push({
            key: `${chap.chapter_id}_mat${mat.material_id}`,
            material_id: mat.material_id,

            // ✅ use file name instead of chapter name for materials
            title:
              ["pdf", "ppt", "pptx", "doc", "docx", "image"].includes(mat.material_type)
                ? getFileNameWithoutExt(mat.file_name)
                : chap.chapter_name,


            type: mat.material_type,
            src: mat.file_path,
            module_id: mod.module_id,
            chapter_id: chap.chapter_id,
            countForProgress: ["video", "pdf", "ppt", "doc", "image"].includes(mat.material_type),
          });

        });

        // Quiz
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
    if (list.length > 0 && enabledLessons.size === 0) {
      setEnabledLessons(new Set([list[0].key]));
    }
  };

  // MARK LESSON COMPLETE - receives full lesson object
  const markLessonComplete = async (lesson, extra = {}) => {
    if (!lesson || !customId) return;
    if (completed.has(lesson.key)) return;

    const uniqueKey = `${lesson.chapter_id}-${lesson.module_id}-${lesson.material_id ?? "quiz"}`;

    if (completedMaterialsRef.current.has(uniqueKey)) {
      console.log("Already marking as complete (in-flight):", uniqueKey);
      return;
    }

    completedMaterialsRef.current.add(uniqueKey);

    // Optimistically update UI: mark completed + enable next lesson
    setCompleted((prev) => {
      if (prev.has(lesson.key)) return prev;
      const next = new Set(prev);
      next.add(lesson.key);
      return next;
    });

    // enable next lesson in sequence
    const idx = lessons.findIndex((l) => l.key === lesson.key);
    if (idx !== -1 && lessons[idx + 1]) {
      setEnabledLessons((prev) => {
        const n = new Set(prev);
        n.add(lessons[idx + 1].key);
        return n;
      });
    }

    // Prepare body in backend format you provided
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

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errText}`);
      }

      // sync backend progress after successful write
      await fetchProgress();
      completedMaterialsRef.current.delete(uniqueKey);
      console.log("✅ Progress saved:", uniqueKey);
      toast.success("Lesson completed!");
    } catch (err) {
      console.error("Failed to save progress:", err);

      // rollback optimistic UI so user can retry
      setCompleted((prev) => {
        const n = new Set(prev);
        n.delete(lesson.key);
        return n;
      });

      completedMaterialsRef.current.delete(uniqueKey);
      toast.error("Failed to save progress. Try again.");
    }
  };

  // Auto-mark non-video, non-pdf lessons after a timeout (60s)
  useEffect(() => {
    const lesson = lessons.find((l) => l.key === activeLesson);
    if (!lesson) return;

    // Exclude pdf from time-based auto completion
    if (["doc", "ppt", "pptx", "image"].includes(lesson.type)) {
      if (completed.has(lesson.key)) return;

      const timer = setTimeout(() => {
        // double-check still active and not completed
        const stillActive = activeLesson === lesson.key && !completed.has(lesson.key);
        if (stillActive) {
          markLessonComplete(lesson);
        }
      }, 60000); // 60s viewing threshold

      return () => clearTimeout(timer);
    }
  }, [activeLesson, lessons, completed]);

  // FIXED: Mark PDF complete based on scroll - Simplified and more reliable
  useEffect(() => {
    const lesson = lessons.find((l) => l.key === activeLesson);
    if (!lesson || lesson.type !== "pdf") return;

    let scrollTarget = null;
    let scrollHandler = null;

    const handleScroll = () => {
      if (!scrollTarget || completed.has(lesson.key)) return;

      // console.log("📜 PDF Scroll detected"); // Debug log

      const { scrollTop, scrollHeight, clientHeight } = scrollTarget;
      const scrollPercent = scrollHeight > clientHeight
        ? (scrollTop / (scrollHeight - clientHeight)) * 100
        : 0;

      // console.log(`📜 Scroll: ${scrollPercent.toFixed(1)}%`); // Debug log

      if (scrollPercent >= 95) { // Reduced threshold for reliability
        // console.log("✅ PDF Scroll complete triggered!");
        markLessonComplete(lesson);
      }
    };

    const findScrollContainer = () => {
      if (!lessonContentRef.current) return null;

      // Try multiple selectors for react-pdf-viewer
      const selectors = [
        '.rpv-core__viewer',
        '.rpv-core__doc-viewer',
        '[data-testid="viewer"]',
        '.pdf-viewer-container',
        '.viewer',
        '.rpv-core__inner',
        '.rpv-core__page-layer'
      ];

      for (const selector of selectors) {
        const element = lessonContentRef.current.querySelector(selector);
        if (element && element.scrollHeight > element.clientHeight) {
          // console.log(`📍 Found scroll container: ${selector}`);
          return element;
        }
      }

      // Fallback: find any scrollable element
      const scrollables = lessonContentRef.current.querySelectorAll('*');
      for (const el of Array.from(scrollables)) {
        if (el.scrollHeight > el.clientHeight + 20 && el.scrollHeight > 100) {
          // console.log(`📍 Found fallback scroll container:`, el);
          return el;
        }
      }

      // console.log("❌ No scroll container found");
      return lessonContentRef.current; // Ultimate fallback
    };

    // Retry finding scroll container multiple times
    const maxRetries = 10;
    let retryCount = 0;

    const attemptScrollSetup = () => {
      scrollTarget = findScrollContainer();
      if (scrollTarget) {
        // console.log("🎯 Scroll target locked:", scrollTarget);
        
        // Remove any existing listeners first
        scrollTarget.removeEventListener("scroll", scrollHandler);
        lessonContentRef.current?.removeEventListener("scroll", scrollHandler);
        
        // Add listeners
        scrollTarget.addEventListener("scroll", handleScroll, { passive: true });
        lessonContentRef.current?.addEventListener("scroll", handleScroll, { passive: true });
        
        return true;
      }
      
      if (retryCount < maxRetries) {
        retryCount++;
        // console.log(`🔄 Retry ${retryCount}/${maxRetries} for scroll container...`);
        setTimeout(attemptScrollSetup, 500);
      }
      
      return false;
    };

    // Initial attempt after short delay
    const timeoutId = setTimeout(attemptScrollSetup, 1500);

    return () => {
      clearTimeout(timeoutId);
      if (scrollTarget) {
        scrollTarget.removeEventListener("scroll", handleScroll);
      }
      lessonContentRef.current?.removeEventListener("scroll", handleScroll);
    };
  }, [activeLesson, lessons, completed]);

  const handleLessonClick = (lessonKey, type) => {
    if (!enabledLessons.has(lessonKey)) {
      toast.error("This lesson is locked. Complete previous lessons first.");
      return;
    }

    const lesson = lessons.find((l) => l.key === lessonKey);
    if (!lesson) return;

    if (type === "quiz") {
      // ensure required materials in this chapter are completed
      const chapterMaterials = lessons.filter(
        (l) => l.chapter_id === lesson.chapter_id && l.type !== "quiz" && l.countForProgress
      );
      const allDone = chapterMaterials.every((m) => completed.has(m.key));

      if (!allDone) {
        toast.error("Please complete all lessons in this chapter first!");
        return;
      }

      // navigate to quiz page (the quiz page will handle marking quiz result)
      navigate(`/quiz/${lesson.chapter_id}`, {
        state: { courseId, chapterId: lesson.chapter_id },
        replace: true,
      });
      return;
    }

    // set active lesson key
    setActiveLesson(lessonKey);
  };

  // Quiz result handler (from location.state)
  useEffect(() => {
    if (lessons.length === 0 || !location.state) return;

    let hasChanged = false;

    const processQuizResult = async () => {
      if (location.state?.failedQuiz) {
        const failedChapterId = Number(location.state.failedQuiz);
        const failedLesson = lessons.find((l) => l.chapter_id === failedChapterId);
        if (failedLesson) {
          await resetModule(failedLesson.module_id);
          hasChanged = true;
        }
      }

      if (location.state?.chapterUnlocked) {
        const unlockedChapterId = Number(location.state.chapterUnlocked);
        const quizKey = `${unlockedChapterId}_quiz`;

        setCompleted((prev) => {
          if (!prev.has(quizKey)) {
            hasChanged = true;
            const n = new Set(prev);
            n.add(quizKey);
            return n;
          }
          return prev;
        });

        const quizIndex = lessons.findIndex((l) => l.key === quizKey);
        if (quizIndex !== -1 && lessons[quizIndex + 1]) {
          setEnabledLessons((prev) => new Set(prev).add(lessons[quizIndex + 1].key));
        }

        if (!nextQuizToastShown) {
          toast.success("Next Chapter unlocked!");
          setNextQuizToastShown(true);
        }
      }

      window.history.replaceState({}, "");
      if (hasChanged) setTimeout(fetchProgress, 300);
    };

    processQuizResult();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state, lessons]);

  // Reset module on quiz fail (keeps server sync logic)
  const resetModule = async (moduleId) => {
    toast.info("Quiz failed! Module has been reset. Starting fresh...");
    try {
      const res = await fetch(`${PROGRESS_API}/reset-module/${customId}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          course_id: Number(courseId),
          module_id: moduleId,
        }),
      });

      if (!res.ok) throw new Error();
      await fetchProgress();
    } catch (err) {
      console.error("Reset failed:", err);
      toast.error("Server sync failed. Refreshing...");
      await fetchProgress();
    }
  };

  // video ended handler should pass the full lesson object
  const handleVideoEnded = () => {
    const lesson = lessons.find((l) => l.key === activeLesson);
    if (lesson) markLessonComplete(lesson);
  };

  // renderLessonContent method
  const renderLessonContent = () => {
    const lesson = lessons.find((l) => l.key === activeLesson);
    if (!lesson) return <p>Select a lesson to start learning.</p>;

    // Normalize path and remove extra 'uploads'
    let cleanPath = lesson.src.replace(/\\/g, "/").replace(/^(\/?uploads\/)+/, "");
    const fileUrl = `${FILE_BASE.replace(/\/$/, "")}/${cleanPath}`;

    // Fullscreen-aware styles
    const fullscreenStyle = isFullScreen ? {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      zIndex: 9999,
      backgroundColor: '#000'
    } : {};

    // Common style for zoom and smooth transform
    const commonStyle = {
      transform: `scale(${zoom})`,
      transformOrigin: "top left",
      transition: "transform 0.2s ease-in-out",
      width: "100%",
      height: "100%",
    };

    switch (lesson.type) {
      case "video":
        console.log("📌 Video File URL:", fileUrl);
        return (
          <video
            ref={videoRef}
            src={fileUrl}
            controls
            controlsList="nodownload noremoteplayback"
            onEnded={handleVideoEnded}
            style={{ 
              ...commonStyle, 
              maxHeight: isFullScreen ? "100vh" : "520px",
              width: "100%",
              height: isFullScreen ? "100%" : "auto",
              ...fullscreenStyle
            }}
            onContextMenu={(e) => e.preventDefault()}
          />
        );

      case "ppt":
      case "pptx":
        console.log("📌 PPT File URL:", fileUrl);
        return (
          <iframe
            src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`}
            style={{
              width: "100%",
              height: isFullScreen ? "100vh" : "520px",
              border: "none",
              borderRadius: "12px",
              ...commonStyle,
              ...fullscreenStyle
            }}
          />
        );

      case "pdf":
        console.log("📌 PDF File URL:", fileUrl);
        return (
          <div
            ref={lessonContentRef}
            style={{
              height: isFullScreen ? "100vh" : "520px",
              width: "100%",
              overflowX: "auto",
              overflowY: "auto",
              position: "relative",
              ...fullscreenStyle
            }}
          >
            <div
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: "top left",
                width: `${100 / zoom}%`,
                height: "auto",
                minWidth: "100%",
              }}
            >
              <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
                <Viewer fileUrl={fileUrl} />
              </Worker>
            </div>
          </div>
        );

      case "image":
        console.log("📌 Image File URL:", fileUrl);
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
              ...fullscreenStyle
            }}
            onContextMenu={(e) => e.preventDefault()}
          />
        );

      case "doc":
      case "docx":
        console.log("📌 DOC File URL:", fileUrl);
        return (
          <iframe
            src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`}
            style={{
              width: "100%",
              height: isFullScreen ? "100vh" : "520px",
              border: "none",
              borderRadius: "12px",
              ...commonStyle,
              ...fullscreenStyle
            }}
          />
        );

      default:
        return <p>Select a lesson to start learning.</p>;
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Load user
  useEffect(() => {
    fetchCustomId();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load course data
  useEffect(() => {
    if (customId && courseId) {
      setLoading(true);
      Promise.all([fetchCourse(), fetchModules()]).finally(() => setLoading(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customId, courseId]);

  // Build lessons
  useEffect(() => {
    if (modules.length > 0 && Object.keys(chapters).length > 0 && Object.keys(quizzes).length > 0) {
      buildLessons();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modules, chapters, quizzes]);

  // Fetch progress when lessons are ready
  useEffect(() => {
    if (customId && lessons.length > 0) fetchProgress();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customId, lessons]);

  if (loading) return <p>Loading course...</p>;

  return (
    <>
      <Sidebar />
      <ToastContainer />
      <div className="mycourse-container">
        <div className="mycourse-grid">
          <div className="left-section">
            <h1 className="course-title">{course?.course_name}</h1>
            <div className="video-player" ref={lessonDisplayRef} style={{ position: "relative" }}>
              {renderLessonContent()}

              {/* Zoom & Fullscreen Controls */}
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

            {course && !isFullScreen && (
              <div className="course-tabs-container">
                <div className="tabs-header">
                  <div className={`tab-item ${activeTab === "overview" ? "active" : ""}`} onClick={() => setActiveTab("overview")}>
                    Course Overview
                  </div>

                  <div className={`tab-item ${activeTab === "description" ? "active" : ""}`} onClick={() => setActiveTab("description")}>
                    Description
                  </div>
                </div>


                <div className="tabs-divider"></div>

                <div className="tabs-content">
                  <div key={activeTab} className="tab-animation">
                    {activeTab === "overview" && <p>{course.overview || "No overview available."}</p>}

                    <div
                      dangerouslySetInnerHTML={{
                        __html: DOMPurify.sanitize(course.description || "No description available."),
                      }}
                    ></div>

                  </div>
                </div>
              </div>
            )}
          </div>

          {!isFullScreen && (
            <div className="right-section">
              <div className="user-progress-card">
                <h3>Your Progress</h3>
                <div className="progress-bar-container">
                  <div className="progress-bar-bg">
                    <div className="progress-bar-fill" style={{ width: `${backendProgress}%` }}></div>
                  </div>
                  <span className="progress-text">{backendProgress}%</span>
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
                                    className={`sub-lesson ${completed.has(lesson.key) ? "completed" : ""} ${
                                      !enabledLessons.has(lesson.key) ? "disabled" : ""
                                    }`}
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
          )}
        </div>

        {/* {showCertificate && (
          <div className="popup-overlay">
            <div className="popup-content">
              <h2>🎉 Congratulations!</h2>
              <p>You've completed all chapters successfully!</p>
              <img src={certificateImg} alt="Certificate" style={{ width: "100%", borderRadius: "12px" }} />
            </div>
          </div>
        )} */}
      </div>
    </>
  );
};

export default MyCourse;
