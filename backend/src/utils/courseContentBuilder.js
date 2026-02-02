import { connectDB } from "../config/db.js";

export const rebuildCourseContent = async (course_id) => {
  const db = await connectDB();

  // 1️⃣ Get modules
  const [modules] = await db.query(
    `
    SELECT module_id, module_name
    FROM modules
    WHERE course_id = ?
    ORDER BY order_index ASC
    `,
    [course_id]
  );

  // 2️⃣ Attach chapters to each module
  for (const module of modules) {
    const [chapters] = await db.query(
      `
      SELECT chapter_id, chapter_name
      FROM chapters
      WHERE module_id = ?
      ORDER BY order_index ASC
      `,
      [module.module_id]
    );

    module.chapters = chapters;
  }

  // 3️⃣ Store JSON in courses table
  await db.query(
    `UPDATE courses SET course_content = ? WHERE course_id = ?`,
    [JSON.stringify(modules), course_id]
  );
};
