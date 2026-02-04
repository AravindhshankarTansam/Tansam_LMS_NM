import { connectDB } from "../config/db.js";
import { publishCourseToNM } from "../services/nmService.js";

/* =====================================================
   🔹 HELPER: remove ALL html tags (NM rejects html)
===================================================== */
const stripHTML = (text = "") =>
  text.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();

/* =====================================================
   🔹 HELPER: safe JSON parse
===================================================== */
const parseJSON = (value) => {
  if (!value) return [];
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return [];
    }
  }
  return value;
};

/* =====================================================
   🚀 PUBLISH COURSE TO NM
===================================================== */
export const publishCourse = async (req, res) => {
  try {
    const db = await connectDB();
    const { id } = req.params;

    /* -----------------------------
       1. Fetch course
    ----------------------------- */
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

    /* -----------------------------
       2. Clean & prepare data
    ----------------------------- */

    // course_content must be ARRAY
    const courseContent = parseJSON(course.course_content);

    // convert outcome text → NM required array format
    const objectives = stripHTML(course.course_outcome || "")
      .split(/\n|,|\./)
      .filter(Boolean)
      .map((o) => ({
        objective: o.trim(),
      }));

    /* -----------------------------
       3. FINAL NM PAYLOAD
       (STRICT FORMAT ONLY)
    ----------------------------- */
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

      // ⭐ REQUIRED BY NM
      course_content: courseContent,
      course_objective: objectives,
    };

    console.log("🚀 CLEAN NM PAYLOAD >>>", payload);

    /* -----------------------------
       4. Send to NM
    ----------------------------- */
    const response = await publishCourseToNM(payload);

    /* -----------------------------
       5. Update local status
    ----------------------------- */
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

    /* -----------------------------
       6. Return NM response
    ----------------------------- */
    res.json(response.data);

  } catch (err) {
    console.error(
      "❌ NM publish error >>>",
      err.response?.data || err.message
    );

    res.status(500).json({
      message: err.response?.data?.message || "NM publish failed",
    });
  }
};