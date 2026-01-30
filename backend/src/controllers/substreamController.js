import { connectDB } from "../config/db.js";

/* ================= GET SUBSTREAMS ================= */
export const getSubstreams = async (req, res) => {
  try {
    const db = await connectDB();
    const [rows] = await db.query(
      "SELECT * FROM substream_master ORDER BY substream_id DESC"
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: "Error fetching substreams" });
  }
};

/* ================= ADD SUBSTREAM ================= */
export const addSubstream = async (req, res) => {
  try {
    const db = await connectDB();
    const { name } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ message: "Substream name is required" });
    }

    await db.execute(
      "INSERT INTO substream_master (substream_name) VALUES (?)",
      [name.trim()]
    );

    res.json({ message: "✅ Substream added successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error adding substream" });
  }
};

/* ================= UPDATE SUBSTREAM ================= */
export const updateSubstream = async (req, res) => {
  try {
    const db = await connectDB();
    const { substream_id } = req.params;
    const { name } = req.body;

    await db.execute(
      "UPDATE substream_master SET substream_name=? WHERE substream_id=?",
      [name.trim(), substream_id]
    );

    res.json({ message: "✏️ Substream updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error updating substream" });
  }
};

/* ================= DELETE SUBSTREAM ================= */
export const deleteSubstream = async (req, res) => {
  try {
    const db = await connectDB();
    const { substream_id } = req.params;

    await db.execute(
      "DELETE FROM substream_master WHERE substream_id=?",
      [substream_id]
    );

    res.json({ message: "🗑️ Substream deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting substream" });
  }
};
