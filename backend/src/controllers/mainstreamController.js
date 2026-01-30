import { connectDB } from "../config/db.js";

/* ================= GET ALL MAINSTREAMS ================= */
export const getMainstreams = async (req, res) => {
  try {
    const db = await connectDB();
    const [rows] = await db.query(
      "SELECT * FROM mainstream_master ORDER BY mainstream_id DESC"
    );
    res.json(rows);
  } catch (error) {
    console.error("Error fetching mainstreams:", error.message);
    res.status(500).json({ message: "Error fetching mainstreams" });
  }
};

/* ================= ADD MAINSTREAM ================= */
export const addMainstream = async (req, res) => {
  try {
    const db = await connectDB();
    const { name } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ message: "Mainstream name is required" });
    }

    await db.execute(
      "INSERT INTO mainstream_master (mainstream_name) VALUES (?)",
      [name.trim()]
    );

    res.json({ message: "✅ Mainstream added successfully" });
  } catch (error) {
    console.error("Error adding mainstream:", error.message);
    res.status(500).json({ message: "Error adding mainstream" });
  }
};

/* ================= UPDATE MAINSTREAM ================= */
export const updateMainstream = async (req, res) => {
  try {
    const db = await connectDB();
    const { mainstream_id } = req.params;
    const { name } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ message: "Mainstream name is required" });
    }

    await db.execute(
      "UPDATE mainstream_master SET mainstream_name=? WHERE mainstream_id=?",
      [name.trim(), mainstream_id]
    );

    res.json({ message: "✏️ Mainstream updated successfully" });
  } catch (error) {
    console.error("Error updating mainstream:", error.message);
    res.status(500).json({ message: "Error updating mainstream" });
  }
};

/* ================= DELETE MAINSTREAM ================= */
export const deleteMainstream = async (req, res) => {
  try {
    const db = await connectDB();
    const { mainstream_id } = req.params;

    await db.execute(
      "DELETE FROM mainstream_master WHERE mainstream_id=?",
      [mainstream_id]
    );

    res.json({ message: "🗑️ Mainstream deleted successfully" });
  } catch (error) {
    console.error("Error deleting mainstream:", error.message);
    res.status(500).json({ message: "Error deleting mainstream" });
  }
};
