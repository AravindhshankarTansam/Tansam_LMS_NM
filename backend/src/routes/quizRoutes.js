// routes/quizRoutes.js
import express from "express";
import {
  createQuiz,
  getQuizzesByChapter,
  updateQuiz,
  deleteQuiz,
  submitQuiz,
} from "../controllers/quizController.js";
import { authenticateUser } from "../middleware/authMiddleware.js";

const router = express.Router();

// ✅ Create quiz (JSON-based)
router.post("/", authenticateUser, createQuiz);

// ✅ Get quizzes by chapter
router.get("/:chapter_id", authenticateUser, getQuizzesByChapter);

// ✅ Update quiz
router.put("/:id", authenticateUser, updateQuiz);

// ✅ Delete quiz
router.delete("/:id", authenticateUser, deleteQuiz);

// ✅ Submit quiz answers
router.post("/submit", authenticateUser, submitQuiz);

export default router;
