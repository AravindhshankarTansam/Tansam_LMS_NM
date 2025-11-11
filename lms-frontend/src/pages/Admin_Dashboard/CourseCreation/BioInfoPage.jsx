import React from "react";
import {
  Box,
  Typography,
  Grid,
  Button,
  Card,
  CardContent,
  CardMedia,
} from "@mui/material";
import { Add, Edit, Delete, Image, ListAlt } from "@mui/icons-material"; // ✅ Added ListAlt icon
import { useNavigate } from "react-router-dom"; // ✅ Added navigate hook
import { COURSE_API } from "../../../config/apiConfig";

export default function BasicInfoTab({
  savedCourses,
  setSavedCourses,
  openAddEditCourse,
  openEditCourse,
}) {
  const navigate = useNavigate(); // ✅ Initialize navigate

  const IMAGE_BASE =
    import.meta.env.VITE_API_BASE_URL?.replace(/\/api\/?$/, "") ||
    "http://localhost:5000";

  const deleteSavedCourse = async (courseId) => {
    if (!window.confirm("Are you sure you want to delete this course?")) return;

    try {
      const token = localStorage.getItem("token");

      const res = await fetch(`${COURSE_API}/${courseId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Delete failed: ${res.status} - ${errText}`);
      }

      setSavedCourses((prev) => prev.filter((c) => c.course_id !== courseId));
      console.log(`🗑️ Course ${courseId} deleted successfully`);
    } catch (error) {
      console.error("❌ Error deleting course:", error);
      alert("Failed to delete course. Check console for details.");
    }
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h6">Course List</Typography>
        <Button startIcon={<Add />} variant="contained" onClick={openAddEditCourse}>
          Add Course
        </Button>
      </Box>

      {savedCourses.length > 0 ? (
        <Grid container spacing={2}>
          {savedCourses.map((course) => {
            const imagePath =
              course.course_image?.replace(/\\/g, "/")?.replace(/^\/+/, "") || "";
            const imageUrl = imagePath ? `${IMAGE_BASE}/${imagePath}` : null;

            return (
              <Grid item xs={12} sm={6} md={4} key={course.course_id}>
                <Card
                  sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    borderRadius: 2,
                    boxShadow: 2,
                  }}
                >
                  {imageUrl ? (
                    <CardMedia
                      component="img"
                      image={imageUrl}
                      alt={course.course_name}
                      sx={{ width: "100%", height: 250, objectFit: "cover" }}
                    />
                  ) : (
                    <Box
                      sx={{
                        height: 160,
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        bgcolor: "#f0f0f0",
                      }}
                    >
                      <Image sx={{ fontSize: 48, color: "#ccc" }} />
                    </Box>
                  )}

                  <CardContent sx={{ flex: 1 }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {course.course_name}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 1 }}
                    >
                      {course.overview || "No overview available"}
                    </Typography>

                    <Box sx={{ mb: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        Category:{" "}
                        <strong>{course.category_name || "N/A"}</strong>
                      </Typography>
                    </Box>

                    <Box sx={{ mb: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        Pricing:{" "}
                        <strong>
                          {course.pricing_type === "paid"
                            ? `₹${course.price_amount}`
                            : "Free"}
                        </strong>
                      </Typography>
                    </Box>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {course.description || "No description provided"}
                    </Typography>
                  </CardContent>

                  {/* ✅ Actions section */}
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: 1,
                      p: 1,
                      pt: 0,
                    }}
                  >
                    <Button
                      size="small"
                      startIcon={<Edit />}
                      onClick={() => openEditCourse(course)}
                    >
                      Edit
                    </Button>

                    {/* ✅ Manage Modules Button */}
                   <Button
                      variant="outlined"
                      size="small"
                      onClick={() => navigate(`/admin/course/${course.course_id}/modules`)}
                    >
                      Manage Modules
                    </Button>


                    <Button
                      size="small"
                      color="error"
                      startIcon={<Delete />}
                      onClick={() => deleteSavedCourse(course.course_id)}
                    >
                      Delete
                    </Button>
                  </Box>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      ) : (
        <Typography color="text.secondary">
          No courses added yet. Click “Add Course” to create one.
        </Typography>
      )}
    </Box>
  );
}
