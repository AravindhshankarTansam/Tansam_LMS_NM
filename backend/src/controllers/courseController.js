import { connectDB } from "../config/db.js";
import path from "path";
import fs from "fs";

// ✅ Helper: get relative path from absolute file path
const getRelativePath = (filePath) => {
  const uploadsIndex = filePath.indexOf("uploads");
  if (uploadsIndex !== -1) {
    return filePath.substring(uploadsIndex).replace(/\\/g, "/");
  }
  return filePath.replace(/\\/g, "/");
};

// ✅ Helper: convert undefined → null for SQL-safe insertions
const safeValue = (val, fallback = null) =>
  val === undefined || val === "" ? fallback : val;

// ✅ Get all courses (with category name)
export const getAllCourses = async (req, res) => {
  try {
    const db = await connectDB();
    const [courses] = await db.execute(`
      SELECT c.*, cat.category_name
      FROM courses c
      LEFT JOIN categories cat ON c.category_id = cat.category_id
      ORDER BY c.course_id DESC
    `);
    res.json(courses);
  } catch (error) {
    console.error("❌ Error fetching courses:", error);
    res.status(500).json({ error: "Failed to fetch courses" });
  }
};

// ✅ Create new course (with image + video + is_active)
export const createCourse = async (req, res) => {
  try {
    const db = await connectDB();
    let {
      course_name,
      category_id,
      description,
      requirements,
      overview,
      pricing_type,
      price_amount,
      is_active,
    } = req.body;

    // ✅ Safely handle uploaded files
    let course_image = null;
    let course_video = null;

    if (req.files && req.files.course_image && req.files.course_image.length > 0) {
      course_image = getRelativePath(req.files.course_image[0].path);
    }

      if (req.files && req.files.course_video && req.files.course_video.length > 0) {
    course_video = getRelativePath(req.files.course_video[0].path);
  }

    // ✅ Get created_by (from auth middleware or default)
    const created_by = req.user?.email || req.user?.username || "Unknown";

    // ✅ Sanitize all input values
    course_name = safeValue(course_name);
    category_id = safeValue(category_id);
    description = safeValue(description);
    requirements = safeValue(requirements);
    overview = safeValue(overview);
    pricing_type = safeValue(pricing_type, "free");
    price_amount =
      pricing_type === "free" ? 0 : safeValue(Number(price_amount), 0);
    is_active = safeValue(is_active, "active");

    console.log("📦 Incoming course data:", {
      course_name,
      category_id,
      description,
      requirements,
      overview,
      pricing_type,
      price_amount,
      is_active,
      created_by,
      course_image,
      course_video,
    });

    // ✅ Insert into DB
    const [result] = await db.execute(
      `
      INSERT INTO courses (
        course_name,
        category_id,
        course_image,
        course_video,
        description,
        requirements,
        overview,
        pricing_type,
        price_amount,
        is_active,
        created_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        course_name,
        category_id,
        course_image,
        course_video,
        description,
        requirements,
        overview,
        pricing_type,
        price_amount,
        is_active,
        created_by,
      ]
    );

    res.status(201).json({
      message: "✅ Course created successfully",
      course_id: result.insertId,
      course_image,
      course_video,
    });
  } catch (error) {
    console.error("❌ Error creating course:", error);
    res.status(500).json({ error: "Failed to create course" });
  }
};

// ✅ Update existing course (with image + video + is_active)


export const updateCourse = async (req, res) => {
  try {
    const db = await connectDB();
    const { id } = req.params;

    const {
      course_name,
      category_id,
      description,
      requirements,
      overview,
      pricing_type,
      price_amount,
      is_active,
    } = req.body;

    // Get existing course
    const [rows] = await db.execute(
      "SELECT * FROM courses WHERE course_id = ?",
      [id]
    );

    if (rows.length === 0)
      return res.status(404).json({ message: "Course not found" });

    const existing = rows[0];

    // =============== FILE HANDLING ===============

    let course_image = existing.course_image;
    let course_video = existing.course_video;

    // --- Replace image ---
    if (req.files?.course_image?.length > 0) {
      if (existing.course_image) {
        const oldImage = path.join(process.cwd(), existing.course_image);
        if (fs.existsSync(oldImage)) fs.unlinkSync(oldImage);
      }

      course_image = getRelativePath(req.files.course_image[0].path);
    }

    // --- Replace video ---
    if (req.files?.course_video?.length > 0) {
      if (existing.course_video) {
        const oldVideo = path.join(process.cwd(), existing.course_video);
        if (fs.existsSync(oldVideo)) fs.unlinkSync(oldVideo);
      }

      course_video = getRelativePath(req.files.course_video[0].path);
    }

    // =============== UPDATE COURSE ===============
    await db.execute(
      `
      UPDATE courses SET
        course_name = ?,
        category_id = ?,
        course_image = ?,
        course_video = ?,
        description = ?,
        requirements = ?,
        overview = ?,
        pricing_type = ?,
        price_amount = ?,
        is_active = ?
      WHERE course_id = ?
      `,
      [
        course_name || existing.course_name,
        category_id || existing.category_id,
        course_image,
        course_video,
        description || existing.description,
        requirements || existing.requirements,
        overview || existing.overview,
        pricing_type || existing.pricing_type,
        price_amount || existing.price_amount,
        is_active || existing.is_active,
        id,
      ]
    );

    res.json({ message: "✅ Course updated successfully" });
  } catch (error) {
    console.error("❌ Error updating course:", error);
    res.status(500).json({ error: "Failed to update course" });
  }
};

// ✅ Delete course
export const deleteCourse = async (req, res) => {
  try {
    const db = await connectDB();
    await db.execute("DELETE FROM courses WHERE course_id = ?", [req.params.id]);
    res.json({ message: "🗑️ Course deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting course:", error);
    res.status(500).json({ error: "Failed to delete course" });
  }
};


export const getCourseById = async (req, res) => {
  try {
    const db = await connectDB();
    const { id } = req.params;

    const [rows] = await db.query("SELECT * FROM courses WHERE course_id = ?", [id]);

    if (rows.length === 0)
      return res.status(404).json({ message: "Course not found" });

    res.json(rows[0]);
  } catch (error) {
    console.error("Error fetching course:", error);
    res.status(500).json({ message: "Server error" });
  }
};


// ✅ Enroll a student in a course
export const enrollCourse = async (req, res) => {
  try {
    const db = await connectDB();

    // ✅ Extract course_id from body
    const { course_id } = req.body;
    const custom_id = req.user?.custom_id; // comes from authMiddleware

    if (!custom_id || !course_id) {
      return res.status(400).json({ message: "Missing custom_id or course_id" });
    }

    // ✅ Check if already enrolled
    const [existing] = await db.execute(
      `SELECT * FROM course_enrollments WHERE custom_id = ? AND course_id = ?`,
      [custom_id, course_id]
    );

    if (existing.length > 0) {
      return res.status(200).json({ message: "Already enrolled in this course" });
    }

    // ✅ Enroll new student
    await db.execute(
      `INSERT INTO course_enrollments (custom_id, course_id) VALUES (?, ?)`,
      [custom_id, course_id]
    );

    res.status(201).json({ message: "✅ Enrolled successfully", course_id });
  } catch (error) {
    console.error("❌ Error enrolling in course:", error);
    res.status(500).json({ error: "Failed to enroll in course" });
  }
};

// GET /api/course-structure/:course_id
export const getCourseStructure = async (req, res) => {
  const db = await connectDB();
  const { course_id } = req.params;

  try {
    // 1️⃣ Fetch course info
    const [courses] = await db.query(
      `SELECT course_id, course_name, description, pricing_type, price_amount, course_image
       FROM courses
       WHERE course_id=?`,
      [course_id]
    );

    if (!courses.length) {
      return res.status(404).json({ message: "Course not found" });
    }

    const course = courses[0];

    // 2️⃣ Fetch modules for the course
    const [modules] = await db.query(
      `SELECT module_id, module_name FROM modules WHERE course_id=? ORDER BY order_index ASC`,
      [course_id]
    );

    // 3️⃣ For each module, fetch its chapters
    for (const mod of modules) {
      const [chapters] = await db.query(
        `SELECT chapter_id, chapter_name FROM chapters WHERE module_id=? ORDER BY order_index ASC`,
        [mod.module_id]
      );
      mod.chapters = chapters;
    }

    // 4️⃣ Return course info + modules with chapters
    res.json({ course, modules });
  } catch (err) {
    console.error("❌ Error fetching course structure:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};