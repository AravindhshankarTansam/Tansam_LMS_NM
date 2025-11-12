import { connectDB } from "../config/db.js";


// ✅ CREATE QUIZ
export const createQuiz = async (req, res) => {
  try {
    const db = await connectDB();
    const { chapter_id, question_type, question, options, correct_answers } = req.body;

    if (!chapter_id || !question || !options || options.length === 0) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // ✅ Normalize question_type
    let qType = (question_type || "multiple_choice").trim().toLowerCase();
    if (!["multiple_choice", "short_answer", "true_false"].includes(qType)) {
      qType = "multiple_choice";
    }

    // ✅ Trim question
    const qText = question.trim();

    // ✅ Map options to DB columns
    const option_a = options[0]?.trim() || null;
    const option_b = options[1]?.trim() || null;
    const option_c = options[2]?.trim() || null;
    const option_d = options[3]?.trim() || null;

    // ✅ Join multiple correct answers with comma
    const correct = Array.isArray(correct_answers)
      ? correct_answers.map(ans => ans.trim()).join(", ")
      : correct_answers?.trim() || null;

    const [result] = await db.execute(
      `INSERT INTO quizzes 
        (chapter_id, question, option_a, option_b, option_c, option_d, correct_answer, question_type)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [chapter_id, qText, option_a, option_b, option_c, option_d, correct, qType]
    );

    res.status(201).json({
      message: "✅ Quiz created successfully",
      quiz_id: result.insertId,
    });
  } catch (err) {
    console.error("❌ Error in createQuiz:", err);
    res.status(500).json({ error: "Failed to create quiz", details: err.message });
  }
};


// ✅ Fetch quizzes by chapter
export const getQuizzesByChapter = async (req, res) => {
  try {
    const db = await connectDB();
    const { chapter_id } = req.params;

    const [rows] = await db.query(
      `SELECT * FROM quizzes WHERE chapter_id = ? ORDER BY quiz_id ASC`,
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
      if (typeof options === "string") options = JSON.parse(options);
    } catch (err) {
      return res.status(400).json({ message: "Invalid JSON in options" });
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
        question_type || "multiple_choice",
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

// ✅ Submit quiz answers
export const submitQuiz = async (req, res) => {
  try {
    console.log("📥 Quiz submission body:", req.body); 
    const db = await connectDB();
    const { custom_id, chapter_id, answers } = req.body;

    if (!custom_id || !chapter_id || !answers || typeof answers !== "object") {
      return res
        .status(400)
        .json({ message: "❌ Missing required fields (custom_id, chapter_id, answers)" });
    }

    const [quizzes] = await db.query(
      "SELECT quiz_id, correct_answer FROM quizzes WHERE chapter_id = ?",
      [chapter_id]
    );

    let total = quizzes.length;
    let score = 0;

    for (const quiz of quizzes) {
      const userAnswer = answers[quiz.quiz_id];
      const isCorrect =
        userAnswer && quiz.correct_answer && quiz.correct_answer.trim() === userAnswer.trim();

      await db.query(
        `
        INSERT INTO quiz_results (custom_id, quiz_id, selected_answer, is_correct)
        VALUES (?, ?, ?, ?)
        `,
        [custom_id, quiz.quiz_id, userAnswer || "", isCorrect ? 1 : 0]
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
    res.status(500).json({ error: "Failed to submit quiz", details: err.message });
  }
};
