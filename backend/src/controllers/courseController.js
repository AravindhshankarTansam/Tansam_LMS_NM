import { connectDB } from "../config/db.js";

// ✅ Get all courses
export const getAllCourses = async (req, res) => {
  const db = await connectDB();
  const courses = await db.all(`
    SELECT c.*, cat.category_name
    FROM courses c
    LEFT JOIN categories cat ON c.category_id = cat.category_id
  `);
  res.json(courses);
};

// ✅ Create new course
export const createCourse = async (req, res) => {
  try {
    const db = await connectDB();
    const {
      course_name,
      category_id,
      description,
      requirements,
      overview,
      pricing_type,
      price_amount,
    } = req.body;

   const course_image = req.file ? req.file.path.replace(/\\/g, "/") : null;

    // ✅ Extract from auth middleware
    const created_by = req.user?.email || req.user?.username || "Unknown";

    const result = await db.run(
      `INSERT INTO courses (
        course_name,
        category_id,
        course_image,
        description,
        requirements,
        overview,
        pricing_type,
        price_amount,
        created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        course_name,
        category_id,
        course_image,
        description,
        requirements,
        overview,
        pricing_type,
        price_amount,
        created_by,
      ]
    );

    res.status(201).json({ message: "✅ Course created", course_id: result.lastID });
  } catch (error) {
    console.error("❌ Error creating course:", error);
    res.status(500).json({ error: "Failed to create course" });
  }
};


// ✅ Update course
export const updateCourse = async (req, res) => {
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
  } = req.body;

  try {
    // 1️⃣ Fetch the existing course
    const existing = await db.get("SELECT * FROM courses WHERE course_id = ?", [
      id,
    ]);
    if (!existing) {
      return res.status(404).json({ message: "Course not found" });
    }

    // 2️⃣ Only replace image if new one uploaded
    const course_image = req.file
          ? req.file.path.replace(/\\/g, "/")
          : existing.course_image;

    // 3️⃣ Update the record
    await db.run(
      `UPDATE courses 
       SET course_name = ?, 
           category_id = ?, 
           course_image = ?, 
           description = ?, 
           requirements = ?, 
           overview = ?, 
           pricing_type = ?, 
           price_amount = ?
       WHERE course_id = ?`,
      [
        course_name,
        category_id,
        course_image,
        description,
        requirements,
        overview,
        pricing_type,
        price_amount,
        id,
      ]
    );

    res.json({ message: "✅ Course updated successfully" });
  } catch (error) {
    console.error("❌ Error updating course:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ✅ Delete course
export const deleteCourse = async (req, res) => {
  const db = await connectDB();
  await db.run(`DELETE FROM courses WHERE course_id=?`, [req.params.id]);
  res.json({ message: "🗑️ Course deleted" });
};
