import { connectDB } from "../config/db.js";

// ✅ Create quiz
export const createQuiz = async (req, res) => {
  const db = await connectDB();

  try {
    let {
      chapter_id,
      question,
      quiz_type,
      options,
      correct_answers,
      order_index,
    } = req.body;

    if (!chapter_id) {
      return res.status(400).json({ message: "❌ chapter_id missing in request" });
    }

    // Parse JSON fields if sent as strings (FormData converts them)
    try {
      options = typeof options === "string" ? JSON.parse(options) : options;
      correct_answers =
        typeof correct_answers === "string"
          ? JSON.parse(correct_answers)
          : correct_answers;
    } catch (e) {
      console.error("⚠️ Invalid JSON for quiz fields:", e);
      return res.status(400).json({ message: "❌ Invalid JSON in options or correct_answers" });
    }

    const [
      option_a,
      option_b,
      option_c,
      option_d,
      option_e,
      option_f,
    ] = options || [];

    const result = await db.run(
      `INSERT INTO quizzes 
       (chapter_id, question, quiz_type, option_a, option_b, option_c, option_d, option_e, option_f, correct_answers, order_index)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        chapter_id,
        question,
        quiz_type,
        option_a,
        option_b,
        option_c,
        option_d,
        option_e,
        option_f,
        JSON.stringify(correct_answers || []),
        order_index || 0,
      ]
    );

    res.json({
      message: "✅ Quiz created successfully",
      quiz_id: result.lastID,
    });
  } catch (err) {
    console.error("❌ Quiz creation error:", err);
    res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
};


// ✅ Read quizzes by chapter (randomized)
export const getQuizzesByChapter = async (req, res) => {
  const db = await connectDB();
  const quizzes = await db.all(
    `SELECT * FROM quizzes WHERE chapter_id=? ORDER BY RANDOM()`,
    [req.params.chapter_id]
  );
  res.json(quizzes);
};

// ✅ Update quiz
export const updateQuiz = async (req, res) => {
  const db = await connectDB();
  const { id } = req.params;
  const {
    question,
    quiz_type,
    options,
    correct_answers,
    order_index,
  } = req.body;

  const [
    option_a,
    option_b,
    option_c,
    option_d,
    option_e,
    option_f,
  ] = options || [];

  await db.run(
    `UPDATE quizzes
     SET question=?, quiz_type=?, option_a=?, option_b=?, option_c=?, option_d=?, option_e=?, option_f=?, correct_answers=?, order_index=?
     WHERE quiz_id=?`,
    [
      question,
      quiz_type,
      option_a,
      option_b,
      option_c,
      option_d,
      option_e,
      option_f,
      correct_answers,
      order_index || 0,
      id,
    ]
  );
  res.json({ message: "📝 Quiz updated" });
};

// ✅ Delete quiz
export const deleteQuiz = async (req, res) => {
  const db = await connectDB();
  await db.run(`DELETE FROM quizzes WHERE quiz_id=?`, [req.params.id]);
  res.json({ message: "🗑️ Quiz deleted" });
};


export const submitQuiz = async (req, res) => {
  const db = await connectDB();
  try {
    const { user_email, chapter_id, answers } = req.body;

    if (!user_email || !chapter_id || typeof answers !== "object") {
      return res.status(400).json({ message: "❌ Missing required fields or invalid answers format" });
    }

    // Fetch correct answers
    const quizzes = await db.all(
      `SELECT quiz_id, correct_answers FROM quizzes WHERE chapter_id=?`,
      [chapter_id]
    );

    if (!quizzes.length) {
      return res.status(404).json({ message: "⚠️ No quizzes found for this chapter" });
    }

    let total = quizzes.length;
    let score = 0;

    // 🧮 Calculate score
    for (const quiz of quizzes) {
      const correctArr = JSON.parse(quiz.correct_answers || "[]");
      const selected = answers[quiz.quiz_id];

      if (!selected) continue;

      const selectedArr = Array.isArray(selected) ? selected : [selected];
      const isCorrect =
        correctArr.length === selectedArr.length &&
        correctArr.every((c) => selectedArr.includes(c));

      if (isCorrect) score++;
    }

    const percentage = ((score / total) * 100).toFixed(2);
    const submittedAt = new Date().toISOString();

    // Get previous attempts
    const previous = await db.get(
      `SELECT MAX(attempt_number) as max_attempt FROM quiz_attempts WHERE user_email=? AND chapter_id=?`,
      [user_email, chapter_id]
    );
    const attempt_number = (previous?.max_attempt || 0) + 1;

    // 🧾 Save attempt summary
    await db.run(
      `INSERT INTO quiz_attempts (user_email, chapter_id, attempt_number, total_questions, total_correct, total_score, percentage, time_taken, passed, submitted_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user_email,
        chapter_id,
        attempt_number,
        total,
        score,
        score,
        percentage,
        0,
        percentage >= 50 ? 1 : 0,
        submittedAt,
      ]
    );

    // 🗃️ Store individual results
    for (const quiz of quizzes) {
      const selected = answers[quiz.quiz_id];
      await db.run(
        `INSERT INTO quiz_results (user_email, quiz_id, user_answer, score, time_taken)
         VALUES (?, ?, ?, ?, ?)`,
        [
          user_email,
          quiz.quiz_id,
          JSON.stringify(selected || []),
          0,
          0,
        ]
      );
    }

    res.json({
      message: "✅ Quiz submitted successfully",
      score,
      total,
      percentage,
      attempt_number,
      submittedAt,
    });
  } catch (err) {
    console.error("❌ Quiz submission failed:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
