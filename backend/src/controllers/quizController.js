import { connectDB } from "../config/db.js";

// ✅ Create quiz
export const createQuiz = async (req, res) => {
  try {
    const db = await connectDB();

    let { chapter_id, question, question_type, options, correct_answer } = req.body;

    if (!chapter_id || !question || !correct_answer) {
      return res
        .status(400)
        .json({ message: "❌ Required fields missing (chapter_id, question, correct_answer)" });
    }

    // Parse JSON strings if coming from FormData
    try {
      options = typeof options === "string" ? JSON.parse(options) : options;
    } catch (err) {
      console.error("⚠️ Invalid JSON in options:", err);
      return res.status(400).json({ message: "❌ Invalid options JSON format" });
    }

    // Extract up to 4 options (A–D)
    const [option_a, option_b, option_c, option_d] = options || [];

    const [result] = await db.query(
      `
      INSERT INTO quizzes
      (chapter_id, question, option_a, option_b, option_c, option_d, correct_answer, question_type)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        chapter_id,
        question,
        option_a || null,
        option_b || null,
        option_c || null,
        option_d || null,
        correct_answer,
        question_type || "mcq",
      ]
    );

    res.status(201).json({
      message: "✅ Quiz created successfully",
      quiz_id: result.insertId,
    });
  } catch (err) {
    console.error("❌ Quiz creation failed:", err);
    res.status(500).json({ error: "Failed to create quiz", details: err.message });
  }
};

// ✅ Read quizzes by chapter (random order)
export const getQuizzesByChapter = async (req, res) => {
  try {
    const db = await connectDB();
    const { chapter_id } = req.params;

    const [rows] = await db.query(
      "SELECT * FROM quizzes WHERE chapter_id = ? ORDER BY RAND()",
      [chapter_id]
    );

    res.status(200).json({ success: true, quizzes: rows });
  } catch (err) {
    console.error("❌ Error fetching quizzes:", err);
    res.status(500).json({ error: "Failed to fetch quizzes" });
  }
};

// ✅ Update quiz
export const updateQuiz = async (req, res) => {
  try {
    const db = await connectDB();
    const { id } = req.params;
    let { question, question_type, options, correct_answer } = req.body;

    try {
      options = typeof options === "string" ? JSON.parse(options) : options;
    } catch (err) {
      return res.status(400).json({ message: "❌ Invalid JSON in options" });
    }

    const [option_a, option_b, option_c, option_d] = options || [];

    await db.query(
      `
      UPDATE quizzes
      SET question = ?, question_type = ?, option_a = ?, option_b = ?, option_c = ?, option_d = ?, correct_answer = ?
      WHERE quiz_id = ?
      `,
      [
        question,
        question_type || "mcq",
        option_a || null,
        option_b || null,
        option_c || null,
        option_d || null,
        correct_answer,
        id,
      ]
    );

    res.json({ message: "📝 Quiz updated successfully" });
  } catch (err) {
    console.error("❌ Quiz update failed:", err);
    res.status(500).json({ error: "Failed to update quiz" });
  }
};

// ✅ Delete quiz
export const deleteQuiz = async (req, res) => {
  try {
    const db = await connectDB();
    const { id } = req.params;

    await db.query("DELETE FROM quizzes WHERE quiz_id = ?", [id]);

    res.json({ message: "🗑️ Quiz deleted successfully" });
  } catch (err) {
    console.error("❌ Quiz deletion failed:", err);
    res.status(500).json({ error: "Failed to delete quiz" });
  }
};

// ✅ Submit quiz
export const submitQuiz = async (req, res) => {
  try {
    const db = await connectDB();
    const { custom_id, chapter_id, answers } = req.body;

    if (!custom_id || !chapter_id || typeof answers !== "object") {
      return res
        .status(400)
        .json({ message: "❌ Missing required fields (custom_id, chapter_id, answers)" });
    }

    // Fetch all quizzes for chapter
    const [quizzes] = await db.query(
      "SELECT quiz_id, correct_answer FROM quizzes WHERE chapter_id = ?",
      [chapter_id]
    );

    if (!quizzes.length) {
      return res.status(404).json({ message: "⚠️ No quizzes found for this chapter" });
    }

    let total = quizzes.length;
    let score = 0;

    for (const quiz of quizzes) {
      const correct = quiz.correct_answer?.toString().trim();
      const selected = answers[quiz.quiz_id]?.toString().trim();

      const isCorrect = correct && selected && correct === selected;

      await db.query(
        `
        INSERT INTO quiz_results (custom_id, quiz_id, selected_answer, is_correct)
        VALUES (?, ?, ?, ?)
        `,
        [custom_id, quiz.quiz_id, selected || "", isCorrect ? 1 : 0]
      );

      if (isCorrect) score++;
    }

    const percentage = ((score / total) * 100).toFixed(2);

    res.json({
      message: "✅ Quiz submitted successfully",
      total,
      score,
      percentage,
      passed: percentage >= 50,
    });
  } catch (err) {
    console.error("❌ Quiz submission failed:", err);
    res.status(500).json({ error: "Failed to submit quiz" });
  }
};
