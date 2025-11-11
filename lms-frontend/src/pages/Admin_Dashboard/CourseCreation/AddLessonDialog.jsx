// src/pages/User_dashboard/CourseCreate/dialogs/AddLessonDialog.jsx
import React, { useState } from "react";
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
  Typography
} from "@mui/material";
import { CloudUpload } from "@mui/icons-material";

export default function AddLessonDialog({ open, onClose, modules, setModules, currentModuleId }) {
  const [lesson, setLesson] = useState({ title: "", type: "video", duration: "", resource: null });

  const addLesson = () => {
    if (!lesson.title.trim()) return;
    const newLesson = { id: Date.now(), ...lesson };
    setModules(prev => prev.map(m => m.id === currentModuleId ? { ...m, lessons: [...m.lessons, newLesson] } : m));
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Add Lesson</DialogTitle>
      <DialogContent sx={{ width: { xs: 300, sm: 480 } }}>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField label="Lesson Title" fullWidth value={lesson.title} onChange={e => setLesson(s => ({ ...s, title: e.target.value }))} />

          <FormControl fullWidth>
            <InputLabel>Type</InputLabel>
            <Select value={lesson.type} onChange={e => setLesson(s => ({ ...s, type: e.target.value }))}>
              <MenuItem value="video">Video</MenuItem>
              <MenuItem value="document">Document</MenuItem>
              <MenuItem value="quiz">Quiz</MenuItem>
            </Select>
          </FormControl>

          <TextField label="Duration (e.g., 5:30)" fullWidth value={lesson.duration} onChange={e => setLesson(s => ({ ...s, duration: e.target.value }))} />

          <Box>
            <Button variant="outlined" component="label" startIcon={<CloudUpload />}>
              Upload Resource
              <input type="file" hidden onChange={e => setLesson(s => ({ ...s, resource: e.target.files?.[0] ?? null }))} />
            </Button>
            {lesson.resource && <Typography variant="caption" sx={{ ml: 1 }}>{lesson.resource.name}</Typography>}
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={addLesson}>Add Lesson</Button>
      </DialogActions>
    </Dialog>
  );
}
