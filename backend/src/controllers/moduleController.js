import { connectDB } from "../config/db.js";
import { rebuildCourseContent } from "../utils/courseContentBuilder.js";

// ✅ Create module
export const createModule = async (req, res) => {
  const db = await connectDB();
  const { course_id, module_name, order_index } = req.body;

  try {
    await db.query(
      `INSERT INTO modules (course_id, module_name, order_index)
       VALUES (?, ?, ?)`,
      [course_id, module_name, order_index || 0]
    );

    // 🔥 rebuild course JSON
    await rebuildCourseContent(course_id);

    res.json({ message: "✅ Module created" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Read modules by course
export const getModulesByCourse = async (req, res) => {
  const db = await connectDB();
  try {
    const [modules] = await db.query(
      `SELECT * FROM modules WHERE course_id=? ORDER BY order_index ASC`,
      [req.params.course_id]
    );
    res.json(modules);
  } catch (err) {
    console.error("❌ Error fetching modules:", err);
    res.status(500).json({ message: "Server error while fetching modules" });
  }
};

// ✅ Update module
export const updateModule = async (req, res) => {
  const db = await connectDB();
  const { id } = req.params;
  const { module_name, order_index } = req.body;
  try {
    await db.query(
      `UPDATE modules SET module_name=?, order_index=? WHERE module_id=?`,
      [module_name, order_index, id]
    );
    res.json({ message: "📝 Module updated" });
  } catch (err) {
    console.error("❌ Error updating module:", err);
    res.status(500).json({ message: "Server error while updating module" });
  }
};

// ✅ Delete module
export const deleteModule = async (req, res) => {
  const db = await connectDB();
  try {
    // 1️⃣ Get the course_id before deleting
    const [deletedModuleRows] = await db.query(
      `SELECT course_id FROM modules WHERE module_id=?`,
      [req.params.id]
    );
    if (deletedModuleRows.length === 0) {
      return res.status(404).json({ message: "❌ Module not found" });
    }

    const courseId = deletedModuleRows[0].course_id;

    // 2️⃣ Delete the module
    await db.query(`DELETE FROM modules WHERE module_id=?`, [req.params.id]);

    // 3️⃣ Reindex remaining modules
    const [remainingModules] = await db.query(
      `SELECT module_id FROM modules WHERE course_id=? ORDER BY order_index ASC`,
      [courseId]
    );

    for (let i = 0; i < remainingModules.length; i++) {
      await db.query(
        `UPDATE modules SET order_index=? WHERE module_id=?`,
        [i + 1, remainingModules[i].module_id]
      );
    }

    res.json({ message: "🗑️ Module deleted and reindexed successfully" });
  } catch (err) {
    console.error("❌ Error deleting module:", err);
    res.status(500).json({ message: "Server error while deleting module" });
  }
};
