import { connectDB } from "../config/db.js";
import { publishCourseToNM } from "../services/nmService.js";


/* =====================================================
   HELPERS
===================================================== */

const clean = (t = "") =>
  String(t)
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();

const buildPublicUrl = (path = "") => {
  if (!path) return "";
  if (path.startsWith("http")) return path;

  const base = process.env.PUBLIC_BASE_URL;
  return `${base}/${path.replace(/^\/+/, "")}`;
};


/* =====================================================
   MAIN CONTROLLER
===================================================== */

export const publishCourse = async (req, res) => {
  console.log("\n=================================");
  console.log("🚀 NM COURSE PUBLISH STARTED");
  console.log("Course ID:", req.params.id);
  console.log("=================================\n");

  let payload = {};

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


    /* =====================================================
       IMAGE
    ===================================================== */
    if (!course.course_image_url && !course.course_image) {
      return res.status(400).json({ message: "Upload course image first" });
    }

    const imageUrl = buildPublicUrl(
      course.course_image_url || course.course_image
    );


    /* =====================================================
       MODULES → course_content
    ===================================================== */
    const [modules] = await db.query(
      `SELECT module_name
       FROM modules
       WHERE course_id=?
       ORDER BY order_index`,
      [id]
    );

    if (!modules.length) {
      return res.status(400).json({ message: "Add modules first" });
    }

    const course_content = modules.map(m => ({
      content: clean(m.module_name)
    }));


    /* =====================================================
       CHAPTERS → course_objective
    ===================================================== */
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

    const course_objective = chapters.map(c => ({
      objective: clean(c.chapter_name)
    }));


    /* =====================================================
       TYPE + FLAGS
    ===================================================== */
    const isOnline = Number(course.no_of_videos) > 0;

    const uniqueRef =
      clean(course.reference_id) || `REF_${Date.now()}`;


    /* =====================================================
       FINAL PAYLOAD
    ===================================================== */
    payload = {
      course_unique_code: clean(course.course_unique_code),
      course_name: clean(course.course_name),
      course_description: clean(course.description),
      course_image_url: imageUrl,
      instructor: clean(course.instructor),

      duration: String(course.duration_minutes),

      language: clean(course.language).toLowerCase(),
      main_stream: clean(course.mainstream).toLowerCase(),
      sub_stream: clean(course.substream).toLowerCase(),
      category: clean(course.category_name).toLowerCase(),

      system_requirements:
        clean(course.system_requirements || "Basic computer knowledge"),

      reference_id: uniqueRef,
      course_type: isOnline ? "ONLINE" : "CLASSROOM",
      course_outcomes: clean(course.course_outcome || "contact tansam for no content"),
      course_content,
      course_objective
    };


    if (isOnline) {
      payload.number_of_videos = String(course.no_of_videos);
      payload.has_subtitles = course.has_subtitles ? "true" : "false";
    } else if (course.location) {
      payload.location = clean(course.location);
    }


    console.log("\n📦 FINAL PAYLOAD >>>");
    console.log(JSON.stringify(payload, null, 2));


    /* =====================================================
       SEND TO NM
    ===================================================== */
    const response = await publishCourseToNM(payload);

    console.log("\n✅ NM SUCCESS:", response);

    res.json(response);

  } catch (err) {
    console.log("\n❌ NM ERROR:", err.message);
    res.status(500).json({ message: err.message });
  }
};
