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
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { Save, Publish, Add } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import Sidebar from "../Sidebar";
import CurriculumTab from "./Curriculum";
import { COURSE_API, COURSE_CATEGORY_API } from "../../../config/apiConfig";
import Header from "../Header";
import { MAINSTREAM_API, SUBSTREAM_API } from "../../../config/apiConfig";


// Quill
import Quill from "quill";
import "quill/dist/quill.snow.css";


// Responsive Quill Editor Component
const QuillEditor = ({ value, onChange }) => {
  const quillRef = useRef(null);
  const containerRef = useRef(null);
  const theme = useTheme();
 
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    if (!containerRef.current) return;

    const quill = new Quill(containerRef.current, {
      theme: "snow",
      modules: {
        toolbar: [
          [{ header: [1, 2, 3, false] }],
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
            flexWrap: "wrap",
            justifyContent: isMobile ? "center" : "space-between",
            alignItems: "center",
            padding: isMobile ? "8px" : "8px 12px",
            gap: 1,
          },
          "& .ql-container": {
            border: "none",
            minHeight: isMobile ? "150px" : "200px",
            fontSize: "14px",
          },
          "& .ql-editor": {
            padding: isMobile ? "12px" : "12px 16px",
            lineHeight: 1.7,
          },
          "& .ql-picker-label": {
            fontWeight: 500,
            color: "#374151",
            fontSize: isMobile ? "12px" : "13px",
          },
        }}
      />

      {/* "Embed Entry" button - responsive positioning */}
      <Box
        sx={{
          position: "absolute",
          top: isMobile ? 4 : 8,
          right: isMobile ? 8 : 12,
          zIndex: 10,
        }}
      >
        <Button
          size="small"
          variant="text"
          sx={{
            color: "#6b7280",
            fontWeight: 500,
            fontSize: isMobile ? "12px" : "13px",
            textTransform: "none",
            minWidth: "auto",
            px: 1,
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [savedCourses, setSavedCourses] = useState([]);
  const [modules, setModules] = useState([]);

  const [mainstreams, setMainstreams] = useState([]);
const [substreams, setSubstreams] = useState([]);

  // Form
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
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  const [department, setDepartment] = useState("");
  const [instructor, setInstructor] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [language, setLanguage] = useState("");
  const [mainstream, setMainstream] = useState("");
  const [substream, setSubstream] = useState("");
  const [courseType, setCourseType] = useState("");
  const [courseOutcome, setCourseOutcome] = useState("");
  const [systemRequirements, setSystemRequirements] = useState("");
  const [noOfVideos, setNoOfVideos] = useState("");
  const [hasSubtitles, setHasSubtitles] = useState("0");
  const [subtitlesLanguage, setSubtitlesLanguage] = useState("");
  const [referenceId, setReferenceId] = useState("");
  const [location, setLocation] = useState("");


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
  fetch(MAINSTREAM_API, { credentials: "include" })
    .then(res => res.json())
    .then(setMainstreams)
    .catch(console.error);
}, []);
useEffect(() => {
  fetch(SUBSTREAM_API)
    .then(res => res.json())
    .then(setSubstreams)
    .catch(console.error);
}, []);


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
    formData.append("department", department);
    formData.append("instructor", instructor);
    formData.append("duration_minutes", durationMinutes);
    formData.append("language", language);
formData.append("mainstream", mainstream);
formData.append("substream", substream);

    formData.append("course_type", courseType);
    formData.append("course_outcome", courseOutcome);
    formData.append("system_requirements", systemRequirements);
    formData.append("no_of_videos", noOfVideos || "0");
    formData.append("has_subtitles", hasSubtitles);
    formData.append("subtitles_language", subtitlesLanguage);
    formData.append("reference_id", referenceId);
    formData.append("location", location);
    formData.append("status", "draft"); // or published later

    formData.append("is_active", courseStatus);
    formData.append(
      "price_amount",
      pricingType === "paid" ? pricingAmount : "0",
    );
    if (coverFile) formData.append("course_image", coverFile);
    if (promoFile) formData.append("course_video", promoFile);

    try {
      setSaving(true);
      const url = editingCourse
        ? `${COURSE_API}/${editingCourse.course_id}`
        : COURSE_API;
      const method = editingCourse ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        credentials: "include",
        body: formData,
      });
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
      {/* Responsive Sidebar */}
      <Box
        sx={{
          position: "sticky",
          top: 0,
          height: "100vh",
          width: isMobile ? "200px" : "75px",
          flexShrink: 0,
          [theme.breakpoints.down("sm")]: {
            width: "100%",
            height: "auto",
            position: "static",
          },
        }}
      >
        <Sidebar />
      </Box>

      <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <Box sx={{ position: "sticky", top: 0, zIndex: 1000 }}>
          <Header />
        </Box>

        <Box sx={{ flex: 1, overflowY: "auto", p: { xs: 1.5, sm: 2, md: 3 } }}>
          {/* Responsive Header */}
          <Paper sx={{ p: { xs: 1.5, sm: 2 }, mb: 2 }} elevation={2}>
            <Stack
              direction={isMobile ? "column" : "row"}
              justifyContent="space-between"
              alignItems={isMobile ? "flex-start" : "center"}
              spacing={isMobile ? 1.5 : 0}
            >
              <Typography variant="h5" fontWeight="bold">
                Course Management
              </Typography>
              <Button
                startIcon={<Add />}
                variant="outlined"
                onClick={handleAddCourse}
                size={isMobile ? "small" : "medium"}
                fullWidth={isMobile}
              >
                Add Course
              </Button>
            </Stack>
          </Paper>

          {/* Responsive Course Form */}
          {showCourseForm && (
            <Paper
              sx={{ p: { xs: 2, sm: 3 }, mb: 4, borderRadius: 2 }}
              elevation={1}
            >
              <Box
                sx={{
                  display: "flex",
                  flexDirection: { xs: "column", md: "row" },
                  gap: { xs: 2, md: 5 },
                }}
              >
                {/* Form Fields - Main Content */}
                <Box sx={{ flex: { xs: 1, md: 2 }, order: { xs: 2, md: 1 } }}>
                  <TextField
                    required
                    fullWidth
                    label="Course Name"
                    value={newCourseName}
                    onChange={(e) => setNewCourseName(e.target.value)}
                    sx={{ mb: 2 }}
                  />

                  <TextField
                    required
                    select
                    fullWidth
                    label="Category"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    sx={{ mb: 2 }}
                    size={isMobile ? "small" : "medium"}
                  >
                    {categories.map((cat) => (
                      <MenuItem key={cat.category_id} value={cat.category_id}>
                        {cat.category_name}
                      </MenuItem>
                    ))}
                  </TextField>

                  <TextField
                    required
                    fullWidth
                    label="Overview"
                    value={newOverview}
                    onChange={(e) => setNewOverview(e.target.value)}
                    sx={{ mb: 2 }}
                    multiline
                    maxRows={3}
                    size={isMobile ? "small" : "medium"}
                  />

                

                  {/* Responsive Quill Editor */}
                  <QuillEditor
                    value={newDescription}
                    onChange={setNewDescription}
                  />
                  {/* ===== Additional Course Details ===== */}

                  <TextField
                    required
                    label="Department"
                    fullWidth
                    sx={{ mb: 2 }}
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                  />

                  <TextField
                    required
                    label="Instructor"
                    fullWidth
                    sx={{ mb: 2 }}
                    value={instructor}
                    onChange={(e) => setInstructor(e.target.value)}
                  />

                  <TextField
                    label="Duration (minutes)"
                    type="number"
                    fullWidth
                    sx={{ mb: 2 }}
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(e.target.value)}
                  />

                  <TextField
                    label="Language"
                    fullWidth
                    sx={{ mb: 2 }}
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                  />
<TextField
  select
  label="Mainstream"
  fullWidth
  sx={{ mb: 2 }}
  value={mainstream}
  onChange={(e) => setMainstream(e.target.value)}
>
  {mainstreams.map(ms => (
    <MenuItem key={ms.mainstream_id} value={ms.mainstream_name}>
      {ms.mainstream_name}
    </MenuItem>
  ))}
</TextField>



               <TextField
  select
  label="Substream"
  fullWidth
  sx={{ mb: 2 }}
  value={substream}
  onChange={(e) => setSubstream(e.target.value)}
>
  {substreams.map(ss => (
    <MenuItem key={ss.substream_id} value={ss.substream_name}>
      {ss.substream_name}
    </MenuItem>
  ))}
</TextField>



                  <TextField
                    label="Course Type"
                    fullWidth
                    sx={{ mb: 2 }}
                    value={courseType}
                    onChange={(e) => setCourseType(e.target.value)}
                  />

                  <TextField
                    label="Course Outcome"
                    multiline
                    rows={3}
                    fullWidth
                    sx={{ mb: 2 }}
                    value={courseOutcome}
                    onChange={(e) => setCourseOutcome(e.target.value)}
                  />

                  <TextField
                    label="System Requirements"
                    multiline
                    rows={3}
                    fullWidth
                    sx={{ mb: 2 }}
                    value={systemRequirements}
                    onChange={(e) => setSystemRequirements(e.target.value)}
                  />

                  <TextField
                    required
                    label="No of Videos"
                    type="number"
                    fullWidth
                    sx={{ mb: 2 }}
                    value={noOfVideos}
                    onChange={(e) => setNoOfVideos(e.target.value)}
                  />

                  <FormControl sx={{ mb: 2 }}>
                    <FormLabel>Has Subtitles</FormLabel>
                    <RadioGroup
                      row
                      value={hasSubtitles}
                      onChange={(e) => setHasSubtitles(e.target.value)}
                    >
                      <FormControlLabel
                        value="1"
                        control={<Radio />}
                        label="Yes"
                      />
                      <FormControlLabel
                        value="0"
                        control={<Radio />}
                        label="No"
                      />
                    </RadioGroup>
                  </FormControl>

                  {hasSubtitles === "1" && (
                    <TextField
                      label="Subtitles Language"
                      fullWidth
                      sx={{ mb: 2 }}
                      value={subtitlesLanguage}
                      onChange={(e) => setSubtitlesLanguage(e.target.value)}
                    />
                  )}

                  <TextField
                    label="Reference ID"
                    fullWidth
                    sx={{ mb: 2 }}
                    value={referenceId}
                    onChange={(e) => setReferenceId(e.target.value)}
                  />

                  <TextField
                    label="Location"
                    fullWidth
                    sx={{ mb: 2 }}
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />

                  <FormControl sx={{ mb: 2, width: "100%" }}>
                    <FormLabel sx={{ mb: 1 }}>Course Status</FormLabel>
                    <RadioGroup
                      row
                      value={courseStatus}
                      onChange={(e) => setCourseStatus(e.target.value)}
                      sx={{
                        flexWrap: "wrap",
                        gap: 1,
                        [theme.breakpoints.down("sm")]: {
                          flexDirection: "column",
                          alignItems: "flex-start",
                        },
                      }}
                    >
                      <FormControlLabel
                        value="active"
                        control={<Radio size="small" />}
                        label="Active"
                      />
                      <FormControlLabel
                        value="inactive"
                        control={<Radio size="small" />}
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
                    size={isMobile ? "small" : "medium"}
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
                      size={isMobile ? "small" : "medium"}
                    />
                  )}

                  <Stack
                    direction={isMobile ? "column" : "row"}
                    spacing={2}
                    sx={{ mt: 3, width: "100%" }}
                  >
                    <Button
                      variant="contained"
                      onClick={saveCourse}
                      disabled={saving}
                      fullWidth={isMobile}
                      size={isMobile ? "small" : "medium"}
                    >
                      {saving ? "Saving..." : editingCourse ? "Update" : "Save"}
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() => {
                        setShowCourseForm(false);
                        resetForm();
                      }}
                      fullWidth={isMobile}
                      size={isMobile ? "small" : "medium"}
                    >
                      Cancel
                    </Button>
                  </Stack>
                </Box>

                {/* Upload Section - Responsive */}
                <Box
                  sx={{
                    flex: { xs: 1, md: 1 },
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                    order: { xs: 1, md: 2 },
                    minWidth: 0,
                  }}
                >
                  <Paper
                    variant="outlined"
                    sx={{
                      p: { xs: 2, sm: 3 },
                      textAlign: "center",
                      border: "2px dashed #ddd",
                      borderRadius: 2,
                      height: 140,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{ mb: 1.5, color: "text.secondary" }}
                    >
                      Cover Image
                    </Typography>
                    {coverFile ? (
                      <Chip
                        label={
                          coverFile.name.length > 20
                            ? `${coverFile.name.slice(0, 20)}...`
                            : coverFile.name
                        }
                        onDelete={() => setCoverFile(null)}
                        size="small"
                        sx={{ mb: 1 }}
                      />
                    ) : (
                      <Button
                        onClick={() => coverInputRef.current?.click()}
                        variant="outlined"
                        size="small"
                      >
                        Upload
                      </Button>
                    )}
                    <input
                      ref={coverInputRef}
                      type="file"
                      hidden
                      onChange={(e) =>
                        setCoverFile(e.target.files?.[0] || null)
                      }
                      accept="image/*"
                    />
                  </Paper>

                  <Paper
                    variant="outlined"
                    sx={{
                      p: { xs: 2, sm: 3 },
                      textAlign: "center",
                      border: "2px dashed #ddd",
                      borderRadius: 2,
                      height: 140,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{ mb: 1.5, color: "text.secondary" }}
                    >
                      Promo Video
                    </Typography>
                    {promoFile ? (
                      <Chip
                        label={
                          promoFile.name.length > 20
                            ? `${promoFile.name.slice(0, 20)}...`
                            : promoFile.name
                        }
                        onDelete={() => setPromoFile(null)}
                        size="small"
                        sx={{ mb: 1 }}
                      />
                    ) : (
                      <Button
                        onClick={() => promoInputRef.current?.click()}
                        variant="outlined"
                        size="small"
                      >
                        Upload
                      </Button>
                    )}
                    <input
                      ref={promoInputRef}
                      type="file"
                      hidden
                      onChange={(e) =>
                        setPromoFile(e.target.files?.[0] || null)
                      }
                      accept="video/*"
                    />
                  </Paper>
                </Box>
              </Box>
            </Paper>
          )}

          {/* Courses List - Responsive */}
          {!showCourseForm && (
            <Paper
              elevation={1}
              sx={{ display: "flex", borderRadius: 2, overflow: "hidden" }}
            >
              <Tabs
                value={tab}
                onChange={handleTabChange}
                orientation={isTablet ? "horizontal" : "vertical"}
                sx={{
                  minWidth: isTablet ? "auto" : 180,
                  borderRight: isTablet ? 0 : 1,
                  borderColor: "divider",
                  [theme.breakpoints.down("md")]: {
                    minHeight: 48,
                  },
                }}
                variant="fullWidth"
              >
                <Tab label="Basic Info" sx={{ minHeight: 48 }} />
              </Tabs>

              <Box sx={{ flex: 1, p: { xs: 2, sm: 3 } }}>
                {loading ? (
                  <Box
                    sx={{ display: "flex", justifyContent: "center", py: 10 }}
                  >
                    <CircularProgress />
                  </Box>
                ) : savedCourses.length === 0 ? (
                  <Typography
                    textAlign="center"
                    sx={{ py: 8, color: "text.secondary" }}
                  >
                    No courses yet
                  </Typography>
                ) : (
                  <Stack spacing={{ xs: 1.5, sm: 2 }}>
                    {savedCourses.map((course) => (
                      <Paper
                        key={course.course_id}
                        sx={{
                          p: { xs: 1.5, sm: 2 },
                          display: "flex",
                          flexDirection: { xs: "column", sm: "row" },
                          alignItems: { xs: "stretch", sm: "center" },
                          gap: { xs: 1.5, sm: 2 },
                        }}
                      >
                        {course.course_image && (
                          <Box
                            component="img"
                            src={`${IMAGE_BASE}/${course.course_image.replace(/^.*uploads\//, "")}`}
                            sx={{
                              width: { xs: 60, sm: 80 },
                              height: { xs: 60, sm: 80 },
                              objectFit: "cover",
                              borderRadius: 1,
                              flexShrink: 0,
                            }}
                          />
                        )}

                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography
                            fontWeight="bold"
                            sx={{
                              fontSize: { xs: "0.95rem", sm: "1.1rem" },
                              mb: 0.5,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {course.course_name}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                            }}
                          >
                            {course.overview}
                          </Typography>
                        </Box>

                        <Stack
                          direction={{ xs: "column", sm: "row" }}
                          spacing={1}
                          sx={{
                            alignSelf: { xs: "stretch", sm: "center" },
                            mt: { xs: 1, sm: 0 },
                          }}
                        >
                          <Button
                            size="small"
                            onClick={() => handleEditCourse(course)}
                            fullWidth={isMobile}
                          >
                            Edit
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() =>
                              navigate(
                                `/admin/course/${course.course_id}/modules`,
                              )
                            }
                            fullWidth={isMobile}
                          >
                            Modules
                          </Button>
                          <Button
                            size="small"
                            color="error"
                            onClick={() => deleteCourse(course.course_id)}
                            fullWidth={isMobile}
                          >
                            Delete
                          </Button>
                        </Stack>
                      </Paper>
                    ))}
                  </Stack>
                )}
              </Box>
            </Paper>
          )}

          <Snackbar
            open={snackOpen}
            autoHideDuration={3000}
            onClose={() => setSnackOpen(false)}
          >
            <Alert severity={snackSeverity}>{snackMsg}</Alert>
          </Snackbar>
        </Box>
      </Box>
    </Box>
  );
}
