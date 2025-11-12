// controllers/moduleController.js
import { connectDB } from "../config/db.js";

// ✅ Get modules by course
export const getModulesByCourse = async (req, res) => {
  try {
    const { course_id } = req.params;
    const db = await connectDB();

    const [rows] = await db.execute(
      `SELECT * FROM modules WHERE course_id = ? ORDER BY order_index ASC`,
      [course_id]
    );

    console.log("📦 Modules for course:", course_id, rows);
    res.status(200).json(rows);
  } catch (err) {
    console.error("❌ Error fetching modules:", err);
    res.status(500).json({ message: "Failed to fetch modules" });
  }
};

// ✅ Create module
export const createModule = async (req, res) => {
  try {
    console.log("📩 Incoming body:", req.body);
    const db = await connectDB();
    const { course_id, module_name, order_index } = req.body;

    if (!course_id || !module_name) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const [result] = await db.execute(
      `INSERT INTO modules (course_id, module_name, order_index) VALUES (?, ?, ?)`,
      [course_id, module_name, order_index || 0]
    );

    res.status(201).json({
      message: "✅ Module created successfully",
      module_id: result.insertId,
    });
  } catch (err) {
    console.error("❌ Error creating module:", err);
    res.status(500).json({ message: "Failed to create module" });
  }
};

// ✅ Update module
export const updateModule = async (req, res) => {
  try {
    const { id } = req.params;
    const { module_name, order_index } = req.body;
    const db = await connectDB();

    const [result] = await db.execute(
      `UPDATE modules SET module_name = ?, order_index = ? WHERE module_id = ?`,
      [module_name, order_index || 0, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Module not found" });
    }

    res.status(200).json({ message: "✅ Module updated successfully" });
  } catch (err) {
    console.error("❌ Error updating module:", err);
    res.status(500).json({ message: "Failed to update module" });
  }
};

// ✅ Delete module
export const deleteModule = async (req, res) => {
  try {
    const { id } = req.params;
    const db = await connectDB();

    const [result] = await db.execute(
      `DELETE FROM modules WHERE module_id = ?`,
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Module not found" });
    }

    res.status(200).json({ message: "✅ Module deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting module:", err);
    res.status(500).json({ message: "Failed to delete module" });
  }
};
