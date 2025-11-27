import express from "express";
import {
  getChaptersByModule,
  createChapter,
  updateChapter,
  deleteChapter,
  getChapterById,
  getMaterialsByChapterId,
  getQuizzesByChapter,
  getCourseProgress,
 
  
} from "../controllers/chapterController.js";
import { authenticateUser } from "../middleware/authMiddleware.js";
import { upload } from "../utils/fileHandler.js"; // Multer config

const router = express.Router();

// 📘 Get all chapters under a module
router.get("/:module_id", authenticateUser, getChaptersByModule);

// 🆕 Create new chapter with multiple materials
router.post(
  "/",
  authenticateUser,
  upload.array("materials", 5), // allow multiple files (e.g. pdf, video)
  createChapter
);

// ✏️ Update chapter details (and optionally re-upload materials)
router.put(
  "/:chapter_id",
  authenticateUser,
  upload.array("materials", 5),
  updateChapter
);

// ❌ Delete a chapter
router.delete("/:chapter_id", authenticateUser, deleteChapter);

// 📗 Get chapter info (without materials)
router.get("/id/:chapter_id", authenticateUser, getChapterById);

// Get materials only for a chapter
router.get("/:chapter_id/materials", getMaterialsByChapterId);

// Fetch quizzes for a chapter
router.get("/:chapter_id/quizzes", authenticateUser, getQuizzesByChapter);

// router.get("/progress/:user_id/:course_id", getCourseProgress);
router.get("/progress/:custom_id", getCourseProgress);






export default router;
