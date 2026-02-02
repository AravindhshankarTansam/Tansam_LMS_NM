import { connectDB } from "../config/db.js";

export const subscribeCourse = async (req, res) => {
  const {
    user_id,        // NM user id
    course_id,      // NTEDU0005
    student_name,
    college_code,
    college_name,
    branch_name,
    district,
    university
  } = req.body;

  try {
    const db = await connectDB();

    if (!user_id || !course_id) {
      return res.json({
        subscription_registration_status: false
      });
    }

    // 1️⃣ Find LMS course
    const [[course]] = await db.execute(
      `SELECT course_id FROM courses WHERE course_unique_code = ?`,
      [course_id]
    );

    if (!course) {
      return res.json({
        subscription_registration_status: false
      });
    }

    // 2️⃣ Check existing subscription
    const [existing] = await db.execute(
      `SELECT 1 FROM course_enrollments WHERE custom_id = ? AND course_id = ?`,
      [user_id, course.course_id]
    );

    if (existing.length === 0) {
      await db.execute(
        `INSERT INTO course_enrollments (custom_id, course_id)
         VALUES (?, ?)`,
        [user_id, course.course_id]
      );
    }

    // 3️⃣ Return NM-required response
    return res.json({
      subscription_registration_status: true,
      subscription_reference_id: `SUB-${user_id}-${course.course_id}`
    });

  } catch (err) {
    console.error("Subscribe error:", err);
    return res.json({
      subscription_registration_status: false
    });
  }
};
