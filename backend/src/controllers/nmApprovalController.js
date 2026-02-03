import { connectDB } from "../config/db.js";

export const approveNMCourse = async (req, res) => {
  try {
    const db = await connectDB();
    const { course_unique_code, nm_reference_id } = req.body;

    if (!course_unique_code || !nm_reference_id) {
      return res.status(400).json({
        message: "course_unique_code and nm_reference_id are required"
      });
    }

    const [result] = await db.execute(`
      UPDATE courses
      SET
        nm_approval_status = 'approved',
        status = 'approved',
        nm_reference_id = ?,
        nm_last_sync = NOW()
      WHERE course_unique_code = ?
    `, [nm_reference_id, course_unique_code]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Course not found" });
    }

    res.json({
      message: "✅ Course approved by NM",
      nm_reference_id
    });

  } catch (err) {
    console.error("NM approval error:", err);
    res.status(500).json({ message: "NM approval failed" });
  }
};
