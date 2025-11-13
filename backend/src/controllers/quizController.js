import { connectDB } from "../config/db.js";
import xlsx from "xlsx";
import mammoth from "mammoth";
import fs from "fs";

// ==========================================
// ✅ Create quiz (manual JSON-based)
// ==========================================
export const createQuiz = async (req, res) => {
  const db = await connectDB();

  try {
    let { chapter_id, question, quiz_type, options, correct_answers } = req.body;

    if (!chapter_id || !question) {
      return res.status(400).json({ message: "❌ Missing required fields" });
    }

    options = typeof options === "string" ? JSON.parse(options) : options;
    correct_answers = typeof correct_answers === "string" ? JSON.parse(correct_answers) : correct_answers;

    const [option_a, option_b, option_c, option_d] = options || [];
    const question_type = quiz_type === "true_false" ? "true_false" : "mcq";
    const correct_answer = correct_answers?.[0] || "";

    const [result] = await db.query(
      `INSERT INTO quizzes 
       (chapter_id, question, option_a, option_b, option_c, option_d, correct_answer, question_type)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [chapter_id, question, option_a, option_b, option_c, option_d, correct_answer, question_type]
    );

    res.json({ message: "✅ Quiz created successfully", quiz_id: result.insertId });
  } catch (err) {
    console.error("❌ Quiz creation error:", err);
    res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
};

// ==========================================
// ✅ Get quizzes by chapter
// ==========================================
export const getQuizzesByChapter = async (req, res) => {
  const db = await connectDB();
  const [quizzes] = await db.query(
    `SELECT * FROM quizzes WHERE chapter_id=? ORDER BY quiz_id ASC`,
    [req.params.chapter_id]
  );
  res.json(quizzes);
};

// ==========================================
// ✅ Update quiz
// ==========================================
export const updateQuiz = async (req, res) => {
  const db = await connectDB();
  const { id } = req.params;
  const { question, quiz_type, options, correct_answers } = req.body;

  const [option_a, option_b, option_c, option_d] =
    typeof options === "string" ? JSON.parse(options) : options;

  const correct_answer =
    typeof correct_answers === "string"
      ? JSON.parse(correct_answers)[0]
      : correct_answers?.[0];

  await db.query(
    `UPDATE quizzes
     SET question=?, question_type=?, option_a=?, option_b=?, option_c=?, option_d=?, correct_answer=?
     WHERE quiz_id=?`,
    [question, quiz_type, option_a, option_b, option_c, option_d, correct_answer, id]
  );

  res.json({ message: "📝 Quiz updated" });
};

// ==========================================
// ✅ Delete quiz
// ==========================================
export const deleteQuiz = async (req, res) => {
  const db = await connectDB();
  await db.query(`DELETE FROM quizzes WHERE quiz_id=?`, [req.params.id]);
  res.json({ message: "🗑️ Quiz deleted" });
};

// ==========================================
// ✅ Submit quiz answers (students)
// ==========================================
export const submitQuiz = async (req, res) => {
  try {
    const db = await connectDB();
    const { custom_id, answers } = req.body; // [{ quiz_id, selected_answer }]

    if (!custom_id || !answers?.length) {
      return res.status(400).json({ error: "Invalid submission format" });
    }

    for (const ans of answers) {
      const { quiz_id, selected_answer } = ans;

      const [[quiz]] = await db.query(
        `SELECT correct_answer FROM quizzes WHERE quiz_id = ?`,
        [quiz_id]
      );
      if (!quiz) continue;

      const is_correct =
        quiz.correct_answer.trim().toLowerCase() === selected_answer.trim().toLowerCase();

      const [[lastAttempt]] = await db.query(
        "SELECT MAX(attempt_number) as last FROM quiz_results WHERE custom_id = ? AND quiz_id = ?",
        [custom_id, quiz_id]
      );
      const attempt_number = (lastAttempt?.last || 0) + 1;

      await db.query(
        `INSERT INTO quiz_results (custom_id, quiz_id, selected_answer, is_correct, attempt_number)
         VALUES (?, ?, ?, ?, ?)`,
        [custom_id, quiz_id, selected_answer, is_correct, attempt_number]
      );
    }

    res.json({ message: "✅ Quiz submitted successfully" });
  } catch (error) {
    console.error("❌ Error submitting quiz:", error);
    res.status(500).json({ error: "Failed to submit quiz" });
  }
};

// ==========================================
// ✅ Import quizzes via Excel / Word (Admin)
// ==========================================
export const importQuizFromFile = async (req, res) => {
  const db = await connectDB();
  const filePath = req.file?.path;
  const fileType = req.file?.mimetype;
  const { chapter_id } = req.body;

  if (!chapter_id || !filePath) {
    return res.status(400).json({ error: "Missing chapter_id or file" });
  }

  try {
    let quizzes = [];

    if (fileType.includes("sheet") || filePath.endsWith(".xlsx")) {
      const workbook = xlsx.readFile(filePath);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = xlsx.utils.sheet_to_json(sheet);

      quizzes = data.map((row) => ({
        question: row.Question || row.question,
        options: [row.OptionA, row.OptionB, row.OptionC, row.OptionD],
        correct_answer: row.Answer || row.Correct,
        question_type: row.Type?.toLowerCase() || "mcq",
      }));
    } else if (fileType.includes("word")) {
      const result = await mammoth.extractRawText({ path: filePath });
      const text = result.value;
      const lines = text.split("\n").filter((l) => l.trim() !== "");
      lines.forEach((line) => {
        if (line.startsWith("Q")) {
          quizzes.push({
            question: line.replace(/^Q\d+[:.-]\s*/, "").trim(),
            options: [],
            correct_answer: "",
            question_type: "mcq",
          });
        }
      });
    }

    for (const q of quizzes) {
      const [a, b, c, d] = q.options || [];
      await db.query(
        `INSERT INTO quizzes (chapter_id, question, option_a, option_b, option_c, option_d, correct_answer, question_type)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [chapter_id, q.question, a, b, c, d, q.correct_answer, q.question_type]
      );
    }

    fs.unlinkSync(filePath);
    res.json({ message: `✅ Imported ${quizzes.length} quizzes successfully` });
  } catch (error) {
    console.error("❌ Import error:", error);
    res.status(500).json({ error: "Failed to import quizzes" });
  }
};
