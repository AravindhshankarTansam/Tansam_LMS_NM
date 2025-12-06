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
// assumes: connectDB(), fs imported, and your multer/express file middleware stores files in req.files
export const updateChapter = async (req, res) => {
  const db = await connectDB();
  const { chapter_id } = req.params;
  // Note: req.body fields might be strings (from form-data)
  const { chapter_name, order_index, existing_materials, material_ids, material_types } = req.body;
  const files = req.files || [];

  if (!chapter_id) return res.status(400).json({ message: "❌ chapter_id is required" });

  try {
    // 0️⃣ Get current chapter & current order_index
    const [[currentChapter]] = await db.query(
      `SELECT chapter_id, module_id, order_index FROM chapters WHERE chapter_id = ?`,
      [chapter_id]
    );
    if (!currentChapter) return res.status(404).json({ message: "❌ Chapter not found" });

    const oldIndex = Number(currentChapter.order_index) || 0;
    const newIndexProvided = typeof order_index !== "undefined" && order_index !== null && order_index !== "";
    const newIndex = newIndexProvided ? Number(order_index) : oldIndex;

    // 1️⃣ Update chapter_name and order_index ONLY if provided
    const updates = [];
    const params = [];
    if (typeof chapter_name !== "undefined") {
      updates.push("chapter_name = ?");
      params.push(chapter_name);
    }
    if (newIndexProvided) {
      updates.push("order_index = ?");
      params.push(newIndex);
    }

    if (updates.length > 0) {
      params.push(chapter_id);
      const sql = `UPDATE chapters SET ${updates.join(", ")} WHERE chapter_id = ?`;
      await db.query(sql, params);
    }

    // 2️⃣ If order_index changed, shift other chapters in the same module
    if (newIndexProvided && newIndex !== oldIndex) {
      const moduleId = currentChapter.module_id;
      // normalize indexes to start from 1 (optional) — adjust as your app expects
      // We'll shift others to make room for the moved chapter
      if (newIndex > oldIndex) {
        // moved down: decrement intermediate chapters
        await db.query(
          `UPDATE chapters SET order_index = order_index - 1
           WHERE module_id = ? AND order_index > ? AND order_index <= ? AND chapter_id <> ?`,
          [moduleId, oldIndex, newIndex, chapter_id]
        );
      } else {
        // moved up: increment intermediate chapters
        await db.query(
          `UPDATE chapters SET order_index = order_index + 1
           WHERE module_id = ? AND order_index >= ? AND order_index < ? AND chapter_id <> ?`,
          [moduleId, newIndex, oldIndex, chapter_id]
        );
      }
      // ensure unique ordering remains contiguous if you want: reassign 1..N optionally
      const [remaining] = await db.query(
        `SELECT chapter_id FROM chapters WHERE module_id=? ORDER BY order_index ASC`,
        [moduleId]
      );
      for (let i = 0; i < remaining.length; i++) {
        await db.query(`UPDATE chapters SET order_index=? WHERE chapter_id=?`, [i + 1, remaining[i].chapter_id]);
      }
    }

    // 3️⃣ Parse existing_materials which could be JSON string or array
    let existingMaterialsArr = [];
    if (existing_materials) {
      try {
        existingMaterialsArr = Array.isArray(existing_materials)
          ? existing_materials
          : JSON.parse(existing_materials);
      } catch (err) {
        // fallback: maybe frontend sent a single JSON object or CSV
        if (typeof existing_materials === "string") {
          try {
            existingMaterialsArr = [JSON.parse(existing_materials)];
          } catch (e2) {
            existingMaterialsArr = [];
          }
        } else {
          existingMaterialsArr = [];
        }
      }
    }

    // 4️⃣ Update material_type for existing materials that have no new file
    for (let m of existingMaterialsArr) {
      if (!m || typeof m.id === "undefined") continue;
      await db.query(
        `UPDATE chapter_materials SET material_type = ? WHERE material_id = ? AND chapter_id = ?`,
        [m.material_type || null, m.id, chapter_id]
      );
    }

    // 5️⃣ Handle uploaded files: material_ids / material_types could be single or arrays
    if (files.length > 0) {
      const fileIds = Array.isArray(material_ids) ? material_ids : (material_ids ? [material_ids] : []);
      const fileTypes = Array.isArray(material_types) ? material_types : (material_types ? [material_types] : []);

      // fetch current materials for this chapter
      const [currentMaterials] = await db.query(
        `SELECT material_id, file_path FROM chapter_materials WHERE chapter_id = ? ORDER BY material_id ASC`,
        [chapter_id]
      );

      // track new DB-inserted material ids to return
      const insertedMaterialIds = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const rawId = fileIds[i]; // might be undefined or a frontend-generated id
        const material_type = fileTypes[i] || null;
        const isNumericId = rawId && !Number.isNaN(Number(rawId)) && Number(rawId) > 0;
        // find matching DB row if numeric id
        const existsInDB = isNumericId && currentMaterials.some((m) => Number(m.material_id) === Number(rawId));

        const file_size_kb = Number((file.size / 1024).toFixed(2));

        if (existsInDB) {
          // UPDATE existing material row and remove old file if present
          const oldMaterial = currentMaterials.find((m) => Number(m.material_id) === Number(rawId));
          try {
            if (oldMaterial && oldMaterial.file_path && fs.existsSync(oldMaterial.file_path)) {
              fs.unlinkSync(oldMaterial.file_path);
            }
          } catch (e) {
            console.warn("Failed to unlink old file", e.message);
          }

          await db.query(
            `UPDATE chapter_materials SET material_type=?, file_name=?, file_path=?, file_size_kb=?, upload_date=NOW() WHERE material_id=?`,
            [material_type, file.originalname, file.path, file_size_kb, rawId]
          );
        } else {
          // treat as NEW material (either frontend-generated temp id or no id)
          const [result] = await db.query(
            `INSERT INTO chapter_materials (chapter_id, material_type, file_name, file_path, file_size_kb)
             VALUES (?, ?, ?, ?, ?)`,
            [chapter_id, material_type, file.originalname, file.path, file_size_kb]
          );
          // result.insertId or result[0].insertId depending on driver — normalize:
          const insertId = result && (result.insertId || result[0]?.insertId) ? (result.insertId || result[0].insertId) : (result.insertId ?? null);
          insertedMaterialIds.push(insertId);
        }
      }

      // optional: return insertedMaterialIds to the client so it can replace its temp ids
      if (insertedMaterialIds.length) {
        // send into response object later (we'll include in res.json)
        // store for final response
        req._insertedMaterialIds = insertedMaterialIds;
      }
    }

    // 6️⃣ success response (include new inserted material ids if any)
    const responsePayload = { message: "✅ Chapter & materials updated successfully", chapter_id };
    if (req._insertedMaterialIds) responsePayload.inserted_material_ids = req._insertedMaterialIds;

    res.json(responsePayload);
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


export const getChapterById = async (req, res) => {
  const db = await connectDB();
  const { chapter_id } = req.params;

  try {
    const [[chapter]] = await db.query(
      `SELECT chapter_id, module_id, chapter_name, order_index, materials_json
       FROM chapters WHERE chapter_id = ?`,
      [chapter_id]
    );

    if (!chapter) return res.status(404).json({ message: "Chapter not found" });

    // Make sure to remove any automatic population of materials
    delete chapter.materials;

    res.json(chapter);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Get materials only for a chapter
export const getMaterialsByChapterId = async (req, res) => {
  const db = await connectDB();
  const { chapter_id } = req.params;

  try {
    const [materials] = await db.query(
      `SELECT * FROM chapter_materials WHERE chapter_id = ?`,
      [chapter_id]
    );

    res.json(materials);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const getQuizzesByChapter = async (req, res) => {
  const db = await connectDB();
  const { chapter_id } = req.params;

  try {
    const [quizzes] = await db.query(
      `SELECT quiz_id, question, option_a, option_b, option_c, option_d, correct_answer, question_type
       FROM quizzes
       WHERE chapter_id = ?`,
      [chapter_id]
    );

    res.json(quizzes); // <- return array directly
  } catch (err) {
    console.error("❌ Error fetching quizzes:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};


export const getCourseProgress = async (req, res) => {
  const db = await connectDB();
  const { custom_id } = req.params;

  try {
    // 1️⃣ Fetch enrolled courses
    const [enrolled] = await db.execute(
      `SELECT ce.course_id, c.course_name
       FROM course_enrollments ce
       JOIN courses c ON ce.course_id = c.course_id
       WHERE ce.custom_id = ?`,
      [custom_id]
    );

    if (enrolled.length === 0) {
      return res.json({
        total_enrolled_courses: 0,
        courses: []
      });
    }

    let finalResult = [];

    // 2️⃣ Loop each course
    for (const course of enrolled) {
      const course_id = course.course_id;

      // 👉 Fetch modules in this course
      const [modules] = await db.execute(
        `SELECT module_id, module_name
         FROM modules
         WHERE course_id = ?
         ORDER BY order_index ASC`,
        [course_id]
      );

      let moduleStats = [];
      let completedModules = 0;

      // 3️⃣ Loop each module
      for (const module of modules) {
        const module_id = module.module_id;

        // Count total quizzes from all chapters (keep this)
        const [quizCount] = await db.execute(
          `SELECT COUNT(*) AS total_quizzes
   FROM quizzes 
   WHERE chapter_id IN (
       SELECT chapter_id FROM chapters WHERE module_id = ?
   )`,
          [module_id]
        );

        // total materials in module
        const [materialCount] = await db.execute(
          `SELECT COUNT(*) AS total_materials
   FROM chapter_materials
   WHERE chapter_id IN (
     SELECT chapter_id FROM chapters WHERE module_id = ?
   )`,
          [module_id]
        );

        // total completed materials from progress table
        const [completedMaterials] = await db.execute(
          `SELECT COUNT(*) AS completed_materials
   FROM material_completion
   WHERE custom_id = ? AND course_id = ?
     AND chapter_id IN (
       SELECT chapter_id FROM chapters WHERE module_id = ?
     )`,
          [custom_id, course_id, module_id]
        );

        // Count completed quizzes
        const [completedQuizzes] = await db.execute(
          `SELECT COUNT(*) AS completed_quizzes
   FROM quiz_results
   WHERE custom_id = ?
     AND chapter_id IN (
         SELECT chapter_id FROM chapters WHERE module_id = ?
     )`,
          [custom_id, module_id]
        );

        // keep quizzes as separate items
        const totalItems =
          materialCount[0].total_materials + quizCount[0].total_quizzes;

        const completedItems =
          completedMaterials[0].completed_materials +
          completedQuizzes[0].completed_quizzes;

        const isModuleCompleted =
          completedItems >= totalItems && totalItems > 0;

        if (isModuleCompleted) completedModules++;

        moduleStats.push({
          module_id,
          module_name: module.module_name,
          total_items: totalItems,
          completed_items: completedItems,
          is_completed: isModuleCompleted,
        });
      }

      finalResult.push({
        course_id,
        course_name: course.course_name,
        total_modules: modules.length,
        completed_modules: completedModules,
        remaining_modules: modules.length - completedModules,
        modules: moduleStats
      });
    }

    res.json({
      total_enrolled_courses: enrolled.length,
      courses: finalResult
    });

  } catch (err) {
    console.error("Error in getCourseProgress:", err);
    return res.status(500).json({
      message: "Server error",
      error: err.message
    });
  }
};

