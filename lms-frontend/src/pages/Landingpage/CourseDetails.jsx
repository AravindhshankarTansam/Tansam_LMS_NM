import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import "./CourseDetails.css";
import herologo from "../../assets/tansamoldlogo.png";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const UPLOADS_BASE = import.meta.env.VITE_UPLOADS_BASE;

// Add this line
export const COURSE_API = `${API_BASE}/dashboard/courses`;

const CourseDetails = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [course, setCourse] = useState(location.state?.course || null);
  const [structure, setStructure] = useState([]);
  const [loading, setLoading] = useState(true);
  const [readMore, setReadMore] = useState(false);

  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `${COURSE_API}/course-structure/${id}`,
          { credentials: "include" }
        );
        const data = await res.json();

        if (data.course) setCourse(data.course);
        if (data.modules) setStructure(data.modules);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourseData();
  }, [id]);

  if (loading)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 5 }}>
        <CircularProgress />
      </Box>
    );

  if (!course) return <Typography>Course not found.</Typography>;

  return (
   <Box className="course-details-page">

      {/* BACK BUTTON */}
   {/* ===== TOP HEADER NAVBAR ===== */}
<nav className="cd-navbar">
  <div className="cd-logo-container" onClick={() => navigate("/")}>
    <img src={herologo} alt="Logo" className="cd-logo-img" />
  </div>

  <ul className="cd-nav-links">
    <li onClick={() => navigate("/")}>Home</li>
    <li onClick={() => navigate("/#courses")}>Courses</li>
    <li onClick={() => navigate("/#testimonials")}>Testimonials</li>
  </ul>

  <Button
    variant="contained"
    className="cd-login-btn"
    onClick={() => navigate("/login")}
  >
    Login
  </Button>
</nav>

{/* BACK BUTTON SECTION */}
<Box className="cd-back-btn">
  <Button
    variant="outlined"
    startIcon={<ArrowBackIcon />}
    onClick={() => navigate("/")}
    sx={{ borderRadius: 2, px: 3, fontWeight: 600 }}
  >
    Back
  </Button>
</Box>

      {/* TOP SECTION */}
      <Box className="cd-top-new">
        {/* TITLE */}
        <h1 className="cd-title-new">
          {course.course_name}
          <span className="cd-price-new">
            (
            {course.pricing_type === "free"
              ? "Free"
              : `Paid - ₹${course.price_amount}`}
            )
          </span>
        </h1>

        {/* IMAGE */}
        {course.course_image && (
          <div className="cd-image-wrapper-new">
            <img
              src={`${UPLOADS_BASE}/${course.course_image.replace(/^.*uploads\//, "")}`}
              alt={course.course_name}
              className="cd-image-new"
              onError={(e) => (e.target.src = "/fallback.jpg")}
            />
          </div>
        )}

        {/* FULL HTML DESCRIPTION WITH READ MORE */}
        <div
          className={`cd-description ${readMore ? "expand" : ""}`}
          dangerouslySetInnerHTML={{ __html: course.description || "" }}
          onClick={() => setReadMore(!readMore)}
        />

        {/* Read More Button */}
        <button
          className="cd-readmore-btn"
          onClick={() => setReadMore(!readMore)}
        >
          {readMore ? "Read Less " : "Read More"}
        </button>
      </Box>

      {/* MODULES */}
      <Box sx={{ maxWidth: "900px", mx: "auto", mt: 6 }}>
        <Typography
          variant="h4"
          sx={{ fontWeight: 700, mb: 3, textAlign: "center", color: "#009999" }}
        >
          Course Modules
        </Typography>

        {structure.length === 0 ? (
          <Typography textAlign="center">No modules available.</Typography>
        ) : (
          structure.map((mod, idx) => (
            <Accordion
              key={mod.module_id}
              sx={{
                mb: 2,
                borderRadius: "12px !important",
                boxShadow: "0px 4px 15px rgba(0,0,0,0.1)",
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography sx={{ fontSize: "18px", fontWeight: 600, color: "#009999" }}>
                  {idx + 1}. {mod.module_name}
                </Typography>
              </AccordionSummary>

              <AccordionDetails>
                {mod.chapters.length === 0 ? (
                  <Typography sx={{ pl: 2 }}>No chapters available.</Typography>
                ) : (
                  <List>
                    {mod.chapters.map((chap) => (
                      <ListItem key={chap.chapter_id}>
                        <ListItemText
                          primary={`• ${chap.chapter_name}`}
                          primaryTypographyProps={{
                            fontSize: "16px",
                            fontWeight: 500,
                          }}
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </AccordionDetails>
            </Accordion>
          ))
        )}
      </Box>
    </Box>
  );
};

export default CourseDetails;