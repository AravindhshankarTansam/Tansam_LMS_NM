import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
  Box,
  CircularProgress,
  Button,
  AppBar,
  Toolbar,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import herologo from "../../assets/tansamoldlogo.png";

const CourseDetails = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [course, setCourse] = useState(location.state?.course || null);
  const [structure, setStructure] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `http://localhost:5000/api/dashboard/courses/course-structure/${id}`,
          { credentials: "include" }
        );
        const data = await res.json();
        // Expecting { course: {...}, modules: [...] }
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
  if (!course) return <Typography variant="h6">Course not found.</Typography>;

  return (
    <Box>
      {/* ===== Sticky Navbar ===== */}
      <AppBar
        position="sticky"
        color="default"
        sx={{ boxShadow: 3, backgroundColor: "#009999" }}
      >
        <Toolbar sx={{ justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <img
              src={herologo}
              alt="Logo"
              style={{ height: 50, marginRight: 16 }}
            />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              TANSAM-LMS
            </Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 3 }}>
            <Button onClick={() => navigate("/")} color="inherit">
              Home
            </Button>
            <Button
              onClick={() =>
                window.scrollTo({ top: 600, behavior: "smooth" })
              }
              color="inherit"
            >
              Courses
            </Button>
            <Button
              onClick={() =>
                window.scrollTo({ top: 1200, behavior: "smooth" })
              }
              color="inherit"
            >
              Testimonials
            </Button>
          </Box>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate("/login")}
          >
            Login
          </Button>
        </Toolbar>
      </AppBar>
       {/* ===== Back Button ===== */}
      <Box sx={{ textAlign: "center", mb: 5 }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/")}
        >
          Back
        </Button>
      </Box>

      {/* ===== Course Header ===== */}
     {/* ===== Course Header ===== */}
<Box sx={{ textAlign: "center", mt: 5, px: 2 }}>
  <Typography
    variant="h3"
    gutterBottom
    sx={{ fontWeight: 700, letterSpacing: 0.5 }}
  >
    {course.course_name}
  </Typography>

  {course.course_image && (
    <Box
      component="img"
      src={
        course.course_image.startsWith("http")
          ? course.course_image
          : `http://localhost:5000/${course.course_image}`
      }
      alt={course.course_name}
      sx={{
        maxWidth: "450px",
        width: "100%",
        height: "auto",
        borderRadius: 3,
        mt: 2,
        mb: 2,
        boxShadow: 3,
      }}
    />
  )}

  {/* Left-aligned description only */}
<Box
  sx={{
    textAlign: "left",
    maxWidth: "800px",  // restrict width for readability
    mx: "auto",         // keep the box centered horizontally
    mb: 4,              // margin bottom
    lineHeight: 1.8,    // spacing between lines
  }}
>
  <Typography variant="body1" color="text.secondary">
    {course.description}
  </Typography>
</Box>


  <Typography
    variant="h5"
    color="primary"
    sx={{ fontWeight: 600, mb: 5 }}
  >
    {course.pricing_type === "free" ? "Free" : `₹${course.price_amount}`}
  </Typography>
</Box>



      {/* ===== Modules & Chapters ===== */}
      <Box sx={{ px: { xs: 2, md: 4 }, mb: 8 }}>
        {structure.length === 0 ? (
          <Typography>No modules available for this course.</Typography>
        ) : (
          <Grid container spacing={4}>
            {structure.map((mod, idx) => (
              <Grid item xs={12} md={6} key={mod.module_id}>
                <Card
                  sx={{
                    borderRadius: 3,
                    boxShadow: 4,
                    transition: "0.3s",
                    "&:hover": { boxShadow: 6, transform: "translateY(-4px)" },
                  }}
                >
                  <CardContent>
                    <Typography
                      variant="h6"
                      gutterBottom
                      color="secondary"
                      sx={{ fontWeight: 600 }}
                    >
                      {idx + 1}. {mod.module_name}
                    </Typography>
                    {mod.chapters.length === 0 ? (
                      <Typography color="text.secondary">
                        No chapters in this module.
                      </Typography>
                    ) : (
                      <List>
                        {mod.chapters.map((chap, cidx) => (
                          <React.Fragment key={chap.chapter_id}>
                            <ListItem
                              sx={{
                                pl: 0,
                                py: 0.5,
                              }}
                            >
                              <ListItemText
                                primary={`${idx + 1}.${cidx + 1} ${chap.chapter_name}`}
                                primaryTypographyProps={{
                                  variant: "body1",
                                  sx: { fontWeight: 500 },
                                }}
                              />
                            </ListItem>
                            {cidx !== mod.chapters.length - 1 && <Divider />}
                          </React.Fragment>
                        ))}
                      </List>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

     
    </Box>
  );
};

export default CourseDetails;
