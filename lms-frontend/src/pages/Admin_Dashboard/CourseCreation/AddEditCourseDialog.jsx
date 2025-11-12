import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Chip,
  Typography,
} from "@mui/material";
import { Delete, CloudUpload } from "@mui/icons-material";
import { COURSE_API, COURSE_CATEGORY_API } from "../../../config/apiConfig";

export default function AddEditCourseDialog({
  open,
  onClose,
  savedCourses,
  setSavedCourses,
  editCourse,
}) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentEditId, setCurrentEditId] = useState(null);
  const [categories, setCategories] = useState([]);

  const [course, setCourse] = useState({
    course_name: "",
    category_id: "",
    description: "",
    requirements: "",
    overview: "",
    pricing_type: "free",
    price_amount: 0,
    course_image: null,
    imageUrl: null,
  });

  // ✅ Load categories for dropdown
  useEffect(() => {
  fetch(COURSE_CATEGORY_API, { credentials: "include" })
    .then((res) => res.json())
    .then((data) => {
      // Ensure categories is always an array
      const cats = Array.isArray(data) ? data : data.categories || [];
      setCategories(cats);
    })
    .catch((err) => {
      console.error("Failed to load categories:", err);
      setCategories([]); // fallback
    });
}, []);


  // ✅ Prefill form when editing
  useEffect(() => {
    if (editCourse) {
      setIsEditMode(true);
      setCurrentEditId(editCourse.course_id);
      setCourse({
        course_name: editCourse.course_name || "",
        category_id: editCourse.category_id || "",
        description: editCourse.description || "",
        requirements: editCourse.requirements || "",
        overview: editCourse.overview || "",
        pricing_type: editCourse.pricing_type || "free",
        price_amount: editCourse.price_amount || 0,
        course_image: null,
        imageUrl: editCourse.course_image
          ? `${import.meta.env.VITE_API_BASE_URL}/${editCourse.course_image}`
          : null,
      });
    } else {
      setIsEditMode(false);
      setCurrentEditId(null);
      setCourse({
        course_name: "",
        category_id: "",
        description: "",
        requirements: "",
        overview: "",
        pricing_type: "free",
        price_amount: 0,
        course_image: null,
        imageUrl: null,
      });
    }
  }, [editCourse, open]);

  // ✅ Save or update course
  const handleSave = async () => {
    if (!course.course_name.trim()) return alert("Course name is required");

    const formData = new FormData();
    Object.entries(course).forEach(([key, value]) => {
      if (value !== null) formData.append(key, value);
    });

    const method = isEditMode ? "PUT" : "POST";
    const url = isEditMode
      ? `${COURSE_API}/${currentEditId}`
      : COURSE_API;

    try {
      const res = await fetch(url, {
        method,
        credentials: "include",
        body: formData,
      });
      const data = await res.json();

      if (res.ok) {
        alert(data.message);

        // Refresh course list after save
        const refreshed = await fetch(COURSE_API, {
          credentials: true,
        }).then((r) => r.json());
        setSavedCourses(refreshed);

        onClose();
      } else {
        alert("Error: " + data.message);
      }
    } catch (err) {
      console.error("Save failed:", err);
      alert("Failed to save course");
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEditMode ? "Edit Course" : "Add New Course"}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Course Name"
            fullWidth
            value={course.course_name}
            onChange={(e) =>
              setCourse((s) => ({ ...s, course_name: e.target.value }))
            }
          />

          <FormControl fullWidth>
            <InputLabel>Category</InputLabel>
            <Select
              value={course.category_id}
              onChange={(e) =>
                setCourse((s) => ({ ...s, category_id: e.target.value }))
              }
            >
              {Array.isArray(categories) && categories.map((cat) => (
                <MenuItem key={cat.category_id} value={cat.category_id}>
                  {cat.category_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box>
            <Button
              variant="outlined"
              component="label"
              startIcon={<CloudUpload />}
            >
              Upload Image
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={(e) =>
                  setCourse((s) => ({
                    ...s,
                    course_image: e.target.files?.[0] ?? null,
                  }))
                }
              />
            </Button>
            {course.course_image && (
              <Typography variant="caption" sx={{ ml: 1 }}>
                {course.course_image.name}
              </Typography>
            )}
            {course.imageUrl && !course.course_image && (
              <Box sx={{ mt: 1 }}>
                <img
                  src={course.imageUrl}
                  alt="Preview"
                  style={{ maxHeight: 100, borderRadius: 4 }}
                />
              </Box>
            )}
          </Box>

          <TextField
            label="Overview"
            multiline
            rows={3}
            fullWidth
            value={course.overview}
            onChange={(e) =>
              setCourse((s) => ({ ...s, overview: e.target.value }))
            }
          />
          <TextField
            label="Requirements"
            multiline
            rows={3}
            fullWidth
            value={course.requirements}
            onChange={(e) =>
              setCourse((s) => ({ ...s, requirements: e.target.value }))
            }
          />
          <TextField
            label="Description"
            multiline
            rows={3}
            fullWidth
            value={course.description}
            onChange={(e) =>
              setCourse((s) => ({ ...s, description: e.target.value }))
            }
          />

          <FormControl fullWidth>
            <InputLabel>Pricing Type</InputLabel>
            <Select
              value={course.pricing_type}
              onChange={(e) =>
                setCourse((s) => ({ ...s, pricing_type: e.target.value }))
              }
            >
              <MenuItem value="free">Free</MenuItem>
              <MenuItem value="paid">Paid</MenuItem>
            </Select>
          </FormControl>

          {course.pricing_type === "paid" && (
            <TextField
              label="Price Amount"
              type="number"
              fullWidth
              value={course.price_amount}
              onChange={(e) =>
                setCourse((s) => ({
                  ...s,
                  price_amount: parseFloat(e.target.value),
                }))
              }
            />
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSave}>
          {isEditMode ? "Update" : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
