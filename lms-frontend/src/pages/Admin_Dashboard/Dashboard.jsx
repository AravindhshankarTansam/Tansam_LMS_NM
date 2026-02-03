import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import axios from "axios";
import "./Dashboard.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

export default function Dashboard() {
  const navigate = useNavigate();

  const [allCourses, setAllCourses] = useState([]);
  const [nmCourses, setNMCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  const [publishLoading, setPublishLoading] = useState(null);
  const [nmMessage, setNmMessage] = useState("");

  /* =====================================================
     LOAD DASHBOARD DATA
  ===================================================== */
  const loadDashboardData = async () => {
    try {
      const [allRes, nmRes] = await Promise.all([
        axios.get(`${API_BASE}/dashboard/courses`),
        axios.get(`${API_BASE}/dashboard/courses/dashboard/nm-courses`)
      ]);

      setAllCourses(allRes.data || []);
      setNMCourses(nmRes.data || []);
    } catch (err) {
      console.error("Dashboard API error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  /* =====================================================
     PUBLISH COURSE TO NM
  ===================================================== */
  const handlePublish = async (courseId) => {
    try {
      setPublishLoading(courseId);
      setNmMessage("");

      const res = await axios.post(
        `${API_BASE}/nm/course/publish/${courseId}`
      );

      setNmMessage(res.data.message);

      // refresh
      loadDashboardData();
    } catch (err) {
      console.error(err);
      setNmMessage("❌ Failed to publish course");
    } finally {
      setPublishLoading(null);
    }
  };

  /* =====================================================
     STATUS COLOR
  ===================================================== */
  const getStatusColor = (status) => {
    if (status === "approved") return "green";
    if (status === "rejected") return "red";
    return "orange";
  };

  /* =====================================================
     SIMPLE GRID (ALL COURSES - OLD STYLE)
  ===================================================== */
  const renderCourses = (courses) => {
    if (!courses.length) return <p>No courses found</p>;

    return (
      <div className="course-grid">
        {courses.map((course) => {
          const imageSrc =
            course.course_image_url ||
            (course.course_image
              ? `${API_BASE.replace("/api", "")}/${course.course_image}`
              : "/default-course.png");

          return (
            <div key={course.course_id} className="course-card">
              <img src={imageSrc} alt="" className="course-image" />

              <div className="course-info">
                <h3>{course.course_name}</h3>
                <p className="muted small">
                  Instructor: {course.instructor || "NA"}
                </p>
                <p className="muted small">
                  Duration: {course.duration_minutes || 0} mins
                </p>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  /* =====================================================
     UI
  ===================================================== */
  return (
    <div className="dashboard-app">
      <Sidebar />

      <div className="dashboard-main">
        <Header userName="System Superadmin" />

        <div className="dashboard-content">
          <div className="top-actions">
            <h2>Courses Dashboard</h2>

            <button
              className="qa-btn"
              onClick={() => navigate("/create-course")}
            >
              + Add Course
            </button>
          </div>

          {loading ? (
            <p>Loading...</p>
          ) : (
            <>
              {/* =====================================================
                  ALL COURSES (cards)
              ===================================================== */}
              <section>
                <h3>All Courses</h3>
                {renderCourses(allCourses)}
              </section>

              {/* =====================================================
                  NM PUBLISH TABLE (NEW)
              ===================================================== */}
              <section style={{ marginTop: "40px" }}>
                <h3>Publish Courses to NM</h3>

                {nmMessage && (
                  <div className="nm-toast">{nmMessage}</div>
                )}

                <table className="nm-table">
                  <thead>
                    <tr>
                      <th>Sl</th>
                      <th>Course Name</th>
                      <th>Unique Code</th>
                      <th>Action</th>
                      <th>Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {nmCourses.map((c, index) => (
                      <tr key={c.course_id}>
                        <td>{index + 1}</td>

                        <td>{c.course_name}</td>

                        <td>{c.course_unique_code}</td>

                        <td>
                          <button
                            disabled={
                              publishLoading === c.course_id ||
                              c.status !== "draft"
                            }
                            onClick={() => handlePublish(c.course_id)}
                          >
                            {publishLoading === c.course_id
                              ? "Sending..."
                              : "Send"}
                          </button>
                        </td>

                        <td
                          style={{
                            color: getStatusColor(c.nm_approval_status),
                            fontWeight: 600,
                          }}
                        >
                          {c.nm_approval_status}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
