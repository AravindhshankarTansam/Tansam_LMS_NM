import express from "express";
import {
  createChapter,
  getChaptersByModule,
  updateChapter,
  deleteChapter,
} from "../controllers/chapterController.js";
import { authenticateUser } from "../middleware/authMiddleware.js";
import { uploadCourseMaterial as upload } from "../middleware/courseMiddleware.js";

const router = express.Router();

router.post("/", authenticateUser, upload.single("material"), createChapter);
router.get("/:module_id", authenticateUser, getChaptersByModule);
router.put("/:id", authenticateUser, upload.single("material"), updateChapter);
router.delete("/:id", authenticateUser, deleteChapter);

export default router;
