import { connectDB } from "../config/db.js";
import { generateCertificate } from "../utils/certificateGenerator.js";

export const issueCertificate = async (req, res) => {
  const db = await connectDB();
  const { user_email, course_id, username, course_name } = req.body;

  try {
    const [existingRows] = await db.execute(
      `SELECT * FROM certificates WHERE user_email = ? AND course_id = ?`,
      [user_email, course_id]
    );

    const existing = existingRows[0];

    if (existing) {
      return res.json({
        message: "ℹ️ Certificate already issued for this course",
        certificate_url: existing.certificate_url,
      });
    }

    const certPath = await generateCertificate(username, course_name);

    await db.execute(
      `INSERT INTO certificates (user_email, course_id, certificate_url)
       VALUES (?, ?, ?)`,
      [user_email, course_id, certPath]
    );

    res.json({ message: "🎓 Certificate issued successfully", certificate_url: certPath });
  } catch (error) {
    console.error("Certificate issue error:", error);
    res.status(500).json({ message: "Error issuing certificate" });
  }
};

export const getCertificatesByUser = async (req, res) => {
  const db = await connectDB();
  const { email } = req.params;

  try {
    const [rows] = await db.execute(
      `SELECT * FROM certificates WHERE user_email = ? ORDER BY created_at DESC`,
      [email]
    );

    res.json(rows);
  } catch (error) {
    console.error("Fetch certificate error:", error);
    res.status(500).json({ message: "Error fetching certificates" });
  }
};

export const generateUserCertificateByUser = async (req, res) => {
  const db = await connectDB();
  const { user_email, username, course_id, course_name, progress_percent } = req.body;

  try {
    if (progress_percent < 100) {
      return res.json({ message: "⚠️ Course not yet completed — certificate unavailable" });
    }

    const [existingRows] = await db.execute(
      `SELECT * FROM certificates WHERE user_email = ? AND course_id = ?`,
      [user_email, course_id]
    );

    if (existingRows.length > 0) {
      return res.json({
        message: "ℹ️ Certificate already generated",
        certificate_url: existingRows[0].certificate_url,
      });
    }

    const certPath = await generateCertificate(username, course_name);

    await db.execute(
      `INSERT INTO certificates (user_email, course_id, certificate_url)
       VALUES (?, ?, ?)`,
      [user_email, course_id, certPath]
    );

    res.json({
      message: "🎉 Certificate generated successfully!",
      certificate_url: certPath,
    });
  } catch (error) {
    console.error("Error generating user certificate:", error);
    res.status(500).json({ message: "Error generating certificate" });
  }
};
