import { connectDB } from "../config/db.js";

// ✅ Create module
export const createModule = async (req, res) => {
  try {
    const db = await connectDB();
    const { course_id, module_name, order_index } = req.body;

    const [result] = await db.execute(
      `INSERT INTO modules (course_id, module_name, order_index) VALUES (?, ?, ?)`,
      [course_id, module_name, order_index || 0]
    );

    res.status(201).json({ message: "✅ Module created", module_id: result.insertId });
  } catch (err) {
    console.error("❌ Error creating module:", err);
    res.status(500).json({ message: "Failed to create module" });
  }
};

// ✅ Read modules by course
export const getModulesByCourse = async (req, res) => {
  try {
    const db = await connectDB();
    const [modules] = await db.execute(
      `SELECT * FROM modules WHERE course_id=? ORDER BY order_index ASC`,
      [req.params.course_id]
    );
    res.json(modules);
  } catch (err) {
    console.error("❌ Error fetching modules:", err);
    res.status(500).json({ message: "Failed to fetch modules" });
  }
};

// ✅ Update module
export const updateModule = async (req, res) => {
  try {
    const db = await connectDB();
    const { id } = req.params;
    const { module_name, order_index } = req.body;

    await db.execute(
      `UPDATE modules SET module_name=?, order_index=? WHERE module_id=?`,
      [module_name, order_index, id]
    );

    res.json({ message: "📝 Module updated" });
  } catch (err) {
    console.error("❌ Error updating module:", err);
    res.status(500).json({ message: "Failed to update module" });
  }
};

// ✅ Delete module
export const deleteModule = async (req, res) => {
  try {
    const db = await connectDB();
    const moduleId = req.params.id;

    // 1️⃣ Get the course_id before deleting
    const [rows] = await db.execute(
      `SELECT course_id FROM modules WHERE module_id=?`,
      [moduleId]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "❌ Module not found" });
    }

    const courseId = rows[0].course_id;

    // 2️⃣ Delete the module
    await db.execute(`DELETE FROM modules WHERE module_id=?`, [moduleId]);

    // 3️⃣ Reindex remaining modules
    const [remainingModules] = await db.execute(
      `SELECT module_id FROM modules WHERE course_id=? ORDER BY order_index ASC`,
      [courseId]
    );

    for (let i = 0; i < remainingModules.length; i++) {
      await db.execute(
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
