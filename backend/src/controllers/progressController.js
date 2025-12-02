import { connectDB } from "../config/db.js";

/**
 * ============================================================
 *  UPDATE / INSERT USER PROGRESS  (UPSERT)
 * ============================================================
 */

// controllers/progressController.js

export const updateProgress = async (req, res) => {
  const db = await connectDB();
  const { custom_id } = req.params;
  const { course_id, chapter_id, material_id, module_id } = req.body;

  try {
    if (!custom_id || !course_id || !chapter_id) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const today = new Date().toISOString().split("T")[0];

    // Daily limit check
    const [daily] = await db.query(
      `SELECT COUNT(DISTINCT ch.module_id) AS modules_today
       FROM material_completion mc
       JOIN chapter_materials cm ON mc.material_id = cm.material_id
       JOIN chapters ch ON cm.chapter_id = ch.chapter_id
       WHERE mc.custom_id = ? AND mc.course_id = ? AND DATE(mc.completed_at) = ?`,
      [custom_id, course_id, today]
    );

       const modulesToday = daily[0].modules_today || 0;

    // Allow up to 4 modules per day
    // Only block when trying to start the 5th
    if (material_id && modulesToday > 4) {
      return res.status(429).json({ 
        message: "You've reached today's limit of 4 modules. Great progress! Continue tomorrow." 
      });
    }

    // Mark material complete (if any)
    if (material_id) {
      await db.query(
        `INSERT INTO material_completion (custom_id, material_id, chapter_id, course_id, completed_at)
         VALUES (?, ?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE completed_at = NOW()`,
        [custom_id, material_id, chapter_id, course_id]
      );
    }

    // TOTAL ITEMS: materials + quiz chapters
    const [totalRes] = await db.query(
      `SELECT 
         COUNT(DISTINCT cm.material_id) AS total_materials,
         COUNT(DISTINCT CASE WHEN q.quiz_id IS NOT NULL THEN ch.chapter_id END) AS chapters_with_quiz
       FROM modules m
       JOIN chapters ch ON m.module_id = ch.module_id
       JOIN chapter_materials cm ON ch.chapter_id = cm.chapter_id
       LEFT JOIN quizzes q ON ch.chapter_id = q.chapter_id
       WHERE m.course_id = ?
       GROUP BY m.course_id`,
      [course_id]
    );

    const totalMaterials = Number(totalRes[0]?.total_materials || 0);
    const chaptersWithQuiz = Number(totalRes[0]?.chapters_with_quiz || 0);
    const totalItems = totalMaterials + chaptersWithQuiz;

    // COMPLETED ITEMS
    const [compRes] = await db.query(
      `SELECT 
         COUNT(DISTINCT mc.material_id) AS completed_materials,
         COUNT(DISTINCT CASE WHEN qr.is_correct = 1 THEN ch.chapter_id END) AS passed_quiz_chapters
       FROM modules m
       JOIN chapters ch ON m.module_id = ch.module_id
       LEFT JOIN chapter_materials cm ON ch.chapter_id = cm.chapter_id
       LEFT JOIN quizzes q ON ch.chapter_id = q.chapter_id
       LEFT JOIN material_completion mc ON cm.material_id = mc.material_id AND mc.custom_id = ?
       LEFT JOIN quiz_results qr ON q.quiz_id = qr.quiz_id AND qr.custom_id = ? AND qr.is_correct = 1
       WHERE m.course_id = ?
       GROUP BY m.course_id`,
      [custom_id, custom_id, course_id]
    );

    const completedMaterials = Number(compRes[0]?.completed_materials || 0);
    const passedQuizChapters = Number(compRes[0]?.passed_quiz_chapters || 0);
    const completedItems = completedMaterials + passedQuizChapters;
    const progressPercent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

    // Save to user_progress
    await db.query(
      `INSERT INTO user_progress 
       (custom_id, course_id, progress_percent, last_module_id, last_chapter_id, last_visited_at)
       VALUES (?, ?, ?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE
         progress_percent = VALUES(progress_percent),
         last_module_id = VALUES(last_module_id),
         last_chapter_id = VALUES(last_chapter_id),
         last_visited_at = NOW()`,
      [custom_id, course_id, progressPercent, module_id || null, chapter_id]
    );
    
 // Mark chapter completed (safe even if no quizzes)
      await db.query(
        `INSERT INTO chapter_completion (custom_id, course_id, chapter_id, completed, completed_at)
        VALUES (?, ?, ?, 1, NOW())
        ON DUPLICATE KEY UPDATE completed_at = NOW()`,
        [custom_id, course_id, chapter_id]
      );


    return res.json({
      message: "Progress updated",
      progressPercent,
      completedItems,
      totalItems,
      course_completed: progressPercent === 100,
      debug: { completedMaterials, passedQuizChapters, chaptersWithQuiz }
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
};

/** GET OVERALL USER PROGRESS BY CUSTOM_ID */

// GET /api/progress/:custom_id  → THIS MUST BE 100% FRESH
export const getUserProgress = async (req, res) => {
  const db = await connectDB();
  const { custom_id } = req.params;

  try {
    const [enrollments] = await db.query(
      `SELECT DISTINCT course_id FROM course_enrollments WHERE custom_id = ?`,
      [custom_id]
    );

    const results = [];

    for (const { course_id } of enrollments) {
      // SAME EXACT LOGIC AS updateProgress
      const [totalRes] = await db.query(
        `SELECT 
           COUNT(DISTINCT cm.material_id) AS total_materials,
           COUNT(DISTINCT CASE WHEN q.quiz_id IS NOT NULL THEN ch.chapter_id END) AS chapters_with_quiz
         FROM modules m
         JOIN chapters ch ON m.module_id = ch.module_id
         JOIN chapter_materials cm ON ch.chapter_id = cm.chapter_id
         LEFT JOIN quizzes q ON ch.chapter_id = q.chapter_id
         WHERE m.course_id = ?
         GROUP BY m.course_id`,
        [course_id]
      );

      const [completedRes] = await db.query(
        `SELECT 
           COUNT(DISTINCT mc.material_id) AS completed_materials,
           COUNT(DISTINCT CASE WHEN qr.is_correct = TRUE THEN ch.chapter_id END) AS passed_quiz_chapters
         FROM modules m
         JOIN chapters ch ON m.module_id = ch.module_id
         LEFT JOIN chapter_materials cm ON ch.chapter_id = cm.chapter_id
         LEFT JOIN quizzes q ON ch.chapter_id = q.chapter_id
         LEFT JOIN material_completion mc ON cm.material_id = mc.material_id AND mc.custom_id = ?
         LEFT JOIN quiz_results qr ON q.quiz_id = qr.quiz_id AND qr.custom_id = ? AND qr.is_correct = TRUE
         WHERE m.course_id = ?
         GROUP BY m.course_id`,
        [custom_id, custom_id, course_id]
      );

      const totalMaterials = Number(totalRes[0]?.total_materials || 0);
      const chaptersWithQuiz = Number(totalRes[0]?.chapters_with_quiz || 0);
      const totalItems = totalMaterials + chaptersWithQuiz;

      const completedMaterials = Number(completedRes[0]?.completed_materials || 0);
      const passedQuizChapters = Number(completedRes[0]?.passed_quiz_chapters || 0);
      const completedItems = completedMaterials + passedQuizChapters;
      const progressPercent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

      results.push({
        custom_id,
        course_id: Number(course_id),
        totalItems,
        completedItems,
        progressPercent,
        completedMaterials,
        passedQuizChapters,
        chaptersWithQuiz,
      });
    }

    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed" });
  }
};

// Optional: Single course progress (you can keep or delete)
export const getUserCourseProgress = async (req, res) => {
  const db = await connectDB();
  const { custom_id, course_id } = req.params;

  try {
    const [materials] = await db.query(
      `SELECT COUNT(*) as total FROM chapter_materials cm
       JOIN chapters c ON cm.chapter_id = c.chapter_id
       JOIN modules m ON c.module_id = m.module_id
       WHERE m.course_id = ? 
       AND cm.material_type IN ('video','pdf','doc','ppt','flowchart')`,
      [course_id]
    );

    const [hasQuiz] = await db.query(
      `SELECT COUNT(DISTINCT c.chapter_id) as count
       FROM chapters c
       JOIN modules m ON c.module_id = m.module_id
       WHERE m.course_id = ?
       AND EXISTS (SELECT 1 FROM quizzes q WHERE q.chapter_id = c.chapter_id)`,
      [course_id]
    );

    const totalItems = (materials[0]?.total || 0) + (hasQuiz[0]?.count || 0);

    const [matsDone] = await db.query(
      `SELECT COUNT(*) as count FROM material_completion WHERE custom_id = ? AND course_id = ?`,
      [custom_id, course_id]
    );

    const [quizDone] = await db.query(
      `SELECT COUNT(*) as count 
       FROM chapter_completion cc
       JOIN chapters c ON cc.chapter_id = c.chapter_id
       WHERE cc.custom_id = ? AND cc.course_id = ?
       AND EXISTS (SELECT 1 FROM quizzes q WHERE q.chapter_id = c.chapter_id)`,
      [custom_id, course_id]
    );

    const completedItems = (matsDone[0]?.count || 0) + (quizDone[0]?.count || 0);
    const progressPercent = totalItems === 0 ? 0 : Math.round((completedItems / totalItems) * 100);

    res.json({
      custom_id,
      course_id: Number(course_id),
      totalItems,
      completedItems,
      progressPercent,
      completedMaterials: matsDone[0]?.count || 0,
      passedQuizChapters: quizDone[0]?.count || 0,
      chaptersWithQuiz: hasQuiz[0]?.count || 0
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Failed" });
  }
};


// controllers/progressController.js
export const resetModuleProgress = async (req, res) => {
  const { custom_id } = req.params;
  const { course_id, module_id } = req.body;

  if (!course_id || !module_id) {
    return res.status(400).json({ error: "course_id and module_id required" });
  }

  const db = await connectDB();

  try {
    // 1. Delete ALL material completions in this module
    await db.execute(
      `DELETE mc FROM material_completion mc
       JOIN chapter_materials cm ON mc.material_id = cm.material_id
       JOIN chapters c ON cm.chapter_id = c.chapter_id
       JOIN modules m ON c.module_id = m.module_id
       WHERE mc.custom_id = ? 
         AND m.course_id = ? 
         AND m.module_id = ?`,
      [custom_id, course_id, module_id]
    );

    // 2. Delete ALL quiz results in this module (FIXED: no qr.course_id!)
    await db.execute(
      `DELETE qr FROM quiz_results qr
       JOIN quizzes q ON qr.quiz_id = q.quiz_id
       JOIN chapters c ON q.chapter_id = c.chapter_id
       JOIN modules m ON c.module_id = m.module_id
       WHERE qr.custom_id = ? 
         AND m.course_id = ? 
         AND m.module_id = ?`,
      [custom_id, course_id, module_id]
    );

    return res.json({ 
      success: true, 
      message: "Module reset successfully — all progress removed" 
    });

  } catch (err) {
    console.error("resetModuleProgress error:", err);
    return res.status(500).json({ 
      error: "Failed to reset module",
      details: err.message 
    });
  }
};