import React, { useEffect, useState } from "react";
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
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import StreamIcon from "@mui/icons-material/Stream";
import Sidebar from "../Sidebar";
import Header from "../Header";
import { MAINSTREAM_API } from "../../../config/apiConfig";

export default function MainstreamMaster() {
  const [name, setName] = useState("");
  const [list, setList] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [open, setOpen] = useState(false);

  const [toast, setToast] = useState({ open: false, msg: "", severity: "success" });

  const showToast = (msg, severity = "success") =>
    setToast({ open: true, msg, severity });

  const fetchMainstreams = async () => {
    const res = await fetch(MAINSTREAM_API);
    const data = await res.json();
    setList(data || []);
  };

  useEffect(() => {
    fetchMainstreams();
  }, []);

  const openDialog = (index = null) => {
    if (index !== null) {
      setName(list[index].mainstream_name);
      setEditIndex(index);
    } else {
      setName("");
      setEditIndex(null);
    }
    setOpen(true);
  };

  const saveMainstream = async () => {
    if (!name.trim()) {
      showToast("Mainstream name required", "warning");
      return;
    }

    const payload = { name: name.trim() };
    let res;

    if (editIndex !== null) {
      res = await fetch(`${MAINSTREAM_API}/${list[editIndex].mainstream_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      res = await fetch(MAINSTREAM_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }

    const data = await res.json();
    if (!res.ok) return showToast(data.message, "error");

    showToast(data.message || "Saved");
    setOpen(false);
    fetchMainstreams();
  };

  const deleteMainstream = async (id) => {
    if (!window.confirm("Delete this mainstream?")) return;
    const res = await fetch(`${MAINSTREAM_API}/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) return showToast(data.message, "error");

    showToast(data.message || "Deleted");
    fetchMainstreams();
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <Box sx={{ flexGrow: 1 }}>
        <Header />

        <Box sx={{ p: 4 }}>
          <Stack direction="row" justifyContent="space-between" mb={3}>
            <Typography variant="h4" fontWeight="bold">
              <StreamIcon sx={{ mr: 1 }} />
              Mainstream Master
            </Typography>
            <Button startIcon={<AddIcon />} variant="contained" onClick={() => openDialog()}>
              Add Mainstream
            </Button>
          </Stack>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Mainstream</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {list.map((m, i) => (
                  <TableRow key={m.mainstream_id}>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell>{m.mainstream_name}</TableCell>
                    <TableCell align="center">
                      <IconButton onClick={() => openDialog(i)}><EditIcon /></IconButton>
                      <IconButton color="error" onClick={() => deleteMainstream(m.mainstream_id)}>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Dialog */}
          <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
            <DialogTitle>{editIndex !== null ? "Edit Mainstream" : "Add Mainstream"}</DialogTitle>
            <DialogContent>
              <TextField
                fullWidth
                label="Mainstream Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                sx={{ mt: 2 }}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpen(false)}>Cancel</Button>
              <Button variant="contained" onClick={saveMainstream}>Save</Button>
            </DialogActions>
          </Dialog>

          <Snackbar open={toast.open} autoHideDuration={3000} onClose={() => setToast({ ...toast, open: false })}>
            <Alert severity={toast.severity}>{toast.msg}</Alert>
          </Snackbar>
        </Box>
      </Box>
    </Box>
  );
}
