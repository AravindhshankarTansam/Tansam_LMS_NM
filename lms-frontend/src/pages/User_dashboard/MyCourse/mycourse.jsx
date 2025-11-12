import React, { useState, useRef, useEffect } from "react";
import "./mycourse.css";
import Sidebar from "../Sidebar/sidebar";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  CheckCircle,
  Circle,
  ChevronDown,
  ChevronUp,
  FileText,
  Image as ImageIcon,
  FileType,
} from "lucide-react";
  import { Box } from "@mui/material";

import Video1 from "../../../assets/Video-1.mp4";
import FlowchartImg from "../../../assets/flowchart.png";
import certificate from "../../../assets/certificate.jpeg";

const MyCourse = () => {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState({
    chapter1: true,
    chapter2: false,
    chapter3: false,
    chapter4: false,
    chapter5: false,
  });
  const [completed, setCompleted] = useState(new Set());
  const [enabledLessons, setEnabledLessons] = useState(new Set());
  const [activeLesson, setActiveLesson] = useState("");
  const [completedChapters, setCompletedChapters] = useState(new Set());
  const [showCertificate, setShowCertificate] = useState(false);
  const [showDownload, setShowDownload] = useState(false);
  const [activeTab, setActiveTab] = useState("Course Overview");
  const videoRef = useRef(null);

  const lessons = [
    // Chapter 1
    { key: "c1_introVideo", title: "Introduction (Video)", type: "video", src: Video1, chapter: 1, countForProgress: true },
    { key: "c1_pptLesson", title: "Network Segmentation (PPT)", type: "ppt", src: "/ppt1.pptx", chapter: 1, countForProgress: false },
    { key: "c1_wordLesson", title: "Access Policy (DOC)", type: "doc", src: "/word1.doc", chapter: 1, countForProgress: false },
    { key: "c1_flowchartLesson", title: "Segmentation Flowchart (Image)", type: "image", src: FlowchartImg, chapter: 1, countForProgress: false },
    { key: "c1_quizLesson", title: "Questionnaire", type: "quiz", chapter: 1, countForProgress: true },
    // Chapter 2
    { key: "c2_video", title: "Advanced Concepts (Video)", type: "video", src: Video1, chapter: 2, countForProgress: true },
    { key: "c2_ppt", title: "Chapter 2 PPT", type: "ppt", src: "/ppt2.pptx", chapter: 2, countForProgress: false },
    { key: "c2_word", title: "Chapter 2 DOC", type: "doc", src: "/word2.doc", chapter: 2, countForProgress: false },
    { key: "c2_flowchart", title: "Chapter 2 Flowchart", type: "image", src: FlowchartImg, chapter: 2, countForProgress: false },
    { key: "c2_quiz", title: "Questionnaire", type: "quiz", chapter: 2, countForProgress: true },
    // Chapter 3
    { key: "c3_video", title: "Video", type: "video", src: Video1, chapter: 3, countForProgress: true },
    { key: "c3_ppt", title: "PPT", type: "ppt", src: "/ppt3.pptx", chapter: 3, countForProgress: false },
    { key: "c3_word", title: "DOC", type: "doc", src: "/word3.doc", chapter: 3, countForProgress: false },
    { key: "c3_quiz", title: "Questionnaire", type: "quiz", chapter: 3, countForProgress: true },
    // Chapter 4
    { key: "c4_video", title: "Video", type: "video", src: Video1, chapter: 4, countForProgress: true },
    { key: "c4_ppt", title: "PPT", type: "ppt", src: "/ppt4.pptx", chapter: 4, countForProgress: false },
    { key: "c4_word", title: "DOC", type: "doc", src: "/word4.doc", chapter: 4, countForProgress: false },
    { key: "c4_quiz", title: "Questionnaire", type: "quiz", chapter: 4, countForProgress: true },
    // Chapter 5
    { key: "c5_video", title: "Video", type: "video", src: Video1, chapter: 5, countForProgress: true },
    { key: "c5_ppt", title: "PPT", type: "ppt", src: "/ppt5.pptx", chapter: 5, countForProgress: false },
    { key: "c5_word", title: "DOC", type: "doc", src: "/word5.doc", chapter: 5, countForProgress: false },
    { key: "c5_quiz", title: "Questionnaire", type: "quiz", chapter: 5, countForProgress: true },
  ];

  useEffect(() => {
    const courseStart = localStorage.getItem("courseStartDate");
    const now = new Date();

    if (!courseStart) localStorage.setItem("courseStartDate", now.toISOString());

    // Enable lessons based on saved scores
    const savedScores = JSON.parse(localStorage.getItem("quizScores")) || {};
    const enabled = new Set();
    lessons.forEach((lesson) => {
      if (lesson.chapter === 1) enabled.add(lesson.key);
      else if (savedScores[lesson.chapter - 1] >= 60) enabled.add(lesson.key);
    });
    setEnabledLessons(enabled);

    // Set first active lesson
    const firstEnabledLesson = lessons.find((l) => enabled.has(l.key));
    if (firstEnabledLesson) setActiveLesson(firstEnabledLesson.key);

    // Load completed lessons
    const completedSet = new Set();
    lessons.forEach((lesson) => {
      if (lesson.type !== "quiz" && localStorage.getItem(lesson.key))
        completedSet.add(lesson.key);
    });
    setCompleted(completedSet);

    // Show certificate if final chapter completed
    if (savedScores[5] >= 60) setShowCertificate(true);
  }, []);

  const toggleExpand = (chapter) =>
    setExpanded((prev) => ({ ...prev, [chapter]: !prev[chapter] }));

  const getLessonIcon = (lesson) => {
    if (lesson.countForProgress) return null;
    switch (lesson.type) {
      case "ppt": return <FileType size={16} color="#f59e0b" />;
      case "doc": return <FileText size={16} color="#3b82f6" />;
      case "image": return <ImageIcon size={16} color="#10b981" />;
      default: return null;
    }
  };

  const markLessonComplete = (lessonKey) => setCompleted(prev => new Set([...prev, lessonKey]));
  const handleVideoEnd = () => markLessonComplete(activeLesson);

  const handleLessonClick = (lessonKey, type) => {
    if (!enabledLessons.has(lessonKey)) return;

    if (type === "quiz") {
      // Dynamic blur tracking for all chapters
      const chapterMatch = lessonKey.match(/c(\d+)_/);
      const chapterNum = chapterMatch ? chapterMatch[1] : "1";

      const quizClickedChapters = JSON.parse(localStorage.getItem("quizClickedChapters")) || {};
      quizClickedChapters[chapterNum] = true;
      localStorage.setItem("quizClickedChapters", JSON.stringify(quizClickedChapters));

      navigate("/quiz", { state: { lessonKey } });
      return;
    }

    setActiveLesson(lessonKey);
    setShowDownload(false);
  };

  const renderLessonContent = () => {
    const lesson = lessons.find((l) => l.key === activeLesson);
    if (!lesson) return <p>Select a lesson to start learning.</p>;

    const fileUrl = `${window.location.origin}${lesson.src}`;
    const viewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`;

    switch (lesson.type) {
      case "video":
        return <video ref={videoRef} width="100%" height="520" src={lesson.src} controls onEnded={handleVideoEnd} />;
      case "ppt":
      case "doc":
        return (
          <div>
            <iframe src={viewerUrl} title={lesson.title} width="100%" height="520" style={{ border: "none", borderRadius: "12px", background: "#f9f9f9" }} onError={() => setShowDownload(true)} />
            {showDownload && <p style={{ textAlign: "center", marginTop: 10 }}>⚠️ Preview not available. <a href={lesson.src} download>Download {lesson.title}</a></p>}
          </div>
        );
      case "image":
        return <img src={lesson.src} alt="Flowchart" style={{ width: "100%", height: "520px", objectFit: "contain", borderRadius: "12px" }} />;
      default:
        return <p>Select a lesson to start learning.</p>;
    }
  };

  const progressLessons = lessons.filter((l) => l.countForProgress);
  const progressPercentage = Math.round((completed.size / progressLessons.length) * 100);

  return (
    <>
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#f9fafb" }}>
      <Sidebar />
      <ToastContainer />
      <Box sx={{
      flex: 1,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      p: 11,
    }}>
      <div className="mycourse-container">
        <div className="mycourse-grid">
          <div className="left-section">
            <h1 className="course-title">Network Segmentation & Access Control</h1>
            <div className="video-player">
              <div className="video-wrapper">{renderLessonContent()}</div>
            </div>
            <div className="tabs">
              {["Course Overview", "Review"].map(tab => (
                <button key={tab} className={`tab ${activeTab === tab ? "active" : ""}`} onClick={() => setActiveTab(tab)}>{tab}</button>
              ))}
            </div>
            <div className="tab-content">
              {activeTab === "Course Overview" && (
                <>
                  <h3>Course Overview</h3>
                  <p>Learn about network segmentation, access control, and policies to protect enterprise infrastructures.</p>
                </>
              )}
              {activeTab === "Review" && (
                <>
                  <h3>Your Review</h3>
                  <ul>
                    <li>Understanding of segmentation models is clear.</li>
                    <li>Access control and policy configuration.</li>
                    <li>Real-world cybersecurity practices.</li>
                  </ul>
                </>
              )}
            </div>
          </div>

          <div className="right-section">
            <div className="progress-card">
              <h3>Your Progress</h3>
              <div className="progress-bar-container">
                <div className="progress-bar-bg">
                  <div className="progress-bar-fill" style={{ width: `${progressPercentage}%` }}></div>
                </div>
                <span className="progress-text">{progressPercentage}%</span>
              </div>
            </div>

            <div className="lessons-list">
              <h3>Lessons</h3>
              {[1, 2, 3, 4, 5].map(chapterNum => (
                <div key={chapterNum} className="lesson-group">
                  <div className="lesson-header" onClick={() => toggleExpand(`chapter${chapterNum}`)}>
                    {completedChapters.has(chapterNum) ? <CheckCircle size={20} color="#10b981" /> : <Circle size={20} color="#6b7280" />}
                    <span>{`Chapter ${chapterNum}`}</span>
                    {expanded[`chapter${chapterNum}`] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                  {expanded[`chapter${chapterNum}`] && (
                    <div className="sub-lessons open">
                      {lessons.filter(l => l.chapter === chapterNum).map(lesson => (
                        <div key={lesson.key} className={`sub-lesson ${completed.has(lesson.key) ? "completed" : ""} ${!enabledLessons.has(lesson.key) ? "disabled" : ""}`} onClick={() => handleLessonClick(lesson.key, lesson.type)}>
                          {lesson.countForProgress ? (completed.has(lesson.key) ? <CheckCircle size={16} /> : <Circle size={16} />) : getLessonIcon(lesson)}
                          <span>{lesson.title}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {showCertificate && (
          <div className="popup-overlay">
            <div className="popup-content">
              <h2>🎉 Congratulations!</h2>
              <p>You’ve completed all chapters successfully!</p>
              <img src={certificate} alt="Certificate" style={{ width: "100%", borderRadius: "12px" }} />
            </div>
          </div>
        )}
      </div>
      </Box>
     </Box>
    </>
  );
};

export default MyCourse;
