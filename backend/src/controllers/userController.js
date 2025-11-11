import bcrypt from "bcryptjs";
import { connectDB } from "../config/db.js";
import { generateCustomId } from "../utils/generateCustomId.js";

// Add new user
export const addUser = async (req, res) => {
  const { username, password, role, mobile_number } = req.body;
  const image_path = req.file ? req.file.path : null;

  try {
    const db = await connectDB();

    const existing = await db.get("SELECT * FROM users WHERE username = ?", [username]);
    if (existing) return res.status(400).json({ message: "Username already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const custom_id = await generateCustomId(role, username);

    await db.run(
      "INSERT INTO users (custom_id, username, password, role, mobile_number, image_path) VALUES (?, ?, ?, ?, ?, ?)",
      [custom_id, username, hashedPassword, role, mobile_number, image_path]
    );

    res.json({ message: "User created successfully", custom_id, image_path });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error creating user" });
  }
};

// Get all users
export const getUsers = async (req, res) => {
  const db = await connectDB();
  const users = await db.all("SELECT * FROM users ORDER BY created_at DESC");
  res.json(users);
};
