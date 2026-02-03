import { connectDB } from "../config/db.js";

export const approveNMCourse = async (req, res) => {
  try {
    const db = await connectDB();
    const { course_id, nm_reference_id } = req.body;

    if (!course_id) {
      return res.status(400).json({ message: "course_id is required" });
    }

    await db.execute(
      `
      UPDATE courses
      SET 
        nm_approval_status='approved',
        status='approved',
        nm_reference_id=?,
        nm_last_sync=NOW()
      WHERE course_id=?
      `,
      [nm_reference_id || null, course_id]
    );

    res.json({ message: "✅ Course marked as NM approved" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "NM approval failed" });
  }
};
