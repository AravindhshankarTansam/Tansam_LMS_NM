import { connectDB } from "../config/db.js";
import { generateCertificate } from "../utils/certificateGenerator.js";

/**
 * 🎓 Issue certificate manually (admin or system-triggered)
 */
export const issueCertificate = async (req, res) => {
  const db = await connectDB();
  const { user_email, course_id, username, course_name } = req.body;

  try {
    // ✅ Check if already issued
    const existing = await db.get(
      `SELECT * FROM certificates WHERE user_email = ? AND course_id = ?`,
      [user_email, course_id]
    );

    if (existing) {
      return res.json({
        message: "ℹ️ Certificate already issued for this course",
        certificate_url: existing.certificate_url,
      });
    }

    // ✅ Generate new certificate file
    const certPath = await generateCertificate(username, course_name);

    // ✅ Insert record
    await db.run(
      `INSERT INTO certificates (user_email, course_id, certificate_url)
       VALUES (?, ?, ?)`,
      [user_email, course_id, certPath]
    );

    res.json({ message: "🎓 Certificate issued successfully", certificate_url: certPath });
  } catch (error) {
    console.error("Certificate issue error:", error.message);
    res.status(500).json({ message: "Error issuing certificate" });
  }
};

/**
 * 🧾 Get all certificates for a specific user
 */
export const getCertificatesByUser = async (req, res) => {
  const db = await connectDB();
  const { email } = req.params;

  try {
    const certificates = await db.all(
      `SELECT * FROM certificates WHERE user_email = ? ORDER BY created_at DESC`,
      [email]
    );

    res.json(certificates);
  } catch (error) {
    console.error("Fetch certificate error:", error.message);
    res.status(500).json({ message: "Error fetching certificates" });
  }
};

/**
 * 👤 Generate user certificate (student-triggered)
 * Typically when a course reaches 100% completion
 */
export const generateUserCertificateByUser = async (req, res) => {
  const db = await connectDB();
  const { user_email, username, course_id, course_name, progress_percent } = req.body;

  try {
    if (progress_percent < 100) {
      return res.json({ message: "⚠️ Course not yet completed — certificate unavailable" });
    }

    // Check if already generated
    const existing = await db.get(
      `SELECT * FROM certificates WHERE user_email = ? AND course_id = ?`,
      [user_email, course_id]
    );

    if (existing) {
      return res.json({
        message: "ℹ️ Certificate already generated",
        certificate_url: existing.certificate_url,
      });
    }

    // Generate new certificate
    const certPath = await generateCertificate(username, course_name);

    await db.run(
      `INSERT INTO certificates (user_email, course_id, certificate_url)
       VALUES (?, ?, ?)`,
      [user_email, course_id, certPath]
    );

    res.json({
      message: "🎉 Certificate generated successfully!",
      certificate_url: certPath,
    });
  } catch (error) {
    console.error("Error generating user certificate:", error.message);
    res.status(500).json({ message: "Error generating certificate" });
  }
};
