import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  Button,
  Stack,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import { Add } from "@mui/icons-material";
import { useParams } from "react-router-dom";
import ModuleCard from "./Module";
import { MODULE_API } from "../../../config/apiConfig";

export default function CurriculumTab({ modules, setModules, openLessonDialog }) {
  const [moduleDialogOpen, setModuleDialogOpen] = useState(false);
  const [newModuleName, setNewModuleName] = useState("");
  const [loading, setLoading] = useState(false);

  const { courseId } = useParams();

  // ✅ Fetch modules for a specific course
  const fetchModules = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${MODULE_API}/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch modules");
      const data = await res.json();
      setModules(data);
    } catch (err) {
      console.error(err);
    }
  };

  // ✅ Save new module
  const handleSaveModule = async () => {
    if (!newModuleName.trim()) return;
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(MODULE_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          course_id: courseId,
          module_name: newModuleName.trim(),
        }),
      });

      if (!res.ok) throw new Error("Failed to save module");
      const newModule = await res.json();
      setModules((prev) => [...prev, newModule]);
      setNewModuleName("");
      setModuleDialogOpen(false);
      openLessonDialog(newModule.id);
    } catch (err) {
      console.error("Error adding module:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModules();
  }, [courseId]);

  return (
    <Box>
      {/* Header */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 2 }}
      >
        <Typography variant="h6">Curriculum</Typography>
        <Button
          startIcon={<Add />}
          variant="contained"
          color="primary"
          onClick={() => setModuleDialogOpen(true)}
        >
          Add Module
        </Button>
      </Stack>

      <Divider sx={{ mb: 2 }} />

      {/* Modules Grid */}
      <Grid container spacing={2}>
        {modules.map((mod) => (
          <Grid item xs={12} md={6} key={mod.id}>
            <ModuleCard
              module={mod}
              setModules={setModules}
              openLessonDialog={openLessonDialog}
            />
          </Grid>
        ))}
      </Grid>

      {/* --- Add Module Dialog --- */}
      <Dialog
        open={moduleDialogOpen}
        onClose={() => setModuleDialogOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Add New Module</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            autoFocus
            margin="dense"
            label="Module Name"
            variant="outlined"
            value={newModuleName}
            onChange={(e) => setNewModuleName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModuleDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSaveModule}
            variant="contained"
            disabled={loading}
          >
            {loading ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
