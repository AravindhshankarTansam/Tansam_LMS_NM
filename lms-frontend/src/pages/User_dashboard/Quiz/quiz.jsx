import React, { useState, useEffect } from "react";
import "./quiz.css";
import Sidebar from "../Sidebar/sidebar";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { ToastContainer, toast ,Slide} from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { QUIZ_API, COURSE_API, MODULE_API } from "../../../config/apiConfig";

// ------------------ Cookie Utilities (FIXED!) ------------------
const setCookie = (name, value, minutes) => {
  const expires = new Date(Date.now() + minutes * 60 * 1000);
  document.cookie = `${name}=${value}; expires=${expires.toUTCString()}; path=/`;
};

const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";")[0];
  return null;
};

const deleteCookie = (name) => {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
};

// ------------------ Quiz Component ------------------
export default function Quiz() {
  const navigate = useNavigate();
  const location = useLocation();
  const { chapterId } = useParams();
  const courseId = location.state?.courseId;

  const [customId, setCustomId] = useState("");
  const [courseName, setCourseName] = useState("");
  const [moduleName, setModuleName] = useState("");
  const [questions, setQuestions] = useState([]);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState("");
  const [checkResult, setCheckResult] = useState(null);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [allAnswers, setAllAnswers] = useState([]);

  // Fetch User
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/auth/me", {
          credentials: "include",
        });
        const data = await res.json();
        if (res.ok && data?.user?.profile?.custom_id) {
          setCustomId(data.user.profile.custom_id);
        }
      } catch (err) {
        console.error("Error fetching user:", err);
      }
    };
    fetchUser();
  }, []);

  // Check 5-Minute Cooldown Lock
  useEffect(() => {
    if (!customId || !chapterId) return;

    const cookieName = `quiz_lock_${customId}_${chapterId}`;
    const lockUntil = getCookie(cookieName);

    if (lockUntil) {
      const remaining = Number(lockUntil) - Date.now();
      if (remaining > 0) {
        const minutes = Math.ceil(remaining / 60000);
        toast.error(`Quiz locked! Try again in ${minutes} minute${minutes > 1 ? "s" : ""}.`);
        setTimeout(() => navigate(`/mycourse/${courseId}`), 3000);
        return;
      } else {
        deleteCookie(cookieName);
      }
    }
  }, [customId, chapterId, courseId, navigate]);

  // Fetch Course & Module Name
  useEffect(() => {
    const fetchNames = async () => {
      if (!courseId) return;
      try {
        const [courseRes, moduleRes] = await Promise.all([
          fetch(`${COURSE_API}/${courseId}`, { credentials: "include" }),
          fetch(`${MODULE_API}/${courseId}`, { credentials: "include" })
        ]);

        const courseData = await courseRes.json();
        if (courseRes.ok) setCourseName(courseData.course_name);

        const modules = await moduleRes.json();
        const chapterModule = modules.find(m => 
          m.chapters?.some(ch => ch.chapter_id === Number(chapterId))
        );
        setModuleName(chapterModule?.module_name || "Quiz");
      } catch (err) {
        console.error(err);
      }
    };
    fetchNames();
  }, [courseId, chapterId]);

  // Fetch Quiz Questions
  useEffect(() => {
    const loadQuiz = async () => {
      try {
        const res = await fetch(`${QUIZ_API}/${chapterId}`, { credentials: "include" });
        const data = await res.json();
        if (res.ok && data.length > 0) setQuestions(data);
        else toast.error("No quiz found for this chapter");
      } catch (err) {
        console.error(err);
      }
    };
    loadQuiz();
  }, [chapterId]);

  const handleOptionSelect = (label, text) => {
    setSelectedOption({ label, text });
    setCheckResult(null);
    setIsChecked(false);

    const q = questions[currentQuestionIndex];
    setAllAnswers(prev => {
      const filtered = prev.filter(a => a.quiz_id !== q.quiz_id);
      return [...filtered, { quiz_id: q.quiz_id, selected_answer: text }];
    });
  };

  const handleCheck = () => {
    if (!selectedOption) return;
    const q = questions[currentQuestionIndex];
    const correct = q.correct_answer.trim().toLowerCase();
    const selected = selectedOption.text.trim().toLowerCase();

    if (correct === selected) {
      setScore(prev => prev + 1);
      setCheckResult("correct");
    } else {
      setCheckResult("wrong");
    }
    setIsChecked(true);
  };

  const handleNext = () => {
    if (!selectedOption) {
      toast.error("Please select an answer");
      return;
    }
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedOption("");
      setCheckResult(null);
      setIsChecked(false);
    } else {
      handleSubmit();
    }
  };

  // FINAL SUBMIT — NOW 100% CORRECT
  const handleSubmit = async () => {
    if (!customId || !chapterId) {
      toast.error("User not authenticated");
      return;
    }

    const payload = {
      custom_id: customId,
      chapter_id: Number(chapterId),
      answers: allAnswers,
    };

    try {
      const res = await fetch(`${QUIZ_API}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.next_try_in_minutes) {
          toast.error(`${data.error}. Next try in ${data.next_try_in_minutes} minute(s).`);
          setTimeout(() => navigate(`/mycourse/${courseId}`), 3000);
        } else {
          toast.error(data.error || "Submission failed");
        }
        return;
      }

      const scorePercent = Math.round((score / questions.length) * 100);
      toast.success(`Submitted! Your score: ${scorePercent}%`);

      setShowResult(true);

      setTimeout(() => {
        if (scorePercent >= 65) {
          // PASS → Unlock chapter
          navigate(`/mycourse/${courseId}`, {
            state: { chapterUnlocked: chapterId }
          });
        } else {
          // FAIL → 5-minute lock + reset module
          const cookieName = `quiz_lock_${customId}_${chapterId}`;
          setCookie(cookieName, Date.now() + 5 * 60 * 1000, 5); // 5 minutes

          toast.error("Failed! Module reset. Try again after 5 minutes.");
          navigate(`/mycourse/${courseId}`, {
            state: { failedQuiz: chapterId }
          });
        }
      }, 2000);

    } catch (err) {
      toast.error("Network error");
      console.error(err);
    }
  };

  const currentQ = questions[currentQuestionIndex];
  const progressPercent = questions.length > 0
    ? ((currentQuestionIndex + 1) / questions.length) * 100
    : 0;

  if (!currentQ && !showResult) {
    return <div>Loading quiz...</div>;
  }

  return (
    <>
      <Sidebar />
      <ToastContainer transition={Slide} />

      <div className="app">
        <div className="lessonSection">
          <span className="unitPath">{courseName}</span>
          <h1 className="unitTitle">{moduleName || "Quiz"}</h1>
        </div>

        <div className="main">
          {!showResult ? (
            <>
              <h2 className="quizTitle">{currentQ.question}</h2>

              <div className="questionBox">
                <p className="instruction">Choose one answer:</p>

                <div className="options">
                  {currentQ.question_type === "mcq"
                    ? ["option_a", "option_b", "option_c", "option_d"].map((key, i) => {
                        const text = currentQ[key];
                        if (!text) return null;
                        const label = String.fromCharCode(65 + i);
                        const isSelected = selectedOption?.label === label;

                        return (
                          <label
                            key={i}
                            className={`option ${isSelected ? "selected" : ""}`}
                            onClick={() => handleOptionSelect(label, text)}
                          >
                            <input type="radio" checked={isSelected} readOnly />
                            <span>{text}</span>
                          </label>
                        );
                      })
                    : ["True", "False"].map((val, i) => {
                        const label = i === 0 ? "A" : "B";
                        const isSelected = selectedOption?.label === label;
                        return (
                          <label
                            key={i}
                            className={`option ${isSelected ? "selected" : ""}`}
                            onClick={() => handleOptionSelect(label, val)}
                          >
                            <input type="radio" checked={isSelected} readOnly />
                            <span>{val}</span>
                          </label>
                        );
                      })}
                </div>
              </div>

              <div className="footerBtns">
                {!isChecked ? (
                  <button className="btnCheck" onClick={handleCheck}>
                    Check Answer
                  </button>
                ) : (
                  <button className="btnCheck" onClick={handleNext}>
                    {currentQuestionIndex === questions.length - 1 ? "Submit Quiz" : "Next →"}
                  </button>
                )}
              </div>

              <div className="progressContainer">
                <div className="progressBar">
                  <div className="progressFill" style={{ width: `${progressPercent}%` }}></div>
                </div>
                <span className="progressText">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </span>
              </div>
            </>
          ) : (
            <div className="resultBox">
              <h3>Quiz Completed!</h3>
              <p>Your final score: <strong>{Math.round((score / questions.length) * 100)}%</strong></p>
              <p>{score >= (questions.length * 0.65) ? "You passed!" : "You did not pass. Module has been reset."}</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}