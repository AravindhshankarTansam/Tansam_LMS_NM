import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { connectDB } from "../config/db.js";
import { generateCustomId } from "../utils/generateCustomId.js";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env.production" });

const createSuperAdmin = async () => {
  try {
    const db = await connectDB();

    const email = process.env.SUPERADMIN_EMAIL;
    const username = process.env.SUPERADMIN_USERNAME;
    const password = process.env.SUPERADMIN_PASSWORD;
    const full_name = process.env.SUPERADMIN_FULLNAME;
    const mobile_number = process.env.SUPERADMIN_MOBILE;
    const role = "superadmin";

    if (!email || !username || !password) {
      console.log("⚠️ Missing required environment variables in .env.local file.");
      process.exit(1);
    }

    // ✅ Check if superadmin already exists in BOTH tables
    const [existingUser] = await db.execute("SELECT * FROM users WHERE email = ?", [email]);
    const [existingDetails] = await db.execute(
      "SELECT * FROM superadmin_details WHERE user_email = ?",
      [email]
    );

    if (existingUser.length > 0 && existingDetails.length > 0) {
      console.log("✅ Superadmin already exists. Skipping creation.");
      process.exit(0);
    }

    // ✅ Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ If missing in users, insert user record
    if (existingUser.length === 0) {
      await db.execute(
        `INSERT INTO users (email, username, password, role, status)
         VALUES (?, ?, ?, ?, 'active')`,
        [email, username, hashedPassword, role]
      );
      console.log("🧩 Added missing user record to 'users' table.");
    }

    // ✅ Generate custom ID
    const custom_id = await generateCustomId(role, full_name);

    // ✅ If missing in superadmin_details, insert details
    if (existingDetails.length === 0) {
      await db.execute(
        `INSERT INTO superadmin_details (user_email, custom_id, full_name, mobile_number)
         VALUES (?, ?, ?, ?)`,
        [email, custom_id, full_name, mobile_number]
      );
      console.log("🧩 Added missing record to 'superadmin_details' table.");
    }

    console.log("🎉 Superadmin user created successfully!");
    console.log({ email, username, role, custom_id, full_name, mobile_number });
    process.exit(0);
  } catch (err) {
    console.error("❌ Error creating superadmin:", err);
    process.exit(1);
  }
};

createSuperAdmin();
