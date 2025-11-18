import React, { useState, useEffect, useRef } from "react";
import {
  Box,
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
  Radio,
  RadioGroup,
  FormControl,
  FormControlLabel,
  FormLabel,
} from "@mui/material";
import { Save, Publish, Add } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import Sidebar from "../Sidebar";
import CurriculumTab from "./Curriculum";
import { COURSE_API, COURSE_CATEGORY_API } from "../../../config/apiConfig";

export default function CourseCreateForm() {
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [savedCourses, setSavedCourses] = useState([]);
  const [modules, setModules] = useState([]);

  // Inline Add/Edit Course form
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [newCourseName, setNewCourseName] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newOverview, setNewOverview] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [coverFile, setCoverFile] = useState(null);
  const [promoFile, setPromoFile] = useState(null);
  const [courseStatus, setCourseStatus] = useState("active");
  const [pricingType, setPricingType] = useState("free");
  const [pricingAmount, setPricingAmount] = useState("");
  const coverInputRef = useRef(null);
  const promoInputRef = useRef(null);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);

  // Snackbar
  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMsg, setSnackMsg] = useState("");
  const [snackSeverity, setSnackSeverity] = useState("success");

  const IMAGE_BASE =
    import.meta.env.VITE_API_BASE_URL?.replace(/\/api\/?$/, "") ||
    "http://localhost:5000";

  // Tabs
  const handleTabChange = (e, v) => setTab(v);

  // Fetch all courses
  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await fetch(COURSE_API, {
        method: "GET",
        credentials: "include",
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

  // Fetch categories
const fetchCategories = async () => {
  try {
    const res = await fetch(COURSE_CATEGORY_API, {
      method: "GET",
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to fetch categories");
    const data = await res.json();

    // Unwrap nested array if needed
    const categoryList = Array.isArray(data[0]) ? data[0] : data;
    setCategories(categoryList || []);
  } catch (err) {
    console.error("Error fetching categories:", err);
  }
};


  useEffect(() => {
    fetchCategories();
    fetchCourses();
  }, []);

  // Reset form
  const resetForm = () => {
    setNewCourseName("");
    setNewCategory("");
    setNewOverview("");
    setNewDescription("");
    setCoverFile(null);
    setPromoFile(null);
    setCourseStatus("active");
    setPricingType("free");
    setPricingAmount("");
  };

  // Open Add Course Form
  const handleAddCourse = () => {
    setEditingCourse(null);
    setShowCourseForm(true);
    resetForm();
  };

  // Open Edit Course Form
  const handleEditCourse = (course) => {
    setEditingCourse(course);
    setShowCourseForm(true);
    setNewCourseName(course.course_name);
    setNewCategory(course.category_id);
    setNewOverview(course.overview || "");
    setNewDescription(course.description || "");
    setCourseStatus(course.is_active || "active");
    setPricingType(course.pricing_type || "free");
    setPricingAmount(course.price_amount || "");
  };

  // Delete Course
  const deleteCourse = async (courseId) => {
    if (!window.confirm("Delete this course?")) return;
    try {
      const res = await fetch(`${COURSE_API}/${courseId}`, {
        method: "DELETE",
        credentials: "include",
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

  // Save Course (Add or Edit)
  const saveCourse = async () => {
    if (!newCourseName || !newCategory) {
      setSnackMsg("Please fill in required fields.");
      setSnackSeverity("warning");
      setSnackOpen(true);
      return;
    }

    if (pricingType === "paid" && !pricingAmount) {
      setSnackMsg("Please enter pricing amount for Paid course.");
      setSnackSeverity("warning");
      setSnackOpen(true);
      return;
    }

    const formData = new FormData();
    formData.append("course_name", newCourseName);
    formData.append("category_id", newCategory);
    formData.append("overview", newOverview);
    formData.append("description", newDescription);
    formData.append("pricing_type", pricingType);
    formData.append("is_active", courseStatus);

    // Fix: send price_amount to match backend
    if (pricingType === "paid") {
      formData.append("price_amount", pricingAmount);
    } else {
      formData.append("price_amount", 0);
    }

    if (coverFile) formData.append("course_image", coverFile);
    if (promoFile) formData.append("course_video", promoFile);

    try {
      setSaving(true);

      let res;
      if (editingCourse) {
        res = await fetch(`${COURSE_API}/${editingCourse.course_id}`, {
          method: "PUT",
          credentials: "include",
          body: formData,
        });
        if (!res.ok) throw new Error("Update failed");
        setSnackMsg("✅ Course updated successfully");
      } else {
        res = await fetch(COURSE_API, {
          method: "POST",
          credentials: "include",
          body: formData,
        });
        if (!res.ok) throw new Error("Save failed");
        setSnackMsg("✅ Course added successfully");
      }

      setSnackSeverity("success");
      setSnackOpen(true);
      setShowCourseForm(false);
      setEditingCourse(null);
      resetForm();
      await fetchCourses();
    } catch (err) {
      console.error(err);
      setSnackMsg("❌ Failed to save course");
      setSnackSeverity("error");
      setSnackOpen(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#f9fafb" }}>
      <Sidebar />
      <Box sx={{ flex: 1, p: 3 }}>
        {/* Header */}
        <Paper sx={{ p: 2, mb: 2 }} elevation={2}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h5" fontWeight="bold">
              Course Management
            </Typography>
            <Stack direction="row" spacing={1}>
              <Button
                startIcon={<Add />}
                variant="outlined"
                onClick={handleAddCourse}
              >
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

        {/* Add/Edit Course Form */}
        {showCourseForm && (
          <Box sx={{ display: "flex", gap: 5, mb: 4 }}>
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
                {categories.length > 0
                  ? categories.map((cat) => (
                      <MenuItem key={cat.category_id} value={cat.category_id}>
                        {cat.category_name}
                      </MenuItem>
                    ))
                  : <MenuItem disabled>Loading...</MenuItem>}
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

              <FormControl component="fieldset" sx={{ mb: 2 }}>
                <FormLabel component="legend">Course Status</FormLabel>
                <RadioGroup
                  row
                  value={courseStatus}
                  onChange={(e) => setCourseStatus(e.target.value)}
                >
                  <FormControlLabel
                    value="active"
                    control={<Radio />}
                    label="Active"
                  />
                  <FormControlLabel
                    value="inactive"
                    control={<Radio />}
                    label="Inactive"
                  />
                </RadioGroup>
              </FormControl>

              <TextField
                select
                fullWidth
                label="Pricing Type"
                value={pricingType}
                onChange={(e) => {
                  setPricingType(e.target.value);
                  if (e.target.value === "free") setPricingAmount("");
                }}
                sx={{ mb: 2 }}
              >
                <MenuItem value="free">Free</MenuItem>
                <MenuItem value="paid">Paid</MenuItem>
              </TextField>

              {pricingType === "paid" && (
                <TextField
                  fullWidth
                  label="Pricing Amount"
                  value={pricingAmount}
                  onChange={(e) => setPricingAmount(e.target.value)}
                  sx={{ mb: 2 }}
                />
              )}

              <Stack direction="row" spacing={2}>
                <Button
                  variant="contained"
                  onClick={saveCourse}
                  disabled={saving}
                >
                  {saving ? "Saving..." : editingCourse ? "Update" : "Save"}
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setShowCourseForm(false);
                    setEditingCourse(null);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
              </Stack>
            </Box>

            {/* Right panel - Uploads */}
            <Box
              sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}
            >
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
                  <Button onClick={() => coverInputRef.current.click()}>
                    Upload
                  </Button>
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
        )}

        {/* Course List / Tabs */}
        {!showCourseForm && (
          <Paper elevation={1} sx={{ display: "flex" }}>
            <Tabs
              value={tab}
              onChange={handleTabChange}
              orientation="vertical"
              sx={{ minWidth: 180, borderRight: 1, borderColor: "divider" }}
            >
              <Tab label="Basic Info" />
              {/* <Tab label="Curriculum" /> */}
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
                                <Typography fontWeight="bold">
                                  {course.course_name}
                                </Typography>
                                <Typography variant="caption">
                                  {course.overview}
                                </Typography>
                                <Typography variant="caption">
                                  Price:{" "}
                                  {course.pricing_type === "free"
                                    ? "Free"
                                    : `$${course.price_amount}`}
                                </Typography>
                              </Box>
                              <Stack direction="row" spacing={1}>
                                <Button
                                  size="small"
                                  onClick={() => handleEditCourse(course)}
                                >
                                  Edit
                                </Button>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  onClick={() =>
                                    navigate(
                                      `/admin/course/${course.course_id}/modules`
                                    )
                                  }
                                >
                                  Add Modules
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
                  {/* {tab === 1 && (
                    <CurriculumTab
                      modules={modules}
                      setModules={setModules}
                      openLessonDialog={(modId) => {}}
                    />
                  )} */}
                </>
              )}
            </Box>
          </Paper>
        )}

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
