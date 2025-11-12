import multer from "multer";
import path from "path";
import fs from "fs";

// ✅ Configure storage dynamically
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const courseName = req.body.course_name
      ? req.body.course_name.replace(/\s+/g, "_").toLowerCase()
      : "uncategorized_course";

    const chapterName = req.body.chapter_name
      ? req.body.chapter_name.replace(/\s+/g, "_").toLowerCase()
      : "general";

    const materialType = req.body.material_type
      ? req.body.material_type.replace(/\s+/g, "_").toLowerCase()
      : "misc";

    // Example path: uploads/course_name/chapter_name/material_type
    const folder = path.join("uploads", courseName, chapterName, materialType);
    fs.mkdirSync(folder, { recursive: true });

    cb(null, folder);
  },

  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext).replace(/\s+/g, "_");
    cb(null, `${baseName}_${timestamp}${ext}`);
  },
});

// ✅ Allow only supported files
const fileFilter = (req, file, cb) => {
  const allowed = [
    "image/jpeg",
    "image/png",
    "image/jpg",
    "video/mp4",
    "video/mkv",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ];

  if (!allowed.includes(file.mimetype)) {
    return cb(new Error("Unsupported file type"), false);
  }

  cb(null, true);
};

// ✅ Export multer instance (limit: 100 MB)
export const uploadCourseMaterial = multer({
  storage,
  fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB
});

// ✅ Helper: Return relative path (from 'uploads/')
export const getRelativePath = (absolutePath) => {
  if (!absolutePath) return null;
  return absolutePath.split("uploads").pop().replace(/\\/g, "/").replace(/^\//, "");
};
