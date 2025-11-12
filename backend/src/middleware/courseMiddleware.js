import multer from "multer";
import path from "path";
import fs from "fs";

// Configure storage for course uploads
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

    // Example: uploads/course_name/chapter_name/material_type
    const folder = path.resolve(
      "uploads",
      courseName,
      chapterName,
      materialType
    );

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

// Allow videos, PDFs, images, and documents
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

// 10 MB limit for now
export const uploadCourseMaterial = multer({
  storage,
  fileFilter,
  limits: { fileSize: 500 * 1024 * 1024 },
});
