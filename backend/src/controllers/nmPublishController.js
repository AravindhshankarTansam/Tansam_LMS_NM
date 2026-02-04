import { connectDB } from "../config/db.js";
import { publishCourseToNM } from "../services/nmService.js";

/* =====================================================
   HELPERS
===================================================== */

// remove html + trim
const clean = (t = "") =>
  String(t)
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();

// DB path → public URL
const buildPublicUrl = (path = "") => {
  if (!path) return "";
  if (path.startsWith("http")) return path;

  const base = process.env.PUBLIC_BASE_URL;
  return `${base}/${path.replace(/^\/+/, "")}`;
};

// unique value to avoid NM duplicate timeout
const makeUnique = (value, id) =>
  `${clean(value)}_${id}_${Date.now()}`;


/* =====================================================
   MAIN CONTROLLER
===================================================== */

export const publishCourse = async (req, res) => {
  console.log("\n=================================");
  console.log("🚀 NM COURSE PUBLISH STARTED");
  console.log("Course ID:", req.params.id);
  console.log("=================================\n");

  try {
    const db = await connectDB();
    const { id } = req.params;

    /* =====================================================
       FETCH COURSE
    ===================================================== */
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

    console.log("📘 Course Loaded:", course.course_name);


    /* =====================================================
       IMAGE
    ===================================================== */
    if (!course.course_image_url && !course.course_image) {
      return res.status(400).json({
        message: "Upload course image first"
      });
    }

    const imageUrl = buildPublicUrl(
      course.course_image_url || course.course_image
    );

    console.log("🖼 Image URL:", imageUrl);


    /* =====================================================
       CONTENT → MODULES (NM syllabus)
    ===================================================== */
    console.log("🔵 Building course_content from modules...");

    const [modules] = await db.query(
      `SELECT module_name
       FROM modules
       WHERE course_id=?
       ORDER BY order_index`,
      [id]
    );

    if (!modules.length) {
      return res.status(400).json({
        message: "Add modules first"
      });
    }

    const course_content = modules.map(m => ({
      content: clean(m.module_name)
    }));

    console.log("📚 Content count:", course_content.length);


    /* =====================================================
       OBJECTIVES → CHAPTERS (NM outcomes)
    ===================================================== */
    console.log("🔵 Building course_objective from chapters...");

    const [chapters] = await db.query(
      `SELECT ch.chapter_name
       FROM chapters ch
       JOIN modules m ON ch.module_id = m.module_id
       WHERE m.course_id=?
       ORDER BY m.order_index, ch.order_index`,
      [id]
    );

    if (!chapters.length) {
      return res.status(400).json({
        message: "Add chapters first"
      });
    }

    const course_objective = chapters.map(c => ({
      objective: clean(c.chapter_name)
    }));

    console.log("🎯 Objectives count:", course_objective.length);


    /* =====================================================
       TYPE
    ===================================================== */
    const isOnline = Number(course.no_of_videos) > 0;


    /* =====================================================
       UNIQUE FIELDS (prevents NM duplicate timeout)
    ===================================================== */
    const uniqueCode = makeUnique(course.course_unique_code, id);
    const uniqueRef = makeUnique(course.reference_id || "REF", id);


    /* =====================================================
       FINAL PAYLOAD
    ===================================================== */
    const payload = {
      course_unique_code: uniqueCode,
      course_name: clean(course.course_name),
      course_description: clean(course.description),
      course_image_url: imageUrl,
      instructor: clean(course.instructor),
      duration: String(course.duration_minutes),

      language: clean(course.language).toLowerCase(),
      main_stream: clean(course.mainstream).toLowerCase(),
      sub_stream: clean(course.substream).toLowerCase(),
      category: clean(course.category_name).toLowerCase(),

      system_requirements: clean(course.system_requirements),

      reference_id: uniqueRef,

      course_type: isOnline ? "ONLINE" : "CLASSROOM",

      // 🔥 CORRECT NM MAPPING
      course_content,     // modules
      course_objective    // chapters
    };

    if (isOnline) {
      payload.number_of_videos = String(course.no_of_videos);
      payload.has_subtitles = course.has_subtitles ? "true" : "false";
    } else {
      payload.location = clean(course.location);
    }

    console.log("\n📦 FINAL PAYLOAD >>>");
    console.log(JSON.stringify(payload, null, 2));


    /* =====================================================
       SEND TO NM
    ===================================================== */
    const response = await publishCourseToNM(payload);

    console.log("✅ NM SUCCESS:", response.data);


    /* =====================================================
       UPDATE DB
    ===================================================== */
    await db.execute(
      `UPDATE courses
       SET status='sent_to_nm',
           nm_approval_status='pending',
           nm_last_sync=NOW()
       WHERE course_id=?`,
      [id]
    );

    console.log("🎉 PUBLISH COMPLETED\n");

    res.json(response.data);

  } catch (err) {
    console.log("\n❌❌❌ NM ERROR ❌❌❌");
    console.log(err.message);

    if (err.response) {
      console.log(err.response.status, err.response.data);
    }

    res.status(500).json({
      message: err.response?.data?.message || err.message
    });
  }
};
