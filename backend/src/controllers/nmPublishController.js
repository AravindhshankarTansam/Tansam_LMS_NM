import { connectDB } from "../config/db.js";
import { publishCourseToNM } from "../services/nmService.js";

/* =====================================================
   🔹 REMOVE HTML (NM blocks tags)
===================================================== */
const stripHTML = (text = "") =>
  text.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();

/* =====================================================
   🚀 PUBLISH COURSE TO NM
===================================================== */
export const publishCourse = async (req, res) => {
  try {
    const db = await connectDB();
    const { id } = req.params;

    /* =================================================
       1. FETCH COURSE
    ================================================= */
    const [[course]] = await db.query(
      `
      SELECT c.*, cat.category_name
      FROM courses c
      LEFT JOIN categories cat ON c.category_id = cat.category_id
      WHERE c.course_id = ?
      `,
      [id]
    );

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    /* =================================================
       2. BUILD course_content FROM CHAPTERS (🔥 REQUIRED)
       NM DOES NOT accept:
       ❌ []
       ❌ strings
       ❌ JSON text
       ONLY:
       ✅ [{content:"text"}]
    ================================================= */
    const [chapters] = await db.query(
      `
      SELECT ch.chapter_name
      FROM chapters ch
      JOIN modules m ON ch.module_id = m.module_id
      WHERE m.course_id = ?
      ORDER BY m.order_index, ch.order_index
      `,
      [id]
    );

    const courseContent = chapters.map((row) => ({
      content: stripHTML(row.chapter_name),
    }));

    /* 🔴 HARD STOP (NM requires at least 1 item) */
    if (courseContent.length === 0) {
      return res.status(400).json({
        message: "Add at least one module/chapter before publishing to NM",
      });
    }

    /* =================================================
       3. BUILD OBJECTIVES ARRAY
    ================================================= */
    const objectives = stripHTML(course.course_outcome || "")
      .split(/\n|,|\./)
      .filter(Boolean)
      .map((o) => ({
        objective: o.trim(),
      }));

    /* =================================================
       4. FINAL NM PAYLOAD (STRICT FORMAT ONLY)
    ================================================= */
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
      course_type: (course.course_type || "ONLINE").toUpperCase(),
      location: stripHTML(course.location || ""),

      // ⭐⭐ MUST MATCH NM EXACTLY
      course_content: courseContent,
      course_objective: objectives,
    };

    console.log("🚀 FINAL NM PAYLOAD >>>", JSON.stringify(payload, null, 2));

    /* =================================================
       5. SEND TO NM
    ================================================= */
    const response = await publishCourseToNM(payload);

    /* =================================================
       6. UPDATE LOCAL STATUS
    ================================================= */
    await db.execute(
      `
      UPDATE courses
      SET
        status = 'sent_to_nm',
        nm_approval_status = 'pending',
        nm_last_sync = NOW()
      WHERE course_id = ?
      `,
      [id]
    );

    /* =================================================
       7. RETURN NM RESPONSE
    ================================================= */
    res.json(response.data);
  } catch (err) {
    console.error("❌ NM publish error >>>", err.response?.data || err.message);

    res.status(500).json({
      message: err.response?.data?.message || "NM publish failed",
    });
  }
};
