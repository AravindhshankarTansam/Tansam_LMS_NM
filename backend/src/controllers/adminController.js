import bcrypt from "bcryptjs";
import fs from "fs";
import { connectDB } from "../config/db.js";
import path from "path";
import { generateCustomId } from "../utils/generateCustomId.js";

// ✅ Add new user
export const addUser = async (req, res) => {
  const { email, username, password, role, full_name, mobile_number } = req.body;
  const image_path = req.file ? req.file.path : null;

  try {
    const db = await connectDB();

    // Check if user already exists
    const [existingRows] = await db.execute("SELECT * FROM users WHERE email = ?", [email]);
    if (existingRows.length > 0) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await db.execute(
      "INSERT INTO users (email, username, password, role) VALUES (?, ?, ?, ?)",
      [email, username, hashedPassword, role]
    );

    const custom_id = await generateCustomId(role, full_name);

    const tableMap = {
      superadmin: "superadmin_details",
      admin: "admin_details",
      student: "student_details",
    };
    const table = tableMap[role] || "student_details";

    await db.execute(
      `INSERT INTO ${table} (user_email, custom_id, full_name, mobile_number, image_path)
       VALUES (?, ?, ?, ?, ?)`,
      [email, custom_id, full_name, mobile_number, image_path]
    );

    res.json({ message: "✅ User created successfully", role, custom_id });
  } catch (err) {
    console.error("❌ Error creating user:", err);
    res.status(500).json({ message: "Error creating user" });
  }
};

// ✅ Get all users (merged view)
export const getUsers = async (req, res) => {
  try {
    const db = await connectDB();

    const [superadmins] = await db.execute(
      `SELECT u.email, u.username, u.role, s.* 
       FROM users u JOIN superadmin_details s ON u.email = s.user_email`
    );
    const [admins] = await db.execute(
      `SELECT u.email, u.username, u.role, a.* 
       FROM users u JOIN admin_details a ON u.email = a.user_email`
    );
    const [students] = await db.execute(
      `SELECT u.email, u.username, u.role, s.* 
       FROM users u JOIN student_details s ON u.email = s.user_email`
    );

    const users = [...superadmins, ...admins, ...students];
    res.json(users);
  } catch (err) {
    console.error("❌ Error fetching users:", err);
    res.status(500).json({ message: "Error fetching users" });
  }
};

// ✅ Update user (by custom_id)
export const updateUser = async (req, res) => {
  const { custom_id } = req.params;
  const { username, password, full_name, mobile_number, role } = req.body;
  let image_path = req.file ? req.file.path : null;

  try {
    const db = await connectDB();

    // Find which table this custom_id belongs to
    const tables = ["superadmin_details", "admin_details", "student_details"];
    let foundUser = null;
    let table = null;

    for (const t of tables) {
      const [rows] = await db.execute(`SELECT * FROM ${t} WHERE custom_id = ?`, [custom_id]);
      if (rows.length > 0) {
        foundUser = rows[0];
        table = t;
        break;
      }
    }

    if (!foundUser)
      return res.status(404).json({ message: "User not found" });

    // Get base user record
    const [userRows] = await db.execute("SELECT * FROM users WHERE email = ?", [foundUser.user_email]);
    const user = userRows[0];
    if (!user)
      return res.status(404).json({ message: "User record missing in users table" });

    // ✅ Hash password only if provided
    const hashedPassword = password
      ? await bcrypt.hash(password, 10)
      : user.password;

    // ✅ Build dynamic SQL for users table
    const userUpdates = [];
    const userParams = [];

    if (username) {
      userUpdates.push("username = ?");
      userParams.push(username);
    }
    if (password) {
      userUpdates.push("password = ?");
      userParams.push(hashedPassword);
    }
    if (role) {
      userUpdates.push("role = ?");
      userParams.push(role);
    }

    if (userUpdates.length > 0) {
      userParams.push(user.email);
      await db.execute(`UPDATE users SET ${userUpdates.join(", ")} WHERE email = ?`, userParams);
    }

    // ✅ Process image (clean up and delete old one if new provided)
    if (image_path) {
      image_path = image_path.replace(/\\/g, "/");
      const backendRoot = path.resolve("backend").replace(/\\/g, "/");
      image_path = image_path.replace(backendRoot + "/", "");
      image_path = `${req.protocol}://${req.get("host")}/${image_path}`;

      if (foundUser.image_path && foundUser.image_path !== image_path) {
        fs.unlink(foundUser.image_path, (err) => {
          if (err) console.warn("⚠️ Failed to delete old image:", err);
        });
      }
    }

    // ✅ Build dynamic SQL for details table
    const detailUpdates = [];
    const detailParams = [];

    if (full_name) {
      detailUpdates.push("full_name = ?");
      detailParams.push(full_name);
    }
    if (mobile_number) {
      detailUpdates.push("mobile_number = ?");
      detailParams.push(mobile_number);
    }
    if (image_path) {
      detailUpdates.push("image_path = ?");
      detailParams.push(image_path);
    }

    if (detailUpdates.length > 0) {
      detailParams.push(custom_id);
      await db.execute(
        `UPDATE ${table} SET ${detailUpdates.join(", ")} WHERE custom_id = ?`,
        detailParams
      );
    }

    res.json({ message: "✅ User updated successfully" });
  } catch (err) {
    console.error("❌ Error updating user:", err);
    res.status(500).json({ message: "Error updating user" });
  }
};

// ✅ Delete user (by custom_id)
export const deleteUser = async (req, res) => {
  const { custom_id } = req.params;

  try {
    const db = await connectDB();

    const tables = ["superadmin_details", "admin_details", "student_details"];
    let userDetail = null;

    for (const t of tables) {
      const [rows] = await db.execute(`SELECT * FROM ${t} WHERE custom_id = ?`, [custom_id]);
      if (rows.length > 0) {
        userDetail = rows[0];
        break;
      }
    }

    if (!userDetail) return res.status(404).json({ message: "User not found" });

    // Delete profile image if exists
    if (userDetail.image_path) {
      fs.unlink(userDetail.image_path, (err) => {
        if (err) console.warn("⚠️ Failed to delete image:", err);
      });
    }

    // Delete from main users table (cascade handles details)
    await db.execute("DELETE FROM users WHERE email = ?", [userDetail.user_email]);

    res.json({ message: "🗑️ User deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting user:", err);
    res.status(500).json({ message: "Error deleting user" });
  }
};
