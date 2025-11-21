import React, { useState, useEffect } from "react";
import "./quiz.css";
import Sidebar from "../Sidebar/sidebar";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { ToastContainer, toast, Slide } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { QUIZ_API, COURSE_API, MODULE_API } from "../../../config/apiConfig";

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

  // NEW: Store ALL answers
  const [allAnswers, setAllAnswers] = useState([]);

  // Attempt States
  const [attemptCount, setAttemptCount] = useState(0);
  const [attemptsLeft, setAttemptsLeft] = useState(3);

  // Fetch user
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/auth/me", {
          credentials: "include",
        });
        const data = await res.json();
        if (res.ok && data?.user?.profile?.custom_id) {
          setCustomId(data.user.profile.custom_id);
        }
      } catch (err) {
        console.error("❌ Error fetching user:", err);
      }
    };

    fetchUserProfile();
  }, []);

  // Fetch attempts
  useEffect(() => {
    if (!customId) return;

    const fetchAttempts = async () => {
      try {
        const res = await fetch(
          `${QUIZ_API}/attempts/${courseId}/${customId}`,
          { credentials: "include" }
        );

        const data = await res.json();
        const used = data?.attempts || 0;

        setAttemptCount(used);
        setAttemptsLeft(Math.max(3 - used, 0));
      } catch (err) {
        console.log("❌ Error fetching attempts:", err);
      }
    };

    fetchAttempts();
  }, [customId, chapterId]);

  // Fetch course + module names
  useEffect(() => {
    const fetchCourseAndModule = async () => {
      try {
        const courseRes = await fetch(`${COURSE_API}/${courseId}`, {
          credentials: "include",
        });
        const courseData = await courseRes.json();
        if (courseRes.ok) setCourseName(courseData.course_name);

        const moduleRes = await fetch(`${MODULE_API}/${courseId}`, {
          credentials: "include",
        });
        const moduleData = await moduleRes.json();

        if (moduleRes.ok && moduleData.length > 0) {
          const foundModule = moduleData.find(
            (m) => m.module_id === parseInt(chapterId)
          );
          setModuleName(foundModule?.module_name || "");
        }
      } catch (err) {
        console.error("❌ Error fetching data:", err);
      }
    };

    fetchCourseAndModule();
  }, [courseId, chapterId]);

  // Fetch quiz questions
  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const res = await fetch(`${QUIZ_API}/${chapterId}`, {
          credentials: "include",
        });
        const data = await res.json();

        if (res.ok) {
          setQuestions(data);
        } else {
          toast.error("No quiz found");
        }
      } catch (err) {
        console.log("❌ Failed to load quiz:", err);
      }
    };

    fetchQuiz();
  }, [chapterId]);

  // SELECT ANSWER — FIXED (stores all answers)
  const handleOptionSelect = (label, text) => {
    setSelectedOption({ label, text });
    setCheckResult(null);
    setIsChecked(false);

    const q = questions[currentQuestionIndex];

    setAllAnswers((prev) => {
      const filtered = prev.filter((a) => a.quiz_id !== q.quiz_id);
      return [...filtered, { quiz_id: q.quiz_id, selected_answer: text }];
    });
  };

  const handleCheck = () => {
    if (!selectedOption?.text) return;

    const currentQ = questions[currentQuestionIndex];
    const correct = currentQ.correct_answer.trim().toLowerCase();
    const chosen = selectedOption.text.trim().toLowerCase();

    if (correct === chosen) {
      setScore((prev) => prev + 1);
      setCheckResult("correct");
    } else {
      setCheckResult("wrong");
    }

    setIsChecked(true);
  };

  const handleNext = () => {
    if (!selectedOption) {
      toast.error("Select an answer first");
      return;
    }

    if (currentQuestionIndex + 1 < questions.length) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedOption("");
      setIsChecked(false);
      setCheckResult(null);
    } else {
      handleSubmit();
    }
  };

  // SUBMIT ANSWERS FIXED — now submitting ALL answers
 // In Quiz.jsx
// const handleSubmit = async () => {
//   try {
//     const payload = {
//       custom_id: customId,
//       answers: allAnswers,
//     };
//     await fetch(`${QUIZ_API}/submit`, {
//       method: "POST",
//       credentials: "include",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(payload),
//     });

//     const percentage = Math.round((score / questions.length) * 100);

//     // ✅ Show toast notification with score
//     toast.success(`🎉 Quiz Submitted! You scored ${percentage}%`, {
//       position: "top-right",
//       autoClose: 4000,
//       hideProgressBar: false,
//       closeOnClick: true,
//       pauseOnHover: true,
//       draggable: true,
//       progress: undefined,
//       transition: Slide,
//     });

//     setShowResult(true);

//     setTimeout(() => {
//       navigate(`/mycourse/${courseId}`, {
//         state: { 
//           chapterUnlocked: chapterId, 
//           progressIncrement: 1,
//         },
//       });
//     }, 2000);
//   } catch (err) {
//     console.error("❌ Submit failed:", err);
//     toast.error("Failed to submit quiz");
//   }
// };
const handleSubmit = async () => {
  if (!customId) {
    toast.error("User not found!");
    return;
  }

  // 🟢 Build answers array that includes quiz_id + selected_answer + progress_percent
  const payload = {
    custom_id: customId,
    answers: allAnswers.map((ans) => ({
      quiz_id: ans.quiz_id,
      selected_answer: ans.selected_answer,
      progress_percent: Math.round((score / questions.length) * 100), 
      chapter_id: chapterId
    })),
  };

  try {
    const res = await fetch(`${QUIZ_API}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (res.ok) {
      toast.success("🎉 Quiz Submitted!");

      // Navigate back with progress increment (merge-friendly)
      navigate(`/mycourse/${courseId}`, {
        state: {
          chapterUnlocked: chapterId,
          progressIncrement: 1,
        },
      });
    } else {
      toast.error(data.error || "Quiz submission failed");
    }
  } catch (error) {
    toast.error("Network error");
    console.error(error);
  }
};


  const currentQ = questions[currentQuestionIndex];

  const progressPercent =
    questions.length > 0
      ? ((currentQuestionIndex + 1) / questions.length) * 100
      : 0;

  return (
    <>
      <Sidebar />
      <ToastContainer />

      <div className="app">
        <div className="lessonSection">
          <span className="unitPath">{courseName}</span>
          <h1 className="unitTitle">{moduleName}</h1>

          <p className="attemptInfo">
            Attempt: <strong>{attemptCount}</strong> / 3 — Left:{" "}
            <strong>{attemptsLeft}</strong>
          </p>
        </div>

        <div className="main">
          {currentQ && !showResult && (
            <>
              <h2 className="quizTitle">{currentQ.question}</h2>

              <div className="questionBox">
                <p className="instruction">Choose one answer:</p>

                <div className="options">
  {currentQ.question_type === "mcq"
    ? ["option_a", "option_b", "option_c", "option_d"].map((key, idx) => {
        const val = currentQ[key];
        if (!val) return null;

        const label = String.fromCharCode(65 + idx);
        const isSelected = selectedOption?.label === label;

        return (
          <label
            key={idx}
            className={`option 
              ${isSelected ? "selected" : ""} 
              ${
                checkResult === "correct" &&
                isSelected &&
                val.trim().toLowerCase() ===
                  currentQ.correct_answer.trim().toLowerCase()
                  ? "correctBlink"
                  : ""
              }
              ${
                checkResult === "wrong" && isSelected ? "wrongBlink" : ""
              }`}
            onClick={() => handleOptionSelect(label, val)}
          >
            <input type="radio" checked={isSelected} readOnly />
            <span>{val}</span>
          </label>
        );
      })
    : // TRUE/FALSE Question
      ["True", "False"].map((val, idx) => {
        const label = idx === 0 ? "A" : "B";
        const isSelected = selectedOption?.label === label;

        return (
          <label
            key={idx}
            className={`option 
              ${isSelected ? "selected" : ""} 
              ${
                checkResult === "correct" &&
                isSelected &&
                val.trim().toLowerCase() ===
                  currentQ.correct_answer.trim().toLowerCase()
                  ? "correctBlink"
                  : ""
              }
              ${
                checkResult === "wrong" && isSelected ? "wrongBlink" : ""
              }`}
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
                  <>
                    <button className="btnSkip" onClick={handleNext}>
                      Skip
                    </button>
                    <button className="btnCheck" onClick={handleCheck}>
                      Check
                    </button>
                  </>
                ) : (
                  <button className="btnCheck" onClick={handleNext}>
                    {currentQuestionIndex === questions.length - 1
                      ? "Submit"
                      : "Next"}
                  </button>
                )}
              </div>

              <div className="progressContainer">
                <div className="progressBar">
                  <div
                    className="progressFill"
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
                <span className="progressText">
                  {currentQuestionIndex + 1}/{questions.length}
                </span>
              </div>
            </>
          )}

          {showResult && (
            <div className="resultBox">
              <h3>Quiz Completed 🎉</h3>
              <p>
                You scored:{" "}
                <strong>{Math.round((score / questions.length) * 100)}%</strong>
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
