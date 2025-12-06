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
import Header from "../Header";

// Quill
import Quill from "quill";
import "quill/dist/quill.snow.css";

// Quill Editor Component - Looks EXACTLY like your screenshot
const QuillEditor = ({ value, onChange }) => {
  const quillRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const quill = new Quill(containerRef.current, {
      theme: "snow",
      modules: {
        toolbar: [
          [{ header: [1, 2, 3, false] }], // Normal Text + H1/H2/H3
          ["bold", "italic", "underline"],
          [{ list: "ordered" }, { list: "bullet" }],
        ],
      },
      placeholder: "Start typing your course description...",
    });

    if (value) quill.root.innerHTML = value;

    quill.on("text-change", () => {
      onChange(quill.root.innerHTML);
    });

    quillRef.current = quill;

    return () => {
      quillRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (quillRef.current && value !== quillRef.current.root.innerHTML) {
      quillRef.current.root.innerHTML = value || "";
    }
  }, [value]);

  return (
    <Box sx={{ position: "relative", mb: 3 }}>
      <Typography sx={{ mb: 1, fontWeight: 500, color: "#374151" }}>
        Description
      </Typography>

      {/* Quill Editor */}
      <Box
        ref={containerRef}
        sx={{
          border: "1px solid #ddd",
          borderRadius: "8px",
          overflow: "hidden",
          "& .ql-toolbar": {
            border: "none",
            borderBottom: "1px solid #ddd",
            backgroundColor: "#fff",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "8px 12px",
          },
          "& .ql-container": {
            border: "none",
            minHeight: "200px",
            fontSize: "14px",
          },
          "& .ql-editor": {
            padding: "12px 16px",
            lineHeight: 1.7,
          },
          "& .ql-picker-label": {
            fontWeight: 500,
            color: "#374151",
          },
        }}
      />

      {/* "Embed Entry" button on the right */}
      <Box
        sx={{
          position: "absolute",
          top: 8,
          right: 12,
          zIndex: 10,
        }}
      >
        <Button
          size="small"
          variant="text"
          sx={{
            color: "#6b7280",
            fontWeight: 500,
            fontSize: "13px",
            textTransform: "none",
          }}
        >
          Embed Entry
        </Button>
      </Box>
    </Box>
  );
};

export default function CourseCreateForm() {
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [savedCourses, setSavedCourses] = useState([]);
  const [modules, setModules] = useState([]);

  // Form
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [newCourseName, setNewCourseName] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newOverview, setNewOverview] = useState("");
  const [newDescription, setNewDescription] = useState(""); // HTML from Quill
  const [coverFile, setCoverFile] = useState(null);
  const [promoFile, setPromoFile] = useState(null);
  const [courseStatus, setCourseStatus] = useState("active");
  const [pricingType, setPricingType] = useState("free");
  const [pricingAmount, setPricingAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);

  // Snackbar
  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMsg, setSnackMsg] = useState("");
  const [snackSeverity, setSnackSeverity] = useState("success");

  const coverInputRef = useRef(null);
  const promoInputRef = useRef(null);
  const IMAGE_BASE = import.meta.env.VITE_UPLOADS_BASE;

  const handleTabChange = (e, v) => setTab(v);

  // Fetch Courses
  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await fetch(COURSE_API, { method: "GET", credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setSavedCourses(data || []);
    } catch (error) {
      setSnackMsg("Failed to fetch courses");
      setSnackSeverity("error");
      setSnackOpen(true);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Categories
  const fetchCategories = async () => {
    try {
      const res = await fetch(COURSE_CATEGORY_API, { method: "GET", credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      const list = Array.isArray(data[0]) ? data[0] : data;
      setCategories(list || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchCourses();
  }, []);

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

  const handleAddCourse = () => {
    setEditingCourse(null);
    resetForm();
    setShowCourseForm(true);
  };

  const handleEditCourse = (course) => {
    setEditingCourse(course);
    setShowCourseForm(true);
    setNewCourseName(course.course_name);
    setNewCategory(course.category_id);
    setNewOverview(course.overview || "");
    setNewDescription(course.description || "");
    setCourseStatus(course.is_active ? "active" : "inactive");
    setPricingType(course.pricing_type || "free");
    setPricingAmount(course.price_amount || "");
  };

  const deleteCourse = async (courseId) => {
    if (!window.confirm("Delete this course?")) return;
    try {
      const res = await fetch(`${COURSE_API}/${courseId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Delete failed");
      setSavedCourses((prev) => prev.filter((c) => c.course_id !== courseId));
      setSnackMsg("Course deleted");
      setSnackSeverity("success");
      setSnackOpen(true);
    } catch (err) {
      setSnackMsg("Delete failed");
      setSnackSeverity("error");
      setSnackOpen(true);
    }
  };

  const saveCourse = async () => {
    if (!newCourseName || !newCategory) {
      setSnackMsg("Fill required fields");
      setSnackSeverity("warning");
      setSnackOpen(true);
      return;
    }

    if (pricingType === "paid" && !pricingAmount) {
      setSnackMsg("Enter price for paid course");
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
    formData.append("price_amount", pricingType === "paid" ? pricingAmount : "0");
    if (coverFile) formData.append("course_image", coverFile);
    if (promoFile) formData.append("course_video", promoFile);

    try {
      setSaving(true);
      const url = editingCourse ? `${COURSE_API}/${editingCourse.course_id}` : COURSE_API;
      const method = editingCourse ? "PUT" : "POST";

      const res = await fetch(url, { method, credentials: "include", body: formData });
      if (!res.ok) throw new Error("Failed");

      setSnackMsg(editingCourse ? "Updated!" : "Created!");
      setSnackSeverity("success");
      setSnackOpen(true);
      setShowCourseForm(false);
      resetForm();
      fetchCourses();
    } catch (err) {
      setSnackMsg("Save failed");
      setSnackSeverity("error");
      setSnackOpen(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#f9fafb" }}>
      <Box sx={{ position: "sticky", top: 0, height: "100vh" }}>
        <Sidebar />
      </Box>

      <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <Box sx={{ position: "sticky", top: 0, zIndex: 1000 }}>
          <Header />
        </Box>

        <Box sx={{ flex: 1, overflowY: "auto", p: 3 }}>
          <Paper sx={{ p: 2, mb: 2 }} elevation={2}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="h5" fontWeight="bold">Course Management</Typography>
              <Stack direction="row" spacing={1}>
                <Button startIcon={<Add />} variant="outlined" onClick={handleAddCourse}>
                  Add Course
                </Button>
                {/* <Button startIcon={<Save />} variant="outlined">Save Draft</Button>
                <Button startIcon={<Publish />} variant="contained">Publish</Button> */}
              </Stack>
            </Stack>
          </Paper>

          {showCourseForm && (
            <Box sx={{ display: "flex", gap: 5, mb: 4 }}>
              <Box sx={{ flex: 2 }}>
                <TextField fullWidth label="Course Name" value={newCourseName} onChange={(e) => setNewCourseName(e.target.value)} sx={{ mb: 2 }} />
                <TextField select fullWidth label="Category" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} sx={{ mb: 2 }}>
                  {categories.map((cat) => (
                    <MenuItem key={cat.category_id} value={cat.category_id}>{cat.category_name}</MenuItem>
                  ))}
                </TextField>
                <TextField fullWidth label="Overview" value={newOverview} onChange={(e) => setNewOverview(e.target.value)} sx={{ mb: 2 }} />

                {/* Beautiful Quill Editor */}
                <QuillEditor value={newDescription} onChange={setNewDescription} />

                <FormControl sx={{ mb: 2 }}>
                  <FormLabel>Course Status</FormLabel>
                  <RadioGroup row value={courseStatus} onChange={(e) => setCourseStatus(e.target.value)}>
                    <FormControlLabel value="active" control={<Radio />} label="Active" />
                    <FormControlLabel value="inactive" control={<Radio />} label="Inactive" />
                  </RadioGroup>
                </FormControl>

                <TextField select fullWidth label="Pricing Type" value={pricingType} onChange={(e) => { setPricingType(e.target.value); if (e.target.value === "free") setPricingAmount(""); }} sx={{ mb: 2 }}>
                  <MenuItem value="free">Free</MenuItem>
                  <MenuItem value="paid">Paid</MenuItem>
                </TextField>

                {pricingType === "paid" && (
                  <TextField fullWidth label="Pricing Amount" value={pricingAmount} onChange={(e) => setPricingAmount(e.target.value)} sx={{ mb: 2 }} />
                )}

                <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
                  <Button variant="contained" onClick={saveCourse} disabled={saving}>
                    {saving ? "Saving..." : editingCourse ? "Update" : "Save"}
                  </Button>
                  <Button variant="outlined" onClick={() => { setShowCourseForm(false); resetForm(); }}>
                    Cancel
                  </Button>
                </Stack>
              </Box>

              <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
                <Paper variant="outlined" sx={{ p: 3, textAlign: "center", border: "2px dashed #ddd", borderRadius: 2 }}>
                  <Typography>Cover Image</Typography>
                  {coverFile ? <Chip label={coverFile.name} onDelete={() => setCoverFile(null)} /> : <Button onClick={() => coverInputRef.current?.click()}>Upload</Button>}
                  <input ref={coverInputRef} type="file" hidden onChange={(e) => setCoverFile(e.target.files?.[0] || null)} accept="image/*" />
                </Paper>

                <Paper variant="outlined" sx={{ p: 3, textAlign: "center", border: "2px dashed #ddd", borderRadius: 2 }}>
                  <Typography>Promo Video</Typography>
                  {promoFile ? <Chip label={promoFile.name} onDelete={() => setPromoFile(null)} /> : <Button onClick={() => promoInputRef.current?.click()}>Upload</Button>}
                  <input ref={promoInputRef} type="file" hidden onChange={(e) => setPromoFile(e.target.files?.[0] || null)} accept="video/*" />
                </Paper>
              </Box>
            </Box>
          )}

          {!showCourseForm && (
            <Paper elevation={1} sx={{ display: "flex" }}>
              <Tabs value={tab} onChange={handleTabChange} orientation="vertical" sx={{ minWidth: 180, borderRight: 1, borderColor: "divider" }}>
                <Tab label="Basic Info" />
              </Tabs>
              <Box sx={{ flex: 1, p: 3 }}>
                {loading ? (
                  <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
                    <CircularProgress />
                  </Box>
                ) : savedCourses.length === 0 ? (
                  <Typography>No courses yet</Typography>
                ) : (
                  <Stack spacing={2}>
                    {savedCourses.map((course) => (
                      <Paper key={course.course_id} sx={{ p: 2, display: "flex", alignItems: "center", gap: 2 }}>
                        {course.course_image && (
                          <Box component="img" src={`${IMAGE_BASE}/${course.course_image.replace(/^.*uploads\//, "")}`} sx={{ width: 80, height: 80, objectFit: "cover", borderRadius: 1 }} />
                        )}
                        <Box sx={{ flex: 1 }}>
                          <Typography fontWeight="bold">{course.course_name}</Typography>
                          <Typography variant="caption">{course.overview}</Typography>
                          {/* <Typography variant="caption">Price: {course.pricing_type === "free" ? "Free" : `$${course.price_amount}`}</Typography> */}
                        </Box>
                        <Stack direction="row" spacing={1}>
                          <Button size="small" onClick={() => handleEditCourse(course)}>Edit</Button>
                          <Button size="small" variant="outlined" onClick={() => navigate(`/admin/course/${course.course_id}/modules`)}>Add Modules</Button>
                          <Button size="small" color="error" onClick={() => deleteCourse(course.course_id)}>Delete</Button>
                        </Stack>
                      </Paper>
                    ))}
                  </Stack>
                )}
              </Box>
            </Paper>
          )}

          <Snackbar open={snackOpen} autoHideDuration={3000} onClose={() => setSnackOpen(false)}>
            <Alert severity={snackSeverity}>{snackMsg}</Alert>
          </Snackbar>
        </Box>
      </Box>
    </Box>
  );
}