// LMS/lms-frontend/src/pages/User_dashboard/CoursePlayer.jsx
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
  const [enrollments, setEnrollments] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const coursesPerPage = 12;

  // Fetch all courses
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
      }
    };
    fetchCourses();
  }, []);

  // Fetch logged-in user
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

  // Filter only courses the user is enrolled in
  const enrolledCourses = courses.filter((course) =>
    enrollments.some((e) => e.course_id === course.course_id)
  );

  // Apply search and category filters
  const filteredCourses = enrolledCourses.filter((course) => {
    const matchesSearch = course.course_name
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesCategory =
      category === "all" ||
      course.category_name?.toLowerCase() === category.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  // Pagination
  const indexOfLastCourse = currentPage * coursesPerPage;
  const indexOfFirstCourse = indexOfLastCourse - coursesPerPage;
  const currentCourses = filteredCourses.slice(
    indexOfFirstCourse,
    indexOfLastCourse
  );
  const totalPages = Math.ceil(filteredCourses.length / coursesPerPage);

  const changePage = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const handleSearch = (value) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handleCategory = (value) => {
    setCategory(value);
    setCurrentPage(1);
  };

  const openCourse = (course) => {
    navigate(`/mycourse/${course.course_id}`);
  };

  if (loading) return <p>Loading...</p>;

  const profile = user?.profile || {};
  const fullName = profile.full_name || "User";
  const initial = fullName.charAt(0).toUpperCase();
  const imageUrl = profile.image_path
    ? `${UPLOADS_BASE}/${profile.image_path.replace(/^.*uploads\//, "")}`
    : null;

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#f9fafb" }}>
      <Sidebar />

      <div className="cp-dashboard">
        {/* USER INFO: full-width, blue background */}
        <div
          className="cp-user-info-fullwidth"
          style={{
            width: "100%",
            backgroundColor: "#1E3A8A", // blue
            color: "white",
            padding: "20px 40px",
            display: "flex",
            alignItems: "center",
            gap: "20px",
            borderRadius:'50px',
          }}
        >
          {user ? (
            <>
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={fullName}
                  className="cp-user-avatar"
                  style={{
                    width: "70px",
                    height: "70px",
                    borderRadius: "50%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <div
                  className="cp-user-initial"
                  style={{
                    width: "70px",
                    height: "70px",
                    borderRadius: "50%",
                    backgroundColor: "#2563EB",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "2rem",
                    fontWeight: "bold",
                  }}
                >
                  {initial}
                </div>
              )}
              <div>
                <h3 style={{ margin: 0 }}>{fullName}</h3>
                <p style={{ margin: 0 }}>{profile.user_email || user.email}</p>
              </div>
            </>
          ) : (
            <p>Loading user info...</p>
          )}
        </div>

        <div className="cp-container">
          {/* COURSES SECTION */}
          <section className="cp-section">
            <div className="cp-header-row">
              <h2 className="cp-title">Courses</h2>
            </div>

            <div className="cp-course-grid">
              {currentCourses.length === 0 && <p>No enrolled courses found.</p>}

              {currentCourses.map((course) => (
                <div className="cp-card" key={course.course_id}>
                  <img
                    src={`${UPLOADS_BASE}/${course.course_image?.replace(
                      /^.*uploads\//,
                      ""
                    )}`}
                    alt={course.course_name}
                    className="cp-img"
                    onError={(e) => (e.target.src = "/fallback.jpg")}
                  />
                  <div className="cp-info">
                    <h3>{course.course_name}</h3>
                    <p
                      dangerouslySetInnerHTML={{
                        __html: course.description || "",
                      }}
                    ></p>
                    <button
                      className="cp-start-btn"
                      onClick={() => openCourse(course)}
                    >
                      Start
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* PAGINATION */}
            {/* <div className="cp-pagination">
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
                  className={`cp-page-box ${
                    currentPage === idx + 1 ? "active" : ""
                  }`}
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
            </div> */}
          </section>
        </div>
      </div>
    </Box>
  );
}
