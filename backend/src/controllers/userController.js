import bcrypt from "bcryptjs";
import { connectDB } from "../config/db.js";
import { generateCustomId } from "../utils/generateCustomId.js";

// Add new user
export const addUser = async (req, res) => {
  const { username, password, role, mobile_number } = req.body;
  const image_path = req.file ? req.file.path : null;

  try {
    const db = await connectDB();

    const existing = await db.get("SELECT * FROM users WHERE username = ?", [username]);
    if (existing) return res.status(400).json({ message: "Username already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const custom_id = await generateCustomId(role, username);

    await db.run(
      "INSERT INTO users (custom_id, username, password, role, mobile_number, image_path) VALUES (?, ?, ?, ?, ?, ?)",
      [custom_id, username, hashedPassword, role, mobile_number, image_path]
    );

    res.json({ message: "User created successfully", custom_id, image_path });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error creating user" });
  }
};

// Get all users
export const getUsers = async (req, res) => {
  const db = await connectDB();
  const users = await db.all("SELECT * FROM users ORDER BY created_at DESC");
  res.json(users);
};


export const getTotalStudents = async (req, res) => {
  try {
    const db = await connectDB();
    // MySQL query to count rows in student_details
    const [[result]] = await db.query("SELECT COUNT(*) as total FROM student_details");
    res.json({ total: result.total });
  } catch (err) {
    console.error("Error in getTotalStudents:", err); // <-- log actual error
    res.status(500).json({ message: "Error fetching student count" });
  }
};

export const getAllStudents = async (req, res) => {
  try {
    const db = await connectDB();

    // 1️⃣ Fetch all students
    const [students] = await db.query(`
      SELECT 
        sd.custom_id,
        sd.user_email,
        sd.full_name,
        sd.mobile_number,
        sd.student_type,
        hm.hud_name,
        bm.block_name,
        hsm.hsc_name,
        pm.phc_name
      FROM student_details sd
      LEFT JOIN hud_master hm ON sd.hud_id = hm.hud_id
      LEFT JOIN block_master bm ON sd.block_id = bm.block_id
      LEFT JOIN hsc_master hsm ON sd.hsc_id = hsm.hsc_id
      LEFT JOIN phc_master pm ON sd.phc_id = pm.phc_id
      ORDER BY sd.full_name ASC
    `);

    // 2️⃣ Fetch progress for each student (latest entry)
    const enrichedStudents = await Promise.all(
      students.map(async (student) => {
        const [progress] = await db.query(
          `SELECT course_id, progress_percent
           FROM user_progress
           WHERE custom_id = ?
           ORDER BY last_visited_at DESC
           LIMIT 1`,
          [student.custom_id]
        );

        return {
          ...student,
          last_course_id: progress.length ? progress[0].course_id : null,
          last_progress: progress.length ? progress[0].progress_percent : 0
        };
      })
    );

    // 3️⃣ Return final response
    res.json({ students: enrichedStudents });

  } catch (err) {
    console.error("Error fetching students with progress:", err);
    res.status(500).json({ message: "Error fetching students" });
  }
};


export const getTopLearners = async (req, res) => {
  try {
    const db = await connectDB();

    const { course_id } = req.query;

    if (!course_id) {
      return res.status(400).json({ message: "course_id is required" });
    }

    // Fetch TOP LEARNERS for a specific course
    const [rows] = await db.query(
      `
      SELECT 
        sd.custom_id,
        sd.full_name,
        sd.user_email,
        latest.progress_percent,
        latest.last_visited_at
      FROM student_details sd
      JOIN (
        SELECT 
          up.custom_id,
          up.progress_percent,
          up.last_visited_at
        FROM user_progress up
        WHERE up.course_id = ?
        AND up.last_visited_at = (
          SELECT MAX(u2.last_visited_at)
          FROM user_progress u2
          WHERE u2.custom_id = up.custom_id
          AND u2.course_id = up.course_id
        )
      ) AS latest
      ON sd.custom_id = latest.custom_id
      ORDER BY latest.progress_percent DESC
      LIMIT 10;
      `,
      [course_id]
    );

    res.json({ top_learners: rows });
  } catch (err) {
    console.error("Error fetching top learners:", err);
    res.status(500).json({ message: "Error fetching top learners" });
  }
};


export const getTopLearnersByCourse = async (req, res) => {
  try {
    const db = await connectDB();

    const { course_id } = req.params;

    if (!course_id) {
      return res.status(400).json({ message: "course_id is required" });
    }

    const [rows] = await db.query(
      `
      SELECT 
        sd.custom_id,
        sd.full_name,
        sd.user_email,
        u.role,
        latest.progress_percent,
        latest.last_visited_at
      FROM student_details sd
      JOIN users u ON sd.user_email = u.email
      JOIN (
        SELECT 
          up.custom_id,
          up.progress_percent,
          up.last_visited_at
        FROM user_progress up
        WHERE up.course_id = ?
        AND up.last_visited_at = (
          SELECT MAX(up2.last_visited_at)
          FROM user_progress up2
          WHERE up2.custom_id = up.custom_id
          AND up2.course_id = up.course_id
        )
      ) AS latest
      ON sd.custom_id = latest.custom_id
      ORDER BY latest.progress_percent DESC
      LIMIT 10;
      `,
      [course_id]
    );

    res.json({ top_learners: rows });
  } catch (err) {
    console.error("Error fetching top learners by course:", err);
    res.status(500).json({ message: "Error fetching top learners by course" });
  }
};


export const getOverallLeaderboard = async (req, res) => {
  try {
    const db = await connectDB();

    const [rows] = await db.query(`
      SELECT 
        sd.custom_id,
        sd.full_name,
        sd.user_email,
        u.role,
        ROUND(AVG(latest.progress_percent), 0) AS avg_progress,
        COUNT(latest.course_id) AS total_courses
      FROM student_details sd
      JOIN users u ON sd.user_email = u.email
      JOIN (
        SELECT 
          up.custom_id,
          up.course_id,
          up.progress_percent
        FROM user_progress up
        WHERE up.last_visited_at = (
          SELECT MAX(up2.last_visited_at)
          FROM user_progress up2
          WHERE up2.custom_id = up.custom_id
          AND up2.course_id = up.course_id
        )
      ) AS latest
      ON sd.custom_id = latest.custom_id
      GROUP BY sd.custom_id, sd.full_name, sd.user_email, u.role
      HAVING total_courses > 0
      ORDER BY avg_progress DESC
      LIMIT 10;
    `);

    res.json({ leaderboard: rows });
  } catch (err) {
    console.error("Error fetching leaderboard:", err);
    res.status(500).json({ message: "Error fetching leaderboard" });
  }
};




// -------------------------------------------------------
// 1️⃣ GET DAY-WISE PROGRESS
// -------------------------------------------------------
export const getStudentDayProgress = async (req, res) => {
  try {
    const db = await connectDB();   // ✔ Same structure as leaderboard

    const { custom_id } = req.params;
    const { date } = req.query;

    if (!custom_id) {
      return res.status(400).json({ message: "custom_id is required" });
    }

    // Default India date (YYYY-MM-DD)
    const selectedDate =
      date ||
      new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

    const [rows] = await db.query(
      `
      SELECT 
        c.chapter_id,
        c.chapter_name,
        qr.quiz_id,
        qr.is_correct,
        qr.progress_percent,
        DATE(qr.attempted_at) AS attempted_date
      FROM quiz_results qr
      JOIN chapters c ON qr.chapter_id = c.chapter_id
      WHERE qr.custom_id = ?
        AND DATE(qr.attempted_at) = ?
      ORDER BY c.chapter_id, qr.quiz_id
      `,
      [custom_id, selectedDate]
    );

    res.json({
      custom_id,
      date: selectedDate,
      completed_chapters: rows
    });

  } catch (err) {
    console.error("Error fetching student day progress:", err);
    res.status(500).json({ message: "Error fetching student day progress" });
  }
};



// -------------------------------------------------------
// 2️⃣ GET REMAINING CHAPTERS
// -------------------------------------------------------
export const getRemainingChapters = async (req, res) => {
  try {
    const db = await connectDB();  // ✔ Same placement as leaderboard

    const { custom_id } = req.params;
    const { course_id } = req.query;

    if (!custom_id || !course_id) {
      return res
        .status(400)
        .json({ message: "custom_id and course_id are required" });
    }

    const [rows] = await db.query(
      `
      SELECT 
        c.chapter_id,
        c.chapter_name
      FROM chapters c
      JOIN modules m ON c.module_id = m.module_id
      WHERE m.course_id = ?
        AND c.chapter_id NOT IN (
          SELECT chapter_id
          FROM quiz_results
          WHERE custom_id = ?
            AND progress_percent = 100
        )
      ORDER BY c.chapter_id
      `,
      [course_id, custom_id]
    );

    res.json({
      custom_id,
      course_id,
      remaining_chapters: rows
    });

  } catch (err) {
    console.error("Error fetching remaining chapters:", err);
    res.status(500).json({ message: "Error fetching remaining chapters" });
  }
};










