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
  getQuizAttempts,
  getQuizAttemptsByChapter,
} from "../controllers/quizController.js";
import { authenticateUser } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * 📤 Create Quiz (JSON) OR Import Quiz (File Upload)
 */
router.post(
  "/",
  authenticateUser,
  upload.single("quiz_file"),
  async (req, res) => {
    try {
      if (req.file) {
        return importQuizFromFile(req, res); // File upload path
      } else {
        return createQuiz(req, res); // Normal JSON create quiz
      }
    } catch (err) {
      console.error("❌ Quiz upload error:", err);
      res.status(500).json({ error: "Quiz upload failed" });
    }
  }
);

/**
 * 🧾 Get all quizzes for a chapter
 */
router.get("/:chapter_id", authenticateUser, getQuizzesByChapter);

/**
 * ✏️ Update quiz
 */
router.put("/:id", authenticateUser, updateQuiz);

/**
 * ❌ Delete quiz
 */
router.delete("/:id", authenticateUser, deleteQuiz);

/**
 * 📝 Submit quiz attempts
 */
router.post("/submit", authenticateUser, submitQuiz);

/**
 * 📊 Get ALL quiz attempts of a user
 */
router.get("/attempts/:custom_id", authenticateUser, getQuizAttempts);

/**
 * 📊 Get quiz attempts for a specific chapter (filtered)
 */
router.get(
  "/attempts/:custom_id/chapter/:chapter_id",
  authenticateUser,
  getQuizAttemptsByChapter
);



router.post("/submit", authenticateUser, submitQuiz);

export default router;
