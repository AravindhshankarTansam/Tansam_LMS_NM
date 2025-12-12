import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { connectDB } from "../config/db.js";

const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key_here";

// 🔐 LOGIN CONTROLLER
export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const db = await connectDB();

    // Fetch user
    const [userRows] = await db.execute(`SELECT * FROM users WHERE email = ?`, [email]);
    const user = userRows[0];
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    // Check password
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });

    // Determine table for custom_id and profile
    const roleTableMap = {
      superadmin: "superadmin_details",
      admin: "admin_details",
      student: "student_details",
      staff: "staff_details", // ✅ Add staff here
    };
    const table = roleTableMap[user.role];

    // Fetch custom_id
    let custom_id = null;
    if (table) {
      const [detailRows] = await db.execute(
        `SELECT custom_id FROM ${table} WHERE user_email = ?`,
        [user.email]
      );
      custom_id = detailRows[0]?.custom_id || null;
    }

    // Generate JWT
    const token = jwt.sign(
      {
        email: user.email,
        username: user.username,
        role: user.role,
        custom_id,
      },
      JWT_SECRET,
      { expiresIn: "10d" }
    );

    // Set cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax",
      maxAge: 10 * 24 * 60 * 60 * 1000,
    });

    // Fetch full profile
    let profile = {};
    if (table) {
      const [profileRows] = await db.execute(
        `SELECT * FROM ${table} WHERE user_email = ?`,
        [user.email]
      );
      profile = profileRows[0] || {};
    }

    res.json({
      message: "Login successful",
      token,
      user: {
        email: user.email,
        username: user.username,
        role: user.role,
        profile,
      },
    });
  } catch (err) {
    console.error("❌ Login error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// ✅ Get logged-in user profile using token
export const getCurrentUser = async (req, res) => {
  try {
    const db = await connectDB();
    const { email, role } = req.user;

    const [userRows] = await db.execute("SELECT * FROM users WHERE email = ?", [email]);
    const user = userRows[0];
    if (!user) return res.status(404).json({ error: "User not found" });

    const roleTableMap = {
      superadmin: "superadmin_details",
      admin: "admin_details",
      student: "student_details",
      staff: "staff_details", // ✅ Add staff here
    };
    const table = roleTableMap[role];

    let profile = {};
    if (table) {
      const [profileRows] = await db.execute(
        `SELECT * FROM ${table} WHERE user_email = ?`,
        [email]
      );
      profile = profileRows[0] || {};
    }

    res.json({
      user: {
        email: user.email,
        username: user.username,
        role: user.role,
        profile,
      },
    });
  } catch (err) {
    console.error("getCurrentUser error:", err);
    res.status(500).json({ error: "Server error" });
  }
};
