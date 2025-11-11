  import React, { useState, useMemo, useEffect } from "react";
  import "./CoursePlayer.css";
  import Sidebar from "../Sidebar/sidebar";

  export default function CoursePlayer() {
    // Course data (mirroring LandingPage for simplicity)
    const courses = [
      { id: 1, title: "Human Anatomy and Physiology Fundamentals", instructor: "Dr. Fatema Fiha" },
      { id: 2, title: "Principles of Drug Action and Clinical Pharmacology", instructor: "Dr. Leonel Money" },
      { id: 3, title: "Fundamentals of Surgical Techniques and Safety", instructor: "Dr. Abrar Islam" },
      { id: 4, title: "Medical Genetics and Molecular Diagnostics", instructor: "Dr. Habiba Akter" },
      { id: 5, title: "Clinical Pathology and Diagnostic Methods", instructor: "Dr. Anjum Sumi" },
      { id: 6, title: "Principles of Epidemiology and Public Health Practice", instructor: "Dr. Leonel Money" },
    ];

    const [enrolledCourse, setEnrolledCourse] = useState(null);

    useEffect(() => {
      const courseId = localStorage.getItem("enrolledCourse");
      if (courseId) {
        const course = courses.find(c => c.id === parseInt(courseId));
        setEnrolledCourse(course);
      }
    }, []);

    // ---------- MATERIALS DATA ----------
    const initialMaterials = [
      {
        id: 1,
        type: "Quiz",
        title: "5 Steps Optimizing User Experience",
        tag: "UI/UX Design",
        urgency: "Urgent",
        points: 20,
        progress: 0,
        status: "Not Started",
      },
      {
        id: 2,
        type: "Page",
        title: "Heuristics: 10 Usability Principles to Improve UI Design",
        tag: "Learning Design",
        urgency: "Not Urgent",
        progress: 40,
        status: "In Progress",
      },
      {
        id: 3,
        type: "Learning Path",
        title: "General Knowledge & Methodology - Layout & Spaci...",
        tag: "Consistency",
        urgency: "Not Urgent",
        progress: 0,
        status: "Not Started",
      },
      {
        id: 4,
        type: "Course",
        title: "Mastering UI Design for Impactful Solutions",
        tag: "UI/UX Design",
        urgency: "Not Urgent",
        progress: 50,
        status: "In Progress",
      },
      {
        id: 5,
        type: "Page",
        title: "A Symphony of Colors in UI Design",
        tag: "Creativity",
        urgency: "Not Urgent",
        progress: 0,
        status: "Not Started",
      },
      // Add more items as needed, including assignments and other pages...
    ];

    // ---------- STATE ----------
    const [materials, setMaterials] = useState(initialMaterials);
    const [filter, setFilter] = useState("All Status");
    const [searchTerm, setSearchTerm] = useState("");

    // ---------- FILTERED MATERIALS ----------
    const filteredMaterials = useMemo(() => {
      return materials.filter((m) => {
        const matchesFilter =
          filter === "All Status" ? true : m.status === filter;
        const matchesSearch = m.title
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
      });
    }, [materials, filter, searchTerm]);

    // ---------- BUTTON HANDLER ----------
    const handleAction = (id) => {
      setMaterials((prev) =>
        prev.map((m) => {
          if (m.id === id) {
            const newProgress =
              m.progress >= 100 ? 100 : Math.min(m.progress + 20, 100);
            const newStatus =
              newProgress >= 100 ? "Completed" : "In Progress";
            return { ...m, progress: newProgress, status: newStatus };
          }
          return m;
        })
      );
    };

    return (
      <>
        <Sidebar />
        <div className="learning-dashboard">
          <div className="app-container">
            {/* ---------- Enrolled Course Header ---------- */}
            <section className="section">
              <h2 className="section-title">
                {enrolledCourse ? `Enrolled Course: ${enrolledCourse.title}` : "No Course Enrolled"}
              </h2>
              {enrolledCourse && (
                <p>Instructor: {enrolledCourse.instructor}</p>
              )}
            </section>

            {/* ---------- Continue Learning ---------- */}
            <section className="section">
              <h2 className="section-title">Continue Learning</h2>
              <div className="continue-grid">
                {/* Card 1 */}
                <div className="continue-card">
                  <div className="continue-icon orange">
                    <div className="icon-inner">
                      <svg
                        className="icon-svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                      >
                        <path
                          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span>12 Materials</span>
                    </div>
                  </div>
                  <div className="continue-body">
                    <h3 className="continue-title">
                      Creating Engaging Learning Journeys: UI/UX Best Practices
                    </h3>
                    <div className="progress-wrapper">
                      <div className="progress-label">Progress: 80%</div>
                      <div className="progress-bar-bg">
                        <div
                          className="progress-bar-fill"
                          style={{ width: "80%" }}
                        />
                      </div>
                    </div>
                    <button
                      className="continue-btn"
                      onClick={() => handleAction(1)}
                    >
                      Continue
                    </button>
                    <p className="continue-next">
                      <span className="arrow">→</span> Advance your learning
                      with Mastering UI Design for Impactful Solutions
                    </p>
                  </div>
                </div>

                {/* Card 2 */}
                <div className="continue-card">
                  <div className="continue-icon purple">
                    <div className="icon-inner">
                      <svg
                        className="icon-svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                      >
                        <path
                          d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H6.75A3.375 3.375 0 003.375 5.625v12.75A3.375 3.375 0 006.75 21.75h10.5a3.375 3.375 0 003.375-3.375v-1.5"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M12 10.5h6m-6 3.75h6m-6 3.75h6"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span>12 Materials</span>
                    </div>
                  </div>
                  <div className="continue-body">
                    <h3 className="continue-title">
                      The Art of Blending Aesthetics and Functionality in
                      UI/UX Design
                    </h3>
                    <div className="progress-wrapper">
                      <div className="progress-label">Progress: 30%</div>
                      <div className="progress-bar-bg">
                        <div
                          className="progress-bar-fill"
                          style={{ width: "30%" }}
                        />
                      </div>
                    </div>
                    <button
                      className="continue-btn"
                      onClick={() => handleAction(2)}
                    >
                      Continue
                    </button>
                    <p className="continue-next">
                      <span className="arrow">→</span> Next, you can dive into
                      Advanced techniques commonly used in UI/UX Design
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* ---------- All Materials ---------- */}
            <section className="section">
              <div className="materials-header">
                <h2 className="section-title">
                  All Materials ({filteredMaterials.length})
                </h2>
                <div className="header-right">
                  <select
                    className="status-select"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                  >
                    <option>All Status</option>
                    <option>Not Started</option>
                    <option>In Progress</option>
                    <option>Completed</option>
                  </select>
                </div>
              </div>

              <div className="filters-bar">
                {["All Status", "Not Started", "In Progress", "Completed"].map(
                  (f) => (
                    <button
                      key={f}
                      className={`filter-btn ${filter === f ? "active" : ""}`}
                      onClick={() => setFilter(f)}
                    >
                      {f}
                    </button>
                  )
                )}
                <input
                  type="text"
                  placeholder="Search..."
                  className="search-input"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button className="icon-btn">Add Filter</button>
                <button className="icon-btn">Sort by</button>
              </div>

              <div className="materials-grid">
                {filteredMaterials.map((m) => (
                  <div key={m.id} className="material-card">
                    <div className="card-header">
                      <span className={`badge ${m.type.toLowerCase()}`}>
                        {m.type}
                      </span>
                    </div>
                    <h3 className="card-title">{m.title}</h3>
                    <p className="card-tag">{m.tag}</p>
                    <p className="card-urgency">{m.urgency}</p>
                    {m.points && (
                      <p className="card-points">
                        <span className="points-value">{m.points} pts</span>{" "}
                        Passing point {m.points} pts
                      </p>
                    )}
                    {m.progress > 0 && (
                      <div className="progress-wrapper small">
                        <div className="progress-label">
                          Progress: {m.progress}%
                        </div>
                        <div className="progress-bar-bg">
                          <div
                            className="progress-bar-fill"
                            style={{ width: `${m.progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                    <button
                      className={`action-btn ${
                        m.status === "Not Started" ? "start" : "continue"
                      }`}
                      onClick={() => handleAction(m.id)}
                    >
                      {m.status === "Not Started"
                        ? "Start"
                        : m.status === "Completed"
                        ? "Review"
                        : "Continue"}
                    </button>
                  </div>
                ))}
                {filteredMaterials.length === 0 && (
                  <p className="no-results">No materials found.</p>
                )}
              </div>
            </section>
          </div>
        </div>
      </>
    );
  }
