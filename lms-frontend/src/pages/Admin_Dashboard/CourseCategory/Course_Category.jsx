import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  IconButton,
  Stack,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Alert,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import Sidebar from "../Sidebar";
import Header from "../Header";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import { COURSE_CATEGORY_API } from "../../../config/apiConfig";

const CourseCategoryPage = () => {
  const [category, setCategory] = useState("");
  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // ✅ Snackbar state
  const [toast, setToast] = useState({
    open: false,
    message: "",
    severity: "success", // success | error | warning | info
  });

  const showToast = (message, severity = "success") => {
    setToast({ open: true, message, severity });
  };

  const handleCloseToast = () => {
    setToast((prev) => ({ ...prev, open: false }));
  };

  // ✅ Fetch all categories
  const fetchCategories = async () => {
    try {
      const res = await fetch(COURSE_CATEGORY_API);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to fetch categories");
      }

      const list = Array.isArray(data) ? data : [];
      setCategories(list);
      setFilteredCategories(list);
    } catch (err) {
      console.error("❌ Error fetching categories:", err);
      showToast(`Error fetching categories: ${err.message}`, "error");
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // ✅ Handle search filtering
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredCategories(categories);
    } else {
      const filtered = categories.filter((cat) =>
        cat.category_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCategories(filtered);
    }
  }, [searchTerm, categories]);

  // ✅ Open Add/Edit dialog
  const handleOpenDialog = (index = null) => {
    if (index !== null) {
      setCategory(filteredCategories[index].category_name);
      setEditIndex(index);
    } else {
      setCategory("");
      setEditIndex(null);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCategory("");
    setEditIndex(null);
  };

  // ✅ Add or update category
  const handleSave = async () => {
    if (!category.trim()) {
      showToast("Category name cannot be empty", "warning");
      return;
    }
    const trimmed = category.trim();

    try {
      let res;
      if (editIndex !== null) {
        const id = filteredCategories[editIndex].category_id;
        res = await fetch(`${COURSE_CATEGORY_API}/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: trimmed }),
        });
      } else {
        res = await fetch(COURSE_CATEGORY_API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: trimmed }),
        });
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Something went wrong");

      showToast(data.message || (editIndex !== null ? "Category updated" : "Category added"), "success");
      await fetchCategories();
      handleCloseDialog();
    } catch (err) {
      console.error("❌ Error saving category:", err);
      showToast(`Error: ${err.message}`, "error");
    }
  };

  // ✅ Delete category
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this category?")) return;
    try {
      const res = await fetch(`${COURSE_CATEGORY_API}/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to delete category");

      showToast(data.message || "Category deleted successfully", "success");
      await fetchCategories();
    } catch (err) {
      console.error("❌ Error deleting category:", err);
      showToast(`Error: ${err.message}`, "error");
    }
  };

  // ✅ Render UI
  return (
      <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#f9f9f9" }}>
      {/* Sticky Sidebar */}
      <Box sx={{ position: "sticky", top: 0, height: "100vh" }}>
        <Sidebar />
      </Box>

      {/* Main Column */}
      <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
        {/* Sticky Header */}
        <Box sx={{ position: "sticky", top: 0, zIndex: 1000 }}>
          <Header />
        </Box>

        {/* Scrollable Content */}
        <Box sx={{ flexGrow: 1, overflowY: "auto", p: 4 }}>
          {/* Header */}
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
<Typography
  variant="h4"
  sx={{
    fontWeight: "bold",
    display: "flex",
    alignItems: "center",
    gap: 1.2,
  }}
>
  <MenuBookIcon fontSize="large" />
  Course Categories
</Typography>

            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              sx={{ borderRadius: 2, px: 4 }}
              onClick={() => handleOpenDialog()}
            >
              Add Category
            </Button>
          </Stack>

          {/* Search */}
          <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
            <TextField
              variant="outlined"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: "text.secondary" }} />,
              }}
              sx={{
                width: "40%",
                bgcolor: "#fff",
                borderRadius: 2,
                boxShadow: 2,
                "& .MuiOutlinedInput-root": { height: "50px", fontSize: "1rem" },
              }}
            />
          </Box>

          {/* Table */}
          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <TableContainer
              component={Paper}
              sx={{ width: "70%", borderRadius: 3, boxShadow: 3, bgcolor: "#fff" }}
            >
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: "primary.main" }}>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>#</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                      Category Name
                    </TableCell>
                    <TableCell align="center" sx={{ color: "white", fontWeight: "bold" }}>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredCategories.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} align="center" sx={{ color: "text.secondary", py: 3 }}>
                        No matching categories found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCategories.map((cat, index) => (
                      <TableRow key={cat.category_id} hover>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{cat.category_name}</TableCell>
                        <TableCell align="center">
                          <Tooltip title="Edit">
                            <IconButton color="info" onClick={() => handleOpenDialog(index)}>
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton color="error" onClick={() => handleDelete(cat.category_id)}>
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          {/* Add/Edit Dialog */}
          <Dialog
            open={openDialog}
            onClose={handleCloseDialog}
            maxWidth="sm"
            fullWidth
            PaperProps={{ sx: { borderRadius: 3, p: 2, boxShadow: 6 } }}
          >
            <DialogTitle
              sx={{ fontWeight: "bold", fontSize: "1.5rem", textAlign: "center", mb: 1 }}
            >
              {editIndex !== null ? "Edit Category" : "Add Category"}
            </DialogTitle>
            <DialogContent sx={{ pt: 3 }}>
              <TextField
                fullWidth
                label="Category Name"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                sx={{
                  mt: 1,
                  "& .MuiInputBase-root": { height: "60px", fontSize: "1.1rem" },
                  "& .MuiInputLabel-root": { fontSize: "1.1rem" },
                }}
              />
            </DialogContent>
            <DialogActions sx={{ p: 3, justifyContent: "center", gap: 2 }}>
              <Button
                onClick={handleCloseDialog}
                color="inherit"
                variant="outlined"
                sx={{ borderRadius: 2, px: 3, fontWeight: 600 }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                variant="contained"
                color="primary"
                sx={{ borderRadius: 2, px: 4, fontWeight: 600 }}
              >
                {editIndex !== null ? "Update" : "Save"}
              </Button>
            </DialogActions>
          </Dialog>

          {/* ✅ Snackbar Toast */}
          <Snackbar
            open={toast.open}
            autoHideDuration={3000}
            onClose={handleCloseToast}
            anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
          >
            <Alert
              onClose={handleCloseToast}
              severity={toast.severity}
              sx={{ width: "100%", fontSize: "1rem", borderRadius: 2 }}
            >
              {toast.message}
            </Alert>
          </Snackbar>
        </Box>
      </Box>
    </Box>
  );
};

export default CourseCategoryPage;
