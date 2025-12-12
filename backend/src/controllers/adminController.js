import bcrypt from "bcryptjs";
import fs from "fs";
import { connectDB } from "../config/db.js";
import path from "path";
import { generateCustomId } from "../utils/generateCustomId.js";

// ✅ Add new use
export const addUser = async (req, res) => {
  const { email, username, password, role, full_name, mobile_number, course_id } = req.body; // include course_id
  let image_path = req.file ? req.file.path : null;

  try {
    const db = await connectDB();

    // Check if user already exists
    const [existingRows] = await db.execute("SELECT * FROM users WHERE email = ?", [email]);
    if (existingRows.length > 0) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert into main users table
    await db.execute(
      "INSERT INTO users (email, username, password, role) VALUES (?, ?, ?, ?)",
      [email, username, hashedPassword, role]
    );

    // Generate custom ID
    const custom_id = await generateCustomId(role, full_name);

    // Map role to details table
    const tableMap = {
      superadmin: "superadmin_details",
      admin: "admin_details",
      student: "student_details",
      staff: "staff_details",
    };
    const table = tableMap[role] || "student_details";

    // Process image path for URL if file exists
    if (image_path) {
      const backendRoot = path.resolve("backend").replace(/\\/g, "/");
      image_path = image_path.replace(/\\/g, "/").replace(backendRoot + "/", "");
      // image_path = `${req.protocol}://${req.get("host")}/${image_path}`;
    }

    // Insert into role-specific details table
    if (role === "staff") {
      // ✅ Include course_id for staff
      await db.execute(
        `INSERT INTO ${table} (user_email, custom_id, full_name, mobile_number, image_path, course_id)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [email, custom_id, full_name, mobile_number, image_path, course_id]
      );

      // ✅ Auto-enroll staff into the course
      const completion_deadline = new Date();
      completion_deadline.setMonth(completion_deadline.getMonth() + 3);
      await db.execute(
        `INSERT INTO course_enrollments (custom_id, course_id, completion_deadline)
         VALUES (?, ?, ?)`,
        [custom_id, course_id, completion_deadline]
      );
    } else {
      await db.execute(
        `INSERT INTO ${table} (user_email, custom_id, full_name, mobile_number, image_path)
         VALUES (?, ?, ?, ?, ?)`,
        [email, custom_id, full_name, mobile_number, image_path]
      );
    }

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
    const [staff] = await db.execute(
      `SELECT u.email, u.username, u.role, s.* 
       FROM users u JOIN staff_details s ON u.email = s.user_email`
    );

    const users = [...superadmins, ...admins, ...students, ...staff];
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



export const getUsersByCourse = async (req, res) => {
  try {
    const { course_id } = req.params;
    const db = await connectDB();

    // Get only staff users for this course
    const [rows] = await db.execute(`
      SELECT 
        s.custom_id, 
        s.full_name, 
        u.email, 
        s.mobile_number, 
        u.role,
        s.image_path
      FROM users u
      JOIN staff_details s ON u.email = s.user_email
      WHERE s.course_id = ?
    `, [course_id]);

    res.json(rows);
  } catch (err) {
    console.error("❌ Error fetching staff by course:", err.message);
    res.status(500).json({ message: "Error fetching staff by course" });
  }
};




export const getAllStaffUsers = async (req, res) => {
  try {
    const db = await connectDB();

    // Get all staff users with joined user info
    const [rows] = await db.execute(`
      SELECT 
        s.custom_id, 
        s.full_name, 
        u.email, 
        s.mobile_number, 
        u.role,
        s.image_path,
        s.course_id
      FROM staff_details s
      JOIN users u ON u.email = s.user_email
      WHERE u.role = 'staff'
    `);

    res.json(rows);
  } catch (err) {
    console.error("❌ Error fetching all staff users:", err.message);
    res.status(500).json({ message: "Error fetching staff users" });
  }
};