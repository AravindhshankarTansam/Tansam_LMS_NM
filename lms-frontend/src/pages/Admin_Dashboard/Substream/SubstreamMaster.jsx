import React, { useEffect, useState } from "react";
import {
  Box, Typography, Button, IconButton, Stack,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Dialog,
  DialogTitle, DialogContent, DialogActions,
  TextField, Snackbar, Alert
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import Sidebar from "../Sidebar";
import Header from "../Header";
import { SUBSTREAM_API } from "../../../config/apiConfig";

export default function SubstreamMaster() {
  const [name, setName] = useState("");
  const [list, setList] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState({ open: false, msg: "", severity: "success" });

  const fetchSubstreams = async () => {
    const res = await fetch(SUBSTREAM_API);
    const data = await res.json();
    setList(data || []);
  };

  useEffect(() => {
    fetchSubstreams();
  }, []);

  const saveSubstream = async () => {
    if (!name.trim()) {
      setToast({ open: true, msg: "Substream name required", severity: "warning" });
      return;
    }

    const payload = { name: name.trim() };
    let res;

    if (editIndex !== null) {
      res = await fetch(`${SUBSTREAM_API}/${list[editIndex].substream_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      res = await fetch(SUBSTREAM_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }

    const data = await res.json();
    setToast({ open: true, msg: data.message, severity: "success" });
    setOpen(false);
    setName("");
    setEditIndex(null);
    fetchSubstreams();
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <Box sx={{ flexGrow: 1 }}>
        <Header />
        <Box sx={{ p: 4 }}>
          <Stack direction="row" justifyContent="space-between" mb={3}>
            <Typography variant="h4" fontWeight="bold">Substream Master</Typography>
            <Button startIcon={<AddIcon />} variant="contained" onClick={() => setOpen(true)}>
              Add Substream
            </Button>
          </Stack>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Substream Name</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {list.map((s, i) => (
                  <TableRow key={s.substream_id}>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell>{s.substream_name}</TableCell>
                    <TableCell align="center">
                      <IconButton onClick={() => {
                        setName(s.substream_name);
                        setEditIndex(i);
                        setOpen(true);
                      }}>
                        <EditIcon />
                      </IconButton>
                      <IconButton color="error" onClick={async () => {
                        await fetch(`${SUBSTREAM_API}/${s.substream_id}`, { method: "DELETE" });
                        fetchSubstreams();
                      }}>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Dialog open={open} onClose={() => setOpen(false)} fullWidth>
            <DialogTitle>{editIndex !== null ? "Edit Substream" : "Add Substream"}</DialogTitle>
            <DialogContent>
              <TextField
                fullWidth
                label="Substream Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                sx={{ mt: 2 }}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpen(false)}>Cancel</Button>
              <Button variant="contained" onClick={saveSubstream}>Save</Button>
            </DialogActions>
          </Dialog>

          <Snackbar open={toast.open} autoHideDuration={3000}>
            <Alert severity={toast.severity}>{toast.msg}</Alert>
          </Snackbar>
        </Box>
      </Box>
    </Box>
  );
}
