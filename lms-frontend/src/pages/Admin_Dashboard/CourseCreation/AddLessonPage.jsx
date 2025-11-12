// src/pages/Admin_dashboard/CourseCreation/AddChapterPage.jsx
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  Box,
  Card,
  Typography,
  TextField,
  Button,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  IconButton,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Checkbox,
  FormControlLabel,
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
  const [materialType, setMaterialType] = useState("video");
  const [file, setFile] = useState(null);
  const [quizzes, setQuizzes] = useState([]);

  useEffect(() => {
    console.log("✅ Module ID from URL:", moduleId); 
  }, [moduleId]);

  const handleAddQuiz = () => {
    setQuizzes((prev) => [
      ...prev,
      {
        id: Date.now(),
        quiz_type: "multiple_choice", // ✅ changed from "mcq"
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

  const handleSaveChapter = async () => {
    if (!chapterName) return alert("Enter a chapter name");
    if (!moduleId) return alert("❌ Module ID missing in URL");

    // ✅ Create chapter
    const formData = new FormData();
    formData.append("module_id", moduleId);
    formData.append("chapter_name", chapterName);
    if (file) formData.append("material", file);

    const res = await fetch(CHAPTER_API, {
      method: "POST",
      credentials:"include",
      body: formData,
    });

    if (!res.ok) {
      alert("❌ Failed to create chapter");
      return;
    }

    const data = await res.json();
    const chapterId = data.chapter_id || data.id;

    if (!chapterId) {
      alert("❌ Chapter created, but no chapter_id returned from backend.");
      return;
    }

    // ✅ Create quizzes
    for (const quiz of quizzes) {
      const quizPayload = {
        chapter_id: chapterId,
        quiz_type: quiz.quiz_type,
        question: quiz.question,
        options: quiz.options,
        correct_answers: quiz.correct_answers,
        order_index: 0,
      };

      try {
        const quizRes = await fetch(QUIZ_API, {
          method: "POST",
          credentials:"include",
          body: JSON.stringify(quizPayload),
        });

        if (!quizRes.ok) {
          console.error("❌ Quiz creation failed:", quizRes.status);
        }
      } catch (err) {
        console.error("❌ Quiz creation error:", err);
      }
    }

    alert("✅ Chapter & quizzes saved successfully!");
    setChapterName("");
    setFile(null);
    setQuizzes([]);
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#f9fafb" }}>
      <Card
        sx={{
          p: 4,
          boxShadow: 5,
          borderRadius: 4,
          background: "linear-gradient(180deg, #f9f9fb 0%, #ffffff 100%)",
          "&:hover": { boxShadow: 7 },
        }}
      >
        <Typography variant="h5" fontWeight={700} mb={3}>
          Create New Chapter
        </Typography>

        {/* CHAPTER INPUTS */}
        <Stack spacing={2}>
          <TextField
            label="Chapter Name"
            value={chapterName}
            onChange={(e) => setChapterName(e.target.value)}
            fullWidth
          />

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <FormControl fullWidth>
              <InputLabel>Material Type</InputLabel>
              <Select
                value={materialType}
                label="Material Type"
                onChange={(e) => setMaterialType(e.target.value)}
              >
                <MenuItem value="video">Video</MenuItem>
                <MenuItem value="ppt">PPT</MenuItem>
                <MenuItem value="pdf">PDF</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>

            <Button
              variant="outlined"
              component="label"
              startIcon={<UploadFile />}
              sx={{ minWidth: 220 }}
            >
              Upload {materialType.toUpperCase()}
              <input
                type="file"
                hidden
                onChange={(e) => setFile(e.target.files[0])}
              />
            </Button>
          </Stack>
        </Stack>

        <Divider sx={{ my: 3 }} />

        {/* QUIZZES SECTION */}
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="h6" fontWeight={600}>
              Quizzes for this Chapter
            </Typography>
          </AccordionSummary>

          <AccordionDetails>
            <Stack spacing={2}>
              {quizzes.map((quiz, idx) => (
                <Paper
                  key={quiz.id}
                  sx={{
                    p: 2.5,
                    borderRadius: 3,
                    boxShadow: 3,
                    backgroundColor: "#f8f9fa",
                  }}
                >
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    mb={1}
                  >
                    <Typography variant="subtitle1" fontWeight={600}>
                      Quiz {idx + 1}
                    </Typography>
                    <IconButton
                      color="error"
                      onClick={() =>
                        setQuizzes(quizzes.filter((q) => q.id !== quiz.id))
                      }
                    >
                      <Delete />
                    </IconButton>
                  </Stack>

                  <Stack spacing={2}>
                    <FormControl fullWidth>
                      <InputLabel>Quiz Type</InputLabel>
                      <Select
                        value={quiz.quiz_type}
                        label="Quiz Type"
                        onChange={(e) =>
                          updateQuiz(quiz.id, "quiz_type", e.target.value)
                        }
                      >
                        <MenuItem value="multiple_choice">
                          Multiple Choice
                        </MenuItem>
                        <MenuItem value="short_answer">Short Answer</MenuItem>
                        <MenuItem value="true_false">True / False</MenuItem>
                      </Select>
                    </FormControl>

                    <TextField
                      label="Question"
                      fullWidth
                      value={quiz.question}
                      onChange={(e) =>
                        updateQuiz(quiz.id, "question", e.target.value)
                      }
                    />

                    {/* ✅ Multiple Choice Section */}
                    {quiz.quiz_type === "multiple_choice" && (
                      <>
                        {quiz.options.map((opt, i) => (
                          <TextField
                            key={i}
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
                          onClick={() => addOption(quiz.id)}
                          variant="text"
                        >
                          + Add Option
                        </Button>

                        <Typography
                          variant="subtitle2"
                          mt={1}
                          fontWeight={600}
                          color="primary"
                        >
                          Select Correct Option(s)
                        </Typography>

                        {quiz.options.map(
                          (opt, i) =>
                            opt && (
                              <FormControlLabel
                                key={`chk-${quiz.id}-${i}`}
                                control={
                                  <Checkbox
                                    checked={quiz.correct_answers.includes(opt)}
                                    onChange={() =>
                                      toggleCorrectAnswer(quiz.id, opt)
                                    }
                                  />
                                }
                                label={opt || `Option ${i + 1}`}
                              />
                            )
                        )}
                      </>
                    )}

                    {/* ✅ Short Answer */}
                    {quiz.quiz_type === "short_answer" && (
                      <TextField
                        label="Correct Answer"
                        fullWidth
                        value={quiz.correct_answers[0] || ""}
                        onChange={(e) =>
                          updateQuiz(quiz.id, "correct_answers", [
                            e.target.value,
                          ])
                        }
                      />
                    )}

                    {/* ✅ True/False */}
                    {quiz.quiz_type === "true_false" && (
                      <FormControl fullWidth>
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
                  </Stack>
                </Paper>
              ))}

              <Button
                startIcon={<Add />}
                onClick={handleAddQuiz}
                variant="contained"
                color="primary"
                sx={{ alignSelf: "flex-start" }}
              >
                Add Quiz
              </Button>
            </Stack>
          </AccordionDetails>
        </Accordion>

        <Divider sx={{ my: 3 }} />

        <Stack direction="row" justifyContent="flex-end">
          <Button
            variant="contained"
            color="success"
            size="large"
            startIcon={<Save />}
            onClick={handleSaveChapter}
          >
            Save Chapter & Quizzes
          </Button>
        </Stack>
      </Card>
    </Box>
  );
}
