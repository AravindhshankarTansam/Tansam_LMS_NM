import { connectDB } from "../config/db.js";
import { detectMaterialType } from "../utils/materialTypeMapper.js";

// ✅ Create a new chapter
export const createChapter = async (req, res) => {
  try {
    const db = await connectDB();
    const { module_id, chapter_name } = req.body;
    const file = req.file;

    console.log("📥 Incoming chapter data:", { module_id, chapter_name });

    if (!module_id || !chapter_name) {
      return res
        .status(400)
        .json({ message: "❌ module_id and chapter_name are required" });
    }

    // Determine material type if file is uploaded
    const material_type = file ? detectMaterialType(file.originalname) : "other";

    // Prepare materials_json (array with one object if file exists)
    const materials_json = file
      ? JSON.stringify([{ type: material_type, path: file.path }])
      : JSON.stringify([]);

    // ✅ Find next order index for this module
    const [orderRows] = await db.query(
      "SELECT COALESCE(MAX(order_index), 0) + 1 AS next_index FROM chapters WHERE module_id = ?",
      [module_id]
    );
    const nextIndex = orderRows[0]?.next_index || 1;

    // ✅ Insert the new chapter
    const [insertResult] = await db.query(
      `
      INSERT INTO chapters (module_id, chapter_name, materials_json, order_index)
      VALUES (?, ?, ?, ?)
      `,
      [module_id, chapter_name, materials_json, nextIndex]
    );

    console.log("✅ Chapter inserted with ID:", insertResult.insertId);

    return res.status(201).json({
      message: "✅ Chapter created successfully",
      chapter_id: insertResult.insertId,
    });
  } catch (error) {
    console.error("❌ Chapter creation failed:", error);
    return res.status(500).json({
      error: "Failed to create chapter",
      details: error.message,
    });
  }
};

// ✅ Get all chapters for a module
export const getChaptersByModule = async (req, res) => {
  try {
    const db = await connectDB();
    const { module_id } = req.params;

    console.log("Fetching chapters for module_id:", module_id);

    const [rows] = await db.query(
      "SELECT * FROM chapters WHERE module_id = ? ORDER BY order_index ASC",
      [module_id]
    );

    console.log("DB returned rows:", rows);

    const chapters = rows.map((ch) => {
      let materials = [];
      try {
        materials = ch.materials_json ? JSON.parse(ch.materials_json) : [];
      } catch (err) {
        console.error("❌ JSON parse error for chapter_id:", ch.chapter_id, err);
      }
      return { ...ch, materials_json: materials };
    });

    res.status(200).json({ success: true, chapters });
  } catch (error) {
    console.error("❌ Error fetching chapters:", error);
    res.status(500).json({ error: "Failed to fetch chapters", details: error.message });
  }
};


// ✅ Update chapter (name, order, or materials)
export const updateChapter = async (req, res) => {
  try {
    const db = await connectDB();
    const { id } = req.params;
    const { chapter_name, order_index } = req.body;
    const file = req.file;

    // Fetch existing materials
    const [rows] = await db.query(
      "SELECT materials_json FROM chapters WHERE chapter_id = ?",
      [id]
    );
    const existing = rows[0];
    let updatedMaterials = existing?.materials_json
      ? JSON.parse(existing.materials_json)
      : [];

    // Append new file if uploaded
    if (file) {
      updatedMaterials.push({
        type: detectMaterialType(file.originalname),
        path: file.path,
      });
    }

    await db.query(
      `
      UPDATE chapters 
      SET chapter_name = ?, materials_json = ?, order_index = ?
      WHERE chapter_id = ?
      `,
      [chapter_name, JSON.stringify(updatedMaterials), order_index || 0, id]
    );

    res.status(200).json({ message: "📝 Chapter updated successfully" });
  } catch (error) {
    console.error("❌ Chapter update failed:", error);
    res.status(500).json({ error: "Failed to update chapter" });
  }
};

// ✅ Delete chapter and reorder indexes
export const deleteChapter = async (req, res) => {
  try {
    const db = await connectDB();
    const { id } = req.params;

    // Get module_id for reorder
    const [rows] = await db.query(
      "SELECT module_id FROM chapters WHERE chapter_id = ?",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "❌ Chapter not found" });
    }

    const module_id = rows[0].module_id;

    // Delete the chapter
    await db.query("DELETE FROM chapters WHERE chapter_id = ?", [id]);

    // Reorder remaining chapters
    const [remaining] = await db.query(
      "SELECT chapter_id FROM chapters WHERE module_id = ? ORDER BY order_index ASC",
      [module_id]
    );

    for (let i = 0; i < remaining.length; i++) {
      await db.query(
        "UPDATE chapters SET order_index = ? WHERE chapter_id = ?",
        [i + 1, remaining[i].chapter_id]
      );
    }

    res.json({ message: "🗑️ Chapter deleted and indexes reordered" });
  } catch (error) {
    console.error("❌ Chapter deletion failed:", error);
    res.status(500).json({ error: "Failed to delete chapter" });
  }
};
