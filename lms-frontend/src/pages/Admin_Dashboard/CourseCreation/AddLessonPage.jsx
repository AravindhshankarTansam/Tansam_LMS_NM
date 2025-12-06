import React, { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
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
  ArrowBack,
} from "@mui/icons-material";
import { CHAPTER_API, QUIZ_API } from "../../../config/apiConfig";
import Sidebar from "../Sidebar";
import Header from "../Header";

export default function AddLessonPage() {
  const { moduleId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const chapterId = searchParams.get("chapterId"); // edit mode if present

  const [chapterName, setChapterName] = useState("");
  const [materials, setMaterials] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [chapterInfo, setChapterInfo] = useState(null);


  const UPLOADS_BASE =
    import.meta.env.VITE_UPLOADS_BASE || "http://localhost:5000/uploads";

  // ===========================
  // Fetch chapter & materials
  // ===========================
  useEffect(() => {
  if (!chapterId) return;

  fetch(`${CHAPTER_API}/id/${chapterId}`, { credentials: "include" })
    .then((res) => res.json())
    .then((data) => {
      setChapterName(data.chapter_name || "");
      setChapterInfo(data);   // ⬅️ store complete chapter (includes order_index)
    })
    .catch(console.error);

  fetch(`${CHAPTER_API}/${chapterId}/materials`, { credentials: "include" })
    .then((res) => res.json())
    .then((data) =>
      setMaterials(
        (data || []).map((m) => ({
          id: m.material_id,
          material_type: m.material_type,
          file: null,
          file_name: m.file_name,
          file_path: m.file_path,
        }))
      )
    )
    .catch(console.error);

  fetch(`${QUIZ_API}/${chapterId}`, { credentials: "include" })
    .then(res => res.json())
    .then(data =>
      setQuizzes(
        (data || []).map(q => ({
          id: q.quiz_id,
          quiz_type: q.question_type === "mcq" ? "multiple_choice" : q.question_type,
          question: q.question,
          options: [q.option_a, q.option_b, q.option_c, q.option_d].filter(Boolean),
          correct_answers: [q.correct_answer]
        }))
      )
    )
    .catch(console.error);
}, [chapterId]);


  // ===========================
  // Material handlers
  // ===========================
  const handleAddMaterial = () => {
    setMaterials((prev) => [...prev, { id: Date.now(), material_type: "", file: null }]);
  };
  const updateMaterial = (id, field, value) => {
    setMaterials((prev) => prev.map((m) => (m.id === id ? { ...m, [field]: value } : m)));
  };
  const removeMaterial = (id) => {
    setMaterials((prev) => prev.filter((m) => m.id !== id));
  };

  // ===========================
  // Quiz handlers
  // ===========================
  const handleAddQuiz = () => {
    setQuizzes((prev) => [
      ...prev,
      { id: Date.now(), quiz_type: "multiple_choice", question: "", options: [""], correct_answers: [] },
    ]);
  };
  const updateQuiz = (id, field, value) => {
    setQuizzes((prev) => prev.map((q) => (q.id === id ? { ...q, [field]: value } : q)));
  };
  const addOption = (quizId) => {
    setQuizzes((prev) =>
      prev.map((q) =>
        q.id === quizId && q.options.length < 6 ? { ...q, options: [...q.options, ""] } : q
      )
    );
  };
  const toggleCorrectAnswer = (quizId, optionText) => {
    setQuizzes((prev) =>
      prev.map((q) => {
        if (q.id === quizId) {
          const isSelected = q.correct_answers.includes(optionText);
          return {
            ...q,
            correct_answers: isSelected
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
  // Save chapter & quizzes
  // ===========================
 const handleSaveChapter = async () => {
  if (!chapterName) return alert("⚠️ Enter a chapter name first.");
  if (!moduleId) return alert("❌ Module ID missing in URL.");

  try {
    const formData = new FormData();
    formData.append("module_id", moduleId);
    formData.append("chapter_name", chapterName);
    formData.append("order_index", chapterInfo?.order_index || 0); 



    // 1️⃣ Prepare arrays for file IDs and types
    const materialIds = [];
    const materialTypes = [];

    // 2️⃣ Append files & corresponding IDs and types
    materials.forEach((m) => {
      if (m.file) {
        formData.append("materials", m.file);
        formData.append("material_ids", m.id); // send ID of material
        formData.append("material_types", m.material_type);
      }
    });

    // 3️⃣ Append existing materials without new files
    const existingMaterialsData = materials
      .filter(m => m.id && !m.file) // only materials not being replaced
      .map(m => ({ id: m.id, material_type: m.material_type }));

    formData.append("existing_materials", JSON.stringify(existingMaterialsData));

    // 4️⃣ Call backend
    const url = chapterId ? `${CHAPTER_API}/${chapterId}` : CHAPTER_API;
    const method = chapterId ? "PUT" : "POST";

    const chapterRes = await fetch(url, {
      method,
      body: formData,
      credentials: "include",
    });

    if (!chapterRes.ok) throw new Error(await chapterRes.text());
    const chapterData = await chapterRes.json();
    const savedChapterId = chapterData.chapter_id || chapterData.id || chapterId;

    // Save quizzes (same as before)
   // Save quizzes
for (const quiz of quizzes) {

  // Detect server quiz IDs → real DB IDs are 1–2 digits normally
  const isRealQuizId = quiz.id && String(quiz.id).length <= 2;

  // Decide method
  const quizMethod = isRealQuizId ? "PUT" : "POST";

  // Decide endpoint
  const quizUrl = isRealQuizId ? `${QUIZ_API}/${quiz.id}` : QUIZ_API;

  const quizPayload = {
    chapter_id: savedChapterId,
    quiz_type: quiz.quiz_type,
    question: quiz.question,
    options: quiz.options,
    correct_answers: quiz.correct_answers,
  };

  const quizRes = await fetch(quizUrl, {
    method: quizMethod,
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(quizPayload),
  });

  if (!quizRes.ok) {
    console.error("❌ Quiz save failed:", await quizRes.text());
  }
}


    alert(`✅ Chapter & quizzes ${chapterId ? "updated" : "created"} successfully!`);
    navigate(-1);
  } catch (err) {
    console.error("❌ Error saving chapter:", err);
    alert(`Error: ${err.message}`);
  }
};

  // ===========================
  // Render file preview
  // ===========================
  const getFileUrl = (filePath) => {
    if (!filePath) return "";
    let cleanPath = filePath.replace(/\\/g, "/");
    cleanPath = cleanPath.replace(/^uploads\//, "");
    const base = UPLOADS_BASE.endsWith("/") ? UPLOADS_BASE.slice(0, -1) : UPLOADS_BASE;
    return `${base}/${cleanPath}`;
  };

  const renderPreview = (m) => {
    if (m.file) {
      const url = URL.createObjectURL(m.file);
      if (m.material_type === "video") return <video src={url} controls width="280" />;
      if (m.material_type === "flowchart") return <img src={url} alt="preview" width="250" />;
      return <Typography mt={1}>{m.file.name}</Typography>;
    }
    if (m.file_path) {
      const url = getFileUrl(m.file_path);
      console.log("Preview URL:", url);
      if (m.material_type === "video") return <video src={url} controls width="280" />;
      if (m.material_type === "flowchart") return <img src={url} alt="preview" width="250" />;
      return <Typography mt={1}>{m.file_name}</Typography>;
    }
    return null;
  };

  // ===========================
  // Render UI
  // ===========================
  return (
    <Box sx={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <Header />

        {/* Scrollable content */}
        <Box sx={{ flex: 1, overflowY: "auto", p: 3 }}>
          <Button
            startIcon={<ArrowBack />}
            sx={{ mb: 2 }}
            onClick={() => navigate(-1)}
          >
            Back
          </Button>

          <Card sx={{ p: 4, borderRadius: 4, boxShadow: 5 }}>
            <Typography variant="h5" fontWeight={700} mb={3}>
              {chapterId ? "✏️ Edit Lesson" : "➕ Add Lesson"}
            </Typography>

            <Stack spacing={3}>
              <TextField
                label="Lesson Name"
                fullWidth
                value={chapterName}
                onChange={(e) => setChapterName(e.target.value)}
              />

              {/* Materials */}
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="h6" fontWeight={600}>Materials</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Stack spacing={2}>
                    {materials.map((m) => (
                      <Paper key={m.id} sx={{ p: 2, borderRadius: 3, boxShadow: 2 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                          <Typography fontWeight={600}>Material</Typography>
                          <IconButton color="error" onClick={() => removeMaterial(m.id)}>
                            <Delete />
                          </IconButton>
                        </Stack>
                        <FormControl fullWidth>
                          <InputLabel>Material Type</InputLabel>
                          <Select
                            value={m.material_type}
                            onChange={(e) => updateMaterial(m.id, "material_type", e.target.value)}
                          >
                            <MenuItem value="video">Video</MenuItem>
                            <MenuItem value="pdf">PDF</MenuItem>
                            <MenuItem value="ppt">PPT</MenuItem>
                            <MenuItem value="doc">DOC</MenuItem>
                            <MenuItem value="flowchart">Flowchart</MenuItem>
                          </Select>
                        </FormControl>
                        <Button sx={{ mt: 1 }} variant="outlined" component="label" startIcon={<UploadFile />}>
                          Upload File
                          <input type="file" hidden onChange={(e) => updateMaterial(m.id, "file", e.target.files[0])} />
                        </Button>
                        {renderPreview(m)}
                      </Paper>
                    ))}
                    <Button startIcon={<Add />} variant="contained" onClick={handleAddMaterial}>Add Material</Button>
                  </Stack>
                </AccordionDetails>
              </Accordion>

              {/* Quizzes */}
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="h6" fontWeight={600}>Quizzes</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Stack spacing={2}>
                    {quizzes.map((quiz, idx) => (
                      <Paper key={quiz.id} sx={{ p: 2, borderRadius: 3, boxShadow: 3 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                          <Typography fontWeight={600}>Quiz {idx + 1}</Typography>
                          <IconButton color="error" onClick={() => removeQuiz(quiz.id)}><Delete /></IconButton>
                        </Stack>

                        <FormControl fullWidth>
                          <InputLabel>Quiz Type</InputLabel>
                          <Select value={quiz.quiz_type} onChange={(e) => updateQuiz(quiz.id, "quiz_type", e.target.value)}>
                            <MenuItem value="multiple_choice">Multiple Choice</MenuItem>
                            <MenuItem value="short_answer">Short Answer</MenuItem>
                            <MenuItem value="true_false">True / False</MenuItem>
                          </Select>
                        </FormControl>

                        <TextField label="Question" fullWidth sx={{ mt: 2 }} value={quiz.question} onChange={(e) => updateQuiz(quiz.id, "question", e.target.value)} />

                        {quiz.quiz_type === "multiple_choice" && (
                          <>
                            {quiz.options.map((opt, i) => (
                              <TextField key={i} sx={{ mt: 1 }} label={`Option ${i + 1}`} value={opt} onChange={(e) => {
                                const opts = [...quiz.options]; opts[i] = e.target.value; updateQuiz(quiz.id, "options", opts);
                              }} fullWidth />
                            ))}
                            <Button size="small" sx={{ mt: 1 }} onClick={() => addOption(quiz.id)}>+ Add Option</Button>
                            <Typography variant="subtitle2" mt={1} fontWeight={600}>Correct Answer(s)</Typography>
                            {quiz.options.map((opt, i) => opt && (
                              <FormControlLabel key={i} control={<Checkbox checked={quiz.correct_answers.includes(opt)} onChange={() => toggleCorrectAnswer(quiz.id, opt)} />} label={opt} />
                            ))}
                          </>
                        )}

                        {quiz.quiz_type === "short_answer" && (
                          <TextField sx={{ mt: 2 }} label="Correct Answer" fullWidth value={quiz.correct_answers[0] || ""} onChange={(e) => updateQuiz(quiz.id, "correct_answers", [e.target.value])} />
                        )}

                        {quiz.quiz_type === "true_false" && (
                          <FormControl fullWidth sx={{ mt: 2 }}>
                            <InputLabel>Correct Answer</InputLabel>
                            <Select value={quiz.correct_answers[0] || ""} onChange={(e) => updateQuiz(quiz.id, "correct_answers", [e.target.value])}>
                              <MenuItem value="True">True</MenuItem>
                              <MenuItem value="False">False</MenuItem>
                            </Select>
                          </FormControl>
                        )}
                      </Paper>
                    ))}
                    <Button startIcon={<Add />} variant="contained" color="primary" onClick={handleAddQuiz}>Add Quiz</Button>
                  </Stack>
                </AccordionDetails>
              </Accordion>

              <Stack direction="row" justifyContent="flex-end">
                <Button variant="contained" color="success" size="large" startIcon={<Save />} onClick={handleSaveChapter}>
                  {chapterId ? "Update Lesson" : "Save Lesson"}
                </Button>
              </Stack>
            </Stack>
          </Card>
        </Box>
      </Box>
    </Box>
  );
}
