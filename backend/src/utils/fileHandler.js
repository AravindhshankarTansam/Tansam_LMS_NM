import multer from "multer";
import path from "path";
import fs from "fs";

// ✅ Determine material type by file extension
const getMaterialType = (ext) => {
  const videoExts = [".mp4", ".mov", ".avi"];
  const pptExts = [".ppt", ".pptx"];
  const pdfExts = [".pdf"];
  const imageExts = [".jpg", ".jpeg", ".png"];
  const docExts = [".doc", ".docx"];
  const excelExts = [".xls", ".xlsx"];

  if (videoExts.includes(ext)) return "video";
  if (pptExts.includes(ext)) return "ppt";
  if (pdfExts.includes(ext)) return "pdf";
  if (imageExts.includes(ext)) return "image";
  if (docExts.includes(ext)) return "doc";
  if (excelExts.includes(ext)) return "excel";
  return "other";
};

// ✅ Configure Multer storage dynamically
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      const courseName =
        req.body.course_name?.replace(/\s+/g, "_").toLowerCase() || "general";
      const ext = path.extname(file.originalname).toLowerCase();
      const materialType = getMaterialType(ext);

      const uploadDir = path.join("uploads", courseName, materialType);

      // Ensure directory exists
      fs.mkdirSync(uploadDir, { recursive: true });

      cb(null, uploadDir);
    } catch (err) {
      cb(err, null);
    }
  },

  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const safeName = file.originalname.replace(/\s+/g, "_");
    cb(null, `${timestamp}_${safeName}`);
  },
});

// ✅ Optional file validation
const fileFilter = (req, file, cb) => {
  const allowed = [
    "application/pdf",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "video/mp4",
    "video/avi",
    "image/jpeg",
    "image/png",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ];

  if (!allowed.includes(file.mimetype)) {
    return cb(new Error("❌ Invalid file type"), false);
  }
  cb(null, true);
};

// ✅ Export multer instance
export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB max
});

export default upload;
