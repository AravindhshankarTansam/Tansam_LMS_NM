import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  InputAdornment,
} from "@mui/material";
import {
  Download,
  Search,
  PersonAdd,
  Edit,
  Delete,
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import Sidebar from "../../Admin_Dashboard/Sidebar.jsx";
import Header from "../../Admin_Dashboard/Header.jsx";
import { ADMIN_API,DASHBOARD_API } from "../../../config/apiConfig.js";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function AddUserPage() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [courseFilter, setCourseFilter] = useState(""); // NEW: course filter
  const [openModal, setOpenModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(""); // Staff course
  const [loadingCourses, setLoadingCourses] = useState(true);

  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    mobile: "",
    role: "student",
    password: "",
    image: null,
    preview: "",
  });


  // Fetch all users
   const fetchUsers = async () => {
    try {
      const res = await fetch(`${ADMIN_API}/all`);
      const data = await res.json();
      const filtered = data.filter(
        (user) => user.role?.toLowerCase() !== "superadmin"
      );
      setUsers(filtered);
    } catch (err) {
      console.error("❌ Failed to fetch users:", err);
    }
  };

  // Fetch courses
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await fetch(`${DASHBOARD_API}/courses`, { credentials: "include" });
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();

        let coursesArray = [];
        if (Array.isArray(data)) coursesArray = data;
        else if (data?.courses) coursesArray = data.courses;
        else if (data?.data) coursesArray = data.data;

        setCourses(coursesArray);
      } catch (err) {
        console.error("Failed to fetch courses:", err);
        setCourses([]);
      } finally {
        setLoadingCourses(false);
      }
    };

    fetchCourses();
    fetchUsers();
  }, []);

  // Filtered users (search + role filter)
  const filteredUsers = users.filter((u) => {
  const matchSearch =
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase());

  const matchRole = roleFilter ? u.role === roleFilter.toLowerCase() : true;

  const matchCourse = courseFilter
    ? String(u.course_id) === String(courseFilter)
    : true;

  return matchSearch && matchRole && matchCourse;
});


  const handleAddOrEditUser = async () => {
    const { name, email, mobile, role, password, image } = newUser;

    if (!name || !email || !mobile || !role || (!editMode && !password)) {
      toast.warning("Please fill all required fields!");
      return;
    }

    if (role === "staff" && !selectedCourse) {
      toast.warning("Please select a course for staff!");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const mobileRegex = /^\d{10}$/;
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

    if (!emailRegex.test(email)) return toast.error("Invalid email");
    if (!mobileRegex.test(mobile)) return toast.error("Invalid mobile number");
    if (!editMode && !passwordRegex.test(password))
      return toast.error(
        "Password must include uppercase, lowercase, number & special char"
      );

    const formData = new FormData();
    formData.append("username", email.split("@")[0]);
    formData.append("email", email);
    formData.append("full_name", name);
    formData.append("mobile_number", mobile);
    formData.append("role", role.toLowerCase());
    if (!editMode) formData.append("password", password);
    if (image && typeof image !== "string") formData.append("image", image);
    if (role === "staff") formData.append("course_id", selectedCourse);

    try {
      const url = editMode
        ? `${ADMIN_API}/update/${selectedUserId}`
        : `${ADMIN_API}/add`;
      const method = editMode ? "PUT" : "POST";

      const res = await fetch(url, { method, body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "API error");

      toast.success(editMode ? "User updated successfully!" : "User added successfully!");

      fetchUsers();
      setOpenModal(false);
      setEditMode(false);
      setSelectedUserId(null);
      setSelectedCourse("");
      resetForm();
    } catch (err) {
      console.error("❌ API error:", err);
      toast.error(err.message || "Failed to save user!");
    }
  };

  const resetForm = () => {
    setNewUser({
      name: "",
      email: "",
      mobile: "",
      role: "student",
      password: "",
      image: null,
      preview: "",
    });
    setSelectedCourse("");
  };

  const handleEdit = (user) => {
    setNewUser({
      name: user.full_name,
      email: user.email,
      mobile: user.mobile_number,
      role: user.role,
      password: "",
      image: user.image_path
        ? `${import.meta.env.VITE_API_BASE_URL.replace("/api", "")}/${user.image_path}`
        : null,
      preview: "",
    });
    setSelectedCourse(user.course_id || "");
    setEditMode(true);
    setSelectedUserId(user.custom_id);
    setOpenModal(true);
  };

  const handleDelete = async (custom_id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      const res = await fetch(`${ADMIN_API}/delete/${custom_id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to delete user");
      toast.success("User deleted successfully!");
      fetchUsers();
    } catch (err) {
      console.error("❌ Delete error:", err);
      toast.error(err.message || "Failed to delete user!");
    }
  };

  const handleDownload = (type) => {
    const worksheet = XLSX.utils.json_to_sheet(filteredUsers);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Users");
    const wbout = XLSX.write(workbook, { bookType: type, type: "array" });
    const blob = new Blob([wbout], {
      type:
        type === "csv"
          ? "text/csv;charset=utf-8;"
          : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, `Users.${type}`);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const allowed = ["image/jpeg", "image/jpg", "image/png"];
    if (!allowed.includes(file.type)) {
      toast.error("Only JPG, JPEG, and PNG files are allowed!");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be less than 2MB!");
      return;
    }
    const imagePreview = URL.createObjectURL(file);
    setNewUser({ ...newUser, image: file, preview: imagePreview });
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#f9fafb" }}>
      <ToastContainer position="top-right" autoClose={2000} />
      <Box sx={{ position: "sticky", top: 0, height: "100vh", flexShrink: 0 }}>
        <Sidebar />
      </Box>
      <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
        <Box sx={{ position: "sticky", top: 0, zIndex: 1000 }}>
          <Header userName="Bagus" />
        </Box>
        <Box sx={{ flexGrow: 1, p: 4, overflowY: "auto" }}>
          {/* Title & Add Button */}
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
            <Typography variant="h4" fontWeight="600">👥 User Management</Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<PersonAdd />}
              onClick={() => { resetForm(); setEditMode(false); setOpenModal(true); }}
            >
              Add User
            </Button>
          </Box>

          {/* Filters */}
          <Card sx={{ p: 3, mb: 3, display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap", boxShadow: 2 }}>
            <TextField
              variant="outlined"
              size="small"
              placeholder="Search by name or email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{ startAdornment: <Search sx={{ mr: 1, color: "gray" }} /> }}
            />
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Role</InputLabel>
              <Select value={roleFilter} label="Role" onChange={(e) => setRoleFilter(e.target.value)}>
                <MenuItem value="">All</MenuItem>
                <MenuItem value="student">Student</MenuItem>
                <MenuItem value="staff">Staff</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Course</InputLabel>
              <Select value={courseFilter} label="Course" onChange={(e) => setCourseFilter(e.target.value)}>
                <MenuItem value="">All</MenuItem>
                {courses.map((course) => (
                  <MenuItem key={course.course_id} value={course.course_id}>
                    {course.course_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Button variant="contained" onClick={() => handleDownload("xlsx")} startIcon={<Download />}>Download Excel</Button>
            <Button variant="outlined" onClick={() => handleDownload("csv")} startIcon={<Download />}>Download CSV</Button>
            <Box sx={{ flexGrow: 1 }} />
            <Typography variant="subtitle1" fontWeight="bold">Total: {filteredUsers.length}</Typography>
          </Card>

          {/* Table */}
          <Card sx={{ p: 2, borderRadius: 3, boxShadow: 3 }}>
            <Table>
              <TableHead sx={{ bgcolor: "#f1f3f6" }}>
                <TableRow>
                  <TableCell>S.No</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Mobile</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Profile</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredUsers.map((u, index) => (
                  <TableRow key={u.custom_id || index} hover>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{u.full_name}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>{u.mobile_number}</TableCell>
                    <TableCell>
                      <Typography
                        sx={{
                          bgcolor: u.role === "admin" ? "#e0f2f1" : "#e3f2fd",
                          color: u.role === "admin" ? "#00695c" : "#1565c0",
                          px: 1.5,
                          py: 0.5,
                          borderRadius: 2,
                          display: "inline-block",
                          fontSize: "0.85rem",
                          fontWeight: 600,
                          textTransform: "capitalize",
                        }}
                      >
                        {u.role}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {u.image_path ? (
                        <img
                          src={u.image_path ? `${import.meta.env.VITE_API_BASE_URL.replace("/api", "")}/${u.image_path}` : "placeholder.jpg"}
                          alt={u.full_name}
                          style={{ width: 50, height: 50, borderRadius: "50%", objectFit: "cover" }}
                        />

                      ) : (
                        <Box sx={{ width: 50, height: 50, borderRadius: "50%", bgcolor: "#e0e0e0", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", color: "#555" }}>
                          {u.full_name?.charAt(0).toUpperCase()}
                        </Box>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Edit">
                        <IconButton color="primary" onClick={() => handleEdit(u)}><Edit /></IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton color="error" onClick={() => handleDelete(u.custom_id)}><Delete /></IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          {/* Add/Edit Modal */}
          <Dialog open={openModal} onClose={() => setOpenModal(false)} fullWidth maxWidth="sm">
            <DialogTitle>{editMode ? "Edit User Details" : "Add New User"}</DialogTitle>
            <DialogContent sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3, mt: 1 }}>
              <TextField
                label="Full Name"
                fullWidth
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
              />
              <TextField
                label="Email"
                fullWidth
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              />
              <TextField
                label="Mobile"
                fullWidth
                value={newUser.mobile}
                onChange={(e) => setNewUser({ ...newUser, mobile: e.target.value })}
              />
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Button variant="outlined" component="label">
                  Upload Image
                  <input type="file" accept="image/*" hidden onChange={handleImageUpload} />
                </Button>
                {newUser.preview || newUser.image ? (
                  <Box component="img" src={newUser.preview || newUser.image} alt="Preview" sx={{ width: 70, height: 70, borderRadius: "50%", objectFit: "cover", border: "2px solid #ccc" }} />
                ) : null}
              </Box>
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  value={newUser.role}
                  label="Role"
                  onChange={(e) => { setNewUser({ ...newUser, role: e.target.value }); setSelectedCourse(""); }}
                >
                  <MenuItem value="student">Student</MenuItem>
                  {/* <MenuItem value="admin">Admin</MenuItem> */}
                  <MenuItem value="staff">Staff</MenuItem>
                </Select>
              </FormControl>

              {newUser.role === "staff" && (
                <FormControl fullWidth>
                  <InputLabel>Assign Course</InputLabel>
                  <Select value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)}>
                    {courses.map((course) => (
                      <MenuItem key={course.course_id} value={course.course_id}>
                        {course.course_name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              <TextField
                label="Password"
                type={showPassword ? "text" : "password"}
                fullWidth
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                required={!editMode}
              />
            </DialogContent>
            <DialogActions sx={{ pr: 3, pb: 2 }}>
              <Button onClick={() => setOpenModal(false)} color="inherit">Cancel</Button>
              <Button variant="contained" onClick={handleAddOrEditUser}>{editMode ? "Update" : "Add"}</Button>
            </DialogActions>
          </Dialog>
        </Box>
      </Box>
    </Box>
  );
}
