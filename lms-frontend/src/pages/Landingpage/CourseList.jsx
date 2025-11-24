import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  TextField,
  Chip,
  Button,
  Box,
  Autocomplete,
  Paper,
} from "@mui/material";
import ClearAllIcon from "@mui/icons-material/ClearAll";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const UPLOADS_BASE = import.meta.env.VITE_UPLOADS_BASE;

const CoursesPage = () => {
  const [courses, setCourses] = useState([]);
  const [selectedFilters, setSelectedFilters] = useState([]);
  const [inputValue, setInputValue] = useState("");
   const navigate = useNavigate();

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

  // Unique course names
  const courseNames = [...new Set(courses.map((c) => c.course_name))];

  // Show only matching options
  const filteredOptions = courseNames.filter((name) =>
    name.toLowerCase().includes(inputValue.toLowerCase())
  );

  // Filter courses on selected names
  const filteredCourses =
    selectedFilters.length === 0
      ? courses
      : courses.filter((c) => selectedFilters.includes(c.course_name));

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      <h1 style={{ textAlign: "center", marginBottom: "20px" }}>All our Courses</h1>

      {/* Search Box */}
      <Paper
        elevation={3}
        style={{
          padding: "16px",
          borderRadius: "12px",
          marginBottom: "20px",
        }}
      >
        <Box
          display="flex"
          gap={2}
          alignItems="center"
          flexWrap="wrap"
          justifyContent="center"
        >
          <Autocomplete
            multiple
            freeSolo
            options={filteredOptions}
            value={selectedFilters}
            inputValue={inputValue}
            onInputChange={(e, val) => setInputValue(val)}
            open={inputValue.length > 0} // Only open when typing
            filterOptions={(x) => x} // Do not filter automatically
            onChange={(e, newValue) => {
              setSelectedFilters(newValue);
              setInputValue(""); // Clear after select
            }}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  {...getTagProps({ index })}
                  key={option}
                  label={option}
                  color="primary"
                />
              ))
            }
            renderInput={(params) => (
              <TextField {...params} label="Search courses…" />
            )}
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
        {filteredCourses.map((course) => {
          const uploadPath = course.course_image
            ? course.course_image.replace(/^.*uploads\//, "")
            : "";

          const imageURL = uploadPath
            ? `${UPLOADS_BASE}/${uploadPath}`
            : "/fallback.jpg";

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

              <p
                style={{
                  fontWeight: "bold",
                  marginBottom: "6px",
                  fontSize: "1.1rem",
                }}
              >
                {course.course_name}
              </p>

              {/* 3-line truncated description */}
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
                dangerouslySetInnerHTML={{
                  __html: course.description || "",
                }}
              />

              <p style={{ fontWeight: "bold", marginBottom: "10px" }}>
                {course.pricing_type === "free"
                  ? "Free"
                  : `₹${course.price_amount}`}
              </p>

              {/* VIEW COURSE BUTTON */}
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
                onClick={() => navigate(`/courseinfo/${course.course_id}`, { state: { course } })}
              >
                View Course
              </button>
            </div>
          );
        })}
      </div>

      {filteredCourses.length === 0 && (
        <p style={{ textAlign: "center", marginTop: "20px" }}>
          No courses found.
        </p>
      )}
    </div>
  );
};

export default CoursesPage;
