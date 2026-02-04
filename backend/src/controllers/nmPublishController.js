import { connectDB } from "../config/db.js";
import { publishCourseToNM } from "../services/nmService.js";

/* ================= HELPERS ================= */

const clean = (t = "") =>
  String(t)
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();

// NM PROD SAFE reference_id
const safeReferenceId = (ref) => {
  if (ref && /^[a-zA-Z0-9_-]+$/.test(ref)) return ref;
  return `REF_${Date.now()}`;
};

// Build public image URL
const buildPublicUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${process.env.PUBLIC_BASE_URL}/${path.replace(/^\/+/, "")}`;
};

/* ================= PUBLISH COURSE ================= */

export const publishCourse = async (req, res) => {
  console.log("\n🚀 NM PUBLISH STARTED");

  try {
    const db = await connectDB();
    const { id } = req.params;

    /* ---------- COURSE ---------- */
    const [[course]] = await db.query(
      `SELECT c.*, cat.category_name
       FROM courses c
       LEFT JOIN categories cat ON c.category_id = cat.category_id
       WHERE c.course_id=?`,
      [id]
    );

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    /* ---------- IMAGE ---------- */
    const imageUrl = buildPublicUrl(
      course.course_image_url || course.course_image
    );

    if (!imageUrl) {
      return res.status(400).json({ message: "Upload course image first" });
    }

    /* ---------- CHAPTERS (NM expects chapters, NOT modules) ---------- */
    const [chapters] = await db.query(
      `SELECT ch.chapter_name
       FROM chapters ch
       JOIN modules m ON ch.module_id = m.module_id
       WHERE m.course_id=?
       ORDER BY m.order_index, ch.order_index`,
      [id]
    );

    if (!chapters.length) {
      return res.status(400).json({ message: "Add chapters first" });
    }

    const course_content = chapters.map(c => ({
      content: clean(c.chapter_name)
    }));

    const course_objective = chapters.map(c => ({
      objective: clean(c.chapter_name)
    }));

    /* ---------- TYPE ---------- */
    const isOnline = String(course.course_type).toUpperCase() === "ONLINE";

    /* ---------- DURATION (must be minutes, realistic) ---------- */
    const durationMinutes = Math.min(
      Number(course.duration_minutes) || 60,
      1000
    );

    /* ---------- FINAL PAYLOAD ---------- */
    const payload = {
      course_unique_code: clean(course.course_unique_code),
      course_name: clean(course.course_name),
      course_description: clean(course.description),
      course_image_url: imageUrl,
      instructor: clean(course.instructor),
      duration: String(durationMinutes),

      language: clean(course.language).toLowerCase(),
      main_stream: clean(course.mainstream).toLowerCase(),
      sub_stream: clean(course.substream).toLowerCase(),
      category: clean(course.category_name).toLowerCase(),

      system_requirements:
        clean(course.system_requirements) || "Basic computer knowledge",

      reference_id: safeReferenceId(course.reference_id),
      course_type: isOnline ? "ONLINE" : "CLASSROOM",

      course_content,
      course_objective
    };

    if (isOnline) {
      payload.number_of_videos = String(course.no_of_videos || 1);
      payload.has_subtitles = course.has_subtitles ? "true" : "false";
    } else {
      payload.location = clean(course.location || "Chennai");
    }

    console.log("\n📦 FINAL NM PAYLOAD:");
    console.log(JSON.stringify(payload, null, 2));

    /* ---------- SEND TO NM ---------- */
    const nmResponse = await publishCourseToNM(payload);

    /* ---------- UPDATE DB ---------- */
    await db.execute(
      `UPDATE courses
       SET status='sent_to_nm',
           nm_approval_status='pending',
           nm_last_sync=NOW()
       WHERE course_id=?`,
      [id]
    );

    res.json({
      message: "✅ Course sent to NM successfully",
      nm_response: nmResponse
    });

  } catch (err) {
    console.error("❌ NM ERROR:", err.response?.data || err.message);
    res.status(500).json({
      message: err.response?.data?.message || "NM publish failed"
    });
  }
};
