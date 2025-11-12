// routes/quizRoutes.js
import express from "express";
import { upload } from "../utils/fileHandler.js";
import {
  createQuiz,
  getQuizzesByChapter,
  updateQuiz,
  deleteQuiz,
  submitQuiz,
  importQuizFromFile,
} from "../controllers/quizController.js";
import { authenticateUser } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * 📤 Upload or Create Quiz
 * Handles both JSON-based and file-based uploads
 */
router.post(
  "/",
  authenticateUser,
  upload.single("quiz_file"),
  async (req, res) => {
    try {
      if (req.file) {
        // ✅ File-based upload
        return importQuizFromFile(req, res);
      } else {
        // ✅ JSON-based quiz creation
        return createQuiz(req, res);
      }
    } catch (err) {
      console.error("❌ Quiz upload error:", err);
      res.status(500).json({ error: "Quiz upload failed" });
    }
  }
);

/**
 * 🧾 Get all quizzes by chapter
 */
router.get("/:chapter_id", authenticateUser, getQuizzesByChapter);

/**
 * ✏️ Update existing quiz
 */
router.put("/:id", authenticateUser, updateQuiz);

/**
 * ❌ Delete quiz
 */
router.delete("/:id", authenticateUser, deleteQuiz);

/**
 * ✅ Submit quiz answers
 */
router.post("/submit", authenticateUser, submitQuiz);

export default router;
