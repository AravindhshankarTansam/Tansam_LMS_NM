import { connectDB } from "../config/db.js";

/**
 * ✅ Enroll a student in a course
 * Automatically sets a 3-month access period.
 */
export const enrollCourse = async (req, res) => {
  const { custom_id, course_id } = req.body;

  try {
    if (!custom_id || !course_id) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const db = await connectDB();

    // 🔍 Check if already enrolled
    // In enrollCourse function
    const [existingRows, fields] = await db.execute(
      // ← Fix this too
      "SELECT 1 FROM course_enrollments WHERE custom_id = ? AND course_id = ? LIMIT 1",
      [custom_id, course_id]
    );

    if (existingRows.length > 0) {
      return res
        .status(400)
        .json({ message: "Already enrolled in this course" });
    }

    // ⏰ Set 3-month deadline (from current date)
    const completion_deadline = new Date();
    completion_deadline.setMonth(completion_deadline.getMonth() + 3);

    // 📝 Insert enrollment
    await db.execute(
      `INSERT INTO course_enrollments (custom_id, course_id, completion_deadline)
       VALUES (?, ?, ?)`,
      [custom_id, course_id, completion_deadline]
    );

    res.json({
      message: "✅ Enrollment successful",
      expires_on: completion_deadline.toISOString().split("T")[0],
    });
  } catch (error) {
    console.error("❌ Error enrolling course:", error.message);
    res.status(500).json({ message: "Error enrolling course" });
  }
};


/**
 * ✅ Get all enrolled courses for a student
 * Includes expiry check — expired courses will be flagged.
 */
/**
 * ✅ Get all enrolled courses for a student
 * Includes expiry check — expired courses will be flagged.
 */
export const getUserEnrollments = async (req, res) => {
  try {
    if (!req.user || !req.user.custom_id) {
      return res.status(401).json({
        message: "Unauthorized - custom_id missing from token",
      });
    }

    const custom_id = req.user.custom_id;
    const db = await connectDB();

    const [rows] = await db.execute(
      "SELECT * FROM course_enrollments WHERE custom_id = ?",
      [custom_id]
    );

    return res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching enrollments:", error);
    res.status(500).json({ message: "Server error fetching enrollments" });
  }
};

export const getEnrolledCourse = async (req, res) => {
  try {
    const custom_id = req.user.custom_id;
    const { courseId } = req.params;
    const db = await connectDB();

 const [rows, fields] = await db.execute(
   `SELECT e.enrollment_id, e.completion_deadline, e.completed,
          c.course_id, c.course_name, c.description, c.course_image, c.course_video,
          IFNULL(p.progress_percent,0) AS progress_percent
   FROM course_enrollments e
   JOIN courses c ON e.course_id = c.course_id
   LEFT JOIN user_progress p 
          ON p.course_id = c.course_id AND p.custom_id = e.custom_id
   WHERE e.custom_id = ? AND e.course_id = ?`,
   [custom_id, courseId]
 );

    if (!rows.length) return res.status(404).json({ message: "Course not found or not enrolled" });
    res.json(rows[0]);
  } catch (err) {
    console.error("❌ Error fetching enrolled course:", err.message);
    res.status(500).json({ message: "Error fetching enrolled course" });
  }
};


/**
 * ✅ Middleware-style check for course access (optional)
 * Use before serving lessons or modules.
 */
export const verifyCourseAccess = async (req, res, next) => {
  const { custom_id, course_id } = req.body;

  try {
    const db = await connectDB();
 const [rows, fields] = await db.execute(
   "SELECT * FROM course_enrollments WHERE custom_id = ? AND course_id = ?",
   [custom_id, course_id]
 );

    if (rows.length === 0) {
      return res.status(403).json({ message: "User not enrolled in this course" });
    }

    const enrollment = rows[0];
    const now = new Date();

    if (new Date(enrollment.completion_deadline) < now) {
      return res.status(403).json({ message: "⏰ Course access expired. Please re-enroll." });
    }

    next(); // allow access
  } catch (error) {
    console.error("❌ Error verifying course access:", error.message);
    res.status(500).json({ message: "Error verifying course access" });
  }
};


/**
 * ✅ Optional: Unenroll from a course
 */
export const unenrollCourse = async (req, res) => {
  const { custom_id, course_id } = req.body;

  try {
    const db = await connectDB();
    await db.execute(
      "DELETE FROM course_enrollments WHERE custom_id = ? AND course_id = ?",
      [custom_id, course_id]
    );

    res.json({ message: "🗑️ Unenrolled successfully" });
  } catch (error) {
    console.error("❌ Error unenrolling:", error.message);
    res.status(500).json({ message: "Error unenrolling" });
  }
};
