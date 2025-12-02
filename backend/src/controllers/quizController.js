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
// controllers/quizController.js

export const submitQuiz = async (req, res) => {
  try {
    const db = await connectDB();
    const { custom_id, chapter_id, answers } = req.body;

    if (!custom_id || !chapter_id || !Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ error: "Invalid submission format" });
    }

    // 1. Get course_id
    const [chapterRows] = await db.query(
      `SELECT m.course_id
       FROM chapters c
       JOIN modules m ON c.module_id = m.module_id
       WHERE c.chapter_id = ? LIMIT 1`,
      [chapter_id]
    );
    if (!chapterRows.length) return res.status(404).json({ error: "Chapter not found" });
    const course_id = chapterRows[0].course_id;

    // 2. Cooldown & attempt logic
    const [lastRows] = await db.query(
      `SELECT attempt_number, attempted_at
       FROM quiz_results
       WHERE custom_id = ? AND chapter_id = ?
       ORDER BY attempted_at DESC LIMIT 1`,
      [custom_id, chapter_id]
    );

    let attempt_number = 1;
    if (lastRows.length > 0) {
      const last = lastRows[0];
      const diffHours = (Date.now() - new Date(last.attempted_at)) / (1000 * 60 * 60);
      if (last.attempt_number >= 5 && diffHours < 1) {
        const mins = Math.ceil(60 - diffHours * 60);
        return res.status(403).json({ error: "Too many attempts", next_try_in_minutes: mins });
      }
      attempt_number = diffHours >= 1 ? 1 : last.attempt_number + 1;
    }

    // 3. Process each answer
    let correctCount = 0;
    const totalQuestions = answers.length;

    for (const { quiz_id, selected_answer } of answers) {
      if (!quiz_id) continue;

      const [q] = await db.query(`SELECT correct_answer FROM quizzes WHERE quiz_id = ?`, [quiz_id]);
      if (!q.length) continue;

      const is_correct = String(q[0].correct_answer || "")
        .trim()
        .toLowerCase() === String(selected_answer || "").trim().toLowerCase();

      if (is_correct) correctCount++;

      await db.query(
        `INSERT INTO quiz_results
         (custom_id, quiz_id, chapter_id, selected_answer, is_correct, attempt_number, attempted_at)
         VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [custom_id, quiz_id, chapter_id, selected_answer || null, is_correct ? 1 : 0, attempt_number]
      );
    }

    // 4. Final score
        // 4) Calculate score
    // 4) Calculate score
    const scorePercent = Number(((correctCount / totalQuestions) * 100).toFixed(2));
    const passed = scorePercent >= 65;

    // FINAL 100% WORKING FIX: Trigger progress using REAL material_id
    if (passed) {
      const [matRow] = await db.query(
        `SELECT cm.material_id 
         FROM chapter_materials cm 
         JOIN chapters c ON cm.chapter_id = c.chapter_id
         JOIN modules m ON c.module_id = m.module_id
         WHERE m.course_id = ? 
         LIMIT 1`,
        [course_id]
      );

      if (matRow.length > 0) {
        const real_material_id = matRow[0].material_id;

        await db.query(
          `INSERT INTO material_completion 
             (custom_id, material_id, chapter_id, course_id, completed_at)
           VALUES (?, ?, ?, ?, NOW())
           ON DUPLICATE KEY UPDATE completed_at = NOW()`,
          [custom_id, real_material_id, chapter_id, course_id]
        );
      }
    }

    // 5) Response
    return res.json({
      message: "Quiz submitted successfully",
      score: scorePercent,
      passed,
      correct_answers: correctCount,
      total_questions: totalQuestions,
      attempt_number,
      attempts_remaining: attempt_number < 5 ? 5 - attempt_number : 0,
    });

  } catch (error) {
    console.error("submitQuiz error:", error);
    return res.status(500).json({ error: "Server error" });
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

// ==========================================
// 📊 GET all quiz attempts of a user
// ==========================================
export const getQuizAttempts = async (req, res) => {
  try {
    const db = await connectDB();
    const { custom_id } = req.params;

    const [rows] = await db.query(
      `SELECT qr.*, q.question, q.correct_answer
       FROM quiz_results qr
       JOIN quizzes q ON qr.quiz_id = q.quiz_id
       WHERE qr.custom_id = ?
       ORDER BY qr.attempted_at DESC`,
      [custom_id]
    );

    res.json(rows);
  } catch (error) {
    console.error("❌ Error fetching quiz attempts:", error);
    res.status(500).json({ error: "Failed to fetch quiz attempts" });
  }
};

// ==========================================
// 📊 GET quiz attempts of a user FOR A CHAPTER
// ==========================================
export const getQuizAttemptsByChapter = async (req, res) => {
  try {
    const db = await connectDB();
    const { custom_id, chapter_id } = req.params;

    const [rows] = await db.query(
      `SELECT qr.*, q.question, q.correct_answer
       FROM quiz_results qr
       JOIN quizzes q ON qr.quiz_id = q.quiz_id
       WHERE qr.custom_id = ? AND q.chapter_id = ?
       ORDER BY qr.attempted_at DESC`,
      [custom_id, chapter_id]
    );

    res.json(rows);
  } catch (error) {
    console.error("❌ Error fetching chapter quiz attempts:", error);
    res.status(500).json({ error: "Failed to fetch chapter quiz attempts" });
  }
};
