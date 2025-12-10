import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../Sidebar/sidebar";
import { Box } from "@mui/material";
import "./CoursePlayer.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const UPLOADS_BASE = import.meta.env.VITE_UPLOADS_BASE;

export default function CoursePlayer() {
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const coursesPerPage = 12;

  // Fetch courses
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await fetch(`${API_BASE}/dashboard/courses`, {
          credentials: "include",
        });
        const data = await res.json();
        setCourses(data);
        setFilteredCourses(data);
      } catch (err) {
        console.error("Error fetching courses:", err);
      }
    };
    fetchCourses();
  }, []);

  // Fetch current user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/me`, {
          credentials: "include",
        });
        const data = await res.json();
        setUser(data.user);
      } catch (err) {
        console.error("Error fetching user:", err);
      }
    };
    fetchUser();
  }, []);

  // Fetch user enrollments
  useEffect(() => {
    if (!user) return;

    const fetchEnrollments = async () => {
      try {
        const res = await fetch(`${API_BASE}/dashboard/enrollments`, {
          credentials: "include",
        });
        const data = await res.json();
        setEnrollments(data);
      } catch (err) {
        console.error("Error fetching enrollments:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEnrollments();
  }, [user]);

  // Helper to check if course is enrolled
  const isEnrolled = (courseId) => {
    return enrollments.some((e) => e.course_id === courseId);
  };

  // Apply filters
  const applyFilters = (searchValue, categoryValue) => {
    let result = courses;

    if (searchValue.trim()) {
      result = result.filter((course) =>
        course.course_name.toLowerCase().includes(searchValue.toLowerCase())
      );
    }

    if (categoryValue !== "all") {
      result = result.filter(
        (course) =>
          course.category_name?.toLowerCase() === categoryValue.toLowerCase()
      );
    }

    setFilteredCourses(result);
    setCurrentPage(1);
  };

  const handleSearch = (value) => {
    setSearch(value);
    applyFilters(value, category);
  };

  const handleCategory = (value) => {
    setCategory(value);
    applyFilters(search, value);
  };

  const openCourse = (course) => {
    navigate(`/mycourse/${course.course_id}`);
  };

  if (loading) return <p>Loading...</p>;

  // Pagination
  const indexOfLastCourse = currentPage * coursesPerPage;
  const indexOfFirstCourse = indexOfLastCourse - coursesPerPage;
  const currentCourses = filteredCourses.slice(indexOfFirstCourse, indexOfLastCourse);
  const totalPages = Math.ceil(filteredCourses.length / coursesPerPage);

  const changePage = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#f9fafb" }}>
      <Sidebar />
      <div className="cp-dashboard">
        <div className="cp-container">
          <section className="cp-section">
            <div className="cp-header-row">
              <h2 className="cp-title">All Courses</h2>
              <div className="cp-header-controls">
                <input
                  type="text"
                  className="cp-search-input"
                  placeholder="Search courses..."
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="cp-course-grid">
              {currentCourses.length === 0 && <p>No matching courses found.</p>}

              {currentCourses.map((course) => {
                const enrolled = isEnrolled(course.course_id);

                return (
                  <div className="cp-card" key={course.course_id}>
                    <img
                      src={`${UPLOADS_BASE}/${course.course_image?.replace(/^.*uploads\//, "")}`}
                      alt={course.course_name}
                      className="cp-img"
                      onError={(e) => (e.target.src = "/fallback.jpg")}
                    />
                    <div className="cp-info">
                      <h3>{course.course_name}</h3>
                      <p dangerouslySetInnerHTML={{ __html: course.description || "" }}></p>

                      {enrolled ? (
                        <button
                          className="cp-start-btn"
                          onClick={() => openCourse(course)}
                        >
                          Start Learning
                        </button>
                      ) : (
                        <button
                          className="cp-enroll-btn"
                          onClick={() =>
                            navigate("/login", {
                              state: { fromEnroll: true, courseId: course.course_id },
                            })
                          }
                        >
                          Enroll
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="cp-pagination">
              <button
                className="cp-pagination-btn"
                onClick={() => changePage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Prev
              </button>

              {[...Array(totalPages)].map((_, idx) => (
                <button
                  key={idx}
                  className={`cp-page-box ${currentPage === idx + 1 ? "active" : ""}`}
                  onClick={() => changePage(idx + 1)}
                >
                  {idx + 1}
                </button>
              ))}

              <button
                className="cp-pagination-btn"
                onClick={() => changePage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          </section>
        </div>
      </div>
    </Box>
  );
}
