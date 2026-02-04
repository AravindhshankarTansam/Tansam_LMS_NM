import { connectDB } from "../config/db.js";
import { publishCourseToNM } from "../services/nmService.js";

/* =====================================================
   HELPERS
===================================================== */

const clean = (t = "") =>
  String(t)
    .replace(/<[^>]*>/g, "")     // remove html
    .replace(/\s+/g, " ")       // collapse spaces
    .trim();

const buildPublicUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${process.env.PUBLIC_BASE_URL}/${path.replace(/^\/+/, "")}`;
};


/* =====================================================
   PUBLISH COURSE (NM EXACT FORMAT)
===================================================== */

export const publishCourse = async (req, res) => {
  console.log("\n==========================================");
  console.log("🚀 NM PUBLISH STARTED");
  console.log("==========================================");

  try {
    const db = await connectDB();
    const { id } = req.params;

    console.log("📌 Course ID:", id);


    /* =================================================
       1️⃣ FETCH COURSE
    ================================================= */
    const [[course]] = await db.query(
      `SELECT c.*, cat.category_name
       FROM courses c
       LEFT JOIN categories cat ON c.category_id = cat.category_id
       WHERE c.course_id=?`,
      [id]
    );

    console.log("\n🧾 RAW COURSE FROM DB:");
    console.log(JSON.stringify(course, null, 2));

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }


    /* =================================================
       2️⃣ IMAGE
    ================================================= */
    const imageUrl = buildPublicUrl(
      course.course_image_url || course.course_image
    );

    console.log("\n🖼 IMAGE DEBUG:");
    console.log({
      course_image_url: course.course_image_url,
      course_image: course.course_image,
      final_imageUrl: imageUrl
    });

    if (!imageUrl) {
      return res.status(400).json({ message: "Upload course image first" });
    }


    /* =================================================
       3️⃣ CHAPTERS → NM course_outcomes STRING
    ================================================= */
    const [chapters] = await db.query(
      `SELECT ch.chapter_name
       FROM chapters ch
       JOIN modules m ON ch.module_id = m.module_id
       WHERE m.course_id=?
       ORDER BY m.order_index, ch.order_index`,
      [id]
    );

    console.log("\n📚 RAW CHAPTERS:");
    console.log(JSON.stringify(chapters, null, 2));

    if (!chapters.length) {
      return res.status(400).json({ message: "Add chapters first" });
    }

    const course_outcomes = chapters
      .map(c => clean(c.chapter_name))
      .join("\n");

    console.log("\n🎯 course_outcomes STRING:");
    console.log(course_outcomes);


    /* =================================================
       4️⃣ TYPE + DURATION
    ================================================= */
    const isOnline =
      String(course.course_type).toUpperCase() === "ONLINE";

    const durationMinutes = Math.min(
      Number(course.duration_minutes) || 60,
      1000
    );


    /* =================================================
       5️⃣ FINAL PAYLOAD
       ⭐ EXACT ORDER AS NM CURL ⭐
    ================================================= */
const payload = {
  course_unique_code: clean(course.course_unique_code),

  course_name: clean(course.course_name),

  course_description: clean(course.description),

  course_image_url: imageUrl,

  instructor: clean(course.instructor),

  duration: String(durationMinutes),

  number_of_videos: isOnline
    ? String(course.no_of_videos || 1)
    : "",

  language: clean(course.language).toLowerCase(),

  main_stream: clean(course.mainstream).toLowerCase(),

  sub_stream: clean(course.substream).toLowerCase(),

  category: clean(course.category_name).toLowerCase(),

  system_requirements:
    clean(course.system_requirements) || "Basic computer knowledge",

  has_subtitles: isOnline
    ? (course.has_subtitles ? "true" : "false")
    : "",

  reference_id: clean(course.reference_id),

  course_type: isOnline ? "ONLINE" : "CLASSROOM",

  location: isOnline ? "" : clean(course.location || "Chennai")
};



    console.log("\n📦 FINAL NM PAYLOAD:");
    console.log(JSON.stringify(payload, null, 2));


    /* =================================================
       6️⃣ SEND TO NM
    ================================================= */
    const nmResponse = await publishCourseToNM(payload);


    /* =================================================
       7️⃣ UPDATE DB
    ================================================= */
    await db.execute(
      `UPDATE courses
       SET status='sent_to_nm',
           nm_approval_status='pending',
           nm_last_sync=NOW()
       WHERE course_id=?`,
      [id]
    );


    console.log("\n✅ NM SUCCESS RESPONSE:");
    console.log(JSON.stringify(nmResponse, null, 2));


    res.json({
      message: "Course sent to NM successfully",
      nm_response: nmResponse
    });

  } catch (err) {

    console.error("\n❌ NM FULL ERROR OBJECT:");
    console.error({
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
      headers: err.response?.headers
    });

    res.status(500).json({
      message: err.response?.data?.message || "NM publish failed"
    });
  }
};
