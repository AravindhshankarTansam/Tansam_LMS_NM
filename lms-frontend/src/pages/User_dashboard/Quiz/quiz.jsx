import React, { useState, useEffect } from 'react'; 
import './quiz.css';
import Sidebar from "../Sidebar/sidebar";
import { useNavigate, useLocation } from "react-router-dom";
import { ToastContainer, toast, Slide } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Quiz() {
  const navigate = useNavigate();
  const location = useLocation();
  const lessonKey = location.state?.lessonKey || "";

  // Sample lessons (can be expanded or dynamic)
  const lessons = [
    { id: '01', title: 'Evaporative Cooling', type: 'play', time: 'Quiz - 8 Questions', active: true },
    { id: '02', title: 'Vaporized Water Transform', type: 'document', time: '25 Minutes' },
    { id: '03', title: 'Heat Specificity', type: 'play', time: '80 Minutes' },
    { id: '04', title: 'Temperatures 101', type: 'play', time: '40 Minutes' },
    { id: '05', title: 'State Changes, Part 1', type: 'play', time: '25 Minutes' },
    { id: '06', title: 'State Changes, Part 2', type: 'document', time: '10 Questions' },
    { id: '07', title: 'Water & Acids', type: 'play', time: '25 Minutes' },
    { id: '08', title: 'Bases & Other Things', type: 'play', time: '110 Minutes' },
  ];

  // Sample questions (replace with real ones)
  const questions = [
    { id: 1, text: 'Why does liquid water have such a high heat capacity?', correct: 'A' },
    { id: 2, text: 'Question 2 text', correct: 'B' },
    { id: 3, text: 'Question 3 text', correct: 'C' },
    { id: 4, text: 'Question 4 text', correct: 'D' },
    { id: 5, text: 'Question 5 text', correct: 'A' },
  ];

  const [currentLesson, setCurrentLesson] = useState('01');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState('');
  const [checkResult, setCheckResult] = useState(null);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);

  // Dynamic blur for all chapters
  const [blurActive, setBlurActive] = useState(true);

  useEffect(() => {
    const quizClickedChapters = JSON.parse(localStorage.getItem("quizClickedChapters")) || {};
    const chapterNum = lessonKey.match(/c(\d+)_/) ? lessonKey.match(/c(\d+)_/)[1] : null;

    if (chapterNum && quizClickedChapters[chapterNum]) {
      setBlurActive(false); // remove blur
      delete quizClickedChapters[chapterNum];
      localStorage.setItem("quizClickedChapters", JSON.stringify(quizClickedChapters));
    }
  }, [lessonKey]);

  const handleLessonClick = (id) => {
    setCurrentLesson(id);
    setCurrentQuestionIndex(0);
    setSelectedOption('');
    setCheckResult(null);
    setScore(0);
    setShowResult(false);
  };

  const handleOptionSelect = (optionId) => {
    setSelectedOption(optionId);
    setCheckResult(null);
  };

  const moveToNextQuestion = () => {
    setSelectedOption('');
    setCheckResult(null);
    if (currentQuestionIndex + 1 < questions.length) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handleCheck = () => {
    if (!selectedOption) return;

    if (selectedOption === questions[currentQuestionIndex].correct) {
      setScore(prev => prev + 1);
      setCheckResult('correct');
    } else {
      setCheckResult('wrong');
    }

    setTimeout(() => {
      if (currentQuestionIndex + 1 < questions.length) {
        setCurrentQuestionIndex(prev => prev + 1);
        setSelectedOption('');
        setCheckResult(null);
      } else {
        setShowResult(true);
      }
    }, 1200);
  };

  const handleSkip = () => moveToNextQuestion();

  const handleSubmit = () => {
    setShowResult(true);

    const percentage = Math.round((score / questions.length) * 100);
    const chapter = lessonKey.match(/c(\d+)_/) ? parseInt(lessonKey.match(/c(\d+)_/)[1]) : 1;

    const savedScores = JSON.parse(localStorage.getItem("quizScores")) || {};
    savedScores[chapter] = percentage;
    localStorage.setItem("quizScores", JSON.stringify(savedScores));

    if (percentage >= 60) {
      toast.success(`🎉 Congrats! You completed Chapter ${chapter}. Chapter ${chapter + 1} unlocked!`, {
        position: "top-right",
        autoClose: 2500,
        theme: "colored",
        transition: Slide,
      });
    } else {
      toast.error(`⚠️ Your score is ${percentage}%. Retry Chapter ${chapter}!`, {
        position: "top-right",
        autoClose: 2500,
        theme: "colored",
        transition: Slide,
      });
    }

    setTimeout(() => {
      navigate(`/mycourse`);
    }, 2600);
  };

  const progressPercent = ((currentQuestionIndex + 1) / questions.length) * 100;
  const totalPercentage = ((score / questions.length) * 100).toFixed(0);

  return (
    <>
      <Sidebar />
      <ToastContainer position="top-right" autoClose={2500} hideProgressBar={false} newestOnTop closeOnClick pauseOnHover draggable theme="colored" transition={Slide} />

      <div className={`app ${blurActive ? 'blurred' : ''}`}>
        <div className="lessonSection">
          <div>
            <span className="unitPath">Unit 3 Lesson 5</span>
            <h1 className="unitTitle">Temperature & State Changes in Water</h1>
          </div>

          <ul className="lessonList">
            {lessons.map(lesson => (
              <li key={lesson.id} className={`lesson ${currentLesson === lesson.id ? 'active' : ''}`} onClick={() => handleLessonClick(lesson.id)}>
                <div className="lessonIcon">
                  {lesson.type === 'play' ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7L8 5z" /></svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6z" /></svg>
                  )}
                </div>
                <div className="lessonInfo">
                  <span className="lessonId">{lesson.id}:</span>
                  <span className="lessonTitle">{lesson.title}</span>
                </div>
                <div className="lessonTime">{lesson.time}</div>
              </li>
            ))}
          </ul>
        </div>

        <div className="main">
          <h2 className="quizTitle">Evaporative Cooling Quiz</h2>

          {!showResult ? (
            <>
              <div className="questionBox">
                <p className="questionText">{questions[currentQuestionIndex].text}</p>
                <p className="instruction">Choose only 1 answer:</p>

                <div className="options">
                  {['A','B','C','D','E'].map((opt,index) => (
                    <label key={index} className={`option 
                      ${selectedOption === opt ? 'selected' : ''} 
                      ${checkResult==='correct' && selectedOption===opt ? 'correctBlink' : ''}
                      ${checkResult==='wrong' && selectedOption===opt ? 'wrongBlink' : ''}`}
                      onClick={() => handleOptionSelect(opt)}>
                      <input type="radio" name="q1" checked={selectedOption===opt} readOnly />
                      <span>Option {opt}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="footerBtns">
                <button className="btnSkip" onClick={handleSkip}>Skip</button>
                <button className="btnCheck" onClick={handleCheck}>Check</button>
                {currentQuestionIndex === questions.length - 1 && (
                  <button className="btnSubmit" onClick={handleSubmit}>Submit</button>
                )}
              </div>

              <div className="progressContainer">
                <div className="progressBar">
                  <div className="progressFill" style={{ width: `${progressPercent}%` }}></div>
                </div>
                <span className="progressText">{currentQuestionIndex + 1}/{questions.length}</span>
              </div>
            </>
          ) : (
            <div className="resultBox">
              <h3>Quiz Completed 🎉</h3>
              <p>Your Score: <strong>{totalPercentage}%</strong></p>
              <p>You answered {score} out of {questions.length} correctly.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
