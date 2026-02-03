import { connectDB } from "../config/db.js";

export const accessCourse = async (req, res) => {
  const { user_id, course_id } = req.body;

  try {
    const db = await connectDB();

    // Find course
    const [[course]] = await db.execute(
      `SELECT course_id FROM courses WHERE course_unique_code = ?`,
      [course_id]
    );

    if (!course) {
      return res.json({ access_status: false });
    }

    // Check subscription
    const [rows] = await db.execute(
      `SELECT 1 FROM course_enrollments
       WHERE custom_id = ? AND course_id = ?`,
      [user_id, course.course_id]
    );

    if (rows.length === 0) {
      return res.json({ access_status: false });
    }

    return res.json({
      access_status: true,
      access_url: `${process.env.LMS_BASE_URL}/course-player?course=${course.course_id}`
    });

  } catch (err) {
    console.error("Access error:", err);
    return res.json({ access_status: false });
  }
};
