import { connectDB } from "../config/db.js";
import { publishCourseToNM } from "../services/nmService.js";

/* ================= HELPERS ================= */

const stripHTML = (text = "") =>
  text.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();

/* ================= PUBLISH ================= */

export const publishCourse = async (req, res) => {
  try {
    const db = await connectDB();
    const { id } = req.params;

    /* 1. Fetch course */
    const [[course]] = await db.query(`
      SELECT c.*, cat.category_name
      FROM courses c
      LEFT JOIN categories cat ON c.category_id = cat.category_id
      WHERE c.course_id = ?
    `, [id]);

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    /* 2. 🔥 Build course_content from chapters (REQUIRED BY NM) */
    const [chapters] = await db.query(`
      SELECT chapter_name
      FROM chapters ch
      JOIN modules m ON ch.module_id = m.module_id
      WHERE m.course_id = ?
      ORDER BY m.order_index, ch.order_index
    `, [id]);

    const courseContent = chapters.map(ch => ({
      content: stripHTML(ch.chapter_name)
    }));

    if (courseContent.length === 0) {
      return res.status(400).json({
        message: "Add at least one chapter before publishing to NM"
      });
    }

    /* 3. Objectives */
    const objectives = stripHTML(course.course_outcome || "")
      .split(/\n|,|\./)
      .filter(Boolean)
      .map(o => ({
        objective: o.trim()
      }));

    /* 4. Payload */
    const payload = {
      course_unique_code: course.course_unique_code,
      course_name: stripHTML(course.course_name),
      course_description: stripHTML(course.description),
      course_image_url: course.course_image_url || "",
      instructor: stripHTML(course.instructor),
      duration: String(course.duration_minutes || 0),
      number_of_videos: String(course.no_of_videos || 0),
      language: stripHTML(course.language),
      main_stream: stripHTML(course.mainstream),
      sub_stream: stripHTML(course.substream),
      category: stripHTML(course.category_name),
      system_requirements: stripHTML(course.system_requirements),
      has_subtitles: course.has_subtitles ? "true" : "false",
      reference_id: course.reference_id || "",
      course_type: course.course_type || "ONLINE",
      location: stripHTML(course.location || ""),

      // ⭐ REQUIRED
      course_content: courseContent,
      course_objective: objectives
    };

    console.log("🚀 FINAL NM PAYLOAD >>>", payload);

    /* 5. Send */
    const response = await publishCourseToNM(payload);

    /* 6. Update */
    await db.execute(`
      UPDATE courses
      SET status='sent_to_nm',
          nm_approval_status='pending',
          nm_last_sync=NOW()
      WHERE course_id=?
    `, [id]);

    res.json(response.data);

  } catch (err) {
    console.error("❌ NM publish error >>>", err.response?.data || err.message);
    res.status(500).json({
      message: err.response?.data?.message || "NM publish failed"
    });
  }
};
