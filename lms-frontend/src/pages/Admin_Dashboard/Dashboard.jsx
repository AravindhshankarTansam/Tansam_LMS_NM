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
  const [approvedCourses, setApprovedCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [allRes, approvedRes] = await Promise.all([
          axios.get(`${API_BASE}/dashboard/courses`),
          axios.get(`${API_BASE}/dashboard/courses/dashboard/approved-courses`)
        ]);

        setAllCourses(allRes.data || []);
        setApprovedCourses(approvedRes.data || []);
      } catch (err) {
        console.error("Dashboard API error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const renderCourses = (courses) => {
    if (courses.length === 0) {
      return <p className="muted">No courses found</p>;
    }

    return (
      <div className="course-grid">
        {courses.map((course) => (
          <div className="course-card" key={course.course_id}>
            <img
              src={
                course.course_image_url
                  ? course.course_image_url
                  : course.course_image
                    ? `${import.meta.env.VITE_API_BASE_URL.replace("/api", "")}/${course.course_image}`
                    : "/default-course.png"
              }
              alt={course.course_name}
              className="course-image"
            />

            <div className="course-info">
              <h3>{course.course_name}</h3>
              <p className="muted small">
                Instructor: {course.instructor || "NA"}
              </p>
              <p className="muted small">
                Duration: {course.duration_minutes || 0} mins
              </p>
{/* 
              <button
                className="qa-btn"
                onClick={() => navigate(`/course/${course.course_id}`)}
              >
                View Course
              </button> */}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="dashboard-app">
      <Sidebar />
      <div className="dashboard-main">
        <Header userName="System Superadmin" />

        <div className="dashboard-content">
          <div className="top-actions">
            <h2 className="greeting">Courses Dashboard</h2>
            <button
              className="qa-btn"
              onClick={() => navigate("/create-course")}
            >
              + Add Course
            </button>
          </div>

          {loading ? (
            <p>Loading courses...</p>
          ) : (
            <>
              {/* 🔹 ALL COURSES */}
              <section>
                <h3>All Courses</h3>
                {renderCourses(allCourses)}
              </section>

              {/* 🔹 NM APPROVED COURSES */}
              <section style={{ marginTop: "32px" }}>
                <h3>NM Approved Courses</h3>
                {renderCourses(approvedCourses)}
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
