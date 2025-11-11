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
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import Sidebar from "../Sidebar";
import Header from "../Header";
import { COURSE_CATEGORY_API } from "../../../config/apiConfig"; // ✅ Import API base

const CourseCategoryPage = () => {
  const [category, setCategory] = useState("");
  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]); // ✅ For search filter
  const [editIndex, setEditIndex] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState(""); // ✅ Search term state

  // ✅ Fetch categories
  const fetchCategories = async () => {
    try {
      const res = await fetch(COURSE_CATEGORY_API);
      if (!res.ok) throw new Error("Failed to fetch categories");
      const data = await res.json();
      setCategories(data);
      setFilteredCategories(data); // ✅ Initialize filtered list
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // ✅ Handle Search Filter
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

  // ✅ Open Dialog for Add/Edit
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

  // ✅ Close Dialog
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCategory("");
    setEditIndex(null);
  };

  // ✅ Add or Update Category
  const handleSave = async () => {
    if (!category.trim()) return;
    const trimmed = category.trim();

    try {
      if (editIndex !== null) {
        // Update category
        const id = filteredCategories[editIndex].category_id;
        const res = await fetch(`${COURSE_CATEGORY_API}/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: trimmed }),
        });
        if (!res.ok) throw new Error("Failed to update category");
      } else {
        // Add category
        const res = await fetch(COURSE_CATEGORY_API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: trimmed }),
        });
        if (!res.ok) throw new Error("Failed to add category");
      }

      await fetchCategories();
      handleCloseDialog();
    } catch (err) {
      console.error("Error saving category:", err);
      alert("Error saving category");
    }
  };

  // ✅ Delete Category
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this category?")) return;
    try {
      const res = await fetch(`${COURSE_CATEGORY_API}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete category");
      await fetchCategories();
    } catch (err) {
      console.error("Error deleting category:", err);
      alert("Error deleting category");
    }
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#f9f9f9" }}>
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
        <Header />

        <Box sx={{ flexGrow: 1, p: 4 }}>
          {/* Header Section */}
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ mb: 3 }}
          >
            <Typography variant="h4" sx={{ fontWeight: "bold" }}>
              📚 Course Categories
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

          {/* Search Bar */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              mb: 3,
            }}
          >
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

          {/* Table Section */}
          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <TableContainer
              component={Paper}
              sx={{
                width: "70%",
                borderRadius: 3,
                boxShadow: 3,
                bgcolor: "#fff",
              }}
            >
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: "primary.main" }}>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>#</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                      Category Name
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{ color: "white", fontWeight: "bold" }}
                    >
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {filteredCategories.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        align="center"
                        sx={{ color: "text.secondary", py: 3 }}
                      >
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
                            <IconButton
                              color="info"
                              onClick={() => handleOpenDialog(index)}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              color="error"
                              onClick={() => handleDelete(cat.category_id)}
                            >
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
            PaperProps={{
              sx: { borderRadius: 3, p: 2, boxShadow: 6 },
            }}
          >
            <DialogTitle
              sx={{
                fontWeight: "bold",
                fontSize: "1.5rem",
                textAlign: "center",
                mb: 1,
              }}
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
        </Box>
      </Box>
    </Box>
  );
};

export default CourseCategoryPage;
