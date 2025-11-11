import express from "express";
import { upload } from "../utils/fileHandler.js"; // ✅ your existing multer config
import {
  createQuiz,
  getQuizzesByChapter,
  updateQuiz,
  deleteQuiz,
  submitQuiz,
} from "../controllers/quizController.js";
import { authenticateUser } from "../middleware/authMiddleware.js";

const router = express.Router();

// ✅ Handle both JSON-based and file-based quiz uploads
router.post(
  "/dashboard/quizzes",
  upload.single("quiz_file"), // <--- allow optional file upload
  async (req, res, next) => {
    try {
      if (req.file) {
        // 📦 Handle file-based quiz import
        const filePath = req.file.path;
        const fileType = req.file.mimetype;

        // You can parse Excel or DOC here (using xlsx, mammoth, etc.)
        // For now, return file info for debugging:
        return res.json({
          message: "✅ Quiz file uploaded successfully",
          filePath,
          fileType,
        });
      } else {
        // 🧾 Fall back to JSON-based quiz creation
        return createQuiz(req, res);
      }
    } catch (err) {
      console.error("❌ Quiz upload error:", err);
      res.status(500).json({ error: "Quiz upload failed" });
    }
  }
);


router.get("/:chapter_id", authenticateUser, getQuizzesByChapter);
router.post("/", authenticateUser, createQuiz);
router.put("/:id", authenticateUser, updateQuiz);
router.delete("/:id", authenticateUser, deleteQuiz);
router.post("/submit", authenticateUser, submitQuiz);

export default router;
