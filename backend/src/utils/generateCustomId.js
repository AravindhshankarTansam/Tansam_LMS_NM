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

  
 const [rows] = await db.execute(
  `SELECT custom_id FROM ${table} WHERE custom_id LIKE ? ORDER BY custom_id DESC LIMIT 1`,
  [`${prefix}%`]
);

let nextNum = 1;

if (rows.length > 0) {
  // Extract numeric part at the end
  const lastId = rows[0].custom_id;
  const match = lastId.match(/(\d+)$/);
  if (match) nextNum = parseInt(match[1]) + 1;
}

const paddedNum = String(nextNum).padStart(3, "0");

const namePart =
  role === "student" && name ? "_" + name.toUpperCase().slice(0, 3) : "";

return `${prefix}${namePart}${paddedNum}`;

};
