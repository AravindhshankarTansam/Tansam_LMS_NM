import express from "express";
import { upload } from "../utils/fileHandler.js";
import {
  createQuiz,
  getQuizzesByChapter,
  updateQuiz,
  deleteQuiz,
  submitQuiz,
} from "../controllers/quizController.js";
import { authenticateUser } from "../middleware/authMiddleware.js";

const router = express.Router();

// ✅ Allow file-based or JSON-based quiz creation
router.post(
  "/dashboard/quizzes",
  authenticateUser,
  upload.single("quiz_file"),
  async (req, res) => {
    try {
      if (req.file) {
        const { path, mimetype } = req.file;
        return res.json({
          message: "✅ Quiz file uploaded successfully",
          filePath: path,
          fileType: mimetype,
        });
      } else {
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
