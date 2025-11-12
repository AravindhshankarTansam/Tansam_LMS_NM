import React, { useEffect, useState } from "react";
import "./LandingPage.css";
import heroImg from "../../assets/main_lms.png";
import herologo from "../../assets/tansamoldlogo.png";
import { Link, useNavigate } from "react-router-dom";

const LandingPage = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ Fetch courses dynamically from backend
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await fetch("http://localhost:5000/api/dashboard/courses", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) throw new Error("Failed to fetch courses");
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

  // ✅ Scroll Helper
  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // ✅ Enroll click handler
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
            {/* <h2 className="logo-text">TANSAM - LMS</h2> */}
          </div>
          <ul className="nav-links">
            <li onClick={() => scrollToSection("home")}>Home</li>
            <li onClick={() => scrollToSection("courses")}>Courses</li>
            <li onClick={() => scrollToSection("instructors")}>Instructors</li>
            <li onClick={() => scrollToSection("testimonials")}>Testimonials</li>
            <li onClick={() => scrollToSection("blog")}>Blog</li>
          </ul>
          <Link to="/login">
            <button className="contact-btns">Login</button>
          </Link>
        </nav>

        <div className="hero-content">
          <div className="text-content">
            <h1>Advancing Medical Knowledge for the Future of Healthcare</h1>
            <p>
              Learn from expert doctors, researchers, and medical educators.
              Join thousands of learners transforming patient care through education.
            </p>
            <button
              className="get-started-btn"
              onClick={() => scrollToSection("courses")}
            >
              Explore Courses
            </button>

            <div className="stats">
              {/* <div>
                <h3>150+</h3>
                <p>TANSAM Courses</p>
              </div> */}
              <div>
                <h3>12K+</h3>
                <p>Active Students</p>
              </div>
              <div>
                <h3>500+</h3>
                <p>College Collaborations</p>
              </div>
              <div>
                <h3>50+</h3>
                <p>Industries Collaborations</p>
              </div>
            </div>
          </div>

          <div className="image-content">
            <img src={heroImg} alt="Hero" />
          </div>
        </div>
      </section>

      {/* ===== PARTNERS ===== */}
      <section className="steps" id="steps">
        {/* <div className="partners-logos">
          <img src="google.png" alt="Google" />
          <img src="trello.png" alt="Trello" />
          <img src="monday.png" alt="Monday" />
          <img src="notion.png" alt="Notion" />
          <img src="slack.png" alt="Slack" />
        </div> */}

        <div className="steps-content-wrapper">
          <div className="steps-header">
            <h2>Your Medical Learning Journey Made Simple</h2>
            <p>
              Begin your path to medical excellence with structured, interactive, and practical learning.  
              From anatomy to public health — gain the clinical knowledge and confidence you need to advance in healthcare.
            </p>
          </div>

          <div className="steps-grid">
            <div className="step">
              <div className="step-number">01</div>
              <h4>Choose Your Medical Course</h4>
              <p>
                Explore specialties like Surgery, Pharmacology, Pathology, and more — designed for healthcare professionals at every level.
              </p>
            </div>

            <div className="step">
              <div className="step-number">02</div>
              <h4>Enroll and Access Expert-Led Content</h4>
              <p>
                Learn directly from experienced doctors and researchers through immersive video lectures and case-based lessons.
              </p>
            </div>

            <div className="step">
              <div className="step-number">03</div>
              <h4>Practice, Assess, and Grow</h4>
              <p>
                Test your clinical knowledge, track your progress, and earn certificates to strengthen your medical career path.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== COURSES SECTION (Dynamic) ===== */}
      <section className="courses" id="courses">
        <h2>Medical Courses</h2>
        {loading ? (
          <p>Loading courses...</p>
        ) : courses.length > 0 ? (
          <div className="courses-grid">
            {courses.map((course) => (
              <div className="course-card" key={course.course_id}>
                <img
                  src={`http://localhost:5000/${course.course_image}`}
                  alt={course.course_name}
                  onError={(e) => {
                    e.target.src = "/fallback.jpg"; // fallback image
                  }}
                />
                <div className="course-info">
                  <p className="category">
                    
                    {course.course_name}
                  </p>
                  <h3>{course.description}</h3>
                  <p>{course.category_name}</p>
                  <div className="details">
                    <p>{course.pricing_type === "free" ? "Free" : `₹${course.price_amount}`}</p>
                    {/* <p>{course.overview}</p> */}
                  </div>
                  <span className="price" onClick={() => handleEnroll(course.course_id)}>
                    Enroll
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>No courses found</p>
        )}
      </section>

      {/* ===== INSTRUCTORS ===== */}
      <section className="online-learning" id="instructors">
        <div className="left-container">
          <h2>Empowering healthcare through digital learning excellence.</h2>
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
          <p className="small-text">Learn medicine anytime, anywhere.</p>
        </div>
        <div className="right-container">
          <h3>Modern Learning Experience for Medical Professionals</h3>
          <div className="features">
            <div className="feature">
              <div className="icon-box"></div>
              <p>Interactive video sessions with real-world clinical scenarios.</p>
            </div>
            <div className="feature">
              <div className="icon-box"></div>
              <p>Personalized dashboards and student progress tracking.</p>
            </div>
            <div className="feature">
              <div className="icon-box"></div>
              <p>Case-based learning integrated with digital resources.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section className="trusted-section" id="testimonials">
        <div className="trusted-left">
          <h4>Student Feedback</h4>
          <h2>Trusted by Healthcare Learners Worldwide</h2>
          <p>
            DPH Medical-LMS has empowered thousands of healthcare professionals to upskill,
            stay updated, and achieve academic excellence in medical sciences.
          </p>
          <div className="trusted-stats">
            <div>
              <h3>98%</h3>
              <p>Course Completion Success Rate</p>
            </div>
            <div>
              <h3>15K+</h3>
              <p>Positive Student Reviews Globally</p>
            </div>
            <div>
              <h3>120+</h3>
              <p>Trusted Medical Institutions</p>
            </div>
          </div>
        </div>

        <div className="trusted-right">
          <div className="student-img-box">
            <img src={heroImg} alt="Student" />
          </div>
          <div className="review-box">
            <p>
              “DPH Medical-LMS made complex topics simple and interactive.
              The instructors are very knowledgeable and responsive.
              This platform truly helps me in clinical preparation.”
            </p>
            <h4>Dr. Emiliya Cart</h4>
            <span>⭐⭐⭐⭐⭐</span>
            <p className="reviews-count">24 Reviews</p>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="footer" id="blog">
        <div className="footer-top">
          <div className="footer-left">
            <h2 className="footer-logo">TANSAM-LMS</h2>
            <p>
              Providing accessible and high-quality medical education to students and professionals worldwide.
            </p>
            <div className="subscribe-box">
              <input type="email" placeholder="Enter your email..." />
              <button>→</button>
            </div>
          </div>

          <div className="footer-links">
            <div>
              <h4>Popular Courses</h4>
              <ul>
                <li>Human Anatomy</li>
                <li>Clinical Pathology</li>
                <li>Pharmacology</li>
                <li>Public Health</li>
              </ul>
            </div>

            <div>
              <h4>Support</h4>
              <ul>
                <li>Help Center</li>
                <li>Account Information</li>
                <li>About Us</li>
                <li>Contact</li>
              </ul>
            </div>

            <div>
              <h4>Contact Us</h4>
              <ul>
                <li>Call: +91 9876543210</li>
                <li>Email: support@tansam.org</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <ul>
            <li onClick={() => scrollToSection("home")}>Home</li>
            <li onClick={() => scrollToSection("courses")}>Courses</li>
            <li onClick={() => scrollToSection("instructors")}>Instructors</li>
            <li onClick={() => scrollToSection("testimonials")}>Testimonials</li>
            <li onClick={() => scrollToSection("blog")}>Blog</li>
          </ul>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
