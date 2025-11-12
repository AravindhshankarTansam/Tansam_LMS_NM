import React, { useState, useEffect, useRef } from "react";
import {
  Paper,
  Tabs,
  Tab,
  Stack,
  Button,
  Typography,
  CircularProgress,
  TextField,
  MenuItem,
  TextareaAutosize,
  Chip,
  Snackbar,
  Alert,
} from "@mui/material";
import { Save, Publish, Add } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import Sidebar from "../Sidebar";
import CurriculumTab from "./Curriculum";
import AddEditCourseDialog from "./AddEditCourseDialog";
import AddLessonDialog from "./AddLessonDialog";
import { COURSE_API } from "../../../config/apiConfig";
import { Box } from "@mui/material";

export default function CourseCreateForm() {
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [savedCourses, setSavedCourses] = useState([]);
  const [modules, setModules] = useState([]);

  // Dialog states
  const [addEditCourseOpen, setAddEditCourseOpen] = useState(false);
  const [lessonDialogOpen, setLessonDialogOpen] = useState(false);
  const [currentModuleId, setCurrentModuleId] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);

  // Inline Add Course form
  const [showAddCourseForm, setShowAddCourseForm] = useState(false);
  const [newCourseName, setNewCourseName] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newOverview, setNewOverview] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [coverFile, setCoverFile] = useState(null);
  const [promoFile, setPromoFile] = useState(null);
  const coverInputRef = useRef(null);
  const promoInputRef = useRef(null);
  const [saving, setSaving] = useState(false);

  // Snackbar
  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMsg, setSnackMsg] = useState("");
  const [snackSeverity, setSnackSeverity] = useState("success");

  const token = localStorage.getItem("token");

  // Tabs
  const handleTabChange = (e, v) => setTab(v);

  // Fetch courses
  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await fetch(COURSE_API, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch courses");
      const data = await res.json();
      setSavedCourses(data || []);
    } catch (error) {
      console.error("❌ Fetch error:", error);
      setSnackMsg("Failed to fetch courses");
      setSnackSeverity("error");
      setSnackOpen(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  // Add course handler
  const handleAddCourse = () => {
    setShowAddCourseForm(true);
    setNewCourseName("");
    setNewCategory("");
    setNewOverview("");
    setNewDescription("");
    setCoverFile(null);
    setPromoFile(null);
  };

  const handleEditCourse = (course) => {
    setSelectedCourse(course);
    setAddEditCourseOpen(true);
  };

  // Delete course
  const deleteCourse = async (courseId) => {
    if (!window.confirm("Delete this course?")) return;
    try {
      const res = await fetch(`${COURSE_API}/${courseId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Delete failed");
      setSavedCourses((prev) => prev.filter((c) => c.course_id !== courseId));
      setSnackMsg("Course deleted successfully");
      setSnackSeverity("success");
      setSnackOpen(true);
    } catch (err) {
      console.error(err);
      setSnackMsg("Failed to delete course");
      setSnackSeverity("error");
      setSnackOpen(true);
    }
  };

  // ✅ Add new course API call (FormData)
  const saveNewCourse = async () => {
    if (!newCourseName || !newCategory) {
      setSnackMsg("Please fill in all required fields.");
      setSnackSeverity("warning");
      setSnackOpen(true);
      return;
    }

    const formData = new FormData();
    formData.append("course_name", newCourseName);
    formData.append("category_name", newCategory);
    formData.append("overview", newOverview);
    formData.append("description", newDescription);
    formData.append("pricing_type", "free");
    if (coverFile) formData.append("course_image", coverFile);
    if (promoFile) formData.append("promo_video", promoFile);

    try {
      setSaving(true);
      const res = await fetch(COURSE_API, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Save failed: ${res.status} - ${errText}`);
      }

      setSnackMsg("Course added successfully");
      setSnackSeverity("success");
      setSnackOpen(true);
      setShowAddCourseForm(false);
      await fetchCourses(); // refresh course list
    } catch (err) {
      console.error(err);
      setSnackMsg("Failed to save course");
      setSnackSeverity("error");
      setSnackOpen(true);
    } finally {
      setSaving(false);
    }
  };

  const IMAGE_BASE =
    import.meta.env.VITE_API_BASE_URL?.replace(/\/api\/?$/, "") ||
    "http://localhost:5000";

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#f9fafb" }}>
      <Sidebar />
      <Box sx={{ flex: 1, p: 3 }}>
        {/* Header */}
        <Paper sx={{ p: 2, mb: 2 }} elevation={2}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h5" fontWeight="bold">
              Course Management
            </Typography>
            <Stack direction="row" spacing={1}>
              <Button startIcon={<Add />} variant="outlined" onClick={handleAddCourse}>
                Add Course
              </Button>
              <Button startIcon={<Save />} variant="outlined">
                Save Draft
              </Button>
              <Button startIcon={<Publish />} variant="contained">
                Publish
              </Button>
            </Stack>
          </Stack>
        </Paper>

        {showAddCourseForm ? (
          <Box sx={{ display: "flex", gap: 5 }}>
            {/* Left panel */}
            <Box sx={{ flex: 2 }}>
              <TextField
                fullWidth
                label="Course Name"
                value={newCourseName}
                onChange={(e) => setNewCourseName(e.target.value)}
                sx={{ mb: 2 }}
              />
              <TextField
                select
                fullWidth
                label="Category"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                sx={{ mb: 2 }}
              >
                <MenuItem value="Web Development">Web Development</MenuItem>
                <MenuItem value="Design">Design</MenuItem>
                <MenuItem value="Business">Business</MenuItem>
              </TextField>
              <TextField
                fullWidth
                label="Overview"
                value={newOverview}
                onChange={(e) => setNewOverview(e.target.value)}
                sx={{ mb: 2 }}
              />
              <TextareaAutosize
                minRows={5}
                placeholder="Description"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "6px",
                  border: "1px solid #ddd",
                  marginBottom: "12px",
                }}
              />
              <Stack direction="row" spacing={2}>
                <Button variant="contained" onClick={saveNewCourse} disabled={saving}>
                  {saving ? "Saving..." : "Save"}
                </Button>
                <Button variant="outlined" onClick={() => setShowAddCourseForm(false)}>
                  Cancel
                </Button>
              </Stack>
            </Box>

            {/* Right panel - Uploads */}
            <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  textAlign: "center",
                  border: "2px dashed #ddd",
                  borderRadius: 2,
                }}
              >
                <Typography>Cover Image</Typography>
                {coverFile ? (
                  <Chip label={coverFile.name} onDelete={() => setCoverFile(null)} />
                ) : (
                  <Button onClick={() => coverInputRef.current.click()}>Upload</Button>
                )}
                <input
                  ref={coverInputRef}
                  type="file"
                  hidden
                  onChange={(e) => setCoverFile(e.target.files[0])}
                />
              </Paper>
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  textAlign: "center",
                  border: "2px dashed #ddd",
                  borderRadius: 2,
                }}
              >
                <Typography>Promo Video</Typography>
                {promoFile ? (
                  <Chip label={promoFile.name} onDelete={() => setPromoFile(null)} />
                ) : (
                  <Button onClick={() => promoInputRef.current.click()}>Upload</Button>
                )}
                <input
                  ref={promoInputRef}
                  type="file"
                  hidden
                  onChange={(e) => setPromoFile(e.target.files[0])}
                />
              </Paper>
            </Box>
          </Box>
        ) : (
          <Paper elevation={1} sx={{ display: "flex" }}>
            <Tabs
              value={tab}
              onChange={handleTabChange}
              orientation="vertical"
              sx={{ minWidth: 180, borderRight: 1, borderColor: "divider" }}
            >
              <Tab label="Basic Info" />
              <Tab label="Curriculum" />
            </Tabs>
            <Box sx={{ flex: 1, p: 3 }}>
              {loading ? (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: 300,
                  }}
                >
                  <CircularProgress />
                </Box>
              ) : (
                <>
                  {tab === 0 && (
                    <Box>
                      {savedCourses.length > 0 ? (
                        <Stack spacing={2}>
                          {savedCourses.map((course) => (
                            <Paper
                              key={course.course_id}
                              sx={{
                                p: 2,
                                display: "flex",
                                alignItems: "center",
                                gap: 2,
                              }}
                            >
                              {course.course_image && (
                                <Box
                                  component="img"
                                  src={`${IMAGE_BASE}/${course.course_image}`}
                                  alt={course.course_name}
                                  sx={{
                                    width: 80,
                                    height: 80,
                                    objectFit: "cover",
                                    borderRadius: 1,
                                  }}
                                />
                              )}

                              <Box sx={{ flex: 1 }}>
                                <Typography fontWeight="bold">{course.course_name}</Typography>
                                <Typography variant="caption">{course.overview}</Typography>
                              </Box>

                              <Stack direction="row" spacing={1}>
                                <Button size="small" onClick={() => handleEditCourse(course)}>
                                  Edit
                                </Button>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  onClick={() =>
                                    navigate(`/admin/course/${course.course_id}/modules`)
                                  }
                                >
                                  Manage Modules
                                </Button>
                                <Button
                                  size="small"
                                  color="error"
                                  onClick={() => deleteCourse(course.course_id)}
                                >
                                  Delete
                                </Button>
                              </Stack>
                            </Paper>
                          ))}
                        </Stack>
                      ) : (
                        <Typography>No courses yet</Typography>
                      )}
                    </Box>
                  )}
                  {tab === 1 && (
                    <CurriculumTab
                      modules={modules}
                      setModules={setModules}
                      openLessonDialog={(modId) => {
                        setCurrentModuleId(modId);
                        setLessonDialogOpen(true);
                      }}
                    />
                  )}
                </>
              )}
            </Box>
          </Paper>
        )}

        {/* Dialogs */}
        <AddEditCourseDialog
          open={addEditCourseOpen}
          onClose={() => {
            setAddEditCourseOpen(false);
            setSelectedCourse(null);
            fetchCourses();
          }}
          savedCourses={savedCourses}
          setSavedCourses={setSavedCourses}
          editCourse={selectedCourse}
        />
        <AddLessonDialog
          open={lessonDialogOpen}
          onClose={() => setLessonDialogOpen(false)}
          modules={modules}
          setModules={setModules}
          currentModuleId={currentModuleId}
        />

        {/* Snackbar */}
        <Snackbar
          open={snackOpen}
          autoHideDuration={3000}
          onClose={() => setSnackOpen(false)}
        >
          <Alert severity={snackSeverity}>{snackMsg}</Alert>
        </Snackbar>
      </Box>
    </Box>
  );
}
