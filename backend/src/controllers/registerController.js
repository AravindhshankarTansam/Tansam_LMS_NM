import nodemailer from "nodemailer";
import bcrypt from "bcrypt";
import { connectDB } from "../config/db.js";

// ==================
// Email Transporter
// ==================
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,   // add in .env
    pass: process.env.MAIL_PASS,   // add in .env
  },
});

// =============================
// 1️⃣ REGISTER REQUEST - SEND OTP
// =============================
router.post("/register-request", async (req, res) => {
  try {
    const { full_name, email, mobile_number, image_base64 } = req.body;

    const otp = Math.floor(100000 + Math.random() * 900000);

    const db = await connectDB();

    await db.execute(
      "INSERT INTO user_temp (full_name, email, mobile_number, image_base64, otp) VALUES (?, ?, ?, ?, ?)",
      [full_name, email, mobile_number, image_base64, otp]
    );

    // TODO: Send email here

    return res.json({
      message: "OTP sent successfully",
      otp,
    });

  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Server error" });
  }
});

// =============================
// 2️⃣ SET PASSWORD
// =============================
router.post("/set-password", async (req, res) => {
  try {
    const { email, password } = req.body;

    const hashed = await bcrypt.hash(password, 10);

    await db.run(
      "UPDATE users SET password=? WHERE email=?",
      [hashed, email]
    );

    return res.json({ message: "Account created successfully" });

  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Server error" });
  }
});