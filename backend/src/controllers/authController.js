import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { connectDB } from "../config/db.js";

const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key_here";

// 🔐 LOGIN CONTROLLER
export const loginUser = async (req, res) => {
  console.log("Login request body:", req.body);

  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const db = await connectDB();

    // ✅ Fetch user by email
    const [userRows] = await db.execute(`SELECT * FROM users WHERE email = ?`, [email]);
    const user = userRows[0];

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // ✅ Check password
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // ✅ Generate JWT
    const token = jwt.sign(
      { email: user.email, username: user.username, role: user.role ,custom_id: user.custom_id, },
      JWT_SECRET,
      { expiresIn: "10d" }
    );

    // ✅ Set cookie (NEW)
    res.cookie("token", token, {
      httpOnly: true,                              // not accessible from JS
      secure: process.env.NODE_ENV === "production", // use true only with HTTPS
      sameSite: "Lax",                             // prevents CSRF in most cases
      maxAge: 10 * 24 * 60 * 60 * 1000,            // 10 days
    });

    // ✅ Determine which table to fetch details from
    const tableMap = {
      superadmin: "superadmin_details",
      admin: "admin_details",
      student: "student_details",
    };
    const table = tableMap[user.role] || "student_details";

    // ✅ Fetch profile details
    const [detailRows] = await db.execute(`SELECT * FROM ${table} WHERE user_email = ?`, [user.email]);
    const details = detailRows[0] || {};

    // ✅ Response (keep token for backward compatibility)
    res.json({
      message: "Login successful",
      token,
      user: {
        email: user.email,
        username: user.username,
        role: user.role,
        profile: details,
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
    const { email } = req.user;

    const [userRows] = await db.execute("SELECT * FROM users WHERE email = ?", [email]);
    const user = userRows[0];

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const tableMap = {
      superadmin: "superadmin_details",
      admin: "admin_details",
      student: "student_details",
    };
    const table = tableMap[user.role] || "student_details";

    const [profileRows] = await db.execute(`SELECT * FROM ${table} WHERE user_email = ?`, [email]);
    const profile = profileRows[0] || {};

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
