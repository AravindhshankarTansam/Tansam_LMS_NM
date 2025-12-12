import { connectDB } from "../config/db.js";

export const generateCustomId = async (role, name = "") => {
  const db = await connectDB();

  let prefix, table;

  if (role === "superadmin") {
    prefix = "SUPERADMIN";
    table = "superadmin_details";
  } else if (role === "admin") {
    prefix = "ADMIN";
    table = "admin_details";
  } else if (role === "staff") {
    prefix = "STF";
    table = "staff_details";
  } else {
    prefix = "STU";
    table = "student_details";
  }

  
  const [rows] = await db.execute(`SELECT COUNT(*) as count FROM ${table}`);
  const nextNum = (rows[0].count || 0) + 1;
  const paddedNum = String(nextNum).padStart(3, "0");

  const namePart =
    role === "student" && name ? "_" + name.toUpperCase().slice(0, 3) : "";

  return `${prefix}${namePart}${paddedNum}`;
};
