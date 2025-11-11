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
import { ADMIN_API } from "../../../config/apiConfig.js";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function AddUserPage() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [mobileError, setMobileError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    mobile: "",
    role: "student",
    password: "",
    image: "",
    preview: "",
  });

  useEffect(() => {
    fetchUsers();
  }, []);

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

  const filteredUsers = users.filter(
    (u) =>
      (u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase())) &&
      (roleFilter ? u.role === roleFilter.toLowerCase() : true)
  );

  const handleAddOrEditUser = async () => {
    const { name, email, mobile, role, password, image } = newUser;
    if (!name || !email || !mobile || !role || !password) {
      toast.warning("Please fill all required fields!");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const mobileRegex = /^\d{10}$/;
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

    if (!emailRegex.test(email)) return setEmailError("Invalid email");
    if (!mobileRegex.test(mobile)) return setMobileError("Invalid mobile number");
    if (!passwordRegex.test(password))
      return setPasswordError(
        "Password must include uppercase, lowercase, number & special char"
      );

    setEmailError("");
    setMobileError("");
    setPasswordError("");

    const formData = new FormData();
    formData.append("username", email.split("@")[0]);
    formData.append("email", email);
    formData.append("password", password);
    formData.append("role", role.toLowerCase());
    formData.append("full_name", name);
    formData.append("mobile_number", mobile);
    if (image && typeof image !== "string") formData.append("image", image);

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
      resetForm();
    } catch (err) {
      console.error("❌ API error:", err);
      toast.error("Failed to save user!");
    }
  };

  const resetForm = () => {
    setNewUser({
      name: "",
      email: "",
      mobile: "",
      role: "student",
      password: "",
      image: "",
      preview: "",
    });
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
        : "",
      preview: "",
    });
    setEditMode(true);
    setSelectedUserId(user.custom_id);
    setOpenModal(true);
  };

  const handleDelete = async (custom_id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      const res = await fetch(`${ADMIN_API}/delete/${custom_id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success("User deleted successfully!");
      fetchUsers();
    } catch (err) {
      console.error("❌ Delete error:", err);
      toast.error("Failed to delete user!");
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
      <Sidebar />
      <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
        <Header userName="Bagus" />
        <Box sx={{ flexGrow: 1, p: 4 }}>
          {/* Header */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography variant="h4" fontWeight="600">
              👥 User Management
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<PersonAdd />}
              onClick={() => {
                resetForm();
                setEditMode(false);
                setOpenModal(true);
              }}
            >
              Add User
            </Button>
          </Box>

          {/* Filters */}
          <Card
            sx={{
              p: 3,
              mb: 3,
              display: "flex",
              alignItems: "center",
              gap: 2,
              flexWrap: "wrap",
              boxShadow: 2,
            }}
          >
            <TextField
              variant="outlined"
              size="small"
              placeholder="Search by name"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: "gray" }} />,
              }}
            />

            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Role</InputLabel>
              <Select
                value={roleFilter}
                label="Role"
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="student">Student</MenuItem>
              </Select>
            </FormControl>

            <Button
              variant="contained"
              onClick={() => handleDownload("xlsx")}
              startIcon={<Download />}
            >
              Download Excel
            </Button>
            <Button
              variant="outlined"
              onClick={() => handleDownload("csv")}
              startIcon={<Download />}
            >
              Download CSV
            </Button>

            <Box sx={{ flexGrow: 1 }} />
            <Typography variant="subtitle1" fontWeight="bold">
              Total: {filteredUsers.length}
            </Typography>
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
                          src={`${import.meta.env.VITE_API_BASE_URL.replace(
                            "/api",
                            ""
                          )}/${u.image_path}`}
                          alt={u.full_name}
                          style={{
                            width: 50,
                            height: 50,
                            borderRadius: "50%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <Box
                          sx={{
                            width: 50,
                            height: 50,
                            borderRadius: "50%",
                            bgcolor: "#e0e0e0",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: "bold",
                            color: "#555",
                          }}
                        >
                          {u.full_name?.charAt(0).toUpperCase()}
                        </Box>
                      )}
                    </TableCell>

                    <TableCell align="center">
                      <Tooltip title="Edit">
                        <IconButton
                          color="primary"
                          onClick={() => handleEdit(u)}
                        >
                          <Edit />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          color="error"
                          onClick={() => handleDelete(u.custom_id)}
                        >
                          <Delete />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </Box>

        {/* Add/Edit Modal */}
        <Dialog
          open={openModal}
          onClose={() => setOpenModal(false)}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>
            {editMode ? "Edit User Details" : "Add New User"}
          </DialogTitle>
          <DialogContent
            sx={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 3,
              mt: 1,
            }}
          >
            {/* ✅ Name */}
            <TextField
              label="Full Name"
              fullWidth
              value={newUser.name}
              onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
              error={newUser.name.trim() === ""}
              helperText={
                newUser.name.trim() === "" ? "Name is required" : ""
              }
            />

            {/* ✅ Email */}
            <TextField
              label="Email"
              fullWidth
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              error={
                newUser.email &&
                !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newUser.email)
              }
              helperText={
                newUser.email &&
                !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newUser.email)
                  ? "Invalid email"
                  : ""
              }
            />

            {/* ✅ Mobile */}
            <TextField
              label="Mobile"
              fullWidth
              value={newUser.mobile}
              onChange={(e) =>
                setNewUser({ ...newUser, mobile: e.target.value })
              }
              error={newUser.mobile && !/^\d{10}$/.test(newUser.mobile)}
              helperText={
                newUser.mobile && !/^\d{10}$/.test(newUser.mobile)
                  ? "Must be 10 digits"
                  : ""
              }
            />

            {/* ✅ Image Upload + Preview */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Button variant="outlined" component="label">
                Upload Image
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleImageUpload}
                />
              </Button>
              {(newUser.preview ||
                (typeof newUser.image === "string" && newUser.image)) && (
                <Box
                  component="img"
                  src={newUser.preview || newUser.image}
                  alt="Preview"
                  sx={{
                    width: 70,
                    height: 70,
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: "2px solid #ccc",
                  }}
                />
              )}
            </Box>

            {/* ✅ Role */}
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                value={newUser.role}
                label="Role"
                onChange={(e) =>
                  setNewUser({ ...newUser, role: e.target.value })
                }
              >
                <MenuItem value="student">Student</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </Select>
            </FormControl>

            {/* ✅ Password */}
            <TextField
              label="Password"
              fullWidth
              type={showPassword ? "text" : "password"}
              value={newUser.password}
              onChange={(e) =>
                setNewUser({ ...newUser, password: e.target.value })
              }
              error={
                newUser.password &&
                !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/.test(
                  newUser.password
                )
              }
              helperText={
                newUser.password &&
                !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/.test(
                  newUser.password
                )
                  ? "Min 8 chars, incl. upper, lower, number & special char"
                  : ""
              }
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenModal(false)} color="secondary">
              Cancel
            </Button>
            <Button
              onClick={handleAddOrEditUser}
              variant="contained"
              color="primary"
            >
              {editMode ? "Update User" : "Save User"}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
}
