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
// submitQuiz (fixed)
export const submitQuiz = async (req, res) => {
  try {
    const db = await connectDB();
    const { custom_id, answers } = req.body; // expected: { custom_id, answers: [{ quiz_id, selected_answer, progress_percent?, chapter_id? }] }

    console.log("📥 submitQuiz payload:", JSON.stringify(req.body));

    if (!custom_id || !Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ error: "Invalid submission format: custom_id and answers are required" });
    }

    // Process each answer and insert a separate row for each quiz question attempt
    for (const ans of answers) {
      const { quiz_id, selected_answer } = ans;
      let progress_percent = ans.progress_percent || 0;
      let chapter_id_from_payload = ans.chapter_id || null;

      if (!quiz_id || typeof selected_answer === "undefined" || selected_answer === null) {
        // skip malformed answer items
        console.warn("⚠️ Skipping malformed answer item:", ans);
        continue;
      }

      // 1) Get quiz details (correct_answer, chapter_id)
      const [[quizRow]] = await db.query(
        `SELECT quiz_id, correct_answer, chapter_id FROM quizzes WHERE quiz_id = ? LIMIT 1`,
        [quiz_id]
      );

      if (!quizRow) {
        console.warn(`⚠️ No quiz found for quiz_id=${quiz_id}, skipping.`);
        continue;
      }

      const correct_answer = (quizRow.correct_answer || "").toString().trim().toLowerCase();
      const chosen = (selected_answer || "").toString().trim().toLowerCase();
      const is_correct = correct_answer !== "" && correct_answer === chosen ? 1 : 0;

      // prefer chapter_id returned by quizzes table if payload not provided
      const chapter_id = chapter_id_from_payload || quizRow.chapter_id;

      // 2) Compute attempt_number per user + quiz (so each new submission increments attempt for that quiz)
      const [[lastAttempt]] = await db.query(
        `SELECT MAX(attempt_number) AS last FROM quiz_results WHERE custom_id = ? AND quiz_id = ?`,
        [custom_id, quiz_id]
      );
      const attempt_number = (lastAttempt?.last || 0) + 1;

      // 3) Insert a new row for this quiz attempt
      await db.query(
        `INSERT INTO quiz_results
         (custom_id, quiz_id, chapter_id, selected_answer, is_correct, progress_percent, attempt_number)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [custom_id, quiz_id, chapter_id, selected_answer, is_correct, progress_percent, attempt_number]
      );
    }

    return res.json({ message: "✅ Quiz submitted successfully" });
  } catch (error) {
    console.error("❌ Error submitting quiz:", error);
    return res.status(500).json({ error: "Failed to submit quiz" });
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
