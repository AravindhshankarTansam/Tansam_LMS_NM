import { connectDB } from "../config/db.js";
import { publishCourseToNM } from "../services/nmService.js";

const stripHTML = (t = "") =>
  t.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();

export const publishCourse = async (req, res) => {
  console.log("\n==============================");
  console.log("🚀 NM PUBLISH STARTED");
  console.log("==============================");

  try {
    const db = await connectDB();
    const { id } = req.params;

    console.log("📌 Course ID:", id);

    /* ---------------- GET COURSE ---------------- */
    const [[course]] = await db.query(
      `SELECT c.*, cat.category_name
       FROM courses c
       LEFT JOIN categories cat ON c.category_id = cat.category_id
       WHERE c.course_id=?`,
      [id]
    );

    console.log("📌 Course DB result:", course);

    if (!course) {
      console.log("❌ Course not found");
      return res.status(404).json({ message: "Course not found" });
    }

    /* ---------------- MODULES ---------------- */
    const [modules] = await db.query(
      `SELECT module_id, module_name
       FROM modules
       WHERE course_id=?
       ORDER BY order_index`,
      [id]
    );

    console.log("📌 Modules:", modules);

    const course_content = [];

    for (const mod of modules) {
      console.log("➡ Processing module:", mod.module_name);

      const [chapters] = await db.query(
        `SELECT chapter_name
         FROM chapters
         WHERE module_id=?
         ORDER BY order_index`,
        [mod.module_id]
      );

      console.log("   Chapters:", chapters);

      const cleanChapters = chapters
        .map(c => stripHTML(c.chapter_name))
        .filter(Boolean)
        .map(name => ({ content: name }));

      if (!cleanChapters.length) {
        console.log("   ⚠ Skipped (no valid chapters)");
        continue;
      }

      course_content.push({
        content: stripHTML(mod.module_name),
        chapters: cleanChapters
      });
    }

    console.log("📌 Final course_content:", JSON.stringify(course_content, null, 2));

    if (!course_content.length) {
      console.log("❌ course_content EMPTY");
      return res.status(400).json({
        message: "Add at least one module & chapter"
      });
    }

    /* ---------------- OBJECTIVES ---------------- */
    let course_objective = stripHTML(course.course_outcome || "")
      .split(/\n|,|\./)
      .map(x => x.trim())
      .filter(Boolean)
      .map(o => ({ objective: o }));

    if (!course_objective.length) {
      console.log("⚠ No objectives found → adding fallback");
      course_objective = [
        { objective: "Understand the course concepts and complete the training successfully" }
      ];
    }

    console.log("📌 Final course_objective:", course_objective);

    /* ---------------- FINAL PAYLOAD ---------------- */
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
      course_content,
      course_objective
    };

    console.log("\n🚀 FINAL NM PAYLOAD >>>");
    console.log(JSON.stringify(payload, null, 2));

    /* ---------------- SEND TO NM ---------------- */
    const response = await publishCourseToNM(payload);

    console.log("✅ NM RESPONSE:", response.data);

    /* ---------------- UPDATE STATUS ---------------- */
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
    console.error("STACK:", err.stack);

    res.status(500).json({
      message: err.response?.data?.message || "NM publish failed"
    });
  }
};
