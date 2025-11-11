import { connectDB } from "../config/db.js";
import { detectMaterialType } from "../utils/materialTypeMapper.js";

// ✅ Create chapter (auto order_index)
export const createChapter = async (req, res) => {
  const db = await connectDB();
  const { module_id, chapter_name } = req.body;
  const file = req.file;

  // Determine material type if file is uploaded
  const material_type = file ? detectMaterialType(file.originalname) : "other";

  // Prepare materials_json (array with one object if file exists)
  const materials_json = file
    ? JSON.stringify([{ type: material_type, path: file.path }])
    : JSON.stringify([]);

  // Find next order index for this module
  const result = await db.get(
    `SELECT COALESCE(MAX(order_index), 0) + 1 AS next_index FROM chapters WHERE module_id=?`,
    [module_id]
  );

  // ✅ Insert and capture result (inserted row ID)
  const insertResult = await db.run(
    `INSERT INTO chapters (module_id, chapter_name, materials_json, order_index)
     VALUES (?, ?, ?, ?)`,
    [module_id, chapter_name, materials_json, result.next_index]
  );

  // ✅ Return the inserted chapter_id explicitly
  res.json({
    message: "✅ Chapter created successfully",
    chapter_id: insertResult.lastID, // <— this fixes the missing ID
  });
};


// ✅ Get chapters by module
export const getChaptersByModule = async (req, res) => {
  const db = await connectDB();
  const chapters = await db.all(
    `SELECT * FROM chapters WHERE module_id=? ORDER BY order_index ASC`,
    [req.params.module_id]
  );

  // Parse JSON materials before sending
  const parsed = chapters.map((ch) => ({
    ...ch,
    materials_json: ch.materials_json ? JSON.parse(ch.materials_json) : [],
  }));

  res.json(parsed);
};

// ✅ Update chapter (already good)
export const updateChapter = async (req, res) => {
  const db = await connectDB();
  const { id } = req.params;
  const { chapter_name, order_index } = req.body;
  const file = req.file;

  let updatedMaterials = [];

  // Fetch current materials
  const existing = await db.get(`SELECT materials_json FROM chapters WHERE chapter_id=?`, [id]);
  if (existing?.materials_json) {
    updatedMaterials = JSON.parse(existing.materials_json);
  }

  // If new file uploaded, add it
  if (file) {
    updatedMaterials.push({
      type: detectMaterialType(file.originalname),
      path: file.path,
    });
  }

  await db.run(
    `UPDATE chapters 
     SET chapter_name=?, materials_json=?, order_index=?
     WHERE chapter_id=?`,
    [chapter_name, JSON.stringify(updatedMaterials), order_index || 0, id]
  );

  res.json({ message: "📝 Chapter updated" });
};

// ✅ Delete chapter and reorder indexes
export const deleteChapter = async (req, res) => {
  const db = await connectDB();
  const { id } = req.params;

  // Get module_id of the chapter being deleted
  const chapter = await db.get(`SELECT module_id FROM chapters WHERE chapter_id=?`, [id]);
  if (!chapter) {
    return res.status(404).json({ message: "❌ Chapter not found" });
  }

  // Delete the chapter
  await db.run(`DELETE FROM chapters WHERE chapter_id=?`, [id]);

  // Reorder remaining chapters
  const chapters = await db.all(
    `SELECT chapter_id FROM chapters WHERE module_id=? ORDER BY order_index ASC`,
    [chapter.module_id]
  );

  for (let i = 0; i < chapters.length; i++) {
    await db.run(`UPDATE chapters SET order_index=? WHERE chapter_id=?`, [i + 1, chapters[i].chapter_id]);
  }

  res.json({ message: "🗑️ Chapter deleted and indexes reordered" });
};
