import { connectDB } from "../config/db.js";
import fs from "fs";
import { detectMaterialType } from "../utils/materialTypeMapper.js";

// ✅ Create chapter with multiple materials
export const createChapter = async (req, res) => {
  const db = await connectDB();
  const { module_id, chapter_name } = req.body;
  const files = req.files;

  if (!module_id || !chapter_name) {
    return res.status(400).json({ message: "❌ Missing module_id or chapter_name" });
  }

  try {
    // Find next order index
    const [rows] = await db.query(
      `SELECT COALESCE(MAX(order_index), 0) + 1 AS next_index FROM chapters WHERE module_id = ?`,
      [module_id]
    );
    const nextIndex = rows[0].next_index;

    // Insert chapter
    const [result] = await db.query(
      `INSERT INTO chapters (module_id, chapter_name, materials_json, order_index)
       VALUES (?, ?, ?, ?)`,
      [module_id, chapter_name, "[]", nextIndex]
    );

    const chapter_id = result.insertId;

    // Insert materials
    if (files && files.length > 0) {
      for (const file of files) {
        const material_type = detectMaterialType(file.originalname);
        const file_size_kb = (file.size / 1024).toFixed(2);

        await db.query(
          `INSERT INTO chapter_materials 
           (chapter_id, material_type, file_name, file_path, file_size_kb)
           VALUES (?, ?, ?, ?, ?)`,
          [chapter_id, material_type, file.originalname, file.path, file_size_kb]
        );
      }
    }

    res.json({
      message: "✅ Chapter created successfully",
      chapter_id,
    });
  } catch (err) {
    console.error("❌ Error creating chapter:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ✅ Get all chapters under a module (with materials)
export const getChaptersByModule = async (req, res) => {
  const db = await connectDB();
  const { module_id } = req.params;

  try {
    const [chapters] = await db.query(
      `SELECT * FROM chapters WHERE module_id=? ORDER BY order_index ASC`,
      [module_id]
    );

    for (const ch of chapters) {
      const [materials] = await db.query(
        `SELECT * FROM chapter_materials WHERE chapter_id=?`,
        [ch.chapter_id]
      );
      ch.materials = materials;
    }

    res.json(chapters);
  } catch (err) {
    console.error("❌ Error fetching chapters:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ✅ Update chapter name or order
export const updateChapter = async (req, res) => {
  const db = await connectDB();
  const { chapter_id } = req.params;
  const { chapter_name, order_index } = req.body;

  try {
    await db.query(
      `UPDATE chapters SET chapter_name=?, order_index=? WHERE chapter_id=?`,
      [chapter_name, order_index || 0, chapter_id]
    );
    res.json({ message: "📝 Chapter updated" });
  } catch (err) {
    console.error("❌ Error updating chapter:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ✅ Delete chapter + materials
export const deleteChapter = async (req, res) => {
  const db = await connectDB();
  const { chapter_id } = req.params;

  try {
    const [[chapter]] = await db.query(
      `SELECT module_id FROM chapters WHERE chapter_id=?`,
      [chapter_id]
    );
    if (!chapter) return res.status(404).json({ message: "❌ Chapter not found" });

    const [materials] = await db.query(
      `SELECT file_path FROM chapter_materials WHERE chapter_id=?`,
      [chapter_id]
    );

    // Delete files
    for (const m of materials) {
      if (fs.existsSync(m.file_path)) fs.unlinkSync(m.file_path);
    }

    await db.query(`DELETE FROM chapter_materials WHERE chapter_id=?`, [chapter_id]);
    await db.query(`DELETE FROM chapters WHERE chapter_id=?`, [chapter_id]);

    // Reorder remaining chapters
    const [remaining] = await db.query(
      `SELECT chapter_id FROM chapters WHERE module_id=? ORDER BY order_index ASC`,
      [chapter.module_id]
    );

    for (let i = 0; i < remaining.length; i++) {
      await db.query(
        `UPDATE chapters SET order_index=? WHERE chapter_id=?`,
        [i + 1, remaining[i].chapter_id]
      );
    }

    res.json({ message: "🗑️ Chapter deleted and indexes reordered" });
  } catch (err) {
    console.error("❌ Error deleting chapter:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
