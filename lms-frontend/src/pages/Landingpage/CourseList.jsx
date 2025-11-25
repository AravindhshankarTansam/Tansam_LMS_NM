import React, { useEffect, useState } from "react";
import { TextField, Chip, Button, Box, Autocomplete, Paper } from "@mui/material";
import ClearAllIcon from "@mui/icons-material/ClearAll";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const UPLOADS_BASE = import.meta.env.VITE_UPLOADS_BASE;

const CoursesPage = () => {
  const [courses, setCourses] = useState([]);
  const [selectedFilters, setSelectedFilters] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const coursesPerPage = 9;
  const navigate = useNavigate();

  // Fetch courses
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await fetch(`${API_BASE}/dashboard/courses`, { credentials: "include" });
        const data = await res.json();
        setCourses(data);
      } catch (err) {
        console.error("Error fetching courses:", err);
      }
    };
    fetchCourses();
  }, []);

  // Unique course names for filter
  const courseNames = [...new Set(courses.map((c) => c.course_name))];
  const filteredOptions = courseNames.filter((name) =>
    name.toLowerCase().includes(inputValue.toLowerCase())
  );

  // Filter courses based on selected filters
  const filteredCourses =
    selectedFilters.length === 0
      ? courses
      : courses.filter((c) => selectedFilters.includes(c.course_name));

  // Reset current page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedFilters]);

  // Pagination logic
  const totalPages = Math.max(Math.ceil(filteredCourses.length / coursesPerPage), 1);
  const indexOfLastCourse = currentPage * coursesPerPage;
  const indexOfFirstCourse = indexOfLastCourse - coursesPerPage;
  const currentCourses = filteredCourses.slice(indexOfFirstCourse, indexOfLastCourse);

  const changePage = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const handleMore = (course) => {
    navigate(`/courseinfo/${course.course_id}`, { state: { course } });
  };

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      <h1 style={{ textAlign: "center", marginBottom: "20px" }}>All our Courses</h1>

      {/* Search Box */}
      <Paper elevation={3} style={{ padding: "16px", borderRadius: "12px", marginBottom: "20px" }}>
        <Box display="flex" gap={2} alignItems="center" flexWrap="wrap" justifyContent="center">
          <Autocomplete
            multiple
            freeSolo
            options={filteredOptions}
            value={selectedFilters}
            inputValue={inputValue}
            onInputChange={(e, val) => setInputValue(val)}
            open={inputValue.length > 0}
            filterOptions={(x) => x}
            onChange={(e, newValue) => {
              setSelectedFilters(newValue);
              setInputValue("");
            }}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip {...getTagProps({ index })} key={option} label={option} color="primary" />
              ))
            }
            renderInput={(params) => <TextField {...params} label="Search courses…" />}
            sx={{ width: "350px" }}
          />

          {selectedFilters.length > 0 && (
            <Button
              color="error"
              variant="outlined"
              onClick={() => setSelectedFilters([])}
              startIcon={<ClearAllIcon />}
            >
              Reset
            </Button>
          )}
        </Box>
      </Paper>

      {/* Courses Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "20px",
        }}
      >
        {currentCourses.map((course) => {
          const uploadPath = course.course_image
            ? course.course_image.replace(/^.*uploads\//, "")
            : "";
          const imageURL = uploadPath ? `${UPLOADS_BASE}/${uploadPath}` : "/fallback.jpg";

          return (
            <div
              key={course.course_id}
              style={{
                background: "#fff",
                borderRadius: "10px",
                boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
                padding: "15px",
                textAlign: "center",
              }}
            >
              <img
                src={imageURL}
                alt={course.course_name}
                onError={(e) => (e.target.src = "/fallback.jpg")}
                style={{
                  width: "100%",
                  height: "180px",
                  objectFit: "cover",
                  borderRadius: "10px",
                  marginBottom: "10px",
                }}
              />
              <p style={{ fontWeight: "bold", marginBottom: "6px", fontSize: "1.1rem" }}>
                {course.course_name}
              </p>
              <div
                style={{
                  height: "60px",
                  display: "-webkit-box",
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  marginBottom: "10px",
                  fontSize: "0.9rem",
                }}
                dangerouslySetInnerHTML={{ __html: course.description || "" }}
              />
              <p style={{ fontWeight: "bold", marginBottom: "10px" }}>
                {course.pricing_type === "free" ? "Free" : `₹${course.price_amount}`}
              </p>
              <button
                style={{
                  backgroundColor: "#1976d2",
                  color: "white",
                  width: "100%",
                  padding: "10px",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "1rem",
                  fontWeight: "500",
                }}
                onClick={() => handleMore(course)}
              >
                View Course
              </button>
            </div>
          );
        })}
      </div>

      {filteredCourses.length === 0 && (
        <p style={{ textAlign: "center", marginTop: "20px" }}>No courses found.</p>
      )}

      {/* Pagination */}
      <div
        style={{
          textAlign: "center",
          marginTop: "30px",
          display: "flex",
          justifyContent: "center",
          gap: "8px",
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={() => changePage(currentPage - 1)}
          disabled={currentPage === 1}
          style={{
            padding: "8px 16px",
            borderRadius: "6px",
            border: "1px solid #1976d2",
            backgroundColor: "#fff",
            cursor: currentPage === 1 ? "not-allowed" : "pointer",
            opacity: currentPage === 1 ? 0.5 : 1,
          }}
        >
          Prev
        </button>

        {[...Array(totalPages)].map((_, index) => (
          <button
            key={index}
            onClick={() => changePage(index + 1)}
            style={{
              padding: "8px 16px",
              borderRadius: "6px",
              border: currentPage === index + 1 ? "1px solid #009999" : "1px solid #ccc",
              backgroundColor: currentPage === index + 1 ? "#009999" : "#fff",
              color: currentPage === index + 1 ? "#fff" : "#000",
              cursor: "pointer",
            }}
          >
            {index + 1}
          </button>
        ))}

        <button
          onClick={() => changePage(currentPage + 1)}
          disabled={currentPage === totalPages}
          style={{
            padding: "8px 16px",
            borderRadius: "6px",
            border: "1px solid #009999",
            backgroundColor: "#fff",
            cursor: currentPage === totalPages ? "not-allowed" : "pointer",
            opacity: currentPage === totalPages ? 0.5 : 1,
          }}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default CoursesPage;
