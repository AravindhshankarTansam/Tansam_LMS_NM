import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  Box,
  Card,
  Typography,
  TextField,
  Button,
  Stack,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  IconButton,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import {
  Add,
  Delete,
  ExpandMore,
  UploadFile,
  Save,
} from "@mui/icons-material";
import { CHAPTER_API, QUIZ_API } from "../../../config/apiConfig";

export default function AddChapterPage() {
  const { moduleId } = useParams();

  const [chapterName, setChapterName] = useState("");
  const [materials, setMaterials] = useState([]);
  const [quizzes, setQuizzes] = useState([]);

  useEffect(() => {
    console.log("✅ Module ID from URL:", moduleId);
  }, [moduleId]);

  // ===========================
  // MATERIAL HANDLERS
  // ===========================
  const handleAddMaterial = () => {
    setMaterials((prev) => [
      ...prev,
      { id: Date.now(), material_type: "", file: null },
    ]);
  };

  const updateMaterial = (id, field, value) => {
    setMaterials((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
  };

  const removeMaterial = (id) => {
    setMaterials((prev) => prev.filter((m) => m.id !== id));
  };

  // ===========================
  // QUIZ HANDLERS
  // ===========================
  const handleAddQuiz = () => {
    setQuizzes((prev) => [
      ...prev,
      {
        id: Date.now(),
        quiz_type: "multiple_choice",
        question: "",
        options: [""],
        correct_answers: [],
      },
    ]);
  };

  const updateQuiz = (id, field, value) => {
    setQuizzes((prev) =>
      prev.map((q) => (q.id === id ? { ...q, [field]: value } : q))
    );
  };

  const addOption = (quizId) => {
    setQuizzes((prev) =>
      prev.map((q) =>
        q.id === quizId && q.options.length < 6
          ? { ...q, options: [...q.options, ""] }
          : q
      )
    );
  };

  const toggleCorrectAnswer = (quizId, optionText) => {
    setQuizzes((prev) =>
      prev.map((q) => {
        if (q.id === quizId) {
          const isAlreadySelected = q.correct_answers.includes(optionText);
          return {
            ...q,
            correct_answers: isAlreadySelected
              ? q.correct_answers.filter((ans) => ans !== optionText)
              : [...q.correct_answers, optionText],
          };
        }
        return q;
      })
    );
  };

  const removeQuiz = (id) => {
    setQuizzes((prev) => prev.filter((q) => q.id !== id));
  };

  // ===========================
  // SAVE CHAPTER LOGIC
  // ===========================
  // ===========================
// SAVE CHAPTER LOGIC (Fixed)
// ===========================
const handleSaveChapter = async () => {
  if (!chapterName) return alert("⚠️ Enter a chapter name first.");
  if (!moduleId) return alert("❌ Module ID missing in URL.");

  try {
    // 🧩 Prepare FormData for chapter + materials in one request
    const formData = new FormData();
    formData.append("module_id", moduleId);
    formData.append("chapter_name", chapterName);

    materials.forEach((m) => {
      if (m.file) {
        formData.append("materials", m.file);
        formData.append("material_types", m.material_type);
      }
    });

    // ✅ Create chapter + upload materials together
    const chapterRes = await fetch(`${CHAPTER_API}`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    if (!chapterRes.ok) throw new Error(await chapterRes.text());
    const chapterData = await chapterRes.json();
    const chapterId = chapterData.chapter_id || chapterData.id;

    if (!chapterId)
      throw new Error("❌ No chapter_id returned from backend.");

    // ✅ Save quizzes (if any)
    for (const quiz of quizzes) {
      const quizPayload = {
        chapter_id: chapterId,
        quiz_type: quiz.quiz_type,
        question: quiz.question,
        options: quiz.options,
        correct_answers: quiz.correct_answers,
      };

      const quizRes = await fetch(`${QUIZ_API}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(quizPayload),
      });

      if (!quizRes.ok)
        console.error("❌ Quiz creation failed:", await quizRes.text());
    }

    alert("✅ Chapter, materials & quizzes saved successfully!");
    setChapterName("");
    setMaterials([]);
    setQuizzes([]);
  } catch (err) {
    console.error("❌ Error saving chapter:", err);
    alert(`Error: ${err.message}`);
  }
};


  // ===========================
  // FILE PREVIEW HANDLER
  // ===========================
  const renderPreview = (file, type) => {
    if (!file) return null;
    const url = URL.createObjectURL(file);
    if (type === "video") return <video src={url} controls width="280" />;
    if (type === "flowchart") return <img src={url} alt="preview" width="250" />;
    return <Typography mt={1}>{file.name}</Typography>;
  };

  // ===========================
  // UI RENDER
  // ===========================
  return (
    <Box p={3}>
      <Card
        sx={{
          p: 4,
          borderRadius: 4,
          boxShadow: 5,
          background: "linear-gradient(180deg,#f9f9fb 0%,#fff 100%)",
        }}
      >
        <Typography variant="h5" fontWeight={700} mb={3}>
          ➕ Create New Chapter
        </Typography>

        <Stack spacing={3}>
          <TextField
            label="Chapter Name"
            fullWidth
            value={chapterName}
            onChange={(e) => setChapterName(e.target.value)}
          />

          {/* ================= MATERIALS ================= */}
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6" fontWeight={600}>
                Upload Chapter Materials
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Stack spacing={2}>
                {materials.map((m) => (
                  <Paper key={m.id} sx={{ p: 2, borderRadius: 3, boxShadow: 2 }}>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      mb={1}
                    >
                      <Typography fontWeight={600}>Material</Typography>
                      <IconButton color="error" onClick={() => removeMaterial(m.id)}>
                        <Delete />
                      </IconButton>
                    </Stack>

                    <FormControl fullWidth>
                      <InputLabel>Material Type</InputLabel>
                      <Select
                        value={m.material_type}
                        label="Material Type"
                        onChange={(e) =>
                          updateMaterial(m.id, "material_type", e.target.value)
                        }
                      >
                        <MenuItem value="video">Video</MenuItem>
                        <MenuItem value="pdf">PDF</MenuItem>
                        <MenuItem value="ppt">PPT</MenuItem>
                        <MenuItem value="doc">DOC</MenuItem>
                        <MenuItem value="flowchart">Flowchart</MenuItem>
                      </Select>
                    </FormControl>

                    <Button
                      sx={{ mt: 1 }}
                      variant="outlined"
                      component="label"
                      startIcon={<UploadFile />}
                    >
                      Upload File
                      <input
                        type="file"
                        hidden
                        onChange={(e) =>
                          updateMaterial(m.id, "file", e.target.files[0])
                        }
                      />
                    </Button>

                    {renderPreview(
                      m.file,
                      m.material_type === "flowchart"
                        ? "flowchart"
                        : m.material_type
                    )}
                  </Paper>
                ))}

                <Button startIcon={<Add />} variant="contained" onClick={handleAddMaterial}>
                  Add Material
                </Button>
              </Stack>
            </AccordionDetails>
          </Accordion>

          {/* ================= QUIZZES ================= */}
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6" fontWeight={600}>
                Add Quizzes
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Stack spacing={2}>
                {quizzes.map((quiz, idx) => (
                  <Paper key={quiz.id} sx={{ p: 2, borderRadius: 3, boxShadow: 3 }}>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      mb={1}
                    >
                      <Typography fontWeight={600}>Quiz {idx + 1}</Typography>
                      <IconButton color="error" onClick={() => removeQuiz(quiz.id)}>
                        <Delete />
                      </IconButton>
                    </Stack>

                    <FormControl fullWidth>
                      <InputLabel>Quiz Type</InputLabel>
                      <Select
                        value={quiz.quiz_type}
                        label="Quiz Type"
                        onChange={(e) =>
                          updateQuiz(quiz.id, "quiz_type", e.target.value)
                        }
                      >
                        <MenuItem value="multiple_choice">Multiple Choice</MenuItem>
                        <MenuItem value="short_answer">Short Answer</MenuItem>
                        <MenuItem value="true_false">True / False</MenuItem>
                      </Select>
                    </FormControl>

                    <TextField
                      label="Question"
                      fullWidth
                      sx={{ mt: 2 }}
                      value={quiz.question}
                      onChange={(e) =>
                        updateQuiz(quiz.id, "question", e.target.value)
                      }
                    />

                    {/* Multiple Choice */}
                    {quiz.quiz_type === "multiple_choice" && (
                      <>
                        {quiz.options.map((opt, i) => (
                          <TextField
                            key={i}
                            sx={{ mt: 1 }}
                            label={`Option ${i + 1}`}
                            value={opt}
                            onChange={(e) => {
                              const opts = [...quiz.options];
                              opts[i] = e.target.value;
                              updateQuiz(quiz.id, "options", opts);
                            }}
                            fullWidth
                          />
                        ))}
                        <Button
                          size="small"
                          sx={{ mt: 1 }}
                          onClick={() => addOption(quiz.id)}
                        >
                          + Add Option
                        </Button>

                        <Typography variant="subtitle2" mt={1} fontWeight={600}>
                          Correct Answer(s)
                        </Typography>
                        {quiz.options.map(
                          (opt, i) =>
                            opt && (
                              <FormControlLabel
                                key={i}
                                control={
                                  <Checkbox
                                    checked={quiz.correct_answers.includes(opt)}
                                    onChange={() =>
                                      toggleCorrectAnswer(quiz.id, opt)
                                    }
                                  />
                                }
                                label={opt}
                              />
                            )
                        )}
                      </>
                    )}

                    {/* Short Answer */}
                    {quiz.quiz_type === "short_answer" && (
                      <TextField
                        sx={{ mt: 2 }}
                        label="Correct Answer"
                        fullWidth
                        value={quiz.correct_answers[0] || ""}
                        onChange={(e) =>
                          updateQuiz(quiz.id, "correct_answers", [e.target.value])
                        }
                      />
                    )}

                    {/* True/False */}
                    {quiz.quiz_type === "true_false" && (
                      <FormControl fullWidth sx={{ mt: 2 }}>
                        <InputLabel>Correct Answer</InputLabel>
                        <Select
                          value={quiz.correct_answers[0] || ""}
                          onChange={(e) =>
                            updateQuiz(quiz.id, "correct_answers", [
                              e.target.value,
                            ])
                          }
                        >
                          <MenuItem value="True">True</MenuItem>
                          <MenuItem value="False">False</MenuItem>
                        </Select>
                      </FormControl>
                    )}
                  </Paper>
                ))}

                <Button
                  startIcon={<Add />}
                  variant="contained"
                  color="primary"
                  onClick={handleAddQuiz}
                >
                  Add Quiz
                </Button>
              </Stack>
            </AccordionDetails>
          </Accordion>

          <Stack direction="row" justifyContent="flex-end">
            <Button
              variant="contained"
              color="success"
              size="large"
              startIcon={<Save />}
              onClick={handleSaveChapter}
            >
              Save Chapter, Materials & Quizzes
            </Button>
          </Stack>
        </Stack>
      </Card>
    </Box>
  );
}
