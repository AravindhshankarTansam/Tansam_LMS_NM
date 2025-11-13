import React, { useEffect, useState } from "react";
import "./LandingPage.css";
import heroImg from "../../assets/main_lms.png";
import herologo from "../../assets/tansamoldlogo.png";
import { Link, useNavigate } from "react-router-dom";
import PlansSection from "./PlansSection";

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
            {/* <li onClick={() => scrollToSection("instructors")}>Instructors</li> */}
            <li onClick={() => scrollToSection("testimonials")}>Testimonials</li>
            {/* <li onClick={() => scrollToSection("blog")}>Blog</li> */}
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
             Join thousands of learners upgrading their skills and shaping the future through powerful learning experiences on Tansam LMS.
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
            <h2>Your Learning Journey Made Simple</h2>
            <p>
              Begin your path to success with structured, interactive, and practical courses. 
            From fundamentals to advanced topics — gain the knowledge and confidence you need to grow and excel in your field.
            </p>
          </div>

          <div className="steps-grid">
            <div className="step">
              <div className="step-number">01</div>
              <h4>Choose Your Course</h4>
              <p>
              Discover a variety of learning programs designed to help you grow, learn new skills, and achieve your goals.
              </p>
            </div>

            <div className="step">
              <div className="step-number">02</div>
              <h4>Enroll and Access Expert-Led Content</h4>
              <p>
               Learn from experienced instructors through interactive lessons, projects, and engaging content.
 
              </p>
            </div>

            <div className="step">
              <div className="step-number">03</div>
              <h4>Practice, Assess, and Succeed</h4>
              <p>
               Track your progress, test your understanding  </p>
            </div>
            
            <div className="step">
              <div className="step-number">04</div>
              <h4>Get your certificates</h4>
              <p>
               arn certificates that showcase your achievements.  </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== COURSES SECTION (Dynamic) ===== */}
      <section className="courses" id="courses">
        <h2>SkillSpace</h2>
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

      <PlansSection />

      {/* ===== INSTRUCTORS ===== */}
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
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section className="trusted-section" id="testimonials">
        <div className="trusted-left">
          <h4>Learner Feedback</h4>
          <h2>Trusted by Learners Around the World</h2>
          <p>
            TANSAM-LMS has helped thousands of learners improve their skills, achieve goals, and grow through continuous learning.
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
              “TANSAM-LMS made learning engaging and easy to follow. The lessons are clear, the instructors are great, and I love the flexibility.”
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
              Providing accessible, high-quality education to learners everywhere. Learn, grow, and achieve your goals with TANSAM-LMS.     </p>
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

            {/* <div>
              <h4>Support</h4>
              <ul>
                <li>Help Center</li>
                <li>Account Information</li>
                <li>About Us</li>
                <li>Contact</li>
              </ul>
            </div> */}

            <div>
              <h4>Contact Us</h4>
              <ul>
                <li><span className="contact-label">Call:</span> +91 9884035145</li>
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
            {/* <li onClick={() => scrollToSection("instructors")}>Instructors</li> */}
            <li onClick={() => scrollToSection("testimonials")}>Testimonials</li>
            {/* <li onClick={() => scrollToSection("blog")}>Blog</li> */}
            <li> <a href="#" className="thin-link">Policy & Terms</a> </li>


          </ul>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
