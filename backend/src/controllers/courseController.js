import { connectDB } from "../config/db.js";
import fs from "fs";

/* ================= HELPERS ================= */

const getRelativePath = (filePath) => {
  const idx = filePath.indexOf("uploads");
  return idx !== -1 ? filePath.substring(idx).replace(/\\/g, "/") : null;
};

const safe = (v, fallback = null) =>
  v === undefined || v === "" ? fallback : v;

/**
 * Generate course_unique_code
 * Format: FIRST4LETTERS + 4-digit number
 * Example: JAVA0001
 */
const generateCourseCode = async (db, courseName) => {
  const prefix = courseName
    .replace(/[^a-zA-Z]/g, "")
    .toUpperCase()
    .substring(0, 5)
    .padEnd(5, "X"); // safety for short names

  const [rows] = await db.execute(
    `
    SELECT MAX(CAST(SUBSTRING(course_unique_code, 5) AS UNSIGNED)) AS max_num
    FROM courses
    WHERE course_unique_code LIKE ?
    `,
    [`${prefix}%`]
  );

  const nextNum = (rows[0].max_num || 0) + 1;
  return `${prefix}${String(nextNum).padStart(4, "0")}`;
};

/* ================= GET ALL COURSES ================= */

export const getAllCourses = async (req, res) => {
  try {
    const db = await connectDB();
    const [rows] = await db.execute(`
      SELECT c.*, cat.category_name
      FROM courses c
      LEFT JOIN categories cat ON c.category_id = cat.category_id
      ORDER BY c.course_id DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch courses" });
  }
};

/* ================= CREATE COURSE ================= */

export const createCourse = async (req, res) => {
  try {
    const db = await connectDB();
    const b = req.body;

    if (!b.course_name) {
      return res.status(400).json({ message: "Course name is required" });
    }

    const course_unique_code = await generateCourseCode(
      db,
      b.course_name
    );

    const course_image = req.files?.course_image?.[0]
      ? getRelativePath(req.files.course_image[0].path)
      : null;

    const course_video = req.files?.course_video?.[0]
      ? getRelativePath(req.files.course_video[0].path)
      : null;

    const created_by = req.user?.email || "system";

    const [result] = await db.execute(
      `
      INSERT INTO courses (
        course_name,
        course_unique_code,
        category_id,
        department,
        instructor,
        course_image,
        course_video,
        course_image_url,
        description,
        overview,
        course_outcome,
        system_requirements,
        requirements,
        language,
        mainstream,
        substream,
        course_type,
        duration_minutes,
        no_of_videos,
        subtitles_language,
        has_subtitles,
        reference_id,
        location,
        pricing_type,
        price_amount,
        status,
        is_active,
        created_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        safe(b.course_name),
        course_unique_code,
        safe(b.category_id),
        safe(b.department),
        safe(b.instructor),

        course_image,
        course_video,
        safe(b.course_image_url),

        safe(b.description),
        safe(b.overview),
        safe(b.course_outcome),
        safe(b.system_requirements),
        safe(b.requirements),

        safe(b.language),
        safe(b.mainstream),
        safe(b.substream),
        safe(b.course_type),

        safe(b.duration_minutes),
        safe(b.no_of_videos, 0),
        safe(b.subtitles_language),
        safe(b.has_subtitles, 0),

        safe(b.reference_id),
        safe(b.location),

        safe(b.pricing_type, "free"),
        safe(b.price_amount, 0),
        safe(b.status, "draft"),
        safe(b.is_active, "active"),

        created_by,
      ]
    );

    res.status(201).json({
      message: "Course created successfully",
      course_id: result.insertId,
      course_unique_code,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Create failed" });
  }
};

/* ================= UPDATE COURSE ================= */

export const updateCourse = async (req, res) => {
  try {
    const db = await connectDB();
    const { id } = req.params;

    const [rows] = await db.execute(
      "SELECT * FROM courses WHERE course_id=?",
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "Course not found" });
    }

    const old = rows[0];
    const b = req.body;

    let course_image = old.course_image;
    let course_video = old.course_video;

    if (req.files?.course_image?.[0]) {
      if (course_image && fs.existsSync(course_image)) {
        fs.unlinkSync(course_image);
      }
      course_image = getRelativePath(req.files.course_image[0].path);
    }

    if (req.files?.course_video?.[0]) {
      if (course_video && fs.existsSync(course_video)) {
        fs.unlinkSync(course_video);
      }
      course_video = getRelativePath(req.files.course_video[0].path);
    }

    await db.execute(
      `
      UPDATE courses SET
        course_name=?,
        category_id=?,
        department=?,
        instructor=?,
        course_image=?,
        course_video=?,
        course_image_url=?,
        description=?,
        overview=?,
        course_outcome=?,
        system_requirements=?,
        requirements=?,
        language=?,
        mainstream=?,
        substream=?,
        course_type=?,
        duration_minutes=?,
        no_of_videos=?,
        subtitles_language=?,
        has_subtitles=?,
        reference_id=?,
        location=?,
        pricing_type=?,
        price_amount=?,
        status=?,
        is_active=?
      WHERE course_id=?
      `,
      [
        b.course_name || old.course_name,
        b.category_id || old.category_id,
        b.department || old.department,
        b.instructor || old.instructor,

        course_image,
        course_video,
        b.course_image_url || old.course_image_url,

        b.description || old.description,
        b.overview || old.overview,
        b.course_outcome || old.course_outcome,
        b.system_requirements || old.system_requirements,
        b.requirements || old.requirements,

        b.language || old.language,
        b.mainstream || old.mainstream,
        b.substream || old.substream,
        b.course_type || old.course_type,

        b.duration_minutes || old.duration_minutes,
        b.no_of_videos ?? old.no_of_videos,
        b.subtitles_language || old.subtitles_language,
        b.has_subtitles ?? old.has_subtitles,

        b.reference_id || old.reference_id,
        b.location || old.location,

        b.pricing_type || old.pricing_type,
        b.price_amount || old.price_amount,
        b.status || old.status,
        b.is_active || old.is_active,

        id,
      ]
    );

    res.json({ message: "Course updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Update failed" });
  }
};

/* ================= DELETE COURSE ================= */

export const deleteCourse = async (req, res) => {
  try {
    const db = await connectDB();
    await db.execute("DELETE FROM courses WHERE course_id = ?", [
      req.params.id,
    ]);
    res.json({ message: "🗑️ Course deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting course:", error);
    res.status(500).json({ error: "Failed to delete course" });
  }
};

/* ================= GET COURSE BY ID ================= */
export const getCourseById = async (req, res) => {
  try {
    const db = await connectDB();
    const { id } = req.params;

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

    // ✅ SAFE JSON HANDLING (THIS FIXES YOUR ERROR)
    const modules =
      course.course_content
        ? typeof course.course_content === "string"
          ? JSON.parse(course.course_content)
          : course.course_content
        : [];

    const course_content = modules.map(m => ({
      content: m.module_name
    }));

    const course_objective = modules.flatMap(m =>
      (m.chapters || []).map(ch => ({
        objective: ch.chapter_name
      }))
    );

    res.json({
      course_unique_code: course.course_unique_code,
      course_name: course.course_name,
      course_description: course.description,
      course_image_url: course.course_image_url,
      instructor: course.instructor,
      duration: String(course.duration_minutes),
      number_of_videos: String(course.no_of_videos),
      language: course.language,
      main_stream: course.mainstream,
      sub_stream: course.substream,
      category: course.category_name,
      system_requirements: course.system_requirements,
      has_subtitles: course.has_subtitles ? "true" : "false",
      reference_id: course.reference_id,
      course_type: course.course_type,
      location: course.location || "",
      course_content,
      course_objective
    });

  } catch (err) {
    console.error("❌ Error in getCourseById:", err);
    res.status(500).json({ message: "Server error" });
  }
};



/* ================= COURSE STRUCTURE ================= */

export const getCourseStructure = async (req, res) => {
  try {
    const db = await connectDB();
    const { course_id } = req.params;

    const [courses] = await db.query(
      `
      SELECT course_id, course_name, course_unique_code, description,
             pricing_type, price_amount, course_image
      FROM courses
      WHERE course_id=?
      `,
      [course_id]
    );

    if (!courses.length) {
      return res.status(404).json({ message: "Course not found" });
    }

    const course = courses[0];

    const [modules] = await db.query(
      `SELECT module_id, module_name
       FROM modules
       WHERE course_id=?
       ORDER BY order_index ASC`,
      [course_id]
    );

    for (const mod of modules) {
      const [chapters] = await db.query(
        `SELECT chapter_id, chapter_name
         FROM chapters
         WHERE module_id=?
         ORDER BY order_index ASC`,
        [mod.module_id]
      );
      mod.chapters = chapters;
    }

    res.json({ course, modules });
  } catch (err) {
    console.error("❌ Error fetching course structure:", err);
    res.status(500).json({ message: "Server error" });
  }
};


/* ================= DASHBOARD – APPROVED COURSES ================= */

export const getNMCourses = async (req, res) => {
  try {
    const db = await connectDB();

    const [courses] = await db.execute(`
      SELECT 
        course_id,
        course_name,
        course_unique_code,
        course_image,
        course_image_url,
        instructor,
        duration_minutes,
        status,  
        nm_approval_status
      FROM courses
      WHERE nm_approval_status IN ('pending','approved')
        AND is_active='active'
      ORDER BY updated_at DESC
    `);

    res.json(courses);
  } catch (err) {
    console.error("❌ Error fetching NM courses:", err);
    res.status(500).json({ message: "Failed to load NM courses" });
  }
};


