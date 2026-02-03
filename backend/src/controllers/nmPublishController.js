import { connectDB } from "../config/db.js";
import { publishCourseToNM } from "../services/nmService.js";

export const publishCourse = async (req, res) => {
  try {
    const db = await connectDB();
    const { id } = req.params;

    const [[course]] = await db.query(
      `
      SELECT c.*, cat.category_name
      FROM courses c
      LEFT JOIN categories cat ON c.category_id = cat.category_id
      WHERE c.course_id=?
      `,
      [id]
    );

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const payload = {
      course_unique_code: course.course_unique_code,
      course_name: course.course_name,
      course_description: course.description,
      course_image_url: course.course_image_url,
      instructor: course.instructor,
      duration: String(course.duration_minutes),
      number_of_videos: String(course.no_of_videos),
      language: course.language,
      main_stream: course.mainstream,
      sub_stream: course.substream,
      category: course.category_name, // ✅ correct
      system_requirements: course.system_requirements,
      has_subtitles: course.has_subtitles ? "true" : "false",
      reference_id: course.reference_id,
      course_type: course.course_type,
      location: course.location || "",

      // 🔥 NM APPROVAL HELPERS (NEW – SAFE)
      course_outcomes: course.course_outcome || "",
      course_content: course.course_content || []
    };

    await publishCourseToNM(payload);

    await db.execute(
      `
      UPDATE courses
      SET status='sent_to_nm',
          nm_approval_status='pending',
          nm_last_sync=NOW()
      WHERE course_id=?
      `,
      [id]
    );

    res.json({
      message: "✅ Course sent to Naan Mudhalvan for approval"
    });

  } catch (err) {
    console.error("NM publish error:", err.message);
    res.status(500).json({ message: "NM publish failed" });
  }
};
