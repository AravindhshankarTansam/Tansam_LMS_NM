import { connectDB } from "../config/db.js";
import { publishCourseToNM } from "../services/nmService.js";

/* =========================================
   ONLY remove HTML (NOT punctuation)
========================================= */
const clean = (t = "") =>
  String(t)
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();

/* ========================================= */
const buildObjectives = (text = "") =>
  clean(text)
    .split(/\n|\.|,/)
    .map(x => x.trim())
    .filter(x => x.length > 5 && x.length < 120)
    .map(o => ({ objective: o }));

/* ========================================= */

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

    if (!course)
      return res.status(404).json({ message: "Course not found" });

    /* ---------- IMAGE (REAL ONLY) ---------- */
    if (!course.course_image_url) {
      return res.status(400).json({
        message: "Upload real course image first"
      });
    }

    /* ---------- CHAPTERS ---------- */
    const [chapters] = await db.query(
      `SELECT ch.chapter_name
       FROM chapters ch
       JOIN modules m ON ch.module_id=m.module_id
       WHERE m.course_id=?
       ORDER BY m.order_index, ch.order_index`,
      [id]
    );

    if (!chapters.length)
      return res.status(400).json({ message: "Add chapters first" });

    const course_content = chapters.map(c => ({
      content: clean(c.chapter_name)
    }));

    /* ---------- OBJECTIVES ---------- */
    let course_objective = buildObjectives(course.course_outcome);

    if (!course_objective.length) {
      course_objective = [
        { objective: "Complete the course successfully" }
      ];
    }

    const isOnline = Number(course.no_of_videos) > 0;

    /* =====================================
       FINAL PAYLOAD (NO duplicates, DB only)
    ===================================== */
    const payload = {
      course_unique_code: clean(course.course_unique_code),
      course_name: clean(course.course_name),
      course_description: clean(course.description),
      course_image_url: clean(course.course_image_url), // 🔥 DB only
      instructor: clean(course.instructor),
      duration: String(course.duration_minutes),
      language: clean(course.language).toLowerCase(),
      main_stream: clean(course.mainstream).toLowerCase(),
      sub_stream: clean(course.substream).toLowerCase(),
      category: clean(course.category_name).toLowerCase(),
      system_requirements: clean(course.system_requirements),
      reference_id: clean(course.reference_id || String(Date.now())),
      course_type: isOnline ? "ONLINE" : "CLASSROOM",
      course_content,
      course_objective
    };

    if (isOnline) {
      payload.number_of_videos = String(course.no_of_videos);
      payload.has_subtitles = course.has_subtitles ? "true" : "false";
    } else {
      payload.location = clean(course.location);
    }

    console.log("\nFINAL PAYLOAD >>>");
    console.log(JSON.stringify(payload, null, 2));

    const response = await publishCourseToNM(payload);

    await db.execute(
      `UPDATE courses
       SET status='sent_to_nm',
           nm_approval_status='pending',
           nm_last_sync=NOW()
       WHERE course_id=?`,
      [id]
    );

    console.log("✅ NM SUCCESS");
    res.json(response.data);

  } catch (err) {
    console.error("❌ NM ERROR:", err.response?.data || err.message);

    res.status(500).json({
      message: err.response?.data?.message || "NM publish failed"
    });
  }
};
