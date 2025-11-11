import { connectDB } from "../config/db.js";

// ✅ Create module
export const createModule = async (req, res) => {
  const db = await connectDB();
  const { course_id, module_name, order_index } = req.body;
  await db.run(
    `INSERT INTO modules (course_id, module_name, order_index) VALUES (?, ?, ?)`,
    [course_id, module_name, order_index || 0]
  );
  res.json({ message: "✅ Module created" });
};

// ✅ Read modules by course
export const getModulesByCourse = async (req, res) => {
  const db = await connectDB();
  const modules = await db.all(
    `SELECT * FROM modules WHERE course_id=? ORDER BY order_index ASC`,
    [req.params.course_id]
  );
  res.json(modules);
};

// ✅ Update module
export const updateModule = async (req, res) => {
  const db = await connectDB();
  const { id } = req.params;
  const { module_name, order_index } = req.body;
  await db.run(
    `UPDATE modules SET module_name=?, order_index=? WHERE module_id=?`,
    [module_name, order_index, id]
  );
  res.json({ message: "📝 Module updated" });
};

// ✅ Delete module
export const deleteModule = async (req, res) => {
  const db = await connectDB();

  try {
    // 1️⃣ Get the course_id before deleting
    const deletedModule = await db.get(
      `SELECT course_id FROM modules WHERE module_id=?`,
      [req.params.id]
    );

    if (!deletedModule) {
      return res.status(404).json({ message: "❌ Module not found" });
    }

    const courseId = deletedModule.course_id;

    // 2️⃣ Delete the module
    await db.run(`DELETE FROM modules WHERE module_id=?`, [req.params.id]);

    // 3️⃣ Reindex remaining modules
    const remainingModules = await db.all(
      `SELECT module_id FROM modules WHERE course_id=? ORDER BY order_index ASC`,
      [courseId]
    );

    for (let i = 0; i < remainingModules.length; i++) {
      await db.run(
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
