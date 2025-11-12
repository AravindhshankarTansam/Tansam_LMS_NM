import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  Typography,
  Button,
  Stack,
  Divider,
  TextField,
  IconButton,
  Collapse,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from "@mui/material";
import {
  Add,
  Delete,
  Edit,
  Save,
  Close,
  ExpandMore,
  ExpandLess,
  Description,
  OndemandVideo,
  Quiz,
} from "@mui/icons-material";
import { useParams, useNavigate } from "react-router-dom";
import { MODULE_API, CHAPTER_API } from "../../../config/apiConfig";

export default function ModuleList() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [modules, setModules] = useState([]);
  const [expandedModule, setExpandedModule] = useState(null);
  const [chaptersByModule, setChaptersByModule] = useState({});
  const [newModuleName, setNewModuleName] = useState("");
  const [editingModuleId, setEditingModuleId] = useState(null);
  const [editingModuleName, setEditingModuleName] = useState("");

  // ✅ Fetch all modules for a specific course
  const fetchModules = async () => {
    try {
      const res = await fetch(`${MODULE_API}/${courseId}`, {
       credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch modules");
      const data = await res.json();
      setModules(data || []);
    } catch (err) {
      console.error("❌ Error fetching modules:", err);
    }
  };

  useEffect(() => {
    if (courseId) fetchModules();
  }, [courseId]);

  // ✅ Fetch chapters for a specific module (when expanded)
  const fetchChaptersForModule = async (moduleId) => {
    try {
      const res = await fetch(`${CHAPTER_API}/${moduleId}`, {
         credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch chapters");
      const data = await res.json();
      setChaptersByModule((prev) => ({
        ...prev,
        [moduleId]: Array.isArray(data) ? data : [],
      }));
    } catch (err) {
      console.error("❌ Error fetching chapters:", err);
    }
  };

  // ✅ Expand/collapse logic
  const handleToggleExpand = (moduleId) => {
    const isExpanding = expandedModule !== moduleId;
    setExpandedModule(isExpanding ? moduleId : null);
    if (isExpanding && !chaptersByModule[moduleId]) {
      fetchChaptersForModule(moduleId);
    }
  };

  // ✅ Add, Edit, Delete Module
const handleAddModule = async () => {
  if (!newModuleName.trim()) return;
  try {
    const res = await fetch(MODULE_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json", // ✅ Important
      },
      credentials: "include",
      body: JSON.stringify({
        course_id: courseId,
        module_name: newModuleName.trim(),
        order_index: modules.length + 1,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Failed to add module: ${errText}`);
    }

    setNewModuleName("");
    fetchModules();
  } catch (err) {
    console.error("❌ Error adding module:", err);
  }
};


  const handleDeleteModule = async (id) => {
    try {
      const res = await fetch(`${MODULE_API}/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete module");
      fetchModules();
    } catch (err) {
      console.error("❌ Error deleting module:", err);
    }
  };

  const handleEditModule = (id, name) => {
    setEditingModuleId(id);
    setEditingModuleName(name);
  };

  const handleSaveModule = async (id) => {
    try {
      const res = await fetch(`${MODULE_API}/${id}`, {
        method: "PUT",
        credentials: "include",
        body: JSON.stringify({
          module_name: editingModuleName.trim(),
          order_index: modules.findIndex((m) => m.module_id === id) + 1,
        }),
      });
      if (!res.ok) throw new Error("Failed to update module");
      setEditingModuleId(null);
      fetchModules();
    } catch (err) {
      console.error("❌ Error updating module:", err);
    }
  };

  // ✅ Delete chapter (lesson)
  const handleDeleteChapter = async (chapterId, moduleId) => {
    if (!window.confirm("Delete this lesson?")) return;
    try {
      const res = await fetch(`${CHAPTER_API}/${chapterId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete chapter");
      fetchChaptersForModule(moduleId);
    } catch (err) {
      console.error("❌ Error deleting chapter:", err);
    }
  };

  // ✅ Icon helper
  const getMaterialIcon = (type) => {
    switch (type) {
      case "video":
        return <OndemandVideo color="primary" />;
      case "pdf":
      case "ppt":
      case "doc":
        return <Description color="secondary" />;
      case "quiz":
        return <Quiz color="warning" />;
      default:
        return <Description />;
    }
  };

  return (
    <Box sx={{ p: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h5" fontWeight="bold">
          Modules for Course #{courseId}
        </Typography>
        <Button variant="outlined" color="secondary" onClick={() => navigate(-1)}>
          Back
        </Button>
      </Stack>

      <Divider sx={{ my: 2 }} />

      {/* ✅ Add New Module */}
      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <TextField
          label="New Module Name"
          value={newModuleName}
          onChange={(e) => setNewModuleName(e.target.value)}
          fullWidth
        />
        <Button
          variant="contained"
          color="primary"
          startIcon={<Add />}
          onClick={handleAddModule}
        >
          Add
        </Button>
      </Stack>

      {modules.length === 0 ? (
        <Typography color="text.secondary">No modules found.</Typography>
      ) : (
        <Stack spacing={2}>
          {modules.map((module) => (
            <Card key={module.module_id} sx={{ p: 2, boxShadow: 2 }}>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
              >
                {editingModuleId === module.module_id ? (
                  <Stack direction="row" spacing={1} alignItems="center" flex={1}>
                    <TextField
                      value={editingModuleName}
                      onChange={(e) => setEditingModuleName(e.target.value)}
                      fullWidth
                      size="small"
                    />
                    <IconButton
                      color="success"
                      onClick={() => handleSaveModule(module.module_id)}
                    >
                      <Save />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => setEditingModuleId(null)}
                    >
                      <Close />
                    </IconButton>
                  </Stack>
                ) : (
                  <>
                    <Typography variant="h6">{module.module_name}</Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Button
                        variant="outlined"
                        startIcon={<Add />}
                        onClick={() =>
                          navigate(`/admin/course/module/${module.module_id}/add-lesson`)
                        }
                      >
                        Add Lesson
                      </Button>
                      <IconButton
                        color="primary"
                        onClick={() =>
                          handleEditModule(module.module_id, module.module_name)
                        }
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => handleDeleteModule(module.module_id)}
                      >
                        <Delete />
                      </IconButton>
                      <IconButton
                        onClick={() => handleToggleExpand(module.module_id)}
                      >
                        {expandedModule === module.module_id ? (
                          <ExpandLess />
                        ) : (
                          <ExpandMore />
                        )}
                      </IconButton>
                    </Stack>
                  </>
                )}
              </Stack>

              {/* ✅ Lesson List */}
              <Collapse
                in={expandedModule === module.module_id}
                timeout="auto"
                unmountOnExit
              >
                <List dense>
                  {chaptersByModule[module.module_id]?.length > 0 ? (
                    chaptersByModule[module.module_id].map((chapter, idx) => (
                      <ListItem
                        key={chapter.chapter_id || idx}
                        secondaryAction={
                          <>
                            <IconButton
                              color="primary"
                              onClick={() =>
                                navigate(
                                  `/admin/course/chapter/edit/${chapter.chapter_id}`
                                )
                              }
                            >
                              <Edit />
                            </IconButton>
                            <IconButton
                              color="error"
                              onClick={() =>
                                handleDeleteChapter(
                                  chapter.chapter_id,
                                  module.module_id
                                )
                              }
                            >
                              <Delete />
                            </IconButton>
                          </>
                        }
                      >
                        <ListItemIcon>
                          {getMaterialIcon(chapter.material_type || "doc")}
                        </ListItemIcon>
                        <ListItemText
                          primary={`Lesson ${idx + 1}: ${
                            chapter.chapter_name ||
                            chapter.title ||
                            "Untitled Lesson"
                          }`}
                          secondary={
                            chapter.material_type
                              ? `Type: ${chapter.material_type}`
                              : "No material attached"
                          }
                        />
                      </ListItem>
                    ))
                  ) : (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ pl: 2, py: 1 }}
                    >
                      No lessons found.
                    </Typography>
                  )}
                </List>
              </Collapse>
            </Card>
          ))}
        </Stack>
      )}
    </Box>
  );
}