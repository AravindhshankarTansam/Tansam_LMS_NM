import { connectDB } from "../config/db.js";
import { publishCourseToNM } from "../services/nmService.js";

/* =====================================================
   🔹 HELPER — remove HTML (NM rejects tags)
===================================================== */
const stripHTML = (t = "") =>
  t.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();

/* =====================================================
   🚀 PUBLISH COURSE TO NM
===================================================== */
export const publishCourse = async (req, res) => {
  console.log("\n==============================");
  console.log("🚀 NM PUBLISH STARTED");
  console.log("==============================");

  try {
    const db = await connectDB();
    const { id } = req.params;

    console.log("📌 Course ID:", id);

    /* -------------------------------------------------
       1️⃣ FETCH COURSE
    ------------------------------------------------- */
    const [[course]] = await db.query(
      `SELECT c.*, cat.category_name
       FROM courses c
       LEFT JOIN categories cat ON c.category_id = cat.category_id
       WHERE c.course_id=?`,
      [id]
    );

    if (!course) {
      console.log("❌ Course not found");
      return res.status(404).json({ message: "Course not found" });
    }

    console.log("📌 Course from DB:", course);

    /* -------------------------------------------------
       2️⃣ FLATTEN CHAPTERS  (🔥 NM requires flat list ONLY)
       NM DOES NOT accept nested modules
    ------------------------------------------------- */
    const [chapters] = await db.query(
      `
      SELECT ch.chapter_name
      FROM chapters ch
      JOIN modules m ON ch.module_id = m.module_id
      WHERE m.course_id=?
      ORDER BY m.order_index, ch.order_index
      `,
      [id]
    );

    const course_content = chapters
      .map((c) => stripHTML(c.chapter_name))
      .filter(Boolean)
      .map((name) => ({ content: name }));

    console.log("📌 course_content:", course_content);
    console.log("📌 course_content length:", course_content.length);

    if (!course_content.length) {
      return res.status(400).json({
        message: "Add at least one chapter before publishing",
      });
    }

    /* -------------------------------------------------
       3️⃣ OBJECTIVES
    ------------------------------------------------- */
    let course_objective = stripHTML(course.course_outcome || "")
      .split(/\n|,|\./)
      .map((x) => x.trim())
      .filter(Boolean)
      .map((o) => ({ objective: o }));

    if (!course_objective.length) {
      console.log("⚠ No objectives → adding fallback");
      course_objective = [
        { objective: "Complete the course successfully" },
      ];
    }

    console.log("📌 course_objective:", course_objective.length);

    /* -------------------------------------------------
       4️⃣ BUILD PAYLOAD (🔥 STRICT NM RULES)
    ------------------------------------------------- */

    // 🔥 RULE:
    // ONLINE → must send number_of_videos + has_subtitles
    // CLASSROOM → must send location ONLY
    const isOnline = Number(course.no_of_videos) > 0;

    const payload = {
      course_unique_code: course.course_unique_code,
      course_name: stripHTML(course.course_name),
      course_description: stripHTML(course.description),
      course_image_url: course.course_image_url || "",
      instructor: stripHTML(course.instructor),
      duration: String(course.duration_minutes || 0),
      language: stripHTML(course.language),
      main_stream: stripHTML(course.mainstream),
      sub_stream: stripHTML(course.substream),
      category: stripHTML(course.category_name),
      system_requirements: stripHTML(course.system_requirements),
      reference_id: (course.reference_id || "").replace(/[^\w-]/g, ""), // remove slash & special chars


      course_type: isOnline ? "ONLINE" : "CLASSROOM",

      course_content,
      course_objective,
    };

    /* 🔥 CONDITIONAL FIELDS ONLY */
    if (isOnline) {
      payload.number_of_videos = String(course.no_of_videos || 1);
      payload.has_subtitles = course.has_subtitles ? "true" : "false";
    } else {
      payload.location = stripHTML(course.location || "TANSAM");
    }

    console.log("\n🚀 FINAL NM PAYLOAD >>>");
    console.log(JSON.stringify(payload, null, 2));

    /* -------------------------------------------------
       5️⃣ SEND TO NM
    ------------------------------------------------- */
    const response = await publishCourseToNM(payload);

    console.log("✅ NM RESPONSE:", response.data);

    /* -------------------------------------------------
       6️⃣ UPDATE LOCAL STATUS
    ------------------------------------------------- */
    await db.execute(
      `UPDATE courses
       SET status='sent_to_nm',
           nm_approval_status='pending',
           nm_last_sync=NOW()
       WHERE course_id=?`,
      [id]
    );

    console.log("✅ Local DB updated");

    res.json(response.data);

  } catch (err) {
    console.error("\n❌❌❌ NM ERROR CAUGHT ❌❌❌");
    console.error("STATUS:", err.response?.status);
    console.error("DATA:", err.response?.data);
    console.error("MESSAGE:", err.message);

    res.status(500).json({
      message: err.response?.data?.message || "NM publish failed",
    });
  }
};
