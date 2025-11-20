import { connectDB } from "../config/db.js";

/**
 * ============================================================
 *  UPDATE / INSERT USER PROGRESS  (UPSERT)
 * ============================================================
 */
/**
 * ============================================================
 *  UPDATE / INSERT USER PROGRESS  (UPSERT)
 * ============================================================
 */
export const updateProgress = async (req, res) => {
  const db = await connectDB();
  const { custom_id } = req.params;
  const { course_id, module_id, chapter_id, progress_percent } = req.body;

  try {
    if (!custom_id || !course_id) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // 1️⃣ Fetch existing progress
    const [existingRows] = await db.query(
      `SELECT * FROM user_progress 
       WHERE custom_id = ? AND course_id = ?`,
      [custom_id, course_id]
    );

    const old = existingRows[0] || {
      last_module_id: null,
      last_chapter_id: null,
      progress_percent: 0,
    };

    // 2️⃣ Only update module/chapter if provided
    const finalModule = module_id ?? old.last_module_id;
    const finalChapter = chapter_id ?? old.last_chapter_id;

    // ⭐ UPDATED: Set progress to the incoming value (absolute), or keep old if not provided
    const finalProgress = progress_percent ?? old.progress_percent ?? 0;

    // 4️⃣ UPSERT the data
    await db.query(
      `INSERT INTO user_progress 
        (custom_id, course_id, last_module_id, last_chapter_id, progress_percent, last_visited_at)
       VALUES (?, ?, ?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE
        last_module_id = VALUES(last_module_id),
        last_chapter_id = VALUES(last_chapter_id),
        progress_percent = VALUES(progress_percent),
        last_visited_at = NOW()`,
      [custom_id, course_id, finalModule, finalChapter, finalProgress]
    );

    res.json({ message: "Progress updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error updating progress" });
  }
};


/**
 * ============================================================
 *  GET ALL USER PROGRESS BY custom_id
 * ============================================================
 */
export const getUserProgress = async (req, res) => {
  const db = await connectDB();
  const { custom_id } = req.params;

  try {
    const [rows] = await db.query(
      `SELECT * FROM user_progress 
       WHERE custom_id = ?
       ORDER BY last_visited_at DESC`,
      [custom_id]
    );

    return res.status(200).json(rows || []);
  } catch (error) {
    console.error("❌ Error fetching progress:", error);
    res.status(500).json({ message: "Error fetching progress" });
  }
};


/**
 * ============================================================
 *  GET USER PROGRESS BY custom_id + course_id
 * ============================================================
 */
export const getUserCourseProgress = async (req, res) => {
  const db = await connectDB();
  const { custom_id, course_id } = req.params;

  try {
    const [rows] = await db.query(
      `SELECT * FROM user_progress 
       WHERE custom_id = ? AND course_id = ?`,
      [custom_id, course_id]
    );

    return res.status(200).json(rows[0] || null);

  } catch (error) {
    console.error("❌ Error fetching course progress:", error);
    res.status(500).json({ message: "Error fetching course progress" });
  }
};
