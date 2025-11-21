import React, { useEffect, useState } from "react";
import "./LandingPage.css";
import heroImg from "../../assets/main_lms.png";
import herologo from "../../assets/tansamoldlogo.png";
import { Link, useNavigate } from "react-router-dom";
import PlansSection from "./PlansSection";
import FAQ from "./FAQ.jsx";
import { ArrowDropUp } from "@mui/icons-material"; 
import { CircularProgress } from "@mui/material";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const UPLOADS_BASE = import.meta.env.VITE_UPLOADS_BASE;

const LandingPage = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const coursesPerPage = 9; // 3x3 grid (9 courses per page)
   const [showTopBtn, setShowTopBtn] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0); // 0 to 100

  


 useEffect(() => {
  const handleScroll = () => {
    const totalScroll =
      document.documentElement.scrollHeight -
      document.documentElement.clientHeight;
    const scroll = document.documentElement.scrollTop;
    const scrolled = (scroll / totalScroll) * 100;

    setScrollProgress(scrolled);
    setShowTopBtn(scroll > 300);
  };

  window.addEventListener("scroll", handleScroll);
  return () => window.removeEventListener("scroll", handleScroll);
}, []);

// ADD THIS useEffect — Scroll-triggered animation for .online-learning section
useEffect(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
        // Add class when section enters viewport
        entry.target.classList.add("in-view");
        }
      });
    },
    { threshold: 0.3 } // Trigger when 30% of section is visible
  );

  const section = document.querySelector(".online-learning");
  if (section) observer.observe(section);

  return () => {
    if (section) observer.unobserve(section);
  };
}, []);

const handleMore = (course) => {
  navigate(`/courseinfo/${course.course_id}`, { state: { course } });
};

const stripHtml = (html) => {
  if (!html) return "";
  return html.replace(/<[^>]+>/g, ""); // removes all HTML tags
};

useEffect(() => {
  const stats = document.querySelectorAll(".stats h3");

  stats.forEach((el) => {
    let targetStr = el.getAttribute("data-num"); // e.g., "12K+", "500+", "50+"
    let suffix = "";
    let target = 0;

    // Detect and keep + sign
    if (targetStr.endsWith("+")) {
      suffix = "+";
      targetStr = targetStr.slice(0, -1); // remove + for calculation
    }

    // Handle K and M
    if (targetStr.toUpperCase().includes("K")) {
      target = parseFloat(targetStr) * 1000;
    } else if (targetStr.toUpperCase().includes("M")) {
      target = parseFloat(targetStr) * 1000000;
    } else {
      target = parseInt(targetStr, 10);
    }

    let count = 0;
    const increment = target > 100 ? Math.ceil(target / 200) : 1;

    const interval = setInterval(() => {
      count += increment;
      if (count >= target) {
        el.textContent = target.toLocaleString() + suffix;
        clearInterval(interval);
      } else {
        el.textContent = count.toLocaleString() + suffix;
      }
    }, 20);
  });
}, []);

  // Fetch courses dynamically from backend
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await fetch(`${API_BASE}/dashboard/courses`, {
          credentials: "include",
        });
        const data = await res.json();
        setCourses(data);
      } catch (err) {
        console.error("Error fetching courses:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  // Pagination logic
  const indexOfLastCourse = currentPage * coursesPerPage;
  const indexOfFirstCourse = indexOfLastCourse - coursesPerPage;
  const currentCourses = courses.slice(indexOfFirstCourse, indexOfLastCourse);

  const totalPages = Math.ceil(courses.length / coursesPerPage);

  const changePage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Scroll Helper
  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleEnroll = (courseId) => {
    navigate("/login", { state: { fromEnroll: true, courseId } });
  };

  return (
    <div className="landing-page">
      {/* ===== HERO SECTION ===== */}
      <section className="hero" id="home">
        <nav className="navbar">
          <div className="logo-container">
            <img src={herologo} alt="Logo" className="logo-img" />
          </div>
          <ul className="nav-links">
            <li onClick={() => scrollToSection("home")}>Home</li>
            <li>
              <Link to="/courseslist">Courses</Link>  {/* Navigate to courses page */}
            </li>
            <li onClick={() => scrollToSection("testimonials")}>Testimonials</li>
          </ul>
          <Link to="/login">
            <button className="contact-btns">Login</button>
          </Link>
        </nav>

        <div className="hero-content">
          <div className="text-content">
            <h1>Advancing Knowledge for the Future</h1>
            <p>
              Learn from industry experts, educators, and professionals.
              Join thousands of learners upgrading their skills and shaping the
              future through powerful learning experiences on Tansam LMS.
            </p>
            <button
              className="get-started-btn"
              onClick={() => scrollToSection("courses")}
            >
              Explore Courses
            </button>

            <div class="stats">
              <div>
                <h3 data-num="12K+">12K+</h3>
                <p>Active Students</p>
              </div>
              <div>
                <h3 data-num="500+">500+</h3>
                <p>College Collaborations</p>
              </div>
              <div>
                <h3 data-num="50+">50+</h3>
                <p>Industries Collaborations</p>
              </div>
            </div>


          </div>

          <div className="image-content">
            <img src={heroImg} alt="Hero" />
          </div>
        </div>
      </section>

      {/* ===== COURSES SECTION (Dynamic) ===== */}
      <section className="courses" id="courses">
        <h2>SkillSpace</h2>

        {/* Displaying the 3x3 grid of courses */}
        <div className="courses-grid">
          {currentCourses.map((course) => {
            const uploadPath = course.course_image
              ? course.course_image.replace(/^.*uploads\//, "")
              : "";
            const imageURL = uploadPath
              ? `${UPLOADS_BASE}/${uploadPath}`
              : "/fallback.jpg";

            return (
              <div className="course-card" key={course.course_id}>
                <img
                  src={imageURL}
                  alt={course.course_name}
                  onError={(e) => (e.target.src = "/fallback.jpg")}
                />

                <div className="course-info">
                  {/* Course name - not clickable */}
                  <p className="category">{course.course_name}</p>

                  {/* Description - 3 lines only, NOT clickable */}
                  <div
                    className="description"
                    dangerouslySetInnerHTML={{ __html: course.description || "" }}
                    onClick={(e) => e.stopPropagation()}   // This prevents any click action
                  />

                  {/* Price text - just display, not clickable */}
                  <div className="details">
                    <p>
                      {course.pricing_type === "free"
                        ? "Free"
                        : `₹${course.price_amount}`}
                    </p>
                  </div>

                  {/* ONLY these two are clickable - using your original class names */}
                  <span
                    className="price"
                    onClick={() => handleEnroll(course.course_id)}
                  >
                    Enroll
                  </span>

                  <button
                    className="more-btn"
                    onClick={() => handleMore(course)}
                  >
                    More
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination */}
        <div className="pagination">
          <button
            className="pagination-btn"
            onClick={() => changePage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Prev
          </button>

          {[...Array(totalPages)].map((_, index) => (
            <button
              key={index}
              className={`page-box ${currentPage === index + 1 ? "active" : ""}`}
              onClick={() => changePage(index + 1)}
            >
              {index + 1}
            </button>
          ))}

          <button
            className="pagination-btn"
            onClick={() => changePage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      </section>

      <PlansSection />

      {/* ===== INSTRUCTORS, TESTIMONIALS, FOOTER ===== */}
      {/* (no changes in these sections, keeping your original code) */}
{/* 
      <section className="online-learning" id="instructors">
        <div className="left-container">
          <h2>Empowering Learners Through Digital Education</h2>
          <div className="video-section">
            <div className="video-layout">
              <div className="main-img video-card">
                <img src={heroImg} alt="Instructor" />
                <p>Instructor</p>
              </div>
              <div className="side-column">
                <div className="video-card">
                  <img src={heroImg} alt="Instructor" />
                  <p>Instructor</p>
                </div>
                <div className="video-card">
                  <img src={heroImg} alt="Instructor" />
                  <p>Instructor</p>
                </div>
              </div>
            </div>
            <div className="video-buttons">
              <button className="present-btn">Watch Lecture</button>
              <button className="call-btn">Join Live Session</button>
            </div>
          </div>
          <p className="small-text">Learn anytime, anywhere.</p>
        </div>

        <div className="right-container">
          <h3>A Modern Learning Experience for Everyone</h3>
          <div className="features">
            <div className="feature">
              <div className="icon-box"></div>
              <p>Interactive sessions designed for effective learning.</p>
            </div>
            <div className="feature">
              <div className="icon-box"></div>
              <p>Personalized dashboards and real-time progress tracking.</p>
            </div>
            <div className="feature">
              <div className="icon-box"></div>
              <p>Practical learning with real-world applications.</p>
            </div>
          </div>
        </div>
      </section> */}
      <FAQ />

      <section className="trusted-section" id="testimonials">
        <div className="trusted-left">
          <h4>Learner Feedback</h4>
          <h2>Trusted by Learners Around the World</h2>
          <p>
            TANSAM-LMS has helped thousands of learners improve their skills,
            achieve goals, and grow through continuous learning.
          </p>
          <div className="trusted-stats">
            <div>
              <h3>98%</h3>
              <p>Course Completion Rate</p>
            </div>
            <div>
              <h3>15K+</h3>
              <p>Positive Reviews</p>
            </div>
            <div>
              <h3>120+</h3>
              <p>Partner Organizations</p>
            </div>
          </div>
        </div>

        <div className="trusted-right">
          <div className="student-img-box">
            <img src={heroImg} alt="Student" />
          </div>
          <div className="review-box">
            <p>
              “TANSAM-LMS made learning engaging and easy to follow. The lessons
              are clear, the instructors are great, and I love the flexibility.”
            </p>
            <h4>Dr. Emiliya Cart</h4>
            <span>⭐⭐⭐⭐⭐</span>
            <p className="reviews-count">24 Reviews</p>
          </div>
        </div>
      </section>

      <footer className="footer" id="blog">
        <div className="footer-top">
          <div className="footer-left">
            <h2 className="footer-logo">TANSAM-LMS</h2>
            <p>
              Providing accessible, high-quality education to learners
              everywhere. Learn, grow, and achieve your goals with TANSAM-LMS.
            </p>
            <div className="subscribe-box">
              <input type="email" placeholder="Enter your email..." />
              <button>→</button>
            </div>
          </div>

          <div className="footer-links">
            <div>
              <h4>Popular Links</h4>
              <ul>
                <li>Courses</li>
                <li>Instructors</li>
                <li>Community</li>
                <li>Blog</li>
              </ul>
            </div>

            <div>
              <h4>Contact Us</h4>
              <ul>
                <li>
                  <span className="contact-label">Call:</span> +91 9884035145
                </li>
                <li>
                  <span className="contact-label">Email:</span>{" "}
                  <a href="mailto:info@tansam.org" className="contact-email">
                    info@tansam.org
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <ul>
            <li onClick={() => scrollToSection("home")}>Home</li>
            <li onClick={() => scrollToSection("courses")}>Courses</li>
            <li onClick={() => scrollToSection("testimonials")}>
              Testimonials
            </li>
            <li>
              <a href="#" className="thin-link">
                Policy & Terms
              </a>
            </li>
          </ul>
        </div>
      </footer>
       {showTopBtn && (
  <div
    style={{
      position: "fixed",
      bottom: "30px",
      right: "30px",
      width: "50px",
      height: "50px",
      zIndex: 1000,
      cursor: "pointer",
      borderRadius: "50%",         
      backgroundColor: "#009999",   
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
    }}
    onClick={() => scrollToSection("home")}
  >
    <CircularProgress
      variant="determinate"
      value={scrollProgress} 
      size={50}
      thickness={4}         
      sx={{color: "rgba(255, 255, 255, 0.8)", position: "absolute",top: 0,left: 0,}} />
    <ArrowDropUp sx={{ color: "#fff", fontSize: 40 }} />
        </div>
      )}
    </div> 
  );
};
export default LandingPage;
