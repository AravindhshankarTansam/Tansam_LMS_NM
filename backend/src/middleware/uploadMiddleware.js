import multer from "multer";
import path from "path";
import fs from "fs";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const role =
      req.body.role?.toLowerCase() ||
      req.body.user_role?.toLowerCase() ||
      null;

    const fullName = req.body.full_name
      ? req.body.full_name.replace(/\s+/g, "_").toLowerCase()
      : null;

    const courseName = req.body.course_name
      ? req.body.course_name.replace(/\s+/g, "_").toLowerCase()
      : null;

    // Default upload folder
    let folder = path.join("uploads", "uncategorized");

    if (role && fullName) {
      // ✅ Example: uploads/student/john_doe
      folder = path.join("uploads", role, fullName);
    } else if (courseName) {
      // ✅ Example: uploads/course_name
      folder = path.join("uploads", courseName);
    }

    // Ensure folder exists
    fs.mkdirSync(folder, { recursive: true });
    cb(null, folder);
  },

  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext).replace(/\s+/g, "_");
    const username =
      req.user?.username?.replace(/\s+/g, "_").toLowerCase() || "user";

    cb(null, `${username}_${timestamp}_${baseName}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/jpg"];
  if (!allowed.includes(file.mimetype)) {
    return cb(new Error("Only .jpeg, .jpg, and .png files are allowed"), false);
  }
  cb(null, true);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
});
