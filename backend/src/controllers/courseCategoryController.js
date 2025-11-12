import { connectDB } from "../config/db.js";

// ✅ Get all categories
export const getCategories = async (req, res) => {
  try {
    const db = await connectDB();
    const [categories] = await db.execute("SELECT * FROM categories ORDER BY category_id DESC");
    res.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error.message);
    res.status(500).json({ message: "Error fetching categories" });
  }
};

// ✅ Add new category
export const addCategory = async (req, res) => {
  try {
    const db = await connectDB();
    const { name } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ message: "Category name is required" });
    }

    const [result] = await db.execute(
      "INSERT INTO categories (category_name) VALUES (?)",
      [name.trim()]
    );

    res.json({ message: "✅ Category added successfully", category_id: result.insertId });
  } catch (error) {
    console.error("Error adding category:", error.message);
    res.status(500).json({ message: "Error adding category" });
  }
};

// ✅ Update category
export const updateCategory = async (req, res) => {
  try {
    const db = await connectDB();
    const { category_id } = req.params;
    const { name } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ message: "Category name is required" });
    }

    const [result] = await db.execute(
      "UPDATE categories SET category_name = ? WHERE category_id = ?",
      [name.trim(), category_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.json({ message: "✏️ Category updated successfully" });
  } catch (error) {
    console.error("Error updating category:", error.message);
    res.status(500).json({ message: "Error updating category" });
  }
};

// ✅ Delete category
export const deleteCategory = async (req, res) => {
  try {
    const db = await connectDB();
    const { category_id } = req.params;

    const [result] = await db.execute(
      "DELETE FROM categories WHERE category_id = ?",
      [category_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.json({ message: "🗑️ Category deleted successfully" });
  } catch (error) {
    console.error("Error deleting category:", error.message);
    res.status(500).json({ message: "Error deleting category" });
  }
};