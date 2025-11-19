import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { connectDB } from "../config/db.js";
import nodemailer from "nodemailer";

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
      { email: user.email, username: user.username, role: user.role },
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
// Email transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});
// ----------------- REGISTER REQUEST -----------------
export const registerRequest = async (req, res) => {
  try {
    const { full_name, email, mobile_number, image_base64 } = req.body;
    const otp = Math.floor(100000 + Math.random() * 900000);
    const db = await connectDB();

    await db.execute(
      "INSERT INTO user_temp (full_name, email, mobile_number, image_base64, otp) VALUES (?, ?, ?, ?, ?)",
      [full_name, email, mobile_number, image_base64, otp]
    );

    // Send email (optional)
    await transporter.sendMail({
      from: process.env.MAIL_USER,
      to: email,
      subject: "Your OTP for TANSAM LMS",
      text: `Your OTP is ${otp}`,
    });

    res.json({ message: "OTP sent successfully", otp });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ----------------- SET PASSWORD -----------------
export const setPassword = async (req, res) => {
  try {
    const { email, password } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    const db = await connectDB();

    await db.execute("UPDATE users SET password=? WHERE email=?", [hashed, email]);

    res.json({ message: "Account created successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};